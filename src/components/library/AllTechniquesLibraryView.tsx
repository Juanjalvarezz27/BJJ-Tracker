"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import type { PositionWithRelations, Technique } from "@/types/bjj";

interface AllTechniquesLibraryViewProps {
  positions: PositionWithRelations[];
  onAddTechniqueClick: (positionId?: string) => void;
  onDeleteTechnique: (techId: string) => void;
  onSelectPosition: (positionId: string) => void;
}

// Obtiene la imagen adecuada para la técnica según su título o posición padre
function getTechniqueDisplayImage(
  techTitle: string,
  positionImageUrl?: string | null
): string | null {
  const lower = techTitle.toLowerCase();
  if (lower.includes("brazo") || lower.includes("armbar")) {
    return "/assets/armbar_technique.jpg";
  }
  if (lower.includes("americana") || lower.includes("keylock")) {
    return "/assets/americana_technique.jpg";
  }
  if (lower.includes("torero") || lower.includes("toreando")) {
    return "/assets/pase-torero.png";
  }
  if (lower.includes("knee cut") || lower.includes("rodilla")) {
    return "/assets/Kneecutpass.png";
  }
  if (lower.includes("osoto") || lower.includes("proyecci") || lower.includes("derribo") || lower.includes("judo")) {
    return "/assets/derribo-osoto.png";
  }
  if (lower.includes("ankle") || lower.includes("tobillo") || lower.includes("ashi")) {
    return "/assets/ashi-garami.png";
  }
  if (
    lower.includes("heel") ||
    lower.includes("talon") ||
    lower.includes("talón") ||
    lower.includes("sankaku") ||
    lower.includes("saddle") ||
    lower.includes("kneebar") ||
    lower.includes("rodilla")
  ) {
    return "/assets/inside-sankaku.png";
  }
  return positionImageUrl || null;
}

type EnrichedTechnique = Technique & {
  positionTitle: string;
  positionSubtitle?: string | null;
  categoryName?: string | null;
  positionImageUrl?: string | null;
};

export function AllTechniquesLibraryView({
  positions,
  onAddTechniqueClick,
  onDeleteTechnique,
  onSelectPosition,
}: AllTechniquesLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPositionId, setFilterPositionId] = useState<string>("all");
  const [selectedDetailTech, setSelectedDetailTech] = useState<EnrichedTechnique | null>(null);

  // Aplanar todas las técnicas vinculándolas con su posición padre y categoría
  const allTechniques = useMemo(() => {
    const list: EnrichedTechnique[] = [];
    positions.forEach((pos) => {
      pos.techniques.forEach((tech) => {
        list.push({
          ...tech,
          positionTitle: pos.title,
          positionSubtitle: pos.subtitle,
          categoryName: pos.category?.name ?? null,
          positionImageUrl: pos.imageUrl ?? null,
        });
      });
    });
    return list;
  }, [positions]);

  // Filtrado reactivo por texto de búsqueda, categoría y por posición
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
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 pb-safe-nav">
      {/* Cabecera del módulo Mis Técnicas */}
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

      {/* Buscador rápido estilo Apple */}
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

      {/* Filtro por posición optimizado para mobile y desktop */}
      <section className="space-y-2.5">
        {/* Selector dropdown para móviles */}
        <div className="sm:hidden">
          <div className="relative">
            <select
              aria-label="Filtrar por posición"
              value={filterPositionId}
              onChange={(e) => setFilterPositionId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.1] dark:border-white/[0.12] text-xs font-bold text-black dark:text-white appearance-none pr-10 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="all">Todas las posiciones ({allTechniques.length})</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.title} ({pos.techniques.length})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#007AFF]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Píldoras visibles envueltas (flex-wrap) */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterPositionId("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
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
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
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
          <div className="space-y-2.5">
            {filteredTechniques.map((tech) => {
              const displayImage = getTechniqueDisplayImage(
                tech.title,
                tech.positionImageUrl
              );

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedDetailTech(tech)}
                  className="group/card flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] shadow-xs hover:shadow-md transition-all hover:border-[#007AFF]/40 cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    {/* Miniatura visual de la técnica */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#eaf2f7] dark:bg-[#152331] border border-black/[0.06] dark:border-white/[0.08] flex-shrink-0 flex items-center justify-center">
                      {displayImage ? (
                        <Image
                          src={encodeURI(displayImage)}
                          alt={tech.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                        />
                      ) : (
                        <div className="w-8 h-8 text-[#007AFF] flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="7" r="4" />
                            <path d="M5 21v-2a7 7 0 0114 0v2" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Nombre y categoría */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] truncate max-w-[180px]">
                          {tech.categoryName ? `${tech.categoryName} • ` : ""}
                          {tech.positionTitle}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-400">
                          {tech.steps?.length || 0} pasos
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-black dark:text-white leading-snug truncate">
                        {tech.title}
                      </h3>
                    </div>
                  </div>

                  {/* Acciones y chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTechnique(tech.id);
                      }}
                      title="Eliminar técnica"
                      className="opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover/card:text-[#007AFF] group-hover/card:translate-x-0.5 transition-all">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal / Vista en Detalle de la Técnica para acceder a los pasos */}
      {selectedDetailTech && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150 safe-top">
          <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1e] rounded-t-[32px] sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-5 sm:p-6 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            {/* Barra superior del modal */}
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3.5">
              <button
                type="button"
                onClick={() => setSelectedDetailTech(null)}
                className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
              >
                Cerrar
              </button>

              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF]">
                {selectedDetailTech.categoryName ? `${selectedDetailTech.categoryName} • ` : ""}
                {selectedDetailTech.positionTitle}
              </span>
            </div>

            {/* Cabecera hero de la técnica */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {(() => {
                const img = getTechniqueDisplayImage(
                  selectedDetailTech.title,
                  selectedDetailTech.positionImageUrl
                );
                return img ? (
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[#eaf2f7] dark:bg-[#152331] border border-black/[0.08] dark:border-white/[0.1] shadow-xs flex-shrink-0">
                    <Image
                      src={encodeURI(img)}
                      alt={selectedDetailTech.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null;
              })()}

              <div className="space-y-1 text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-black dark:text-white leading-tight">
                  {selectedDetailTech.title}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedDetailTech.positionTitle}
                  {selectedDetailTech.positionSubtitle
                    ? ` — ${selectedDetailTech.positionSubtitle}`
                    : ""}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                    {selectedDetailTech.steps?.length || 0} pasos registrados
                  </span>
                </div>
              </div>
            </div>

            {/* Lista detallada de pasos */}
            <div className="space-y-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Pasos de ejecución
              </h3>

              {selectedDetailTech.steps && selectedDetailTech.steps.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedDetailTech.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#f5f5f7] dark:bg-black/40 border border-black/[0.04] dark:border-white/[0.06]"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#007AFF] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic">
                  Esta técnica aún no tiene pasos de ejecución registrados.
                </p>
              )}
            </div>

            {/* Botón para navegar a la posición completa */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onSelectPosition(selectedDetailTech.positionId);
                  setSelectedDetailTech(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0062cc] active:scale-[0.98] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>Ir a la posición completa ({selectedDetailTech.positionTitle})</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllTechniquesLibraryView;
