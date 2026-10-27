"use client";

import React, { useState, useMemo } from "react";
import type { PositionWithRelations, Technique } from "@/types/bjj";

interface AllTechniquesLibraryViewProps {
  positions: PositionWithRelations[];
  onAddTechniqueClick: (positionId?: string) => void;
  onDeleteTechnique: (techId: string) => void;
  onSelectPosition: (positionId: string) => void;
}

export function AllTechniquesLibraryView({
  positions,
  onAddTechniqueClick,
  onDeleteTechnique,
  onSelectPosition,
}: AllTechniquesLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPositionId, setFilterPositionId] = useState<string>("all");

  // Aplanar todas las tecnicas vinculandolas con su posicion padre y categoria principal
  const allTechniques = useMemo(() => {
    const list: Array<
      Technique & {
        positionTitle: string;
        positionSubtitle?: string | null;
        categoryName?: string | null;
      }
    > = [];
    positions.forEach((pos) => {
      pos.techniques.forEach((tech) => {
        list.push({
          ...tech,
          positionTitle: pos.title,
          positionSubtitle: pos.subtitle,
          categoryName: pos.category?.name ?? null,
        });
      });
    });
    return list;
  }, [positions]);

  // Filtrado reactivo por texto de busqueda, categoria y por posicion
  const filteredTechniques = useMemo(() => {
    return allTechniques.filter((tech) => {
      const matchesPosition =
        filterPositionId === "all" || tech.positionId === filterPositionId;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesPosition;

      const matchesTitle = tech.title.toLowerCase().includes(query);
      const matchesPositionName = tech.positionTitle.toLowerCase().includes(query);
      const matchesCategoryName = tech.categoryName?.toLowerCase().includes(query) ?? false;
      const matchesSteps = tech.steps.some((s) => s.toLowerCase().includes(query));

      return (
        matchesPosition &&
        (matchesTitle || matchesPositionName || matchesCategoryName || matchesSteps)
      );
    });
  }, [allTechniques, filterPositionId, searchQuery]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28">
      {/* Cabecera del modulo Mis Tecnicas */}
      <header className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Mis Técnicas
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Biblioteca de movimientos ordenados por posición
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddTechniqueClick(filterPositionId !== "all" ? filterPositionId : undefined)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm min-h-[36px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Técnica</span>
        </button>
      </header>

      {/* Buscador rapido estilo Apple */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por técnica, agarre o posición..."
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.08] text-sm text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
          >
            <span className="text-xs bg-zinc-200 dark:bg-zinc-700 rounded-full w-4 h-4 flex items-center justify-center font-bold">
              ×
            </span>
          </button>
        )}
      </div>

      {/* Filtro horizontal por posicion estilo pill */}
      <section className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterPositionId("all")}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
              filterPositionId === "all"
                ? "bg-[#007AFF] border-[#007AFF] text-white shadow-xs"
                : "bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Todas ({allTechniques.length})
          </button>

          {positions.map((pos) => {
            const isSelected = filterPositionId === pos.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => setFilterPositionId(pos.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
                  isSelected
                    ? "bg-[#007AFF] border-[#007AFF] text-white shadow-xs"
                    : "bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <span>{pos.title}</span>
                <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-zinc-400"}`}>
                  {pos.techniques.length}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Resultados de la biblioteca */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Técnicas encontradas
          </span>
          <span className="text-xs text-zinc-400">
            {filteredTechniques.length} {filteredTechniques.length === 1 ? "movimiento" : "movimientos"}
          </span>
        </div>

        {filteredTechniques.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-white dark:bg-[#1c1c1e] border border-dashed border-black/[0.08] dark:border-white/[0.08] space-y-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              No se encontraron técnicas con ese criterio.
            </p>
            <p className="text-xs text-zinc-400">
              Prueba con otro término de búsqueda o registra una nueva técnica.
            </p>
            <button
              type="button"
              onClick={() => onAddTechniqueClick(filterPositionId !== "all" ? filterPositionId : undefined)}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              + Agregar técnica ahora
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTechniques.map((tech) => (
              <div
                key={tech.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-3 transition-all hover:border-[#007AFF]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {/* Insignia de categoría y posición padre clicable */}
                    <button
                      type="button"
                      onClick={() => onSelectPosition(tech.positionId)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] hover:underline"
                    >
                      {tech.categoryName && (
                        <span className="opacity-75 font-semibold">
                          {tech.categoryName} •
                        </span>
                      )}
                      <span>{tech.positionTitle}</span>
                    </button>

                    <h3 className="font-bold text-sm text-black dark:text-white leading-snug">
                      {tech.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteTechnique(tech.id)}
                    title="Eliminar técnica"
                    className="text-zinc-400 hover:text-red-500 active:scale-90 p-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Pasos ordenados */}
                {tech.steps && tech.steps.length > 0 && (
                  <ol className="space-y-1.5 pl-6 text-xs text-zinc-700 dark:text-zinc-300 list-decimal leading-relaxed border-t border-black/[0.04] dark:border-white/[0.04] pt-2.5">
                    {tech.steps.map((step, idx) => (
                      <li key={idx} className="pl-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AllTechniquesLibraryView;
