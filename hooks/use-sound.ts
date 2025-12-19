"use client"

import { useCallback, useRef, useEffect } from "react"

export function useSound(src: string, options: { volume?: number } = {}) {
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Create audio element
        const audio = new Audio(src)
        audio.volume = options.volume ?? 0.5
        audioRef.current = audio

        return () => {
            audio.pause()
            audioRef.current = null
        }
    }, [src, options.volume])

    const play = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {
                // Ignore autoplay errors
            })
        }
    }, [])

    return play
}

// Simple click sound (data URI for zero dependency)
export const CLICK_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" // truncated placeholder, better to use real file or standard one
// Actually, let's use a generated beep for simplicity if no file is provided, or assume a path.
// For now, I will create a simple utility that plays a short frequency for 'click'.
export function playClickSound() {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

export function playVictorySound() {
    if (typeof window === "undefined") return
    const context = new (window.AudioContext || (window as any).webkitAudioContext)()

    const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = context.createOscillator()
        const gain = context.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

        osc.connect(gain)
        gain.connect(context.destination)

        osc.start(startTime)
        osc.stop(startTime + duration)
    }

    const now = context.currentTime
    // Celebratory C Major chord sequence
    playNote(523.25, now, 0.5) // C5
    playNote(659.25, now + 0.1, 0.5) // E5
    playNote(783.99, now + 0.2, 0.5) // G5
    playNote(1046.50, now + 0.3, 0.8) // C6
}
