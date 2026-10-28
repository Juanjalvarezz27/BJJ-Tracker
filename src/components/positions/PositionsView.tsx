"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { PositionWithRelations, CategoryWithPositions, Technique } from "@/types/bjj";
import { BjjIconPlaceholder } from "@/components/common/BjjIconPlaceholder";
import { uploadPositionImageAction } from "@/app/actions";
import { compressImage, safeImageSrc, isDataOrBlob } from "@/lib/imageCompression";

interface PositionsViewProps {
  positions: PositionWithRelations[];
  categories: CategoryWithPositions[];
  onSelectPosition: (positionId: string) => void;
  onAddPositionClick: (categoryId?: string) => void;
  selectedPositionId?: string | null;
  onBackToGrid?: () => void;
  onAddTechniqueClick: (positionId: string) => void;
  onDeleteTechnique: (techId: string) => void;
  onUpdateTechniqueSteps?: (techId: string, steps: string[]) => Promise<void> | void;
  onUpdateTechnique?: (
    techniqueId: string,
    data: { title?: string; steps?: string[]; notes?: string | null; imageUrl?: string | null }
  ) => Promise<void> | void;
  onSaveNotes: (positionId: string, notes: string) => void;
  onEditPositionClick: (position: PositionWithRelations) => void;
  onDeletePositionClick: (positionId: string) => void;
  onAddMediaLink?: (positionId: string, url: string) => void;
  onDeleteMediaLink?: (linkId: string, positionId: string) => void;
}

// Descripciones contextuales para las categorías principales
const CATEGORY_META: Record<
  string,
  { subtitle: string; emptyTitle: string; emptyDesc: string; btnLabel: string }
> = {
  Posiciones: {
    subtitle: "Controles dominantes y transiciones clave",
    emptyTitle: "Sin posiciones registradas",
    emptyDesc: "Añade controles clave como Rodilla en Barriga o Norte-Sur.",
    btnLabel: "Registrar Posición",
  },
  Guardias: {
    subtitle: "Sistemas defensivos, retención y ataques de suelo",
    emptyTitle: "Sin guardias registradas",
    emptyDesc: "Añade variantes como Media Guardia, Mariposa o De la Riva.",
    btnLabel: "Registrar Guardia",
  },
  "Leg Locks": {
    subtitle: "Controles de tren inferior, enredos y sumisiones",
    emptyTitle: "Sin posiciones registradas",
    emptyDesc: "Añade posiciones como Ashi Garami, Inside Sankaku o 50/50.",
    btnLabel: "Registrar Posición",
  },
  Derribos: {
    subtitle: "Lucha de pie, proyecciones y desequilibrios (Kuzushi)",
    emptyTitle: "Sin derribos registrados aún",
    emptyDesc: "Registra técnicas como Osoto Gari, Seoi Nage o derribos de lucha.",
    btnLabel: "Registrar Derribo",
  },
  Pases: {
    subtitle: "Superación de guardias y aperturas de defensa",
    emptyTitle: "Sin pases registrados aún",
    emptyDesc: "Registra pases como Knee Cut, Toreando o Pase de Presión.",
    btnLabel: "Registrar Pase",
  },
};

