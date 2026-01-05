import { motion } from "framer-motion";
import { Play, ExternalLink } from "lucide-react";

interface ArtistCardProps {
  name: string;
  image: string;
  isSponsored?: boolean;
  onClick?: () => void;
}

const ArtistCard = ({ name, image, isSponsored = true, onClick }: ArtistCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="cinna-card cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        {/* Image */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="p-4 rounded-full bg-primary/90 backdrop-blur-sm">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Sponsored Badge */}
        {isSponsored && (
          <div className="absolute top-3 right-3">
            <span className="cinna-badge cinna-badge-sponsored text-[10px]">
              Sponsored Artist
            </span>
          </div>
        )}

        {/* Artist Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
            {name}
          </h3>
          <div className="flex items-center gap-2 text-muted-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
            <span>Listen Now</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ArtistCard;
