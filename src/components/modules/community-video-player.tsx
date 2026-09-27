'use client';

import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommunityVideoPlayerProps {
  videoSrc?: string;
  posterSrc?: string;
  fallbackImageSrc?: string;
  title?: string;
  className?: string;
}

export function CommunityVideoPlayer({
  videoSrc = '/videos/community-video.mp4',
  posterSrc = '/videos/community-poster.jpg',
  fallbackImageSrc = '/brand/community-team.png',
  title = 'Dokumentasi Kejuaraan & Komunitas Rajendra Project',
  className = '',
}: CommunityVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('[VideoPlayer] Play attempt notice:', err);
          // If browser policy blocked unmuted playback, retry muted
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch((e) => {
                console.warn('[VideoPlayer] Autoplay fallback failed:', e);
              });
          }
        });
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div
      className={cn(
        'group relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 shadow-2xl transition-all',
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* ── VIDEO CONTAINER ── */}
      <div
        className="relative aspect-video w-full overflow-hidden flex items-center justify-center bg-slate-900 cursor-pointer"
        onClick={togglePlay}
      >
        {!hasError ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc}
            playsInline
            muted={isMuted}
            preload="metadata"
            loop
            onError={() => setHasError(true)}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="h-full w-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : (
          /* Fallback Poster Image if Video file is not yet placed by user */
          <div className="relative h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fallbackImageSrc}
              alt={title}
              className="h-full w-full object-cover object-center filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
          </div>
        )}

        {/* ── BIG CENTER PLAY BUTTON OVERLAY ── */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/35 backdrop-blur-[2px] transition-all">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
              className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#18a2b8]/90 text-white shadow-xl ring-4 ring-white/30 backdrop-blur-md transition-all hover:scale-110 hover:bg-[#138496] active:scale-95 cursor-pointer"
            >
              <Play className="h-7 w-7 sm:h-9 sm:w-9 fill-current ml-1" />
            </button>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
              <Film className="h-3.5 w-3.5 text-cyan-300" />
              Putar Video Teaser &amp; Dokumentasi
            </span>
          </div>
        )}

        {/* ── TOP BADGE OVERLAY ── */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-slate-950/60 text-white backdrop-blur-md border border-white/20 shadow-xs">
            <Sparkles className="h-3 w-3 text-cyan-300" />
            KOMUNITAS RAJENDRA PROJECT
          </span>
        </div>

        {/* ── BOTTOM CONTROLS BAR (HOVER VISIBLE) ── */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-4 transition-opacity duration-300 text-white',
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg text-white hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-white hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
              title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <span className="text-xs font-bold truncate max-w-xs sm:max-w-md hidden sm:inline-block text-slate-200">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg text-white hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
              title="Layar Penuh"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
