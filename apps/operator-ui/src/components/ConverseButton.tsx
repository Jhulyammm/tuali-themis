/**
 * ConverseButton — push-to-talk para hablarle a Themis.
 *
 * Press y hold = grabando. Release = transcribe + pregunta + Themis responde con voz.
 * Renderea una mini-transcripción de la pregunta y respuesta para feedback visual.
 */

"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff, MessageCircle, Loader2, Volume2 } from "lucide-react";
import { useMic } from "@/hooks/useMic";
import { useVoice } from "@/hooks/useVoice";

interface Props {
  context?: {
    currentUrl?: string;
    mappings?: Array<{ source_field: string; destination_field: string }>;
    playbookName?: string;
    phase?: string;
  };
  compact?: boolean;
}

interface Exchange {
  question: string;
  answer: string;
  ts: number;
}

export function ConverseButton({ context, compact = false }: Props) {
  const { start, stop, isRecording, isTranscribing, error: micError } = useMic();
  const { speak, unlock, isPlaying } = useVoice();
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [thinking, setThinking] = useState(false);
  const [conversingError, setConversingError] = useState<string | null>(null);

  const handlePress = useCallback(async () => {
    setConversingError(null);
    await unlock();
    await start();
  }, [start, unlock]);

  const handleRelease = useCallback(async () => {
    const question = await stop();
    if (!question || question.length < 2) return;

    setThinking(true);
    try {
      const res = await fetch("/api/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { answer: string };
      setExchange({ question, answer: data.answer, ts: Date.now() });
      void speak(data.answer, "firm");
    } catch (err) {
      setConversingError((err as Error).message);
    } finally {
      setThinking(false);
    }
  }, [stop, context, speak]);

  const busy = isRecording || isTranscribing || thinking;
  const buttonLabel = isRecording
    ? "Grabando..."
    : isTranscribing
      ? "Transcribiendo..."
      : thinking
        ? "Pensando..."
        : "Hablale a Themis";

  if (compact) {
    return (
      <button
        type="button"
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        disabled={busy && !isRecording}
        className={`relative w-10 h-10 rounded-full grid place-items-center transition ${
          isRecording
            ? "bg-coral text-white animate-pulse"
            : "bg-coral/10 text-coral hover:bg-coral/20"
        } disabled:opacity-50`}
        title={buttonLabel}
      >
        {isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : isTranscribing || thinking ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onMouseDown={handlePress}
          onMouseUp={handleRelease}
          onTouchStart={handlePress}
          onTouchEnd={handleRelease}
          disabled={busy && !isRecording}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium text-sm ${
            isRecording
              ? "bg-coral text-white shadow-lg shadow-coral/30 scale-105"
              : "bg-white border border-coral/30 text-coral hover:bg-coral/5"
          } disabled:opacity-60`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Suéltame para preguntar</span>
            </>
          ) : isTranscribing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transcribiendo...</span>
            </>
          ) : thinking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Themis está pensando...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>

        {isPlaying && (
          <div className="flex items-center gap-1.5 text-xs text-coral">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-mono uppercase tracking-widest">Themis responde</span>
          </div>
        )}
      </div>

      {(micError || conversingError) && (
        <p className="text-xs text-status-error">
          {micError ?? conversingError}
        </p>
      )}

      {exchange && (
        <div className="space-y-2 border-l-2 border-coral/40 pl-3">
          <div className="flex items-start gap-2">
            <MessageCircle className="w-3.5 h-3.5 text-text-tertiary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-secondary italic">
              "{exchange.question}"
            </p>
          </div>
          <p className="text-sm text-text-primary">{exchange.answer}</p>
        </div>
      )}
    </div>
  );
}
