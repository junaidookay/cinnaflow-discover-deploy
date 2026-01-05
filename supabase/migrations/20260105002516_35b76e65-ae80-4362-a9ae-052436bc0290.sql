-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user roles table for admin access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles (only admins can view/manage)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by owner"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Content Types enum
CREATE TYPE public.content_type AS ENUM ('movie', 'tv', 'sports', 'clip');

-- Badge Types enum
CREATE TYPE public.badge_type AS ENUM ('trending', 'sponsored', 'live', 'featured');

-- Section Types enum
CREATE TYPE public.section_type AS ENUM ('hero', 'trending', 'recently_added', 'editor_picks');

-- Platform Types enum
CREATE TYPE public.platform_type AS ENUM ('twitch', 'youtube', 'kick');

-- Approval Status enum
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Content Items table
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type content_type NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  poster_url TEXT,
  video_embed_url TEXT,
  external_watch_links JSONB DEFAULT '[]',
  badges badge_type[] DEFAULT '{}',
  section_assignments section_type[] DEFAULT '{}',
  hero_order INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Public can view published content
CREATE POLICY "Anyone can view published content"
  ON public.content_items FOR SELECT
  USING (is_published = true);

-- Admins can manage all content
CREATE POLICY "Admins can manage content"
  ON public.content_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Artist Promotions table
CREATE TABLE public.artist_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  video_embed_url TEXT,
  thumbnail_url TEXT,
  external_links JSONB DEFAULT '{"youtube": null, "spotify": null, "instagram": null}',
  is_sponsored BOOLEAN DEFAULT true,
  placement_locations TEXT[] DEFAULT '{}',
  approval_status approval_status DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  submitter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_promotions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (insert) artist promotions
CREATE POLICY "Anyone can submit artist promotions"
  ON public.artist_promotions FOR INSERT
  WITH CHECK (true);

-- Public can view approved promotions
CREATE POLICY "Anyone can view approved artists"
  ON public.artist_promotions FOR SELECT
  USING (approval_status = 'approved');

-- Admins can view and manage all
CREATE POLICY "Admins can manage artist promotions"
  ON public.artist_promotions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Creator Promotions table
CREATE TABLE public.creator_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_name TEXT NOT NULL,
  platform platform_type NOT NULL,
  channel_url TEXT,
  thumbnail_url TEXT,
  is_live BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  placement_locations TEXT[] DEFAULT '{}',
  approval_status approval_status DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  submitter_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_promotions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit creator promotions
CREATE POLICY "Anyone can submit creator promotions"
  ON public.creator_promotions FOR INSERT
  WITH CHECK (true);

-- Public can view approved creators
CREATE POLICY "Anyone can view approved creators"
  ON public.creator_promotions FOR SELECT
  USING (approval_status = 'approved');

-- Admins can manage all
CREATE POLICY "Admins can manage creator promotions"
  ON public.creator_promotions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policies for media bucket
CREATE POLICY "Anyone can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Admins can manage media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_promotions_updated_at
  BEFORE UPDATE ON public.artist_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_promotions_updated_at
  BEFORE UPDATE ON public.creator_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();