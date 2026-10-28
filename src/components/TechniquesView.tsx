"use client";

import React, { useState, useTransition } from "react";
import type { PositionWithRelations, Technique } from "@/types/bjj";
import {
  createTechniqueAction,
  createPositionAction,
  deleteTechniqueAction,
  updatePositionNotesAction,
} from "@/app/actions";

interface TechniquesViewProps {
  initialPositions: PositionWithRelations[];
}

export function TechniquesView({ initialPositions }: TechniquesViewProps) {
  const [positions, setPositions] = useState<PositionWithRelations[]>(initialPositions);
  const [selectedPositionId, setSelectedPositionId] = useState<string>(
    initialPositions[0]?.id ?? ""
  );
  const [isPending, startTransition] = useTransition();

  // Estados para modal de nuevo movimiento
  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState(false);
  const [newTechTitle, setNewTechTitle] = useState("");
  const [newTechStepsText, setNewTechStepsText] = useState("");

  // Estados para modal de nueva posicion
  const [isAddPosModalOpen, setIsAddPosModalOpen] = useState(false);
  const [newPosTitle, setNewPosTitle] = useState("");
  const [newPosSubtitle, setNewPosSubtitle] = useState("");
  const [newPosDescription, setNewPosDescription] = useState("");

  // Estado para notas de la posicion activa
  const activePosition = positions.find((p) => p.id === selectedPositionId) ?? positions[0];
  const [notesDraft, setNotesDraft] = useState(activePosition?.notes ?? "");

  // Actualiza notas draft cuando cambia la posicion
  const handleSelectPosition = (id: string) => {
    setSelectedPositionId(id);
    const pos = positions.find((p) => p.id === id);
    setNotesDraft(pos?.notes ?? "");
  };

  // Guardar nuevo movimiento
  const handleCreateTechnique = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTechTitle.trim() || !activePosition) return;

    const steps = newTechStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const tempId = `temp-${Date.now()}`;
    const optimisticTech: Technique = {
      id: tempId,
      positionId: activePosition.id,
      title: newTechTitle.trim(),
      notes: null,
      imageUrl: null,
      steps: steps.length > 0 ? steps : ["Asegurar control de base"],
      sortOrder: activePosition.techniques.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Actualizacion optimista inmediata
    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === activePosition.id
          ? { ...pos, techniques: [...pos.techniques, optimisticTech] }
          : pos
      )
    );

    setIsAddTechModalOpen(false);
    setNewTechTitle("");
    setNewTechStepsText("");

    startTransition(async () => {
      const res = await createTechniqueAction({
        positionId: activePosition.id,
        title: optimisticTech.title,
        steps: optimisticTech.steps,
      });

      if (res.success && res.technique) {
        const savedTech = res.technique;
        setPositions((prev) =>
          prev.map((pos) =>
            pos.id === activePosition.id
              ? {
                  ...pos,
                  techniques: pos.techniques.map((t) =>
                    t.id === tempId ? savedTech : t
                  ),
                }
              : pos
          )
        );
      }
    });
  };

  // Guardar nueva posicion
  const handleCreatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosTitle.trim()) return;

    const tempId = `temp-pos-${Date.now()}`;
    const optimisticPos: PositionWithRelations = {
      id: tempId,
      categoryId: null,
      title: newPosTitle.trim(),
      subtitle: newPosSubtitle.trim() || null,
      description: newPosDescription.trim() || null,
      imageUrl: null,
      svgIconName: null,
      sortOrder: positions.length + 1,
      notes: "",
      techniques: [],
      mediaLinks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPositions((prev) => [...prev, optimisticPos]);
    setSelectedPositionId(tempId);
    setNotesDraft("");
    setIsAddPosModalOpen(false);
    setNewPosTitle("");
    setNewPosSubtitle("");
    setNewPosDescription("");

    startTransition(async () => {
      const res = await createPositionAction({
        title: optimisticPos.title,
        subtitle: optimisticPos.subtitle ?? undefined,
        description: optimisticPos.description ?? undefined,
      });

      if (res.success && res.position) {
        const savedPos = res.position;
        setPositions((prev) =>
          prev.map((p) => (p.id === tempId ? savedPos : p))
        );
        setSelectedPositionId(savedPos.id);
      }
    });
  };

  // Eliminar movimiento
  const handleDeleteTechnique = (techId: string) => {
    if (!activePosition) return;

    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === activePosition.id
          ? {
              ...pos,
              techniques: pos.techniques.filter((t) => t.id !== techId),
            }
          : pos
      )
    );

    startTransition(async () => {
      await deleteTechniqueAction(techId);
    });
  };

  // Guardar notas personales
  const handleSaveNotes = () => {
    if (!activePosition) return;

    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === activePosition.id ? { ...pos, notes: notesDraft } : pos
      )
    );

    startTransition(async () => {
      await updatePositionNotesAction(activePosition.id, notesDraft);
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 pb-20">
      {/* Cabecera principal limpia */}
      <header className="flex items-center justify-between gap-3.5 sm:gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Técnicas de BJJ
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            Posiciones y movimientos registrados
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddPosModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm min-h-[36px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Posición</span>
        </button>
      </header>

      {/* Selector horizontal de posiciones iniciales tipo pill estilo iOS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Seleccionar Posición
          </span>
          <span className="text-xs text-zinc-400">
            {positions.length} posiciones
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {positions.map((pos) => {
            const isSelected = pos.id === activePosition?.id;
            return (
              <button
                key={pos.id}
                type="button"
                onClick={() => handleSelectPosition(pos.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all active:scale-95 min-h-[44px] ${
                  isSelected
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-900 border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span>{pos.title}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {pos.techniques.length}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Detalle de la posicion seleccionada y sus movimientos */}
      {activePosition ? (
        <section className="space-y-5 animate-in fade-in duration-200">
          {/* Tarjeta de encabezado de la posicion activa */}
          <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {activePosition.title}
                </h2>
                {activePosition.subtitle && (
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {activePosition.subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsAddTechModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Agregar Movimiento</span>
              </button>
            </div>

            {activePosition.description && (
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 border-t border-black/[0.04] dark:border-white/[0.04] pt-2.5">
                {activePosition.description}
              </p>
            )}

            {/* Notas personales directas */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="notes-input"
                  className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider"
                >
                  Notas tácticas de la posición
                </label>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 active:opacity-60"
                >
                  Guardar nota
                </button>
              </div>
              <textarea
                id="notes-input"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Añade aquí ajustes de peso, agarres preferidos o transiciones..."
                rows={2}
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-black/[0.06] dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Lista de movimientos / tecnicas desde esta posicion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Movimientos desde {activePosition.title} ({activePosition.techniques.length})
              </h3>
            </div>

            {activePosition.techniques.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-dashed border-black/[0.1] dark:border-white/[0.1] space-y-2">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Aún no tienes movimientos registrados desde {activePosition.title}.
                </p>
                <p className="text-xs text-zinc-400">
                  Presiona el botón de abajo para registrar las sumisiones, raspados o escapes que conoces.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddTechModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                >
                  + Agregar primer movimiento
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activePosition.techniques.map((tech, index) => (
                  <div
                    key={tech.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] shadow-sm space-y-3 transition-all hover:border-black/[0.12] dark:hover:border-white/[0.15]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-200/50 dark:border-blue-800/40">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {tech.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTechnique(tech.id)}
                        title="Eliminar movimiento"
                        className="text-zinc-400 hover:text-red-500 active:scale-90 p-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Pasos ordenados del movimiento */}
                    {tech.steps && tech.steps.length > 0 && (
                      <ol className="space-y-1.5 pl-8 text-xs text-zinc-600 dark:text-zinc-300 list-decimal leading-relaxed">
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
          </div>
        </section>
      ) : null}

      {/* Modal para Agregar Movimiento */}
      {isAddTechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Nuevo Movimiento
                </h3>
                <p className="text-xs text-zinc-400">
                  Desde: <span className="font-semibold text-blue-600 dark:text-blue-400">{activePosition?.title}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTechModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateTechnique} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre del movimiento o técnica *
                </label>
                <input
                  type="text"
                  required
                  value={newTechTitle}
                  onChange={(e) => setNewTechTitle(e.target.value)}
                  placeholder="Ej: Barra de Brazo (Armbar), Estrangulamiento..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Pasos de ejecución (un paso por línea)
                </label>
                <textarea
                  rows={4}
                  value={newTechStepsText}
                  onChange={(e) => setNewTechStepsText(e.target.value)}
                  placeholder="Paso 1: Aislar el brazo cruzado...&#10;Paso 2: Pasar pierna sobre la cabeza...&#10;Paso 3: Elevar cadera..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddTechModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newTechTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Guardando..." : "Guardar Movimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Agregar Posicion */}
      {isAddPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Nueva Posición de Jiu-Jitsu
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPosModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreatePosition} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre de la posición *
                </label>
                <input
                  type="text"
                  required
                  value={newPosTitle}
                  onChange={(e) => setNewPosTitle(e.target.value)}
                  placeholder="Ej: Guardia Mariposa, Control Norte-Sur..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Subtítulo o término alternativo (opcional)
                </label>
                <input
                  type="text"
                  value={newPosSubtitle}
                  onChange={(e) => setNewPosSubtitle(e.target.value)}
                  placeholder="Ej: Butterfly Guard / Kuzushi"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Descripción táctica (opcional)
                </label>
                <textarea
                  rows={2}
                  value={newPosDescription}
                  onChange={(e) => setNewPosDescription(e.target.value)}
                  placeholder="Descripción de la posición y objetivos..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-black/[0.08] dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddPosModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newPosTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Creando..." : "Crear Posición"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TechniquesView;
