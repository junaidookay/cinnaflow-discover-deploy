import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ContentDetail from "./pages/ContentDetail";
import Promote from "./pages/Promote";
import SubmitArtist from "./pages/SubmitArtist";
import SubmitCreator from "./pages/SubmitCreator";
import CategoryPage from "./pages/CategoryPage";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContent from "./pages/admin/AdminContent";
import AdminArtists from "./pages/admin/AdminArtists";
import AdminCreators from "./pages/admin/AdminCreators";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPlex from "./pages/admin/AdminPlex";
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
            <Route path="/content/:id" element={<ContentDetail />} />
            <Route path="/promote" element={<Promote />} />
            <Route path="/submit/artist" element={<SubmitArtist />} />
            <Route path="/submit/creator" element={<SubmitCreator />} />
            <Route path="/movies" element={<CategoryPage />} />
            <Route path="/tv" element={<CategoryPage />} />
            <Route path="/sports" element={<CategoryPage />} />
            <Route path="/clips" element={<CategoryPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/artists" element={<AdminArtists />} />
            <Route path="/admin/creators" element={<AdminCreators />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/plex" element={<AdminPlex />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
