"use client";

import React, { useMemo } from "react";
import type { TechniqueWithRelations, TrainingActivity, MediaLink } from "@/types/bjj";
import { MediaEmbed } from "@/components/media/MediaEmbed";

interface TechniqueDetailViewProps {
  technique: TechniqueWithRelations;
  onBack?: () => void;
  onSelectPosition?: () => void;
}

export function TechniqueDetailView({
  technique,
  onBack,
  onSelectPosition,
}: TechniqueDetailViewProps) {
  // Calculo de frecuencia mensual de entrenamiento
  const monthlyData = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentMonth = new Date().getMonth();
    
    // Obtener los ultimos 6 meses
    const last6 = Array.from({ length: 6 }, (_, i) => {
      const idx = (currentMonth - 5 + i + 12) % 12;
      return { month: monthNames[idx], count: 0, monthIndex: idx };
    });

    if (technique.trainingActivities) {
      technique.trainingActivities.forEach((act: TrainingActivity) => {
        const actMonth = new Date(act.date).getMonth();
        const found = last6.find((m) => m.monthIndex === actMonth);
        if (found) {
          found.count += act.appliedCount;
        }
      });
    }

    const maxCount = Math.max(...last6.map((m) => m.count), 1);
    return { data: last6, maxCount };
  }, [technique.trainingActivities]);

  const totalApplied = technique.trainingActivities?.reduce(
    (acc: number, act: TrainingActivity) => acc + act.appliedCount,
    0
  ) ?? 0;

  return (
    <article className="w-full max-w-md mx-auto px-4 py-4 space-y-6 pb-28">
      {/* Boton de regreso estilo iOS */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 active:opacity-60 transition-opacity min-h-[44px] min-w-[44px]"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Posición</span>
        </button>

        {/* Insignia indicando la Posicion Padre */}
        {technique.position && (
          <button
            type="button"
            onClick={onSelectPosition}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-xs font-semibold active:opacity-75 transition-opacity"
          >
            <span>Posición:</span>
            <span className="font-bold">{technique.position.title}</span>
          </button>
        )}
      </div>

      {/* Titulo de la tecnica */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {technique.title}
        </h1>
        <p className="text-xs text-zinc-400 font-medium">
          Registrada el {new Date(technique.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {/* Tarjeta aislada con la lista vertical estrictamente numerada de pasos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Secuencia de Ejecución
          </h2>
          <span className="text-xs font-medium text-zinc-500">
            {technique.steps.length} {technique.steps.length === 1 ? "paso" : "pasos"}
          </span>
        </div>

        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-sm space-y-4">
          {technique.steps.map((step: string, index: number) => (
            <div key={index} className="flex items-start gap-3.5 group">
              {/* Circulo numerado indicador de orden */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 flex items-center justify-center text-xs font-bold shadow-xs">
                {index + 1}
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed pt-0.5">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Enlaces de video si existen para la tecnica */}
      {technique.mediaLinks && technique.mediaLinks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Demostración en Video
          </h2>
          <div className="space-y-3">
            {technique.mediaLinks.map((media: MediaLink) => (
              <MediaEmbed key={media.id} mediaLink={media} />
            ))}
          </div>
        </section>
      )}

      {/* Grafico de Actividad de Entrenamiento (Training Activity) segmentado por mes */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Actividad en Sparring / Drills
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
            {totalApplied} finalizaciones
          </span>
        </div>

        <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-sm space-y-4">
          <div className="flex items-end justify-between h-36 pt-6 px-2 gap-2">
            {monthlyData.data.map((item, idx) => {
              const heightPercent = Math.max((item.count / monthlyData.maxCount) * 100, 10);
              const isCurrent = idx === monthlyData.data.length - 1;

              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  {/* Etiqueta de cantidad */}
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {item.count}
                  </span>

                  {/* Barra vertical con degradado */}
                  <div className="w-full max-w-[28px] bg-slate-100 dark:bg-zinc-800 rounded-lg flex items-end overflow-hidden h-24">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-lg transition-all duration-500 ${
                        isCurrent
                          ? "bg-blue-600 dark:bg-blue-500"
                          : "bg-blue-300 dark:bg-blue-800/80"
                      }`}
                    />
                  </div>

                  {/* Etiqueta de mes */}
                  <span className={`text-[10px] font-medium ${isCurrent ? "font-bold text-blue-600 dark:text-blue-400" : "text-zinc-400"}`}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-center text-zinc-400 border-t border-black/[0.04] dark:border-white/[0.04] pt-3">
            Frecuencia de repeticiones exitosas durante las sesiones de tatami.
          </p>
        </div>
      </section>
    </article>
  );
}

export default TechniqueDetailView;
