"use client";

import React, { useState, useTransition, useMemo } from "react";
import type { PositionWithRelations, Technique, AppTab, CategoryWithPositions } from "@/types/bjj";
import {
  createTechniqueAction,
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
  deleteTechniqueAction,
  updateTechniqueAction,
  updatePositionNotesAction,
  uploadPositionImageAction,
  createMediaLinkAction,
  deleteMediaLinkAction,
} from "@/app/actions";
import { PositionsView } from "@/components/positions/PositionsView";
import { AllTechniquesLibraryView } from "@/components/library/AllTechniquesLibraryView";
import { BottomTabBar } from "@/components/navigation/BottomTabBar";

interface MainAppContainerProps {
  initialPositions: PositionWithRelations[];
  initialCategories?: CategoryWithPositions[];
}

export function MainAppContainer({ initialPositions, initialCategories = [] }: MainAppContainerProps) {
  const [positions, setPositions] = useState<PositionWithRelations[]>(initialPositions);
  const [categories, setCategories] = useState<CategoryWithPositions[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<AppTab>("posiciones");
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados de modal para agregar movimiento
  const [isAddTechModalOpen, setIsAddTechModalOpen] = useState(false);
  const [targetPositionIdForTech, setTargetPositionIdForTech] = useState<string>("");
  const [newTechTitle, setNewTechTitle] = useState("");
  const [newTechStepsText, setNewTechStepsText] = useState("");

  // Estados de modal para crear posicion
  const [isAddPosModalOpen, setIsAddPosModalOpen] = useState(false);
  const [newPosCategoryId, setNewPosCategoryId] = useState<string>(
    initialCategories[0]?.id ?? ""
  );
  const [newPosTitle, setNewPosTitle] = useState("");
  const [newPosSubtitle, setNewPosSubtitle] = useState("");
  const [newPosDescription, setNewPosDescription] = useState("");
  const [newPosImageUrl, setNewPosImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Estados de modal para editar posicion
  const [isEditPosModalOpen, setIsEditPosModalOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string>("");
  const [editPosCategoryId, setEditPosCategoryId] = useState<string>("");
  const [editPosTitle, setEditPosTitle] = useState("");
  const [editPosSubtitle, setEditPosSubtitle] = useState("");
  const [editPosDescription, setEditPosDescription] = useState("");
  const [editPosImageUrl, setEditPosImageUrl] = useState<string>("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  // Estado para el modal de confirmacion de eliminacion personalizado
  const [positionToDelete, setPositionToDelete] = useState<PositionWithRelations | null>(null);

  // Agrupación dinámica de posiciones dentro de cada categoría padre
  const categoriesWithPositions = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      positions: positions.filter(
        (p) => p.categoryId === cat.id || p.category?.id === cat.id
      ),
    }));
  }, [categories, positions]);

  // Total de tecnicas calculadas
  const totalTechniquesCount = useMemo(() => {
    return positions.reduce((acc, p) => acc + p.techniques.length, 0);
  }, [positions]);

  // Abre el modal de agregar movimiento
  const handleOpenAddTechModal = (positionId?: string) => {
    const defaultId = positionId || selectedPositionId || positions[0]?.id || "";
    setTargetPositionIdForTech(defaultId);
    setNewTechTitle("");
    setNewTechStepsText("");
    setIsAddTechModalOpen(true);
  };

  // Abre el modal para crear posición con categoría predefinida
  const handleOpenAddPosModal = (presetCategoryId?: string) => {
    if (presetCategoryId) {
      setNewPosCategoryId(presetCategoryId);
    } else if (!newPosCategoryId && categories.length > 0) {
      setNewPosCategoryId(categories[0].id);
    }
    setNewPosTitle("");
    setNewPosSubtitle("");
    setNewPosDescription("");
    setNewPosImageUrl("");
    setImagePreview(null);
    setIsAddPosModalOpen(true);
  };

  // Manejo de carga de archivo de imagen
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadPositionImageAction(formData);

      if (res.success && res.url) {
        setNewPosImageUrl(res.url);
      } else {
        // Fallback a Base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setNewPosImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      // Fallback a Base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewPosImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Quita la imagen seleccionada
  const handleRemoveImage = () => {
    setImagePreview(null);
    setNewPosImageUrl("");
  };

  // Abre el modal para editar posicion con sus datos precargados
  const handleOpenEditPosModal = (pos: PositionWithRelations) => {
    setEditingPositionId(pos.id);
    setEditPosCategoryId(pos.categoryId ?? categories[0]?.id ?? "");
    setEditPosTitle(pos.title);
    setEditPosSubtitle(pos.subtitle ?? "");
    setEditPosDescription(pos.description ?? "");
    setEditPosImageUrl(pos.imageUrl ?? "");
    setEditImagePreview(pos.imageUrl ?? null);
    setIsEditPosModalOpen(true);
  };

  // Manejo de carga de archivo de imagen para edicion
  const handleEditImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setEditImagePreview(localPreview);
    setIsUploadingEditImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadPositionImageAction(formData);

      if (res.success && res.url) {
        setEditPosImageUrl(res.url);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setEditPosImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setEditPosImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  // Quita la imagen en modo edicion
  const handleRemoveEditImage = () => {
    setEditImagePreview(null);
    setEditPosImageUrl("");
  };

  // Guardar cambios de edicion de posicion
  const handleUpdatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPosTitle.trim() || !editingPositionId) return;

    const parentCat = categories.find((c) => c.id === editPosCategoryId) || null;

    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === editingPositionId
          ? {
              ...pos,
              title: editPosTitle.trim(),
              subtitle: editPosSubtitle.trim() || null,
              description: editPosDescription.trim() || null,
              categoryId: editPosCategoryId || null,
              category: parentCat,
              imageUrl: editPosImageUrl.trim() || null,
            }
          : pos
      )
    );

    setIsEditPosModalOpen(false);

    startTransition(async () => {
      const res = await updatePositionAction({
        id: editingPositionId,
        title: editPosTitle.trim(),
        subtitle: editPosSubtitle.trim() || null,
        description: editPosDescription.trim() || null,
        categoryId: editPosCategoryId || null,
        imageUrl: editPosImageUrl.trim() || null,
      });

      if (res.success && res.position) {
        const updated = res.position;
        setPositions((prev) =>
          prev.map((p) => (p.id === editingPositionId ? updated : p))
        );
      }
    });
  };

  // Solicita confirmacion con modal propio para eliminar una posicion
  const handleRequestDeletePosition = (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (pos) {
      setPositionToDelete(pos);
    }
  };

  // Ejecuta la eliminacion confirmada por el modal personalizado
  const handleConfirmDeletePosition = () => {
    if (!positionToDelete) return;
    const id = positionToDelete.id;
    setPositionToDelete(null);
    setIsEditPosModalOpen(false);

    setPositions((prev) => prev.filter((p) => p.id !== id));
    if (selectedPositionId === id) {
      setSelectedPositionId(null);
    }

    startTransition(async () => {
      await deletePositionAction(id);
    });
  };

  // Guardar nuevo movimiento
  const handleCreateTechnique = (e: React.FormEvent) => {
    e.preventDefault();
    const position = positions.find((p) => p.id === targetPositionIdForTech);
    if (!newTechTitle.trim() || !position) return;

    const steps = newTechStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const tempId = `temp-${Date.now()}`;
    const optimisticTech: Technique = {
      id: tempId,
      positionId: position.id,
      title: newTechTitle.trim(),
      steps: steps.length > 0 ? steps : ["Asegurar control de base"],
      sortOrder: position.techniques.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === position.id
          ? { ...pos, techniques: [...pos.techniques, optimisticTech] }
          : pos
      )
    );

    setIsAddTechModalOpen(false);
    setNewTechTitle("");
    setNewTechStepsText("");

    startTransition(async () => {
      const res = await createTechniqueAction({
        positionId: position.id,
        title: optimisticTech.title,
        steps: optimisticTech.steps,
      });

      if (res.success && res.technique) {
        const savedTech = res.technique;
        setPositions((prev) =>
          prev.map((pos) =>
            pos.id === position.id
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
    const parentCategory = categories.find((c) => c.id === newPosCategoryId) || null;

    const optimisticPos: PositionWithRelations = {
      id: tempId,
      categoryId: newPosCategoryId || null,
      category: parentCategory,
      title: newPosTitle.trim(),
      subtitle: newPosSubtitle.trim() || null,
      description: newPosDescription.trim() || null,
      imageUrl: newPosImageUrl.trim() || null,
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
    setActiveTab("posiciones");
    setIsAddPosModalOpen(false);
    setNewPosTitle("");
    setNewPosSubtitle("");
    setNewPosDescription("");
    setNewPosImageUrl("");
    setImagePreview(null);

    startTransition(async () => {
      const res = await createPositionAction({
        title: optimisticPos.title,
        subtitle: optimisticPos.subtitle ?? undefined,
        description: optimisticPos.description ?? undefined,
        categoryId: newPosCategoryId || undefined,
        imageUrl: optimisticPos.imageUrl ?? undefined,
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
    setPositions((prev) =>
      prev.map((pos) => ({
        ...pos,
        techniques: pos.techniques.filter((t) => t.id !== techId),
      }))
    );

    startTransition(async () => {
      await deleteTechniqueAction(techId);
    });
  };

  // Guardar notas personales
  const handleSaveNotes = (positionId: string, notes: string) => {
    setPositions((prev) =>
      prev.map((pos) => (pos.id === positionId ? { ...pos, notes } : pos))
    );

    startTransition(async () => {
      await updatePositionNotesAction(positionId, notes);
    });
  };

  // Agrega enlace multimedia a una posicion
  const handleAddMediaLink = (positionId: string, url: string) => {
    if (!url.trim()) return;
    startTransition(async () => {
      const res = await createMediaLinkAction({ positionId, url: url.trim() });
      if (res.success && res.mediaLink) {
        const newMedia = res.mediaLink;
        setPositions((prev) =>
          prev.map((pos) =>
            pos.id === positionId
              ? { ...pos, mediaLinks: [...pos.mediaLinks, newMedia] }
              : pos
          )
        );
      }
    });
  };

  // Elimina enlace multimedia
  const handleDeleteMediaLink = (linkId: string, positionId: string) => {
    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === positionId
          ? { ...pos, mediaLinks: pos.mediaLinks.filter((m) => m.id !== linkId) }
          : pos
      )
    );
    startTransition(async () => {
      await deleteMediaLinkAction(linkId);
    });
  };

  // Actualiza los pasos de una técnica existente
  const handleUpdateTechniqueSteps = async (techId: string, steps: string[]) => {
    setPositions((prev) =>
      prev.map((pos) => ({
        ...pos,
        techniques: pos.techniques.map((t) =>
          t.id === techId ? { ...t, steps } : t
        ),
      }))
    );
    startTransition(async () => {
      await updateTechniqueAction({ id: techId, steps });
    });
  };

  // Navegar a una posicion especifica desde la biblioteca de tecnicas
  const handleGoToPositionFromLibrary = (positionId: string) => {
    setSelectedPositionId(positionId);
    setActiveTab("posiciones");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black text-black dark:text-white flex flex-col justify-between selection:bg-[#007AFF]/20">
      {/* Contenido dinamico segun la pestaña activa */}
      <main className="flex-1 w-full">
        {activeTab === "posiciones" ? (
          <PositionsView
            positions={positions}
            categories={categoriesWithPositions}
            selectedPositionId={selectedPositionId}
            onSelectPosition={(id) => setSelectedPositionId(id)}
            onBackToGrid={() => setSelectedPositionId(null)}
            onAddPositionClick={(catId) => handleOpenAddPosModal(catId)}
            onAddTechniqueClick={(posId) => handleOpenAddTechModal(posId)}
            onDeleteTechnique={handleDeleteTechnique}
            onUpdateTechniqueSteps={handleUpdateTechniqueSteps}
            onSaveNotes={handleSaveNotes}
            onEditPositionClick={(pos) => handleOpenEditPosModal(pos)}
            onDeletePositionClick={(posId) => handleRequestDeletePosition(posId)}
            onAddMediaLink={handleAddMediaLink}
            onDeleteMediaLink={handleDeleteMediaLink}
          />
        ) : (
          <AllTechniquesLibraryView
            positions={positions}
            onAddTechniqueClick={(posId) => handleOpenAddTechModal(posId)}
            onDeleteTechnique={handleDeleteTechnique}
            onSelectPosition={handleGoToPositionFromLibrary}
          />
        )}
      </main>

      {/* Barra de navegacion inferior con exactamente 2 modulos */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "posiciones" && selectedPositionId) {
            // Permanece en la posicion o vuelve a la cuadricula
          }
        }}
        positionsCount={positions.length}
        techniquesCount={totalTechniquesCount}
      />

      {/* Modal Agregar Movimiento */}
      {isAddTechModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-t-3xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-base text-black dark:text-white">
                  Nuevo Movimiento
                </h3>
                <p className="text-xs text-zinc-400">
                  Registra una técnica o finalización
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTechModalOpen(false)}
                className="text-zinc-400 hover:text-black dark:hover:text-white text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateTechnique} className="space-y-4">
              {/* Selector de Posicion Padre */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Posición de origen *
                </label>
                <select
                  value={targetPositionIdForTech}
                  onChange={(e) => setTargetPositionIdForTech(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                >
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de la tecnica */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre del movimiento *
                </label>
                <input
                  type="text"
                  required
                  value={newTechTitle}
                  onChange={(e) => setNewTechTitle(e.target.value)}
                  placeholder="Ej: Barra de Brazo, Estrangulamiento Ezequiel, Triángulo..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  autoFocus
                />
              </div>

              {/* Pasos de ejecucion */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Pasos de ejecución (uno por línea)
                </label>
                <textarea
                  rows={4}
                  value={newTechStepsText}
                  onChange={(e) => setNewTechStepsText(e.target.value)}
                  placeholder="Paso 1: Aislar el brazo cruzado...&#10;Paso 2: Pasar pierna sobre la cabeza...&#10;Paso 3: Elevar cadera..."
                  className="w-full p-3 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddTechModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newTechTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Guardando..." : "Guardar Movimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Posicion */}
      {isAddPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-t-3xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <h3 className="font-bold text-base text-black dark:text-white">
                Nueva Posición de Jiu-Jitsu
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPosModalOpen(false)}
                className="text-zinc-400 hover:text-black dark:hover:text-white text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreatePosition} className="space-y-4">
              {/* Selector de Categoría Principal Padre */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Categoría principal *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = newPosCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewPosCategoryId(cat.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-[#007AFF] border-[#007AFF] text-white shadow-xs font-semibold"
                            : "bg-[#f5f5f7] dark:bg-black border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-black/[0.2]"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                  autoFocus
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
                  placeholder="Objetivos de control y transiciones desde esta posición..."
                  className="w-full p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 resize-none"
                />
              </div>

              {/* Imagen o ilustración de la posición */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Ilustración o Imagen (opcional)
                </label>

                {imagePreview || newPosImageUrl ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.12] bg-[#e1eaf1] dark:bg-[#151c24] flex items-center justify-center">
                    <img
                      src={imagePreview || newPosImageUrl}
                      alt="Vista previa de posición"
                      className="w-full h-full object-contain p-2 rounded-2xl"
                    />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-xs text-white font-medium">
                        Subiendo imagen...
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Quitar</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-black/[0.1] dark:border-white/[0.15] hover:border-[#007AFF] dark:hover:border-[#0A84FF] rounded-2xl cursor-pointer bg-[#f5f5f7]/50 dark:bg-black/50 transition-all p-3 text-center group">
                      <svg className="w-6 h-6 text-zinc-400 group-hover:text-[#007AFF] transition-colors mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        Subir imagen desde el dispositivo
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">
                        PNG, JPG o WebP
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      value={newPosImageUrl}
                      onChange={(e) => {
                        setNewPosImageUrl(e.target.value);
                        setImagePreview(e.target.value.trim() ? e.target.value.trim() : null);
                      }}
                      placeholder="O pega el enlace de una imagen (https://...)"
                      className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddPosModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-98 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !newPosTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
                >
                  {isPending ? "Creando..." : "Crear Posición"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Posicion */}
      {isEditPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-t-3xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <h3 className="font-bold text-base text-black dark:text-white">
                Editar Posición
              </h3>
              <button
                type="button"
                onClick={() => setIsEditPosModalOpen(false)}
                className="text-zinc-400 hover:text-black dark:hover:text-white text-sm font-semibold p-1"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleUpdatePosition} className="space-y-4">
              {/* Selector de Categoría Principal Padre */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Categoría principal *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = editPosCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditPosCategoryId(cat.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-[#007AFF] border-[#007AFF] text-white shadow-xs font-semibold"
                            : "bg-[#f5f5f7] dark:bg-black border-black/[0.08] dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:border-black/[0.2]"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Nombre de la posición *
                </label>
                <input
                  type="text"
                  required
                  value={editPosTitle}
                  onChange={(e) => setEditPosTitle(e.target.value)}
                  placeholder="Ej: Guardia Mariposa, Control Norte-Sur..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                />
              </div>


              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Descripción táctica (opcional)
                </label>
                <textarea
                  rows={2}
                  value={editPosDescription}
                  onChange={(e) => setEditPosDescription(e.target.value)}
                  placeholder="Objetivos de control y transiciones desde esta posición..."
                  className="w-full p-2.5 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 resize-none"
                />
              </div>

              {/* Imagen o ilustración de la posición */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Ilustración o Imagen (opcional)
                </label>

                {editImagePreview || editPosImageUrl ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.12] bg-[#e1eaf1] dark:bg-[#151c24] flex items-center justify-center">
                    <img
                      src={editImagePreview || editPosImageUrl}
                      alt="Vista previa de posición"
                      className="w-full h-full object-contain p-2 rounded-2xl"
                    />
                    {isUploadingEditImage && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-xs text-white font-medium">
                        Subiendo imagen...
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveEditImage}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black text-white text-[11px] font-semibold flex items-center gap-1 transition-all shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Quitar</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-black/[0.1] dark:border-white/[0.15] hover:border-[#007AFF] dark:hover:border-[#0A84FF] rounded-2xl cursor-pointer bg-[#f5f5f7]/50 dark:bg-black/50 transition-all p-3 text-center group">
                      <svg className="w-6 h-6 text-zinc-400 group-hover:text-[#007AFF] transition-colors mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                        Subir nueva imagen
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">
                        PNG, JPG o WebP
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageFileChange}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      value={editPosImageUrl}
                      onChange={(e) => {
                        setEditPosImageUrl(e.target.value);
                        setEditImagePreview(e.target.value.trim() ? e.target.value.trim() : null);
                      }}
                      placeholder="O pega el enlace de una imagen (https://...)"
                      className="w-full px-3 py-2 rounded-xl bg-[#f5f5f7] dark:bg-black border border-black/[0.08] dark:border-white/[0.08] text-xs text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
                    />
                  </div>
                )}
              </div>

              {/* Acciones: Guardar y Cancelar */}
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditPosModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-98 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !editPosTitle.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación Personalizado (Estilo Apple Alert) */}
      {positionToDelete && (
        <div
          onClick={() => setPositionToDelete(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1c1c1e] p-6 border border-black/[0.08] dark:border-white/[0.08] shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Icono de advertencia destructiva */}
            <div className="w-12 h-12 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <h3 id="delete-modal-title" className="font-bold text-lg text-black dark:text-white">
                ¿Eliminar {positionToDelete.title}?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {positionToDelete.techniques.length > 0
                  ? `Esta posición contiene ${positionToDelete.techniques.length} ${
                      positionToDelete.techniques.length === 1 ? "técnica registrada" : "técnicas registradas"
                    }. Se eliminarán permanentemente de tu biblioteca.`
                  : "Esta acción no se puede deshacer. Se eliminará la posición de tu biblioteca."}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPositionToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-98 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePosition}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainAppContainer;