// Extrae el ID de un enlace de YouTube
function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Ilustración vectorial para la cabecera hero de la posición
function BjjHeroIllustration({ title }: { title: string }) {
  return (
    <svg className="w-24 h-24 text-[#35536b] dark:text-[#8cb8d9]" viewBox="0 0 120 120" fill="none" stroke="currentColor">
      <ellipse cx="60" cy="100" rx="46" ry="12" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      <circle cx="48" cy="88" r="8" strokeWidth="2.5" />
      <path d="M42 98C42 92 48 90 56 90H68" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="68" cy="45" r="9" strokeWidth="2.5" />
      <path d="M68 54L65 72M65 72L50 82M65 72L80 82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M66 60L52 75M66 60L78 72" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Visual distintivo para cada tarjeta de técnica
function TechniqueIllustration({ title, index }: { title: string; index: number }) {
  const lower = title.toLowerCase();

  if (lower.includes("brazo") || lower.includes("armbar")) {
    return (
      <svg className="w-16 h-16 text-[#007AFF]" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <circle cx="40" cy="20" r="8" strokeWidth="2.5" />
        <path d="M40 28v20l18 10M40 38l-18 6M40 48l-14 16M48 54l16 10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M52 35l14-6" strokeWidth="2.5" strokeLinecap="round" stroke="#FF3B30" />
      </svg>
    );
  }

  if (lower.includes("americana") || lower.includes("keylock") || lower.includes("omoplata")) {
    return (
      <svg className="w-16 h-16 text-[#34C759]" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <circle cx="40" cy="20" r="8" strokeWidth="2.5" />
        <path d="M40 28v22l14 14M40 34H24v16h16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 50l-12 16" strokeWidth="2.5" strokeLinecap="round" stroke="#FF9500" />
      </svg>
    );
  }

  if (lower.includes("choke") || lower.includes("ezequiel") || lower.includes("estrangula")) {
    return (
      <svg className="w-16 h-16 text-[#AF52DE]" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <circle cx="40" cy="22" r="8" strokeWidth="2.5" />
        <circle cx="40" cy="46" r="10" strokeWidth="2.5" strokeDasharray="3 3" />
        <path d="M26 38c0-8 8-14 14-14s14 6 14 14-8 14-14 14" strokeWidth="2.5" strokeLinecap="round" stroke="#FF2D55" />
      </svg>
    );
  }

  if (
    lower.includes("ankle") ||
    lower.includes("tobillo") ||
    lower.includes("heel") ||
    lower.includes("leg") ||
    lower.includes("saddle") ||
    lower.includes("ashi") ||
    lower.includes("aoki")
  ) {
    return (
      <svg className="w-16 h-16 text-[#FF9500]" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <circle cx="36" cy="24" r="7" strokeWidth="2.5" />
        <path d="M36 31v14l16 12M36 40l-14 8M22 48l12 16M48 50l14 14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M54 60l10-4" strokeWidth="2.5" strokeLinecap="round" stroke="#FF2D55" />
      </svg>
    );
  }

  if (
    lower.includes("derribo") ||
    lower.includes("osoto") ||
    lower.includes("takedown") ||
    lower.includes("proyecci") ||
    lower.includes("judo")
  ) {
    return (
      <svg className="w-16 h-16 text-[#FF453A]" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <circle cx="32" cy="22" r="7" strokeWidth="2.5" />
        <circle cx="54" cy="46" r="7" strokeWidth="2.5" />
        <path d="M32 29v18l14 8M32 38l14-6M48 42l16 12M54 53l-8 14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 62c6-10 18-14 26-10" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
    );
  }

  if (
    lower.includes("pase") ||
    lower.includes("pass") ||
    lower.includes("cut") ||
    lower.includes("toreando") ||
    lower.includes("torero")
  ) {
    return (
      <svg className="w-16 h-16 text-[#30D158]" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <circle cx="28" cy="24" r="7" strokeWidth="2.5" />
        <circle cx="52" cy="42" r="7" strokeWidth="2.5" />
        <path d="M28 31v14l16 8M28 38l12-6M44 40h16M52 49l8 15" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 52c12 4 20-4 28-6" strokeWidth="2.5" strokeLinecap="round" stroke="#0A84FF" />
      </svg>
    );
  }

  return (
    <svg className="w-16 h-16 text-[#0A84FF]" viewBox="0 0 80 80" fill="none" stroke="currentColor">
      <circle cx="30" cy="30" r="7" strokeWidth="2.5" />
      <circle cx="52" cy="44" r="7" strokeWidth="2.5" />
      <path d="M30 37l10 12M52 51l-8 12M32 46l18-8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Obtiene la foto de técnica si está disponible en assets locales
function getTechniqueImage(title: string): string | null {
  const lower = title.toLowerCase();
  if (lower.includes("brazo") || lower.includes("armbar")) {
    return "/assets/armbar_technique.jpg";
  }
  if (lower.includes("americana") || lower.includes("keylock")) {
    return "/assets/americana_technique.jpg";
  }
  return null;
}


// Pasos de referencia detallados del mockup si la técnica no tiene suficientes registrados
const DEFAULT_TECHNIQUE_STEPS: Record<string, string[]> = {
  brazo: [
    "Tengo que estar ya en montada",
    "Pongo mis manos en sus axilas",
    "Mano derecha con pulgar arriba",
    "Mano izquierda con pulgar abajo",
    "Me pongo ligeramente en mis pies en las puntas (pies vivos)",
    "Haciendo presión en sus axilas salto haciendo un ángulo",
    "La idea es que su brazo quede entre mis piernas",
    "Ya con mis piernas encima de él y su brazo en medio",
    "Cierro las rodillas, y tomo su brazo",
  ],
};

export function PositionsView({
  positions,
  categories,
  onSelectPosition,
  onAddPositionClick,
  selectedPositionId,
  onBackToGrid,
  onAddTechniqueClick,
  onDeleteTechnique,
  onUpdateTechniqueSteps,
  onUpdateTechnique,
  onSaveNotes,
  onEditPositionClick,
  onDeletePositionClick,
  onAddMediaLink,
  onDeleteMediaLink,
}: PositionsViewProps) {
  const activePosition = positions.find((p) => p.id === selectedPositionId);
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [isTechFav, setIsTechFav] = useState(false);
  const [isTechMenuOpen, setIsTechMenuOpen] = useState(false);
  const [isEditingTechnique, setIsEditingTechnique] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [editingImageUrl, setEditingImageUrl] = useState("");
  const [editingStepsList, setEditingStepsList] = useState<string[]>([]);
  const [isSavingTechnique, setIsSavingTechnique] = useState(false);
  const [isUploadingTechPhoto, setIsUploadingTechPhoto] = useState(false);
  const techFileInputRef = useRef<HTMLInputElement>(null);
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState("");

  // Reiniciar técnica seleccionada y estado de edición al cambiar la posición activa
  useEffect(() => {
    setSelectedTechniqueId(null);
    setIsTechMenuOpen(false);
    setIsEditingTechnique(false);
  }, [selectedPositionId]);

  // Obtiene el ID de 'Posiciones' por defecto, o el primero disponible
  const defaultCategoryId =
    categories.find((c) => c.name.toLowerCase() === "posiciones")?.id ??
    categories[0]?.id ??
    "";

  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>(defaultCategoryId);

  // Categoria activa validada
  const activeCategoryId = selectedCategoryFilter || defaultCategoryId;

  // Vista de detalle de técnica (Nivel 3: Categoría -> Posición -> Técnica)
  if (activePosition && selectedPositionId && selectedTechniqueId) {
    const activeTechnique = activePosition.techniques.find((t) => t.id === selectedTechniqueId);
    if (activeTechnique) {
      const defaultPhotoUrl = getTechniqueImage(activeTechnique.title);
      const displayPhotoUrl = activeTechnique.imageUrl || defaultPhotoUrl;

      const isArmbar =
        activeTechnique.title.toLowerCase().includes("brazo") ||
        activeTechnique.title.toLowerCase().includes("armbar");

      // Comprobar si tiene la semilla inicial de 5 pasos para no sobreescribir con la semilla antigua
      const isOriginalArmbarSeed =
        activeTechnique.steps?.length === 5 &&
        activeTechnique.steps[0]?.startsWith("Subir a montada");

      const stepsToDisplay =
        isOriginalArmbarSeed
          ? DEFAULT_TECHNIQUE_STEPS.brazo
          : activeTechnique.steps && activeTechnique.steps.length > 0
          ? activeTechnique.steps
          : isArmbar
          ? DEFAULT_TECHNIQUE_STEPS.brazo
          : [
              "Establecer la posición de control de inicio.",
              "Aislar la extremidad o el agarre principal.",
              "Asegurar los puntos de palanca con tu cuerpo.",
              "Aplicar presión gradual y controlada hasta la finalización.",
            ];

      // Inicia el modo de edición completo de la técnica
      const handleStartEditingTechnique = () => {
        setEditingTitle(activeTechnique.title);
        setEditingNotes(activeTechnique.notes || "");
        setEditingImageUrl(activeTechnique.imageUrl || "");
        setEditingStepsList(
          activeTechnique.steps && activeTechnique.steps.length > 0
            ? [...activeTechnique.steps]
            : [...stepsToDisplay]
        );
        setIsEditingTechnique(true);
        setIsTechMenuOpen(false);
      };

      // Guarda los cambios de la técnica (nombre, imagen, notas y pasos)
      const handleSaveTechnique = async () => {
        if (!editingTitle.trim()) return;
        setIsSavingTechnique(true);
        try {
          const cleanedSteps = editingStepsList
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          const payload = {
            title: editingTitle.trim(),
            steps: cleanedSteps.length > 0 ? cleanedSteps : ["Asegurar control de base"],
            notes: editingNotes.trim() || null,
            imageUrl: editingImageUrl.trim() || null,
          };

          if (onUpdateTechnique) {
            await onUpdateTechnique(activeTechnique.id, payload);
          } else if (onUpdateTechniqueSteps) {
            await onUpdateTechniqueSteps(activeTechnique.id, payload.steps);
          }
          setIsEditingTechnique(false);
        } catch (error) {
          console.error("Error al guardar técnica:", error);
        } finally {
          setIsSavingTechnique(false);
        }
      };

      // Maneja subida de imagen de la técnica con compresión máxima
      const handleTechPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFile = e.target.files?.[0];
        if (!rawFile) return;

        setIsUploadingTechPhoto(true);

        try {
          // Comprime imagen en el cliente reduciendo su peso un 95%+
          const { dataUrl } = await compressImage(rawFile, {
            maxWidth: 960,
            maxHeight: 960,
            quality: 0.7,
          });

          setEditingImageUrl(dataUrl);
        } catch (err) {
          console.error("Error al procesar foto de técnica:", err);
        } finally {
          setIsUploadingTechPhoto(false);
        }
      };

      // Modo Edición Completa de Técnica
      if (isEditingTechnique) {
        return (
          <div className="w-full max-w-xl mx-auto px-4 py-5 space-y-6 pb-safe-nav animate-in fade-in duration-200">
            {/* Input oculto para subir foto */}
            <input
              type="file"
              ref={techFileInputRef}
              onChange={handleTechPhotoUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Barra superior en modo edición: Cancelar | Título | Guardar */}
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
              <button
                type="button"
                onClick={() => setIsEditingTechnique(false)}
                disabled={isSavingTechnique}
                className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>

              <span className="text-sm font-bold text-black dark:text-white">
                Editar Técnica
              </span>

              <button
                type="button"
                onClick={handleSaveTechnique}
                disabled={isSavingTechnique || !editingTitle.trim()}
                className="px-4 py-1.5 rounded-full bg-[#007AFF] text-white text-xs font-semibold hover:bg-[#0062cc] active:scale-95 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingTechnique ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar</span>
                )}
              </button>
            </div>

            {/* 1. Nombre de la técnica */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Nombre del movimiento *
              </label>
              <input
                type="text"
                required
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Nombre de la técnica..."
                className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#1c2732] border border-black/[0.1] dark:border-white/[0.12] text-sm sm:text-base font-bold text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF] shadow-xs"
              />
            </div>

            {/* 2. Foto de la técnica */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Foto o imagen de referencia
              </label>
              {editingImageUrl ? (
                <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
                  <Image
                    src={safeImageSrc(editingImageUrl)}
                    alt={editingTitle}
                    fill
                    unoptimized={isDataOrBlob(editingImageUrl)}
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => techFileInputRef.current?.click()}
                      disabled={isUploadingTechPhoto}
                      className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-100 transition-colors shadow-md"
                    >
                      {isUploadingTechPhoto ? "Subiendo..." : "Cambiar foto"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingImageUrl("")}
                      className="px-3.5 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-md"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => techFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-black/[0.12] dark:border-white/[0.12] rounded-2xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6 text-[#007AFF] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF]">
                    {isUploadingTechPhoto ? "Subiendo foto..." : "Toca para subir una foto"}
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">PNG, JPG o WebP</span>
                </div>
              )}
            </div>

            {/* 3. Notas de la técnica */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Notas y detalles clave
              </label>
              <textarea
                rows={3}
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Detalles sobre distribución de peso, advertencias, agarres..."
                className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#1c2732] border border-black/[0.1] dark:border-white/[0.12] text-xs sm:text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF] resize-none shadow-xs"
              />
            </div>

            {/* 4. Pasos de ejecución con inputs individuales */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Pasos de ejecución
                </label>
                <button
                  type="button"
                  onClick={() => setEditingStepsList([...editingStepsList, ""])}
                  className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Añadir paso</span>
                </button>
              </div>

              <div className="space-y-2">
                {editingStepsList.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] shadow-xs"
                  >
                    <span className="w-7 h-7 rounded-full bg-[#007AFF]/15 text-[#007AFF] dark:text-[#0A84FF] text-xs font-bold flex items-center justify-center shrink-0 select-none">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => {
                        const updated = [...editingStepsList];
                        updated[idx] = e.target.value;
                        setEditingStepsList(updated);
                      }}
                      placeholder={`Paso ${idx + 1}: Describe el movimiento...`}
                      className="flex-1 px-2 py-1 bg-transparent text-xs sm:text-sm font-medium text-black dark:text-white placeholder:text-zinc-400 focus:outline-none"
                    />
                    {editingStepsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEditingStepsList(editingStepsList.filter((_, i) => i !== idx))}
                        className="w-8 h-8 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center shrink-0 transition-colors"
                        title="Eliminar este paso"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setEditingStepsList([...editingStepsList, ""])}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#007AFF]/40 dark:border-[#0A84FF]/40 text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Añadir paso</span>
              </button>
            </div>
          </div>
        );
      }

      // Modo Lectura / Vista Detallada de Técnica
      return (
        <div className="w-full max-w-xl mx-auto px-4 py-5 space-y-6 pb-safe-nav animate-in fade-in duration-200">
          {/* Barra superior de navegación: Cerrar + Editar + Cápsula de opciones y favorito */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSelectedTechniqueId(null);
                setIsEditingTechnique(false);
              }}
              className="px-5 py-2 rounded-full bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] text-sm font-semibold text-zinc-900 dark:text-zinc-100 shadow-xs hover:bg-zinc-50 dark:hover:bg-[#22303e] active:scale-95 transition-all flex items-center justify-center min-h-[40px]"
            >
              Cerrar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartEditingTechnique}
                className="px-4 py-2 rounded-full bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] shadow-xs hover:bg-zinc-50 dark:hover:bg-[#22303e] active:scale-95 transition-all flex items-center gap-1.5 min-h-[40px]"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Editar</span>
              </button>

              <div className="relative flex items-center gap-3.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] shadow-xs min-h-[40px]">
                {/* Botón de tres puntos (...) */}
                <button
                  type="button"
                  onClick={() => setIsTechMenuOpen((prev) => !prev)}
                  title="Opciones"
                  aria-label="Opciones"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

                {/* Botón de favorito (♡) */}
                <button
                  type="button"
                  onClick={() => setIsTechFav((prev) => !prev)}
                  title="Favorito"
                  aria-label="Favorito"
                  className="text-zinc-700 dark:text-zinc-300 hover:text-red-500 transition-colors p-1 active:scale-90"
                >
                  {isTechFav ? (
                    <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 stroke-current fill-none" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>

                {/* Menú contextual de técnica */}
                {isTechMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsTechMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-12 z-40 w-44 rounded-2xl bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                      <button
                        type="button"
                        onClick={handleStartEditingTechnique}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#007AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Editar técnica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTechMenuOpen(false);
                          onDeleteTechnique(activeTechnique.id);
                          setSelectedTechniqueId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar técnica</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Título de la técnica */}
          <div className="pt-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black dark:text-white">
              {activeTechnique.title}
            </h1>
          </div>

          {/* Foto principal / Hero de la técnica */}
          <div className="rounded-[26px] overflow-hidden bg-[#101820] aspect-[4/3] sm:aspect-[16/10] relative border border-[#d6e5ef] dark:border-[#223547] shadow-xs">
            {displayPhotoUrl ? (
              <Image
                src={safeImageSrc(displayPhotoUrl)}
                alt={activeTechnique.title}
                fill
                unoptimized={isDataOrBlob(displayPhotoUrl)}
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#dbe8f2] dark:bg-[#101923] p-6 gap-3">
                <TechniqueIllustration index={0} title={activeTechnique.title} />
                <button
                  type="button"
                  onClick={handleStartEditingTechnique}
                  className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] shadow-xs hover:bg-zinc-50 dark:hover:bg-[#22303e] transition-colors"
                >
                  + Añadir foto
                </button>
              </div>
            )}
          </div>

          {/* Sección: Notas */}
          <div className="space-y-2.5">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white">
              Notas
            </h2>
            <div className="rounded-[22px] bg-[#eaf2f7] dark:bg-[#152331] p-5 border border-[#d6e5ef] dark:border-[#223547] shadow-xs">
              <p className="text-xs sm:text-sm text-[#476074] dark:text-[#9abfd7] leading-relaxed font-normal">
                {activeTechnique.notes ||
                  activePosition.description ||
                  "Sin notas específicas registradas. Toca en Editar para añadir detalles clave sobre este movimiento."}
              </p>
            </div>
          </div>

          {/* Sección: Pasos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white">
                Pasos
              </h2>

              <button
                type="button"
                onClick={handleStartEditingTechnique}
                className="text-xs sm:text-sm font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline flex items-center gap-1 active:opacity-60"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Editar</span>
              </button>
            </div>

            <div className="rounded-[24px] bg-[#eaf2f7] dark:bg-[#152331] border border-[#d6e5ef] dark:border-[#223547] divide-y divide-[#d6e5ef]/70 dark:divide-[#223547]/70 shadow-xs overflow-hidden">
              {stepsToDisplay.map((step, idx) => (
                <div
                  key={idx}
                  onClick={handleStartEditingTechnique}
                  title="Toca para editar"
                  className="flex items-center min-h-[64px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer group"
                >
                  <span className="w-14 sm:w-16 flex-shrink-0 text-xl sm:text-2xl font-black text-[#8faec7] dark:text-[#527a9c] text-center select-none">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-100 py-4 pr-5 leading-snug flex-1">
                    {step}
                  </p>
                  <span className="text-xs text-[#007AFF] opacity-0 group-hover:opacity-100 pr-4 transition-opacity flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Editar</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  // Si hay una posición seleccionada, se muestra la vista de detalle de esa posición inspirada en Apple BJJ
  if (activePosition && selectedPositionId) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-5 space-y-6 pb-safe-nav animate-in fade-in duration-200">
        {/* Barra superior de navegación: Cerrar, Editar, Eliminar, Compartir y Favorito */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToGrid}
            className="px-5 py-2 rounded-full bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] text-sm font-semibold text-zinc-900 dark:text-zinc-100 shadow-xs hover:bg-zinc-50 dark:hover:bg-[#22303e] active:scale-95 transition-all flex items-center justify-center min-h-[40px]"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {/* Botón Editar Posición */}
            <button
              type="button"
              onClick={() => onEditPositionClick(activePosition)}
              title="Editar posición"
              className="w-10 h-10 rounded-full bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white shadow-xs active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>

            {/* Botón Eliminar Posición */}
            <button
              type="button"
              onClick={() => onDeletePositionClick(activePosition.id)}
              title="Eliminar posición"
              className="w-10 h-10 rounded-full bg-white dark:bg-[#1c2732] border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-red-500 shadow-xs active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Encabezado: Título principal */}
        <div className="pt-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black dark:text-white">
            {activePosition.title}
          </h1>
        </div>

        {/* Tarjeta Hero / Visión General de la Posición */}
        <div className="rounded-[26px] bg-[#eaf2f7] dark:bg-[#152331] p-5 sm:p-6 border border-[#d6e5ef] dark:border-[#223547] flex items-center gap-4 sm:gap-6 shadow-xs">
          <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden relative">
            {activePosition.imageUrl ? (
              <Image
                src={safeImageSrc(activePosition.imageUrl)}
                alt={activePosition.title}
                width={160}
                height={160}
                unoptimized={isDataOrBlob(activePosition.imageUrl)}
                className="w-full h-full object-contain drop-shadow-xs"
                priority
              />
            ) : (
              <BjjHeroIllustration title={activePosition.title} />
            )}
          </div>

          <div className="flex-1">
            <p className="text-xs sm:text-sm text-[#476074] dark:text-[#9abfd7] leading-relaxed font-normal">
              {activePosition.description ||
                "Posición dominante sobre el torso del oponente. Desde aquí puedes atacar con llaves de brazo, estrangulaciones o pasar a controles aún más fuertes."}
            </p>
          </div>
        </div>


        {/* Sección: Mis técnicas (Carrusel horizontal interactivo) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white">
                Mis técnicas
              </h2>
              <span className="text-xs sm:text-sm font-medium text-zinc-400 dark:text-zinc-500">
                +{activePosition.techniques.length} añadido
              </span>
            </div>

            <button
              type="button"
              onClick={() => onAddTechniqueClick(activePosition.id)}
              className="text-xs sm:text-sm font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline flex items-center gap-1 active:opacity-60"
            >
              <span>+ Añadir</span>
            </button>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            {activePosition.techniques.map((tech, idx) => {
              const techThumb = tech.imageUrl || getTechniqueImage(tech.title);
              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechniqueId(tech.id)}
                  className="w-38 sm:w-44 flex-shrink-0 flex flex-col rounded-[22px] overflow-hidden bg-[#eaf2f7] dark:bg-[#152331] border border-[#d6e5ef] dark:border-[#223547] shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                >
                  {/* Visual ilustrativo o foto real de la técnica */}
                  <div className="h-32 sm:h-36 w-full bg-[#dbe8f2] dark:bg-[#101923] flex items-center justify-center overflow-hidden relative">
                    {techThumb ? (
                      <Image
                        src={safeImageSrc(techThumb)}
                        alt={tech.title}
                        fill
                        unoptimized={isDataOrBlob(techThumb)}
                        sizes="(max-width: 768px) 180px, 200px"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="p-3">
                        <TechniqueIllustration index={idx} title={tech.title} />
                      </div>
                    )}
                  </div>

                  {/* Título de la técnica */}
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white line-clamp-2 leading-snug group-hover:text-[#007AFF] transition-colors">
                      {tech.title}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
                      <span>{tech.steps?.length || 0} pasos registrados</span>
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Tarjeta para añadir técnica directamente desde el carrusel */}
            <div
              onClick={() => onAddTechniqueClick(activePosition.id)}
              className="w-36 sm:w-40 flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-[22px] border-2 border-dashed border-[#b8d6ea] dark:border-[#223d54] bg-[#f4f9fd]/40 dark:bg-[#121c26]/40 hover:bg-[#eaf2f7] dark:hover:bg-[#152331] cursor-pointer transition-all active:scale-95 text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 text-[#007AFF] dark:text-[#0A84FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-2">Nueva técnica</span>
            </div>
          </div>
        </div>

        {/* Sección: Enlaces (Videos y Tutoriales) */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white">
              Enlaces
            </h2>
            <button
              type="button"
              onClick={() => setIsAddMediaModalOpen(true)}
              className="text-xs sm:text-sm font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline"
            >
              Añadir
            </button>
          </div>

          <div className="rounded-[24px] bg-[#eaf2f7] dark:bg-[#152331] p-4 border border-[#d6e5ef] dark:border-[#223547] space-y-3.5 shadow-xs">
            {/* Cabecera del reproductor con logo de YouTube */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-4.5 bg-[#FF0000] rounded-md flex items-center justify-center shadow-xs">
                  <svg className="w-3 h-3 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span className="text-xs sm:text-sm font-bold text-black dark:text-white">Youtube</span>
              </div>

              {activePosition.mediaLinks && activePosition.mediaLinks.length > 0 && (
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {activePosition.mediaLinks.length} {activePosition.mediaLinks.length === 1 ? "video" : "videos"}
                </span>
              )}
            </div>

            {/* Video o Preview interactivo */}
            {activePosition.mediaLinks && activePosition.mediaLinks.length > 0 ? (
              <div className="space-y-3">
                {activePosition.mediaLinks.map((media) => {
                  const embedId = getYouTubeVideoId(media.url);
                  return (
                    <div key={media.id} className="space-y-2">
                      {embedId ? (
                        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-sm bg-black">
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${embedId}`}
                            title="Video de YouTube"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full border-0"
                          />
                        </div>
                      ) : (
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#1c2732] border border-black/[0.06] dark:border-white/[0.08] hover:border-[#007AFF] transition-colors"
                        >
                          <span className="text-xs font-medium text-black dark:text-white truncate max-w-xs">{media.url}</span>
                          <span className="text-xs font-semibold text-[#007AFF]">Abrir enlace &rarr;</span>
                        </a>
                      )}
                      {onDeleteMediaLink && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => onDeleteMediaLink(media.id, activePosition.id)}
                            className="text-[11px] text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            Eliminar enlace
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                onClick={() => setIsAddMediaModalOpen(true)}
                className="relative rounded-2xl overflow-hidden bg-[#121820] aspect-video group cursor-pointer shadow-inner flex items-center justify-center border border-black/10 dark:border-white/5"
              >
                {/* Mat de jiu-jitsu oscuro de fondo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 z-10 flex flex-col justify-end p-4">
                  <p className="text-white text-xs sm:text-sm font-bold">Tutorial de {activePosition.title}</p>
                  <p className="text-zinc-300 text-[11px] mt-0.5">Toca aquí para vincular un video de YouTube o TikTok</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform z-20">
                  <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Modal para Vincular Enlace de Video (YouTube / TikTok) */}
        {isAddMediaModalOpen && (
          <div
            onClick={() => setIsAddMediaModalOpen(false)}
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1c2732] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-4.5 bg-[#FF0000] rounded-md flex items-center justify-center shadow-xs">
                  <svg className="w-3 h-3 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <h3 className="font-bold text-base text-black dark:text-white">
                  Vincular Video
                </h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pega la dirección de un video de YouTube o TikTok para tener el tutorial siempre a mano en {activePosition.title}.
              </p>

              <input
                type="url"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full p-2.5 text-xs rounded-xl bg-[#f5f5f7] dark:bg-black/50 border border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                autoFocus
              />

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMediaModalOpen(false);
                    setMediaUrlInput("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-600 dark:text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!mediaUrlInput.trim()}
                  onClick={() => {
                    if (onAddMediaLink && mediaUrlInput.trim()) {
                      onAddMediaLink(activePosition.id, mediaUrlInput.trim());
                    }
                    setIsAddMediaModalOpen(false);
                    setMediaUrlInput("");
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] text-white text-xs font-semibold hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-xs"
                >
                  Guardar Enlace
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Despliega la categoría activa seleccionada
  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? categories[0];
  const displayedCategories = activeCategory ? [activeCategory] : [];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 pb-safe-nav">
      {/* Cabecera del módulo principal */}
      <header className="flex items-center justify-between gap-3.5 sm:gap-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Categorías de BJJ
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
            Posiciones, guardias, leg locks, derribos y pases con sus técnicas
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAddPositionClick(activeCategoryId)}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm min-h-[36px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Entrada</span>
        </button>
      </header>

      {/* Selector de categorías optimizado para mobile y desktop */}
      <div className="space-y-2.5">
        {/* Selector dropdown para móviles (acceso directo e inmediato sin scrolling) */}
        <div className="sm:hidden">
          <div className="relative">
            <select
              aria-label="Seleccionar categoría"
              value={activeCategoryId}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.1] dark:border-white/[0.12] text-xs font-bold text-black dark:text-white appearance-none pr-10 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              {categories.map((cat) => {
                const count = cat.positions?.length ?? 0;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({count} {count === 1 ? "posición" : "posiciones"})
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#007AFF]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Píldoras visibles envueltas (flex-wrap) sin corte horizontal */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isSelected = activeCategoryId === cat.id;
            const count = cat.positions?.length ?? 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
                  isSelected
                    ? "bg-[#007AFF] border-[#007AFF] text-white shadow-xs"
                    : "bg-white dark:bg-[#1c1c1e] border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-black/[0.2]"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-black/[0.05] dark:bg-white/[0.08] text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secciones por categoría principal */}
      <div className="space-y-8">
        {displayedCategories.map((category) => {
          const categoryPositions: PositionWithRelations[] = category.positions || [];
          const meta = CATEGORY_META[category.name] || {
            subtitle: "Técnicas y posiciones asociadas",
            emptyTitle: "Sin elementos registrados",
            emptyDesc: "Registra nuevas técnicas dentro de esta categoría.",
            btnLabel: "Registrar",
          };



          return (
            <section key={category.id} className="space-y-3">
              {/* Encabezado de la categoría padre */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold tracking-tight text-black dark:text-white">
                      {category.name}
                    </h2>
                    <span className="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-400">
                      {categoryPositions.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {meta.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAddPositionClick(category.id)}
                  className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:underline active:opacity-60 flex items-center gap-1"
                >
                  <span>+ Añadir</span>
                </button>
              </div>

              {/* Contenido: cuadrícula de posiciones o estado vacío elegante */}
              {categoryPositions.length === 0 ? (
                <div className="p-6 text-center rounded-3xl bg-white dark:bg-[#1c1c1e] border border-dashed border-black/[0.08] dark:border-white/[0.08] space-y-2">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {meta.emptyTitle}
                  </p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    {meta.emptyDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddPositionClick(category.id)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    + {meta.btnLabel}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                  {categoryPositions.map((pos: PositionWithRelations) => (
                    <div
                      key={pos.id}
                      className="group/card relative flex flex-col p-3 rounded-3xl bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] text-left transition-all duration-200 shadow-xs hover:shadow-md hover:border-[#007AFF]/40"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          onSelectPosition(pos.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            onSelectPosition(pos.id);
                          }
                        }}
                        className="w-full text-left active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        {/* Ilustración de posición con bordes redondeados nítidos */}
                        <div
                          className="relative w-full aspect-square rounded-2xl overflow-hidden mb-2.5 border border-black/[0.08] dark:border-white/[0.12] shadow-xs flex items-center justify-center bg-[#e1eaf1] dark:bg-[#151c24]"
                          style={{ borderRadius: "18px", overflow: "hidden" }}
                        >
                          {pos.imageUrl ? (
                            <Image
                              src={safeImageSrc(pos.imageUrl)}
                              alt={pos.title}
                              width={300}
                              height={300}
                              unoptimized={isDataOrBlob(pos.imageUrl)}
                              style={{ borderRadius: "18px" }}
                              className="w-full h-full object-cover rounded-2xl transition-transform duration-300 ease-out group-hover/card:scale-105"
                              priority={pos.sortOrder <= 4}
                            />
                          ) : (
                            <BjjIconPlaceholder name={pos.title} className="w-16 h-16" />
                          )}

                          {/* Botones de acción rápida: Editar (Azul) y Eliminar (Rojo) visibles únicamente en hover */}
                          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPositionClick(pos);
                              }}
                              title={`Editar ${pos.title}`}
                              aria-label={`Editar ${pos.title}`}
                              className="w-7 h-7 rounded-full bg-[#007AFF] hover:bg-[#0062cc] active:scale-90 text-white shadow-md transition-all flex items-center justify-center border border-white/20"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePositionClick(pos.id);
                              }}
                              title={`Eliminar ${pos.title}`}
                              aria-label={`Eliminar ${pos.title}`}
                              className="w-7 h-7 rounded-full bg-[#FF3B30] hover:bg-[#d72c23] active:scale-90 text-white shadow-md transition-all flex items-center justify-center border border-white/20"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Título de la posición e indicador de movimientos */}
                        <div className="px-0.5 pb-0.5 flex items-center justify-between gap-1.5 w-full">
                          <h3 className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-50 leading-tight truncate">
                            {pos.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-[#007AFF]/10 dark:bg-[#0A84FF]/15 text-[#007AFF] dark:text-[#0A84FF] flex-shrink-0">
                            {pos.techniques.length} {pos.techniques.length === 1 ? "mov" : "movs"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default PositionsView;
