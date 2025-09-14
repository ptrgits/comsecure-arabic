import { useEffect } from 'react';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Music
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface BackgroundMusicProps {
  showControls?: boolean;
  autoplay?: boolean;
  volume?: number;
}

const BackgroundMusic = ({ 
  showControls = true, 
  autoplay = true, 
  volume = 0.3 
}: BackgroundMusicProps) => {
  const {
    isPlaying,
    isLoaded,
    currentTrack,
    currentTrackName,
    totalTracks,
    playMusic,
    pauseMusic,
    toggleMusic,
    nextTrack,
    previousTrack,
    setVolume
  } = useBackgroundMusic({ autoplay, volume });

  // Coba autoplay setelah user interaction pertama
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isPlaying && autoplay) {
        playMusic();
      }
      // Remove listener setelah interaction pertama
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isPlaying, autoplay, playMusic]);

  if (!showControls) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 bg-surface/90 backdrop-blur-sm border-metallic/30 w-80">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Music className="w-5 h-5 text-metallic" />
          <div className="flex-1">
            <div className="text-sm font-mono text-glow" dir="rtl">
              موسيقى خلفية
            </div>
            <div className="text-xs text-text-muted font-mono">
              {currentTrackName} ({currentTrack + 1}/{totalTracks})
            </div>
          </div>
        </div>

        {/* Music Controls */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Button
            onClick={previousTrack}
            variant="ghost"
            size="sm"
            className="text-metallic hover:text-glow"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            onClick={toggleMusic}
            variant="ghost"
            size="sm"
            className="text-metallic hover:text-glow"
            disabled={!isLoaded}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>

          <Button
            onClick={nextTrack}
            variant="ghost"
            size="sm"
            className="text-metallic hover:text-glow"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <VolumeX className="w-4 h-4 text-text-muted" />
          <Slider
            defaultValue={[volume * 100]}
            max={100}
            step={1}
            className="flex-1"
            onValueChange={(value) => setVolume(value[0] / 100)}
          />
          <Volume2 className="w-4 h-4 text-text-muted" />
        </div>

        {/* Status */}
        <div className="text-xs text-text-muted font-mono mt-2 text-center" dir="rtl">
          {!isLoaded && 'جاري التحميل...'}
          {isLoaded && !isPlaying && 'متوقف'}
          {isLoaded && isPlaying && 'يتم التشغيل'}
        </div>
      </CardContent>
    </Card>
  );
};

export default BackgroundMusic;