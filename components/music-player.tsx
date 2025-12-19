"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipForward, SkipBack, Disc, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const PLAYLIST = [
    { title: "Calm Focus", src: "/music/calm_music.mp3", color: "from-blue-400 to-cyan-300" },
    { title: "Chill Beats", src: "/music/chill_beats.mp3", color: "from-purple-400 to-pink-300" },
    { title: "Gaming Mode", src: "/music/gaming_track.mp3", color: "from-green-400 to-emerald-300" },
    { title: "Atmosphere", src: "/music/smooth_atmosphere.mp3", color: "from-orange-400 to-yellow-300" },
]

export function MusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const [volume, setVolume] = useState(0.3)
    const [isMuted, setIsMuted] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const currentTrack = PLAYLIST[currentTrackIndex]

    useEffect(() => {
        audioRef.current = new Audio(currentTrack.src)
        audioRef.current.loop = true
        return () => {
            audioRef.current?.pause()
            audioRef.current = null
        }
    }, []) // Init only once, track change handled below

    useEffect(() => {
        if (audioRef.current) {
            // Change source if needed
            if (audioRef.current.src !== new URL(currentTrack.src, window.location.href).href) {
                const wasPlaying = isPlaying;
                audioRef.current.src = currentTrack.src;
                if (wasPlaying) {
                    audioRef.current.play().catch((error) => {
                        if (error.name !== 'AbortError') {
                            console.error('Audio play error:', error);
                        }
                    });
                }
            }
            audioRef.current.volume = isMuted ? 0 : volume
        }
    }, [currentTrack, volume, isMuted, isPlaying])

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play().catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('Audio play error:', error);
                    }
                });
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleNext = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length)
    }

    const handlePrev = () => {
        setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)
    }

    return (
        <div
            className={cn(
                "fixed z-50 transition-all duration-300 ease-out",
                "max-sm:bottom-4 max-sm:right-2 sm:bottom-4 sm:left-4",
                isHovered ? "scale-100 opacity-100" : "scale-90 opacity-80 hover:scale-100 hover:opacity-100"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={cn(
                "bg-background/80 backdrop-blur-md border border-border shadow-2xl rounded-xl sm:rounded-full p-2 flex items-center gap-2 transition-all duration-300",
                !isHovered && "max-sm:w-16 max-sm:pr-2 overflow-hidden"
            )}>

                {/* CD Spinner */}
                <div className="relative w-12 h-12 flex-shrink-0">
                    <div
                        className={cn(
                            "absolute inset-0 rounded-full bg-gradient-to-tr animate-spin-slow border-2 border-white/20 shadow-inner",
                            currentTrack.color,
                            !isPlaying && "animation-paused"
                        )}
                        style={{ animationDuration: '3s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-background rounded-full border border-border" />
                    </div>
                </div>

                <div className="flex flex-col min-w-[100px]">
                    <span className="text-xs font-bold truncate max-w-[100px]">{currentTrack.title}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePrev}>
                            <SkipBack className="h-3 w-3" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-primary/10 hover:bg-primary/20 rounded-full"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 ml-0.5 text-primary" />}
                        </Button>

                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNext}>
                            <SkipForward className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Volume - Show on hover */}
                <div className={cn(
                    "flex items-center gap-2 transition-all duration-300 overflow-hidden",
                    isHovered ? "w-24 opacity-100" : "w-0 opacity-0"
                )}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setIsMuted(!isMuted)}>
                        {isMuted || volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    </Button>
                    <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={(v) => setVolume(v[0])}
                        className="w-16"
                    />
                </div>

            </div>
            <style jsx global>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        .animation-paused {
          animation-play-state: paused;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}
