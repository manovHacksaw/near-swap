import { useCallback, useEffect, useState } from 'react';

interface SoundHook {
  play: () => void;
  isLoaded: boolean;
}

export function useSound(src: string, options?: { volume?: number }): [() => void, { isLoaded: boolean }] {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;

    try {
      const audioElement = new Audio(src);
      audioElement.preload = 'auto';
      audioElement.volume = options?.volume || 1;

      const handleCanPlayThrough = () => {
        setIsLoaded(true);
        setError(null);
      };

      const handleError = () => {
        setError('Failed to load audio');
        setIsLoaded(false);
      };

      audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
      audioElement.addEventListener('error', handleError);

      setAudio(audioElement);

      return () => {
        audioElement.removeEventListener('canplaythrough', handleCanPlayThrough);
        audioElement.removeEventListener('error', handleError);
        audioElement.pause();
        audioElement.src = '';
      };
    } catch (err) {
      console.warn('Failed to create audio element:', err);
      setError('Failed to create audio element');
    }
  }, [src, options?.volume]);

  const play = useCallback(() => {
    if (audio && isLoaded && !error) {
      try {
        audio.currentTime = 0;
        audio.play().catch((err) => {
          console.warn('Failed to play audio:', err);
        });
      } catch (err) {
        console.warn('Failed to play audio:', err);
      }
    }
  }, [audio, isLoaded, error]);

  return [play, { isLoaded }];
}
