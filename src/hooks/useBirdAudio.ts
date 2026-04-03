// useBirdAudio — HTML5 Audio playback for bird sounds
// Manages a single Audio instance; cleans up on unmount

import { useState, useRef, useCallback, useEffect } from 'react'

export function useBirdAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  /** Tick function that updates progress on each animation frame while playing. */
  const tick = useCallback(() => {
    const audio = audioRef.current
    if (audio && !audio.paused && audio.duration > 0) {
      setProgress(audio.currentTime / audio.duration)
      setDuration(audio.duration)
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  /** Clean up the current audio instance and reset state. */
  const cleanup = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }

    setIsPlaying(false)
    setCurrentUrl(null)
    setProgress(0)
    setDuration(0)
  }, [])

  /** Stop current playback without destroying state needed for restart. */
  const stop = useCallback(() => {
    cleanup()
  }, [cleanup])

  /** Play a bird sound from the given URL. Stops any current playback first. */
  const play = useCallback(
    (url: string) => {
      try {
        // If already playing this URL, restart from the beginning
        if (audioRef.current && currentUrl === url) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(err => {
            console.error('[useBirdAudio] play failed:', err)
            cleanup()
          })
          return
        }

        // Stop any current playback
        cleanup()

        const audio = new Audio(url)
        audioRef.current = audio

        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration)
        })

        audio.addEventListener('ended', () => {
          setIsPlaying(false)
          setProgress(1)
          if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
          }
        })

        audio.addEventListener('error', () => {
          console.error('[useBirdAudio] audio error for:', url)
          cleanup()
        })

        setCurrentUrl(url)
        setIsPlaying(true)
        setProgress(0)

        audio.play().then(() => {
          rafRef.current = requestAnimationFrame(tick)
        }).catch(err => {
          console.error('[useBirdAudio] play failed:', err)
          cleanup()
        })
      } catch (err) {
        console.error('[useBirdAudio] play setup failed:', err)
        cleanup()
      }
    },
    [currentUrl, cleanup, tick],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
        audioRef.current.load()
      }
    }
  }, [])

  return {
    play,
    stop,
    isPlaying,
    currentUrl,
    progress,
    duration,
  }
}
