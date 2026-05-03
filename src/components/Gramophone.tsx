import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';
import type { SongConfig } from '@/types/template-data';
import './Gramophone.css';

interface GramophoneProps {
  song: SongConfig;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoPlay?: boolean;
}

const Gramophone = ({ song, position = 'bottom-right', autoPlay = false }: GramophoneProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio only once on mount
    if (song.audioUrl && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = song.loop || false;
      audioRef.current.src = song.audioUrl;
      
      // Add error handler
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio file failed to load:', song.audioUrl, e);
        setHasError(true);
        setIsPlaying(false);
      });
      
      // Add canplay event to verify file is loaded
      audioRef.current.addEventListener('canplay', () => {
        console.log('Audio file loaded successfully:', song.audioUrl);
        setHasError(false);
      });
    }

    return () => {
      // Only cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        // Don't set to null here to prevent re-initialization
      }
    };
  }, [song]); // Only depend on song, not autoPlay

  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  // Separate effect to handle autoplay
  useEffect(() => {
    if (autoPlay && audioRef.current && !isPlaying && !hasAutoPlayed) {
      audioRef.current.currentTime = 0; // Start from beginning
      audioRef.current.play().catch(err => {
        console.log('Autoplay blocked:', err);
        setHasError(true);
      });
      setIsPlaying(true);
      setHasAutoPlayed(true);
    }
  }, [autoPlay, isPlaying, hasAutoPlayed]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (hasError || !audioRef.current) {
      console.warn('Audio not available');
      alert('⚠️ Audio file not found.\n\nPlease add your song file to:\n/public/assets/songs/\n\nExpected file: ' + song.audioUrl);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.log('Play error:', err);
        setHasError(true);
        alert('⚠️ Unable to play audio.\n\nPlease check that the file exists:\n' + song.audioUrl);
      });
      setIsPlaying(true);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4 sm:bottom-6 sm:right-6';
      case 'bottom-left':
        return 'bottom-4 left-4 sm:bottom-6 sm:left-6';
      case 'top-right':
        return 'top-4 right-4 sm:top-6 sm:right-6';
      case 'top-left':
        return 'top-4 left-4 sm:top-6 sm:left-6';
      default:
        return 'bottom-4 right-4 sm:bottom-6 sm:right-6';
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* Music Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        className="relative gramophone-button"
        aria-label="Music player"
      >
        {/* Outer shadow ring */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-800 via-gray-900 to-black shadow-2xl overflow-hidden cursor-pointer border-2 border-gray-700/50">
          {/* Vinyl Record */}
          <div className={`absolute inset-1.5 rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-900 ${isPlaying ? 'spinning' : ''}`}>
            {/* Record grooves - multiple concentric circles */}
            <div className="absolute inset-1 rounded-full border border-gray-800/40" />
            <div className="absolute inset-2 rounded-full border border-gray-800/30" />
            <div className="absolute inset-3 rounded-full border border-gray-800/25" />
            <div className="absolute inset-4 rounded-full border border-gray-800/20" />
            <div className="absolute inset-5 rounded-full border border-gray-800/15" />
            
            {/* Vinyl shine effect */}
            <div className="absolute inset-0 rounded-full vinyl-shine" />
            
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 shadow-lg border border-amber-700">
                {/* Center hole */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Music Note Icon (Alternative simpler design) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default Gramophone;
