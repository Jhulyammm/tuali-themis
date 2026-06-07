/**
 * useMic — graba audio del micrófono y lo transcribe via Whisper.
 *
 * Push-to-talk style:
 *   - start(): pide permiso de micro, arranca grabación
 *   - stop(): cierra grabación, envía a /api/whisper, devuelve texto
 *
 * NO tiene VAD (voice activity detection) — el usuario controla con un botón.
 * Es lo más confiable para demo en vivo: presiona, habla, suelta.
 */

"use client";

import { useCallback, useRef, useState } from "react";

interface UseMicReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
}

const MAX_RECORDING_MS = 15_000; // tope duro: 15s

export function useMic(): UseMicReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timeoutRef.current = setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, MAX_RECORDING_MS);
    } catch (err) {
      const msg = (err as Error).message;
      setError(`Mic falló: ${msg}`);
      cleanup();
    }
  }, [cleanup]);

  const stop = useCallback(async (): Promise<string | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanup();
      setIsRecording(false);
      return null;
    }

    const result = await new Promise<string | null>((resolve) => {
      recorder.onstop = async () => {
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        cleanup();

        if (blob.size < 1000) {
          setError("Audio muy corto. Intenta de nuevo.");
          resolve(null);
          return;
        }

        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append("file", blob, "mic.webm");
          const res = await fetch("/api/whisper", {
            method: "POST",
            body: form,
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(j.error ?? `HTTP ${res.status}`);
          }
          const data = (await res.json()) as { text?: string };
          resolve(data.text?.trim() ?? null);
        } catch (err) {
          setError(`Whisper: ${(err as Error).message}`);
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.stop();
    });

    return result;
  }, [cleanup]);

  return { isRecording, isTranscribing, error, start, stop };
}
