'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { formatAudioTime } from '@/lib/utils/time'

interface AudioPlayerProps {
  src: string
  onEnded?: () => void
  allowReplay?: boolean
}

export function AudioPlayer({ src, onEnded, allowReplay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setHasPlayed(true)
      onEnded?.()
    }
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [onEnded])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (hasPlayed && !allowReplay) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!allowReplay && hasPlayed) return
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    audio.currentTime = pct * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0
  const isDisabled = hasPlayed && !allowReplay

  return (
    <div className="w-full bg-neutral-50 rounded-lg p-4 border border-neutral-200">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isDisabled || isLoading}
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            isDisabled || isLoading
              ? 'bg-neutral-200 cursor-not-allowed text-neutral-400'
              : 'bg-neutral-900 hover:bg-neutral-800 text-white'
          }`}
        >
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} className="ml-0.5" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div
            className={`h-2 bg-neutral-200 rounded-full overflow-hidden ${!isDisabled ? 'cursor-pointer' : ''}`}
            onClick={handleSeek}
          >
            <div
              className="h-full bg-neutral-900 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-neutral-500">
            <span>{formatAudioTime(currentTime)}</span>
            <span>{formatAudioTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <button
          onClick={() => setVolume((v) => (v === 0 ? 1 : 0))}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-600"
        >
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {hasPlayed && !allowReplay && (
        <p className="text-xs text-amber-600 mt-3 text-center bg-amber-50 py-1.5 rounded-md">
          Audio has been played. In authentic IELTS mode, audio plays once only.
        </p>
      )}
    </div>
  )
}
