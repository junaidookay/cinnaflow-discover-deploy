import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import ContentRow from "@/components/ContentRow";
import ArtistRow from "@/components/ArtistRow";
import CreatorRow from "@/components/CreatorRow";
import PromoBanner from "@/components/PromoBanner";
import Footer from "@/components/Footer";

// Sample data for content rows
const trendingContent = [
  {
    id: 1,
    title: "Midnight Chronicles",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=80",
    badge: "trending" as const,
  },
  {
    id: 2,
    title: "The Last Kingdom",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
    badge: "trending" as const,
  },
  {
    id: 3,
    title: "Cyber Punk Rising",
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80",
  },
  {
    id: 4,
    title: "Ocean's Mystery",
    image: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&q=80",
  },
  {
    id: 5,
    title: "Desert Warriors",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
  },
  {
    id: 6,
    title: "Neon Nights",
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&q=80",
    badge: "trending" as const,
  },
];

const recentlyAddedContent = [
  {
    id: 1,
    title: "Shadow Protocol",
    image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=600&q=80",
  },
  {
    id: 2,
    title: "Future Legends",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&q=80",
  },
  {
    id: 3,
    title: "The Heist",
    image: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&q=80",
  },
  {
    id: 4,
    title: "Urban Legends",
    image: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&q=80",
  },
  {
    id: 5,
    title: "Code Red",
    image: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=600&q=80",
  },
  {
    id: 6,
    title: "Silent Storm",
    image: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600&q=80",
  },
];

const editorPicksContent = [
  {
    id: 1,
    title: "Cinematic Masterpiece",
    image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=80",
    badge: "featured" as const,
  },
  {
    id: 2,
    title: "Epic Adventures",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    badge: "featured" as const,
  },
  {
    id: 3,
    title: "Hidden Gems",
    image: "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=600&q=80",
    badge: "featured" as const,
  },
  {
    id: 4,
    title: "Award Winners",
    image: "https://images.unsplash.com/photo-1560109947-543149eceb16?w=600&q=80",
    badge: "featured" as const,
  },
];

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Slider */}
      <HeroSlider />
      
      {/* Trending Now */}
      <ContentRow
        title="Trending Now"
        items={trendingContent}
        aspectRatio="video"
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
        items={recentlyAddedContent}
        aspectRatio="video"
      />
      
      {/* Editor Picks */}
      <ContentRow
        title="Editor's Picks"
        items={editorPicksContent}
        aspectRatio="video"
      />
      
      <Footer />
    </main>
  );
};

export default Index;
