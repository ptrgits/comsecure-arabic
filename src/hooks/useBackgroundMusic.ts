import { useEffect, useRef, useState } from 'react';

interface UseBackgroundMusicProps {
  autoplay?: boolean;
  volume?: number;
}

export const useBackgroundMusic = ({ 
  autoplay = true, 
  volume = 0.3 
}: UseBackgroundMusicProps = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Daftar musik yang akan diputar berurutan
  const musicTracks = [
    '/play/music1.mp3',
    '/play/music2.mp3',
    '/play/music3.mp3',
    '/play/music4.mp3'
  ];

  useEffect(() => {
    // Buat audio element
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.preload = 'auto';

    const audio = audioRef.current;

    // Event listeners
    const handleCanPlay = () => {
      setIsLoaded(true);
      if (autoplay) {
        playMusic();
      }
    };

    const handleEnded = () => {
      // Pindah ke track berikutnya
      setCurrentTrack((prev) => (prev + 1) % musicTracks.length);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Load track pertama
    audio.src = musicTracks[0];
    audio.load();

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Effect untuk mengganti track
  useEffect(() => {
    if (audioRef.current && musicTracks[currentTrack]) {
      const audio = audioRef.current;
      const wasPlaying = isPlaying;
      
      audio.src = musicTracks[currentTrack];
      audio.load();
      
      const handleCanPlay = () => {
        if (wasPlaying || autoplay) {
          playMusic();
        }
        audio.removeEventListener('canplay', handleCanPlay);
      };
      
      audio.addEventListener('canplay', handleCanPlay);
    }
  }, [currentTrack]);

  const playMusic = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.log('Autoplay blocked by browser:', error);
        // Browser memblokir autoplay, akan diputar setelah user interaction
      }
    }
  };

  const pauseMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggleMusic = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playMusic();
    }
  };

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % musicTracks.length);
  };

  const previousTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + musicTracks.length) % musicTracks.length);
  };

  const setVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return {
    isPlaying,
    isLoaded,
    currentTrack,
    currentTrackName: musicTracks[currentTrack]?.split('/').pop()?.replace('.mp3', '') || '',
    totalTracks: musicTracks.length,
    playMusic,
    pauseMusic,
    toggleMusic,
    nextTrack,
    previousTrack,
    setVolume
  };
};