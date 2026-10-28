"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

// Tiempo máximo sin onresult antes de considerar un silent hang de WebKit
const WATCHDOG_MS = 8000;

export function useVoiceRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultCallbackRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const baseTextRef = useRef<string>("");
  const sessionIdRef = useRef<number>(0);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasResultRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SR));
    }
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  // Destruye la instancia actual limpiando todos los listeners antes de abortar
  const destroyRecognition = useCallback(() => {
    clearWatchdog();
    if (recognitionRef.current) {
      const old = recognitionRef.current;
      recognitionRef.current = null;
      old.onstart = null;
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try { old.abort(); } catch { /* ya cerrado */ }
    }
  }, [clearWatchdog]);

  const stopListening = useCallback(() => {
    sessionIdRef.current += 1;
    destroyRecognition();
    setIsListening(false);
    setActiveId(null);
  }, [destroyRecognition]);

  // Construye y configura una nueva instancia de SpeechRecognition
  // SIEMPRE se crea desde cero para evitar el "poisoned instance" bug de iOS
  const buildRecognition = useCallback((mySessionId: number, onResult: (text: string, isFinal: boolean) => void) => {
    if (typeof window === "undefined") return null;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    const isIOS = detectIOS();

    recognition.continuous = !isIOS;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    const userLang = navigator.language || "es-ES";
    recognition.lang = userLang.startsWith("es") ? userLang : "es-ES";

    recognition.onstart = () => {
      if (sessionIdRef.current !== mySessionId) return;
      hasResultRef.current = false;
      setIsListening(true);

      // Watchdog: si onresult no dispara en WATCHDOG_MS, es un silent hang de WebKit
      clearWatchdog();
      watchdogRef.current = setTimeout(() => {
        if (sessionIdRef.current !== mySessionId) return;
        if (!hasResultRef.current) {
          console.warn("[VoiceRecognition] Silent hang detectado (WebKit bug). Abortando instancia envenenada...");
          // Incrementar sesión para invalidar esta instancia
          sessionIdRef.current += 1;
          const nextSession = sessionIdRef.current;
          const savedCallback = onResultCallbackRef.current;
          const savedBase = baseTextRef.current;
          const savedActiveId = activeId;

          destroyRecognition();

          // Reintento automático con instancia fresca tras 200ms
          setTimeout(() => {
            if (sessionIdRef.current !== nextSession) return;
            const fresh = buildRecognition(nextSession, savedCallback!);
            if (!fresh) return;
            recognitionRef.current = fresh;
            try { fresh.start(); } catch { /* ignorar */ }
          }, 200);
        }
      }, WATCHDOG_MS);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (sessionIdRef.current !== mySessionId) return;
      hasResultRef.current = true;
      clearWatchdog();

      let transcript = "";
      let hasFinal = false;

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) hasFinal = true;
      }

      const trimmed = transcript.trim();
      if (!trimmed) return;

      const output = baseTextRef.current
        ? `${baseTextRef.current} ${trimmed}`
        : trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

      if (onResultCallbackRef.current) {
        onResultCallbackRef.current(output, hasFinal);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (sessionIdRef.current !== mySessionId) return;
      clearWatchdog();
      console.warn("[VoiceRecognition] Error:", event.error);

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErrorMessage("Permiso de micrófono denegado. Habilítalo en el navegador.");
      } else if (event.error === "no-speech") {
        // Silencio detectado — no mostrar al usuario
      } else if (event.error !== "aborted") {
        setErrorMessage(`Error de voz: ${event.error}`);
      }

      sessionIdRef.current += 1;
      destroyRecognition();
      setIsListening(false);
      setActiveId(null);
    };

    recognition.onend = () => {
      if (sessionIdRef.current !== mySessionId) return;
      clearWatchdog();
      sessionIdRef.current += 1;
      destroyRecognition();
      setIsListening(false);
      setActiveId(null);
    };

    return recognition;
  }, [activeId, clearWatchdog, destroyRecognition]);

  const startListening = useCallback(
    (
      id: string | number,
      initialText: string = "",
      onResult: (text: string, isFinal: boolean) => void
    ) => {
      if (typeof window === "undefined") return;
      if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) {
        setErrorMessage("El dictado por voz no está soportado en este navegador.");
        return;
      }

      // Mismo botón ya escuchando → detener
      if (isListening && activeId === id) {
        stopListening();
        return;
      }

      // Destruir sesión anterior y crear nueva
      destroyRecognition();
      sessionIdRef.current += 1;
      const mySessionId = sessionIdRef.current;

      setErrorMessage(null);
      baseTextRef.current = initialText.trim();
      onResultCallbackRef.current = onResult;
      hasResultRef.current = false;
      setActiveId(id);

      const recognition = buildRecognition(mySessionId, onResult);
      if (!recognition) return;
      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (startErr: any) {
        if (startErr.name === "InvalidStateError") {
          // Audio hardware aún liberándose; reintentar en 200ms
          setTimeout(() => {
            if (sessionIdRef.current !== mySessionId) return;
            try {
              recognition.start();
            } catch {
              sessionIdRef.current += 1;
              destroyRecognition();
              setIsListening(false);
              setActiveId(null);
            }
          }, 200);
        } else {
          console.error("[VoiceRecognition] No se pudo iniciar:", startErr);
          setErrorMessage("No se pudo activar el micrófono.");
          sessionIdRef.current += 1;
          destroyRecognition();
          setIsListening(false);
          setActiveId(null);
        }
      }
    },
    [activeId, isListening, buildRecognition, destroyRecognition, stopListening]
  );

  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      destroyRecognition();
    };
  }, [destroyRecognition]);

  return {
    isSupported,
    isListening,
    activeId,
    errorMessage,
    startListening,
    stopListening,
  };
}
