import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ViewerDashboard from "./dashboard/ViewerDashboard";
import ArtistDashboard from "./dashboard/ArtistDashboard";
import CreatorDashboard from "./dashboard/CreatorDashboard";
import { Skeleton } from "@/components/ui/skeleton";

type AccountType = "viewer" | "artist" | "creator";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      // Fetch user's account type from profile
      const fetchAccountType = async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setAccountType("viewer");
        } else {
          setAccountType((data?.account_type as AccountType) || "viewer");
        }
        setIsLoading(false);
      };

      fetchAccountType();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  switch (accountType) {
    case "artist":
      return <ArtistDashboard />;
    case "creator":
      return <CreatorDashboard />;
    default:
      return <ViewerDashboard />;
  }
};

export default Dashboard;