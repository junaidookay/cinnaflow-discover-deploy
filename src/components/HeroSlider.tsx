import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";

interface Slide {
  id: number;
  title: string;
  tagline: string;
  image: string;
  type: "show" | "sports" | "artist" | "creator";
}

const slides: Slide[] = [
  {
    id: 1,
    title: "The Midnight Chronicles",
    tagline: "A journey through time and space awaits",
    image: hero1,
    type: "show",
  },
  {
    id: 2,
    title: "Championship Finals",
    tagline: "Witness history in the making",
    image: hero2,
    type: "sports",
  },
  {
    id: 3,
    title: "Velvet Sounds",
    tagline: "Experience the new wave of music",
    image: hero3,
    type: "artist",
  },
  {
    id: 4,
    title: "Creator Spotlight",
    tagline: "Discover trending creators live now",
    image: hero4,
    type: "creator",
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[current].image})` }}
          />
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 md:px-8 flex items-end pb-16 md:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary rounded-full">
              {slides[current].type === "show" && "Trending Now"}
              {slides[current].type === "sports" && "Live Sports"}
              {slides[current].type === "artist" && "Featured Artist"}
              {slides[current].type === "creator" && "Creator Spotlight"}
            </span>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display text-foreground mb-4 tracking-wide">
              {slides[current].title}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
              {slides[current].tagline}
            </p>
            
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 group">
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Explore
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "w-8 bg-primary"
                : "bg-foreground/30 hover:bg-foreground/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
