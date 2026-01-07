import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CreatorCard from "./CreatorCard";
import { useApprovedCreators } from "@/hooks/useContent";

// Fallback data when no database content
const fallbackCreators = [
  {
    id: "fallback-1",
    creator_name: "StreamKing",
    thumbnail_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
    platform: "twitch" as const,
    is_live: true,
  },
  {
    id: "fallback-2",
    creator_name: "GameMaster Pro",
    thumbnail_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80",
    platform: "youtube" as const,
    is_live: false,
  },
  {
    id: "fallback-3",
    creator_name: "NightOwl Gaming",
    thumbnail_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80",
    platform: "kick" as const,
    is_live: true,
  },
  {
    id: "fallback-4",
    creator_name: "TechTalk Live",
    thumbnail_url: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&q=80",
    platform: "youtube" as const,
    is_live: false,
  },
  {
    id: "fallback-5",
    creator_name: "Creative Corner",
    thumbnail_url: "https://images.unsplash.com/photo-1493711662062-fa541f7f76a9?w=600&q=80",
    platform: "twitch" as const,
    is_live: true,
  },
  {
    id: "fallback-6",
    creator_name: "Sports Central",
    thumbnail_url: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
    platform: "kick" as const,
    is_live: false,
  },
];

const CreatorRow = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: creators, isLoading } = useApprovedCreators();

  const displayCreators = creators && creators.length > 0 ? creators : fallbackCreators;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-8">
          <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-6" />
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px] aspect-video bg-secondary rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
              Featured Creators
            </motion.h2>
            <p className="text-sm text-muted-foreground mt-1">
              Watch live streams and discover new creators
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
          {displayCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-[280px] md:w-[320px]"
            >
              <CreatorCard
                name={creator.creator_name}
                image={creator.thumbnail_url || ""}
                platform={creator.platform}
                isLive={creator.is_live ?? false}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreatorRow;
