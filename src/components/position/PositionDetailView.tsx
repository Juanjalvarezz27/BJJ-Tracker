"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { PositionWithRelations, Technique } from "@/types/bjj";
import { BjjIconPlaceholder } from "@/components/common/BjjIconPlaceholder";
import { MediaEmbed } from "@/components/media/MediaEmbed";

interface PositionDetailViewProps {
  position: PositionWithRelations;
  onBack?: () => void;
  onSelectTechnique?: (technique: Technique) => void;
  onSaveNotes?: (notes: string) => void;
}

export function PositionDetailView({
  position,
  onBack,
  onSelectTechnique,
  onSaveNotes,
}: PositionDetailViewProps) {
  const [notes, setNotes] = useState(position.notes ?? "");

  // Ordenamiento de tecnicas hijas por sortOrder
  const sortedTechniques = [...position.techniques].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <article className="w-full max-w-md mx-auto px-4 py-4 space-y-6 pb-28">
      {/* Barra de navegacion superior tipo iOS */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 active:opacity-60 transition-opacity min-h-[44px] min-w-[44px]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Biblioteca</span>
        </button>

        {position.category && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 font-medium">
            {position.category.name}
          </span>
        )}
      </div>

      {/* Cabecera con titulo y subtitulo en japones */}
      <header className="space-y-1 text-left">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {position.title}
        </h1>
        {position.subtitle && (
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {position.subtitle}
          </p>
        )}
      </header>

      {/* Gran ilustracion oficial o vectorial central */}
      <div
        className="w-full h-48 rounded-3xl bg-[#e1eaf1] dark:bg-[#151c24] border border-black/[0.08] dark:border-white/[0.12] flex items-center justify-center p-4 shadow-sm overflow-hidden"
        style={{ borderRadius: "24px", overflow: "hidden" }}
      >
        {position.imageUrl ? (
          <Image
            src={encodeURI(position.imageUrl)}
            alt={position.title}
            width={280}
            height={280}
            style={{ borderRadius: "18px" }}
            className="w-full h-full object-contain rounded-2xl"
            priority
          />
        ) : (
          <BjjIconPlaceholder name={position.svgIconName} className="w-28 h-28" />
        )}
      </div>

      {/* Bloque de descripcion */}
      {position.description && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Descripción y Conceptos Clave
          </h2>
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 shadow-sm">
            {position.description}
          </div>
        </section>
      )}

      {/* Seccion Notas Personales */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Mis Notas y Ajustes
          </h2>
          {onSaveNotes && (
            <button
              type="button"
              onClick={() => onSaveNotes(notes)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 active:opacity-60"
            >
              Guardar
            </button>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe aquí detalles sobre distribución de peso, agarres favoritos o errores comunes..."
          rows={3}
          className="w-full p-3.5 text-sm rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none shadow-sm placeholder:text-zinc-400"
        />
      </section>

      {/* Seccion "Mis tecnicas" - Carrusel horizontal */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Mis técnicas
          </h2>
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {sortedTechniques.length} disponibles
          </span>
        </div>

        {sortedTechniques.length === 0 ? (
          <p className="text-xs text-zinc-400 italic p-4 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl">
            No hay técnicas registradas para esta posición.
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scrollbar-none">
            {sortedTechniques.map((technique) => (
              <button
                key={technique.id}
                type="button"
                onClick={() => onSelectTechnique?.(technique)}
                className="snap-start shrink-0 w-44 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] text-left active:scale-[0.98] transition-all shadow-sm hover:shadow-md space-y-2.5"
              >
                {/* Placeholder de imagen o miniatura tecnica */}
                <div className="w-full h-24 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div>
                  <h3 className="font-semibold text-xs leading-snug line-clamp-2 text-zinc-900 dark:text-zinc-100">
                    {technique.title}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {technique.steps.length} {technique.steps.length === 1 ? "paso" : "pasos"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Seccion "Enlaces" - Media embeds */}
      {position.mediaLinks && position.mediaLinks.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Enlaces y Demostraciones
          </h2>
          <div className="space-y-4">
            {position.mediaLinks.map((media) => (
              <MediaEmbed key={media.id} mediaLink={media} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export default PositionDetailView;
