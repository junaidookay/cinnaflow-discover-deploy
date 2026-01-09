import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Lock, Bell, Trash2, User, Music, Video, Play } from "lucide-react";

type AccountType = "viewer" | "artist" | "creator";

const accountTypeOptions: { value: AccountType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "viewer", label: "Viewer", icon: <Play className="w-5 h-5" />, description: "Watch movies, shows & streams" },
  { value: "artist", label: "Artist / Music Producer", icon: <Music className="w-5 h-5" />, description: "Promote your music" },
  { value: "creator", label: "Creator / Streamer", icon: <Video className="w-5 h-5" />, description: "Grow your audience" },
];

const Settings = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingAccountType, setIsSavingAccountType] = useState(false);
  const [currentAccountType, setCurrentAccountType] = useState<AccountType>("viewer");
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>("viewer");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    marketing: false,
  });

  useEffect(() => {
    if (user) {
      // Fetch current account type
      const fetchAccountType = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", user.id)
          .single();
        
        if (data?.account_type) {
          setCurrentAccountType(data.account_type as AccountType);
          setSelectedAccountType(data.account_type as AccountType);
        }
      };
      fetchAccountType();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleAccountTypeChange = async () => {
    if (selectedAccountType === currentAccountType) return;
    
    setIsSavingAccountType(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ account_type: selectedAccountType })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update account type");
    } else {
      setCurrentAccountType(selectedAccountType);
      toast.success("Account type updated! Your dashboard will reflect this change.");
    }

    setIsSavingAccountType(false);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword,
    });

    if (error) {
      toast.error("Failed to update password");
    } else {
      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }

    setIsChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    toast.error("Account deletion requires admin approval. Please contact support.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-8 cinna-gold-text">
            Settings
          </h1>

          <div className="space-y-6">
            {/* Account Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Type
                </CardTitle>
                <CardDescription>
                  Choose how you want to use CinnaFlow. This affects your dashboard experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {accountTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedAccountType(option.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        selectedAccountType === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-primary/50"
                      }`}
                    >
                      <div className={`${selectedAccountType === option.value ? "text-primary" : "text-muted-foreground"}`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${selectedAccountType === option.value ? "text-primary" : "text-foreground"}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {currentAccountType === option.value && (
                        <span className="text-xs text-muted-foreground">Current</span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedAccountType !== currentAccountType && (
                  <Button
                    onClick={handleAccountTypeChange}
                    disabled={isSavingAccountType}
                  >
                    {isSavingAccountType ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Account Type"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security
                </CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !passwordForm.newPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your account
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">
                      Receive news and promotional content
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketing: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
