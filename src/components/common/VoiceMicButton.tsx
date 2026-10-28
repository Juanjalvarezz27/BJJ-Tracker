"use client";

import React from "react";

interface VoiceMicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
  title?: string;
  size?: "sm" | "md";
  className?: string;
}

export function VoiceMicButton({
  isListening,
  isSupported,
  onClick,
  title = "Dictar por voz",
  size = "sm",
  className = "",
}: VoiceMicButtonProps) {
  if (!isSupported) return null;

  const sizeClasses =
    size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      title={isListening ? "Detener dictado" : title}
      aria-label={isListening ? "Detener dictado" : title}
      className={`relative rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95 ${sizeClasses} ${
        isListening
          ? "bg-red-500 text-white shadow-md ring-4 ring-red-400/30 animate-pulse"
          : "text-zinc-400 hover:text-[#007AFF] hover:bg-[#007AFF]/10 dark:hover:bg-[#0A84FF]/15 bg-black/[0.03] dark:bg-white/[0.05]"
      } ${className}`}
    >
      {isListening ? (
        <span className="flex items-center justify-center relative">
          {/* Ondas de grabación activas */}
          <span className="absolute -inset-1 rounded-full bg-red-400 opacity-75 animate-ping" />
          <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </span>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
}

// Indicador flotante en vivo cuando el micrófono está grabando audio
export function VoiceListeningBadge({
  isListening,
  onStop,
  label = "Escuchando... Di el paso con tu voz",
}: {
  isListening: boolean;
  onStop: () => void;
  label?: string;
}) {
  if (!isListening) return null;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold animate-in fade-in duration-150">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span className="font-medium text-[11px] sm:text-xs">{label}</span>
      </div>
      <button
        type="button"
        onClick={onStop}
        className="px-2 py-0.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors"
      >
        Detener
      </button>
    </div>
  );
}

