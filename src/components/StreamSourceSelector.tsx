import { useState } from 'react';
import { ChevronDown, Play, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { streamingSources, getPrimaryStreamUrl, getAllStreamUrls } from '@/lib/streamingSources';
import VideoPlayer from '@/components/VideoPlayer';

interface StreamSourceSelectorProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  poster?: string;
  title?: string;
}

const StreamSourceSelector = ({
  tmdbId,
  type,
  season,
  episode,
  poster,
  title
}: StreamSourceSelectorProps) => {
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  const allSources = getAllStreamUrls(tmdbId, type, season, episode);
  const currentSource = allSources[currentSourceIndex];
  
  const handleSourceChange = (index: number) => {
    setCurrentSourceIndex(index);
    setHasError(false);
  };
  
  const tryNextSource = () => {
    if (currentSourceIndex < allSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
      setHasError(false);
    }
  };

  if (!tmdbId) {
    return (
      <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">No streaming source available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Source selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            Streaming from: <span className="text-foreground font-medium">{currentSource.name}</span>
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Change Source
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            {allSources.map((source, index) => (
              <DropdownMenuItem
                key={source.name}
                onClick={() => handleSourceChange(index)}
                className={index === currentSourceIndex ? 'bg-primary/10 text-primary' : ''}
              >
                <Play className="w-4 h-4 mr-2" />
                {source.name}
                {index === currentSourceIndex && (
                  <span className="ml-auto text-xs text-primary">(active)</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Video player */}
      <div className="relative">
        <VideoPlayer
          src={currentSource.url}
          poster={poster}
          title={title}
        />
        
        {/* Error overlay with fallback option */}
        {hasError && currentSourceIndex < allSources.length - 1 && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
            <p className="text-foreground mb-2">Source unavailable</p>
            <p className="text-muted-foreground text-sm mb-4">
              Try another streaming source
            </p>
            <Button onClick={tryNextSource} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try {allSources[currentSourceIndex + 1]?.name}
            </Button>
          </div>
        )}
      </div>

      {/* Source info */}
      <p className="text-xs text-muted-foreground">
        If the video doesn't play, try switching to a different source using the dropdown above.
      </p>
    </div>
  );
};

export default StreamSourceSelector;
