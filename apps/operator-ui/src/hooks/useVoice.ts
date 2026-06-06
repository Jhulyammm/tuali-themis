/**
 * useVoice — Capa 2 hook.
 *
 * Reproduce texto con la voz de Themis (ElevenLabs) via /api/voice.
 * Devuelve isPlaying + función speak().
 *
 * Usage:
 *   const { speak, isPlaying, stop } = useVoice();
 *   await speak("Voy a iniciar sesión en el portal...");
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  error: string | null;
}

export function useVoice(): UseVoiceReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
    };
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    setError(null);
    stop();
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Voice API failed: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setError("Audio playback failed");
        setIsPlaying(false);
      };

      await audio.play();
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      setIsPlaying(false);
    }
  }, [stop]);

  return { speak, stop, isPlaying, error };
}
