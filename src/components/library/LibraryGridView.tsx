"use client";

import React from "react";
import Image from "next/image";
import type { CategoryWithPositions, Position } from "@/types/bjj";
import { BjjIconPlaceholder } from "@/components/common/BjjIconPlaceholder";

interface LibraryGridViewProps {
  categories: CategoryWithPositions[];
  onSelectPosition?: (position: Position) => void;
}

// Paleta de tonos pasteles inspirada en el sistema de diseño iOS
const PASTEL_VARIANTS = [
  {
    card: "bg-blue-50/80 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40",
    text: "text-blue-950 dark:text-blue-100",
    subtext: "text-blue-700/80 dark:text-blue-300/80",
    badge: "bg-blue-100/80 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
  },
  {
    card: "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40",
    text: "text-emerald-950 dark:text-emerald-100",
    subtext: "text-emerald-700/80 dark:text-emerald-300/80",
    badge: "bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200",
  },
  {
    card: "bg-purple-50/80 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40",
    text: "text-purple-950 dark:text-purple-100",
    subtext: "text-purple-700/80 dark:text-purple-300/80",
    badge: "bg-purple-100/80 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200",
  },
  {
    card: "bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40",
    text: "text-amber-950 dark:text-amber-100",
    subtext: "text-amber-700/80 dark:text-amber-300/80",
    badge: "bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200",
  },
  {
    card: "bg-rose-50/80 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40",
    text: "text-rose-950 dark:text-rose-100",
    subtext: "text-rose-700/80 dark:text-rose-300/80",
    badge: "bg-rose-100/80 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200",
  },
  {
    card: "bg-slate-50/80 dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800",
    text: "text-slate-900 dark:text-slate-100",
    subtext: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  },
];

export function LibraryGridView({
  categories,
  onSelectPosition,
}: LibraryGridViewProps) {
  // Ordenamiento estricto por sortOrder para categorias y posiciones
  const sortedCategories = [...categories]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      ...category,
      positions: [...category.positions].sort((a, b) => a.sortOrder - b.sortOrder),
    }));

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 space-y-7 pb-24">
      {sortedCategories.map((category) => (
        <section key={category.id} className="space-y-3">
          {/* Titulo de categoria con conteo de elementos */}
          <div className="flex items-baseline justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {category.name}
            </h2>
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {category.positions.length} {category.positions.length === 1 ? "posición" : "posiciones"}
            </span>
          </div>

          {/* Cuadricula responsive de 2 columnas estilo iOS */}
          <div className="grid grid-cols-2 gap-3.5">
            {category.positions.map((position, index) => {
              const pastel = PASTEL_VARIANTS[index % PASTEL_VARIANTS.length];
              const techniquesCount = position._count?.techniques ?? position.techniques?.length ?? 0;

              return (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => onSelectPosition?.(position)}
                  className={`group flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md ${pastel.card}`}
                >
                  {/* Ilustración oficial de la posición */}
                  <div
                    className="w-full h-28 flex items-center justify-center mb-2 overflow-hidden rounded-xl bg-white/60 dark:bg-black/30 p-2 border border-black/[0.05] dark:border-white/[0.08]"
                    style={{ borderRadius: "14px", overflow: "hidden" }}
                  >
                    {position.imageUrl ? (
                      <Image
                        src={encodeURI(position.imageUrl)}
                        alt={position.title}
                        width={180}
                        height={180}
                        style={{ borderRadius: "12px" }}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <BjjIconPlaceholder name={position.svgIconName} className="w-16 h-16" />
                    )}
                  </div>

                  {/* Informacion de la posicion */}
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className={`font-semibold text-sm leading-tight truncate ${pastel.text}`}>
                        {position.title}
                      </h3>
                    </div>

                    {/* Subtitulo en japones o sinonimo recortado */}
                    {position.subtitle && (
                      <p className={`text-xs truncate italic font-light ${pastel.subtext}`}>
                        {position.subtitle}
                      </p>
                    )}

                    {/* Insignia con el numero de tecnicas hijas */}
                    <div className="pt-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight ${pastel.badge}`}>
                        {techniquesCount} {techniquesCount === 1 ? "técnica" : "técnicas"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default LibraryGridView;
