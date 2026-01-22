import { useState, useMemo } from 'react';
import { ChevronDown, Play, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Episode {
  season: number;
  episode: number;
  title?: string;
  url: string;
}

interface EpisodeSelectorProps {
  episodes: Episode[];
  currentEpisode: Episode | null;
  onEpisodeSelect: (episode: Episode) => void;
  className?: string;
}

const EpisodeSelector = ({ 
  episodes, 
  currentEpisode, 
  onEpisodeSelect,
  className 
}: EpisodeSelectorProps) => {
  // Group episodes by season
  const seasons = useMemo(() => {
    const seasonMap = new Map<number, Episode[]>();
    
    episodes.forEach(ep => {
      if (!seasonMap.has(ep.season)) {
        seasonMap.set(ep.season, []);
      }
      seasonMap.get(ep.season)!.push(ep);
    });
    
    // Sort episodes within each season
    seasonMap.forEach(eps => {
      eps.sort((a, b) => a.episode - b.episode);
    });
    
    return Array.from(seasonMap.entries()).sort((a, b) => a[0] - b[0]);
  }, [episodes]);

  const [selectedSeason, setSelectedSeason] = useState<number>(
    currentEpisode?.season || seasons[0]?.[0] || 1
  );

  const currentSeasonEpisodes = useMemo(() => {
    return seasons.find(([s]) => s === selectedSeason)?.[1] || [];
  }, [seasons, selectedSeason]);

  if (episodes.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tv className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Episodes</h3>
          <span className="text-sm text-muted-foreground">
            ({episodes.length} total)
          </span>
        </div>

        {/* Season Selector */}
        {seasons.length > 1 && (
          <Select 
            value={selectedSeason.toString()} 
            onValueChange={(val) => setSelectedSeason(parseInt(val))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map(([season, eps]) => (
                <SelectItem key={season} value={season.toString()}>
                  Season {season} ({eps.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Episode Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {currentSeasonEpisodes.map((ep) => {
          const isActive = currentEpisode?.season === ep.season && 
                          currentEpisode?.episode === ep.episode;
          
          return (
            <button
              key={`${ep.season}-${ep.episode}`}
              onClick={() => onEpisodeSelect(ep)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all",
                "hover:bg-primary/10 hover:text-primary",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-foreground"
              )}
            >
              <Play className={cn(
                "w-3.5 h-3.5 flex-shrink-0",
                isActive ? "fill-current" : ""
              )} />
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  E{ep.episode.toString().padStart(2, '0')}
                </div>
                {ep.title && (
                  <div className="text-xs opacity-70 truncate">
                    {ep.title}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Currently Playing */}
      {currentEpisode && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
          <Play className="w-4 h-4 text-primary fill-primary" />
          <span>
            Now playing: Season {currentEpisode.season}, Episode {currentEpisode.episode}
            {currentEpisode.title && ` - ${currentEpisode.title}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default EpisodeSelector;
