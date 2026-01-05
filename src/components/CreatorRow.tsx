import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CreatorCard from "./CreatorCard";

interface Creator {
  id: number;
  name: string;
  image: string;
  platform: "twitch" | "youtube" | "kick";
  isLive?: boolean;
}

const creators: Creator[] = [
  {
    id: 1,
    name: "StreamKing",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
    platform: "twitch",
    isLive: true,
  },
  {
    id: 2,
    name: "GameMaster Pro",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80",
    platform: "youtube",
    isLive: false,
  },
  {
    id: 3,
    name: "NightOwl Gaming",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&q=80",
    platform: "kick",
    isLive: true,
  },
  {
    id: 4,
    name: "TechTalk Live",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&q=80",
    platform: "youtube",
    isLive: false,
  },
  {
    id: 5,
    name: "Creative Corner",
    image: "https://images.unsplash.com/photo-1493711662062-fa541f7f76a9?w=600&q=80",
    platform: "twitch",
    isLive: true,
  },
  {
    id: 6,
    name: "Sports Central",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80",
    platform: "kick",
    isLive: false,
  },
];

const CreatorRow = () => {
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
          {creators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex-shrink-0 w-[280px] md:w-[320px]"
            >
              <CreatorCard
                name={creator.name}
                image={creator.image}
                platform={creator.platform}
                isLive={creator.isLive}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CreatorRow;
