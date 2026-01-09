-- Create enum for account types (user intent)
CREATE TYPE public.account_type AS ENUM ('viewer', 'artist', 'creator');

-- Add account_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'viewer';