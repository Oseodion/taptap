import { useEffect, useRef } from 'react'
import countdownSrc from '../assets/sounds/countdown_tension.mp3'
import clickSrc from '../assets/sounds/click_tap.mp3'

export function useAudio(isMuted: boolean) {
  const countdownRef = useRef<HTMLAudioElement | null>(null)
  const clickRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    countdownRef.current = new Audio(countdownSrc)
    countdownRef.current.loop = true
    countdownRef.current.volume = 0.0

    clickRef.current = new Audio(clickSrc)
    clickRef.current.loop = false
    clickRef.current.volume = 0.7

    return () => {
      countdownRef.current?.pause()
      clickRef.current?.pause()
    }
  }, [])

  useEffect(() => {
    if (isMuted) {
      countdownRef.current?.pause()
    }
  }, [isMuted])

  function playCountdown() {
    if (isMuted || !countdownRef.current) return
    countdownRef.current.volume = 0.04
    countdownRef.current.play().catch(() => {})
  }

  function stopCountdown() {
    if (!countdownRef.current) return
    countdownRef.current.pause()
    countdownRef.current.currentTime = 0
  }

  function setCountdownIntensity(secondsLeft: number, total: number) {
    if (!countdownRef.current || isMuted) return
    const progress = 1 - secondsLeft / total
    const vol = Math.min(0.85, 0.04 + Math.pow(progress, 2) * 0.81)
    countdownRef.current.volume = vol
  }

  function playClick() {
    if (isMuted || !clickRef.current) return
    clickRef.current.currentTime = 0
    clickRef.current.play().catch(() => {})
  }

  function stopAll() {
    stopCountdown()
  }

  // Keep these as no-ops so Home.tsx and Room.tsx don't break
  function playAmbient() {}
  function stopAmbient() {}
  function fadeOutAmbient(_durationMs: number) {}

  return {
    playAmbient,
    stopAmbient,
    fadeOutAmbient,
    playCountdown,
    stopCountdown,
    setCountdownIntensity,
    playClick,
    stopAll,
  }
}