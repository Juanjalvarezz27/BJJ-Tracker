"use client";

import React from "react";
import type { GlobalTab, SegmentedView } from "@/types/bjj";

interface GlobalNavigationProps {
  activeTab: GlobalTab;
  onTabChange: (tab: GlobalTab) => void;
  activeSegment?: SegmentedView;
  onSegmentChange?: (segment: SegmentedView) => void;
  showSegmentedControl?: boolean;
}

export function GlobalNavigation({
  activeTab,
  onTabChange,
  activeSegment = "biblioteca",
  onSegmentChange,
  showSegmentedControl = true,
}: GlobalNavigationProps) {
  const tabs = [
    {
      id: "diario" as const,
      label: "Diario",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: "tecnicas" as const,
      label: "Técnicas",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "secuencias" as const,
      label: "Secuencias",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: "objetivos" as const,
      label: "Objetivos",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "perfil" as const,
      label: "Perfil",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const segments = [
    { id: "biblioteca" as const, label: "Biblioteca de BJJ" },
    { id: "mis_movimientos" as const, label: "Mis movimientos" },
    { id: "probar_tarde" as const, label: "Probar más tarde" },
  ];

  return (
    <>
      {/* Control segmentado superior estilo iOS */}
      {showSegmentedControl && (
        <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-slate-50/85 dark:bg-zinc-950/85 border-b border-black/[0.06] dark:border-white/[0.08] safe-top">
          <div className="max-w-md mx-auto px-4 py-2.5">
            <div className="flex items-center p-1 bg-black/[0.05] dark:bg-white/[0.08] rounded-xl text-xs font-semibold">
              {segments.map((seg) => {
                const isActive = activeSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => onSegmentChange?.(seg.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all duration-200 text-center truncate ${
                      isActive
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    {seg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>
      )}

      {/* Tab bar inferior fija estilo iOS */}
      <nav
        aria-label="Navegación principal"
        className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-slate-50/90 dark:bg-zinc-950/90 border-t border-black/[0.06] dark:border-white/[0.08] safe-bottom"
      >
        <div className="max-w-md mx-auto flex items-center justify-around h-14 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full min-w-[56px] min-h-[44px] transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                <div className={`transition-transform duration-150 ${isActive ? "scale-105" : "scale-100"}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-medium tracking-tight mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default GlobalNavigation;
