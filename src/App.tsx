import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ContentDetail from "./pages/ContentDetail";
import Promote from "./pages/Promote";
import SubmitArtist from "./pages/SubmitArtist";
import SubmitCreator from "./pages/SubmitCreator";
import CategoryPage from "./pages/CategoryPage";
import ArtistsPage from "./pages/ArtistsPage";
import CreatorsPage from "./pages/CreatorsPage";
import PodcastsPage from "./pages/PodcastsPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import MyList from "./pages/MyList";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContent from "./pages/admin/AdminContent";
import AdminArtists from "./pages/admin/AdminArtists";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPlex from "./pages/admin/AdminPlex";
import AdminTMDB from "./pages/admin/AdminTMDB";
import AdminStreams from "./pages/admin/AdminStreams";
import AdminPodcasts from "./pages/admin/AdminPodcasts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/content/:id" element={<ContentDetail />} />
            <Route path="/promote" element={<Promote />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/my-list" element={<MyList />} />
            <Route path="/submit/artist" element={<SubmitArtist />} />
            <Route path="/submit/creator" element={<SubmitCreator />} />
            <Route path="/movies" element={<CategoryPage />} />
            <Route path="/tv" element={<CategoryPage />} />
            <Route path="/sports" element={<CategoryPage />} />
            <Route path="/clips" element={<CategoryPage />} />
            <Route path="/podcasts" element={<PodcastsPage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/creators" element={<CreatorsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/podcasts" element={<AdminPodcasts />} />
            <Route path="/admin/artists" element={<AdminArtists />} />
            <Route path="/admin/creators" element={<AdminCreators />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/plex" element={<AdminPlex />} />
            <Route path="/admin/tmdb" element={<AdminTMDB />} />
            <Route path="/admin/streams" element={<AdminStreams />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
