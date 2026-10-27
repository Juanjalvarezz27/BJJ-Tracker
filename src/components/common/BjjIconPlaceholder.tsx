import React from "react";

interface BjjIconPlaceholderProps {
  name?: string | null;
  className?: string;
}

export function BjjIconPlaceholder({ name, className = "w-16 h-16" }: BjjIconPlaceholderProps) {
  // Ilustraciones vectoriales limpias para representar posiciones de Jiu-Jitsu
  return (
    <div className={`flex items-center justify-center text-zinc-700 dark:text-zinc-300 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label={name ?? "Ilustración de posición de Jiu-Jitsu"}
        className="w-full h-full drop-shadow-sm opacity-90 transition-transform hover:scale-105 duration-200"
      >
        {/* Silueta estilizada de tatami y practicantes */}
        <ellipse cx="32" cy="52" rx="24" ry="5" strokeWidth="1.5" className="opacity-30" />
        {/* Figura base (defensa/abajo) */}
        <circle cx="24" cy="38" r="5" strokeWidth="2" />
        <path d="M19 46c0-4 4-6 10-6s10 2 10 6" />
        {/* Figura superior (dominante/arriba) */}
        <circle cx="38" cy="22" r="5.5" strokeWidth="2.2" />
        <path d="M30 31c2-3 6-5 12-4 4 1 6 4 6 7l-5 9" />
        <path d="M28 27l-8 7" />
        {/* Cinturon / Kimono detalle */}
        <path d="M32 37l4 2-2 4" strokeWidth="2" className="text-blue-600 dark:text-blue-400" />
      </svg>
    </div>
  );
}

export default BjjIconPlaceholder;
