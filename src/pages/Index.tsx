import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import ContentRow from "@/components/ContentRow";
import ArtistRow from "@/components/ArtistRow";
import CreatorRow from "@/components/CreatorRow";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";
import { useContentBySection } from "@/hooks/useContent";

const Index = () => {
  const { data: trendingContent, isLoading: trendingLoading } = useContentBySection("trending");
  const { data: recentlyAddedContent, isLoading: recentlyLoading } = useContentBySection("recently_added");
  const { data: editorPicksContent, isLoading: editorLoading } = useContentBySection("editor_picks");

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Slider */}
      <HeroSlider />
      
      {/* Trending Now */}
      <ContentRow
        title="Trending Now"
        items={trendingContent || []}
        aspectRatio="video"
        isLoading={trendingLoading}
      />
      
      {/* Featured Artists */}
      <ArtistRow />
      
      {/* Promo Banner */}
      <PromoBanner />
      
      {/* Featured Creators */}
      <CreatorRow />
      
      {/* Recently Added */}
      <ContentRow
        title="Recently Added"
        items={recentlyAddedContent || []}
        aspectRatio="video"
        isLoading={recentlyLoading}
      />
      
      {/* Editor Picks */}
      <ContentRow
        title="Editor's Picks"
        items={editorPicksContent || []}
        aspectRatio="video"
        isLoading={editorLoading}
      />
      
      <Footer />
    </main>
  );
};

export default Index;
