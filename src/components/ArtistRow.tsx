import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ArtistCard from "./ArtistCard";

interface Artist {
  id: number;
  name: string;
  image: string;
  isSponsored?: boolean;
}

const artists: Artist[] = [
  {
    id: 1,
    name: "Luna Eclipse",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
  },
  {
    id: 2,
    name: "Neon Pulse",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80",
  },
  {
    id: 3,
    name: "Velvet Storm",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
  },
  {
    id: 4,
    name: "Crystal Waves",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
  },
  {
    id: 5,
    name: "Midnight Rhythm",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
  },
  {
    id: 6,
    name: "Aurora Beats",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
  },
];

const ArtistRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4 md:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="cinna-section-title"
            >
              Featured Artists
            </motion.h2>
            <p className="text-sm text-muted-foreground mt-1">
              Discover new music and support independent artists
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll("left")}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0"
        >
          {artists.map((artist, index) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-[200px] md:w-[240px]"
            >
              <ArtistCard
                name={artist.name}
                image={artist.image}
                isSponsored={artist.isSponsored !== false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArtistRow;
