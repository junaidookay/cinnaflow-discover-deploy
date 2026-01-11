import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SubmitMusicForm from "@/components/dashboard/SubmitMusicForm";
import QuickPromotion from "@/components/dashboard/QuickPromotion";
import { Music, BarChart3, Settings, Clock, CheckCircle, XCircle, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ArtistDashboard = () => {
  const { user } = useAuth();
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ["my-artist-submissions", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from("artist_promotions")
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
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-6 h-6 text-primary" />
              <Badge variant="secondary">Artist Account</Badge>
            </div>
            <h1 className="text-3xl font-display font-bold cinna-gold-text mb-2">
              Artist Dashboard
            </h1>
            <p className="text-muted-foreground">
              Submit your music and manage promotions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Submit Music Section */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Collapsible open={showSubmitForm} onOpenChange={setShowSubmitForm}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-6 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Plus className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Submit Your Music</h3>
                          <p className="text-sm text-muted-foreground">Get featured on CinnaFlow</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        {showSubmitForm ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-6 pb-6 border-t border-border pt-6">
                      <SubmitMusicForm onSuccess={() => {
                        refetch();
                        setShowSubmitForm(false);
                      }} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Submissions List */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Your Submissions
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {submissions?.length || 0} total
                  </span>
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
                            alt={submission.artist_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Music className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{submission.artist_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Submitted {new Date(submission.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusIcons[submission.approval_status || "pending"]}
                          <span className="text-sm capitalize hidden sm:inline">
                            {submission.approval_status || "pending"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      You haven't submitted any music yet
                    </p>
                    <Button onClick={() => setShowSubmitForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Your First Track
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Promotion */}
              <QuickPromotion type="artist" />

              {/* Quick Links */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Settings className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Account Settings</span>
                  </Link>
                  <Link
                    to="/artists"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Music className="w-5 h-5 text-primary" />
                    <span className="text-foreground">Browse Artists</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArtistDashboard;
