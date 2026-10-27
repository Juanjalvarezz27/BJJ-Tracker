"use client";

import React from "react";
import type { AppTab } from "@/types/bjj";

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  positionsCount: number;
  techniquesCount: number;
}

export function BottomTabBar({
  activeTab,
  onTabChange,
  positionsCount,
  techniquesCount,
}: BottomTabBarProps) {
  const tabs = [
    {
      id: "posiciones" as const,
      label: "Posiciones",
      count: positionsCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "tecnicas" as const,
      label: "Mis Técnicas",
      count: techniquesCount,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Navegación principal de dos módulos"
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/85 dark:bg-black/85 border-t border-black/[0.08] dark:border-white/[0.08] safe-bottom"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] transition-colors relative ${
                isActive
                  ? "text-[#007AFF] dark:text-[#0A84FF]"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
              }`}
            >
              <div className="relative">
                <div className={`transition-transform duration-150 ${isActive ? "scale-110" : "scale-100"}`}>
                  {tab.icon}
                </div>
                {tab.count > 0 && (
                  <span
                    className={`absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      isActive
                        ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-semibold tracking-tight mt-1 ${isActive ? "font-bold" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabBar;
