/**
 * useVoice — Capa 2 hook.
 *
 * Reproduce texto con la voz de Themis (ElevenLabs) via /api/voice.
 *
 * Notas técnicas:
 * - Chrome/Firefox bloquean autoplay sin user gesture. Por eso el primer
 *   speak() solo funciona si se llama dentro de un onClick handler.
 * - Si la fetch tarda mucho, algunos navegadores cancelan el "user activation"
 *   antes del .play() → workaround: pre-llamar al hook con un sonido vacío en
 *   el primer click, luego siguientes speak() ya tienen permiso.
 *
 * Usage:
 *   const { speak, isPlaying, stop, error, unlocked, unlock } = useVoice();
 *   useEffect(() => { ... }, []);
 *   <button onClick={() => { unlock(); speak("Hola"); }}>Probar</button>
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  unlock: () => Promise<void>;
  isPlaying: boolean;
  unlocked: boolean;
  error: string | null;
}

export function useVoice(): UseVoiceReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
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

  /**
   * Llama esto desde un click handler ANTES del primer speak().
   * Reproduce un audio vacío (silent) que "desbloquea" la política de autoplay.
   * Después de esto, speak() funciona sin restricciones por el resto de la sesión.
   */
  const unlock = useCallback(async () => {
    if (unlocked) return;
    try {
      // Silent WAV (44 bytes header + 0 samples) en base64
      const silentWav =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      const audio = new Audio(silentWav);
      await audio.play();
      setUnlocked(true);
      console.log("[useVoice] Audio desbloqueado para esta sesión");
    } catch (err) {
      console.warn("[useVoice] Unlock falló:", err);
    }
  }, [unlocked]);

  const speak = useCallback(
    async (text: string) => {
      setError(null);
      stop();
      console.log(`[useVoice] Pidiendo voz: "${text.slice(0, 50)}..."`);

      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Voice API ${res.status}: ${errText.slice(0, 100)}`);
        }

        const blob = await res.blob();
        if (blob.size === 0) {
          throw new Error("ElevenLabs devolvió audio vacío (0 bytes)");
        }
        console.log(`[useVoice] Audio recibido (${blob.size} bytes)`);

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = 1.0;
        audioRef.current = audio;

        audio.onplay = () => {
          console.log("[useVoice] Audio comenzó a reproducirse");
          setIsPlaying(true);
        };
        audio.onended = () => {
          console.log("[useVoice] Audio terminó");
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
        audio.onerror = (e) => {
          console.error("[useVoice] Audio error:", e);
          setError("Audio playback failed");
          setIsPlaying(false);
        };

        try {
          await audio.play();
        } catch (playErr) {
          // Autoplay block (Chrome/Firefox)
          const msg = (playErr as Error).message;
          console.error("[useVoice] play() rejected:", msg);
          setError(
            `Navegador bloqueó autoplay: ${msg}. Click en cualquier parte primero.`,
          );
          setIsPlaying(false);
        }
      } catch (err) {
        const msg = (err as Error).message;
        console.error("[useVoice] speak() falló:", msg);
        setError(msg);
        setIsPlaying(false);
      }
    },
    [stop],
  );

  return { speak, stop, unlock, isPlaying, unlocked, error };
}
