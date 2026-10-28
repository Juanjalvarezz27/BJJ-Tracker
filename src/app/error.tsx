"use client";

import { useEffect } from "react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error capturado en ErrorBoundary de la aplicación:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black text-black dark:text-white flex flex-col items-center justify-center p-6 text-center select-none safe-top safe-bottom">
      <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-5 shadow-xs">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
        Ha ocurrido un problema
      </h2>
      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
        {error.message && !error.message.includes("digest")
          ? error.message
          : "La página no pudo procesar la acción reciente. Tus notas y datos guardados permanecen seguros."}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-full bg-[#007AFF] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="px-6 py-2.5 rounded-full bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold hover:bg-black/[0.03] dark:hover:bg-white/[0.03] active:scale-95 transition-all shadow-xs"
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  );
}
