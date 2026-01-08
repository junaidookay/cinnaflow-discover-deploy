import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Upload, Loader2 } from "lucide-react";

const Profile = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile({
        full_name: data.full_name || "",
        avatar_url: data.avatar_url || "",
      });
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } else {
      toast.success("Profile updated successfully");
    }

    setIsSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(`avatars/${fileName}`, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload avatar");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(`avatars/${fileName}`);

    setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
    toast.success("Avatar uploaded - click Save to apply");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile.full_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8 cinna-gold-text">
            Profile
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG or GIF. Max 2MB
                  </p>
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Avatar URL (optional manual entry) */}
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile((prev) => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
