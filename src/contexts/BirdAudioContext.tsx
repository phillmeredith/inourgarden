// BirdAudioContext — global singleton for bird audio playback
// Ensures only one bird card plays audio at a time across the entire app.

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface BirdAudioState {
  /** Currently playing bird id (null if nothing playing) */
  activeBirdId: string | null
  /** URL currently loaded */
  activeUrl: string | null
  /** 0-1 normalised progress */
  progress: number
  /** Duration in seconds */
  duration: number
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Start or resume playback for a bird */
  play: (birdId: string, url: string) => void
  /** Pause current playback */
  pause: () => void
  /** Toggle play/pause for a specific bird+url */
  toggle: (birdId: string, url: string) => void
  /** Seek to a normalised position 0-1 */
  seek: (fraction: number) => void
  /** Stop and reset everything */
  stop: () => void
}

const BirdAudioContext = createContext<BirdAudioState | null>(null)

export function BirdAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [activeBirdId, setActiveBirdId] = useState<string | null>(null)
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const cancelRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const audio = audioRef.current
    if (audio && !audio.paused && audio.duration > 0) {
      setProgress(audio.currentTime / audio.duration)
      setDuration(audio.duration)
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const cleanup = useCallback(() => {
    cancelRaf()
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
    setIsPlaying(false)
    setActiveBirdId(null)
    setActiveUrl(null)
    setProgress(0)
    setDuration(0)
  }, [cancelRaf])

  const stop = useCallback(() => {
    cleanup()
  }, [cleanup])

  const pause = useCallback(() => {
    cancelRaf()
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [cancelRaf])

  const play = useCallback(
    (birdId: string, url: string) => {
      // If same bird+url and we have an audio element, just resume
      if (audioRef.current && activeBirdId === birdId && activeUrl === url) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true)
            rafRef.current = requestAnimationFrame(tick)
          })
          .catch((err) => {
            console.error('[BirdAudio] resume failed:', err)
            cleanup()
          })
        return
      }

      // Different bird or URL — tear down old, build new
      cleanup()

      const audio = new Audio(url)
      audioRef.current = audio

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })

      audio.addEventListener('ended', () => {
        cancelRaf()
        setIsPlaying(false)
        setProgress(1)
      })

      audio.addEventListener('error', () => {
        console.error('[BirdAudio] load error for:', url)
        cleanup()
      })

      setActiveBirdId(birdId)
      setActiveUrl(url)
      setIsPlaying(true)
      setProgress(0)

      audio
        .play()
        .then(() => {
          rafRef.current = requestAnimationFrame(tick)
        })
        .catch((err) => {
          console.error('[BirdAudio] play failed:', err)
          cleanup()
        })
    },
    [activeBirdId, activeUrl, cleanup, cancelRaf, tick],
  )

  const toggle = useCallback(
    (birdId: string, url: string) => {
      if (activeBirdId === birdId && activeUrl === url && isPlaying) {
        pause()
      } else {
        play(birdId, url)
      }
    },
    [activeBirdId, activeUrl, isPlaying, pause, play],
  )

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current
    if (audio && audio.duration > 0) {
      audio.currentTime = fraction * audio.duration
      setProgress(fraction)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRaf()
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
    }
  }, [cancelRaf])

  return (
    <BirdAudioContext.Provider
      value={{
        activeBirdId,
        activeUrl,
        progress,
        duration,
        isPlaying,
        play,
        pause,
        toggle,
        seek,
        stop,
      }}
    >
      {children}
    </BirdAudioContext.Provider>
  )
}

export function useBirdAudioContext() {
  const ctx = useContext(BirdAudioContext)
  if (!ctx) {
    throw new Error('useBirdAudioContext must be used within a BirdAudioProvider')
  }
  return ctx
}
