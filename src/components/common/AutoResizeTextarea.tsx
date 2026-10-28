"use client";

import React, { useRef, useEffect } from "react";

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxHeight?: number;
  autoFocus?: boolean;
}

export function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  minRows = 2,
  maxHeight = 300,
  autoFocus = false,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajusta dinámicamente la altura del textarea según el contenido
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    // Resetea altura temporalmente para recalcular scrollHeight preciso
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, maxHeight]);

  return (
    <textarea
      ref={textareaRef}
      rows={minRows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`block w-full resize-none transition-[height] duration-75 ${className}`}
    />
  );
}
