import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Video, Rocket, BarChart3, Settings, Plus, Clock, CheckCircle, XCircle, Twitch, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const platformIcons: Record<string, React.ReactNode> = {
  twitch: <Twitch className="w-6 h-6" />,
  youtube: <Youtube className="w-6 h-6" />,
  kick: <Video className="w-6 h-6" />,
};

const CreatorDashboard = () => {
  const { user } = useAuth();

  // Fetch user's submissions
  const { data: submissions, isLoading } = useQuery({
    queryKey: ["my-creator-submissions", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from("creator_promotions")
        .select("*")
        .eq("submitter_email", user.email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    approved: <CheckCircle className="w-4 h-4 text-green-500" />,
    rejected: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-6 h-6 text-primary" />
              <Badge variant="secondary">Creator Account</Badge>
            </div>
            <h1 className="text-3xl font-display font-bold cinna-gold-text mb-2">
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your channel and promotions
            </p>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link
              to="/submit/creator"
              className="bg-primary text-primary-foreground rounded-xl p-6 hover:bg-primary/90 transition-colors group"
            >
              <Plus className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-1">
                Submit Your Channel
              </h3>
              <p className="text-sm opacity-90">
                Get featured on CinnaFlow
              </p>
            </Link>

            <Link
              to="/promote"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
            >
              <Rocket className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Boost Your Reach
              </h3>
              <p className="text-sm text-muted-foreground">
                Explore promotion packages
              </p>
            </Link>

            <Link
              to="/settings"
              className="bg-card border border-border rounded-xl p-6 hover:border-primary transition-colors group"
            >
              <Settings className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Account Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your profile
              </p>
            </Link>
          </div>

          {/* Submissions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Your Submissions
              </h2>
              <Link
                to="/submit/creator"
                className="text-sm text-primary hover:underline"
              >
                + New Submission
              </Link>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading submissions...
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg"
                  >
                    {submission.thumbnail_url ? (
                      <img
                        src={submission.thumbnail_url}
                        alt={submission.creator_name}
                        className="w-16 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-10 rounded bg-primary/10 flex items-center justify-center">
                        {platformIcons[submission.platform] || <Video className="w-6 h-6 text-primary" />}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{submission.creator_name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="capitalize">{submission.platform}</span>
                        •
                        Submitted {new Date(submission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {submission.is_live && (
                        <Badge className="bg-red-600 text-white animate-pulse">
                          LIVE
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        {statusIcons[submission.approval_status || "pending"]}
                        <span className="text-sm capitalize">
                          {submission.approval_status || "pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any channels yet
                </p>
                <Link
                  to="/submit/creator"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Submit Your Channel
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreatorDashboard;