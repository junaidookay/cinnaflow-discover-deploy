import { motion } from "framer-motion";
import { Play } from "lucide-react";

interface ContentCardProps {
  title: string;
  image: string;
  badge?: "trending" | "sponsored" | "live" | "featured";
  aspectRatio?: "video" | "poster" | "square";
  onClick?: () => void;
}

const badgeStyles = {
  trending: "cinna-badge-trending",
  sponsored: "cinna-badge-sponsored",
  live: "cinna-badge-live",
  featured: "bg-primary/20 text-primary border border-primary/30",
};

const badgeLabels = {
  trending: "Trending",
  sponsored: "Sponsored",
  live: "Live",
  featured: "Featured",
};

const ContentCard = ({
  title,
  image,
  badge,
  aspectRatio = "video",
  onClick,
}: ContentCardProps) => {
  const aspectClasses = {
    video: "aspect-video",
    poster: "aspect-[2/3]",
    square: "aspect-square",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="cinna-card cursor-pointer group"
      onClick={onClick}
    >
      <div className={`relative ${aspectClasses[aspectRatio]} overflow-hidden`}>
        {/* Image */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Play Button (appears on hover) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-4 rounded-full bg-primary/90 backdrop-blur-sm">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3">
            <span className={`cinna-badge ${badgeStyles[badge]}`}>
              {badgeLabels[badge]}
            </span>
          </div>
        )}

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-2">
            {title}
          </h3>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentCard;
