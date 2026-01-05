import { motion } from "framer-motion";
import { Tv, Youtube, Radio } from "lucide-react";

interface CreatorCardProps {
  name: string;
  image: string;
  platform: "twitch" | "youtube" | "kick";
  isLive?: boolean;
  onClick?: () => void;
}

const platformIcons = {
  twitch: Tv,
  youtube: Youtube,
  kick: Radio,
};

const platformColors = {
  twitch: "text-purple-400",
  youtube: "text-red-500",
  kick: "text-green-400",
};

const CreatorCard = ({
  name,
  image,
  platform,
  isLive = false,
  onClick,
}: CreatorCardProps) => {
  const PlatformIcon = platformIcons[platform];

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="cinna-card cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden">
        {/* Image */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {isLive && (
            <span className="cinna-badge cinna-badge-live flex items-center gap-1">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Live
            </span>
          )}
          {!isLive && (
            <span className="cinna-badge cinna-badge-sponsored">Featured</span>
          )}
        </div>

        {/* Platform Icon */}
        <div className="absolute top-3 right-3">
          <div className="p-2 rounded-full bg-background/80 backdrop-blur-sm">
            <PlatformIcon className={`w-4 h-4 ${platformColors[platform]}`} />
          </div>
        </div>

        {/* Creator Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground capitalize">{platform}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default CreatorCard;
