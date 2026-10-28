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

// Detecta iOS/Safari una sola vez (no dentro del hook para evitar recálculos)
function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function useVoiceRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultCallbackRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const baseTextRef = useRef<string>("");

  // sessionIdRef: identifica cada sesión de forma única para evitar race conditions
  // NO usamos la instancia del objeto como guard (causa el bug de resultados bloqueados)
  const sessionIdRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SR));
    }
  }, []);

  // Limpia la instancia anterior sin tocar los event listeners (para no bloquear resultados en vuelo)
  const destroyRecognition = useCallback(() => {
    if (recognitionRef.current) {
      const old = recognitionRef.current;
      recognitionRef.current = null;
      // Desvincular eventos ANTES de abortar para que el onend viejo no ejecute nada
      old.onstart = null;
      old.onresult = null;
      old.onerror = null;
      old.onend = null;
      try { old.abort(); } catch { /* ya cerrado */ }
    }
  }, []);

  const stopListening = useCallback(() => {
    // Invalidar la sesión activa incrementando el contador
    sessionIdRef.current += 1;
    destroyRecognition();
    setIsListening(false);
    setActiveId(null);
  }, [destroyRecognition]);

  const startListening = useCallback(
    (
      id: string | number,
      initialText: string = "",
      onResult: (text: string, isFinal: boolean) => void
    ) => {
      if (typeof window === "undefined") return;

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMessage("El dictado por voz no está soportado en este navegador.");
        return;
      }

      // Si se toca el mismo botón que ya escucha, detener
      if (isListening && activeId === id) {
        stopListening();
        return;
      }

      // Destruir cualquier sesión previa
      destroyRecognition();

      // Incrementar el sessionId; todos los callbacks de esta sesión capturan ESTE valor
      sessionIdRef.current += 1;
      const mySessionId = sessionIdRef.current;

      setErrorMessage(null);
      baseTextRef.current = initialText.trim();
      onResultCallbackRef.current = onResult;
      setActiveId(id);

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        const isIOS = detectIOS();

        // iOS Safari: continuous=true bloquea el audio session tras la primera locución
        recognition.continuous = !isIOS;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const userLang = navigator.language || "es-ES";
        recognition.lang = userLang.startsWith("es") ? userLang : "es-ES";

        recognition.onstart = () => {
          // Ignorar si la sesión ya fue reemplazada
          if (sessionIdRef.current !== mySessionId) return;
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          // Guard por sessionId, NO por instancia (la instancia puede ser null en onend antes de onresult)
          if (sessionIdRef.current !== mySessionId) return;

          let transcript = "";
          let hasFinal = false;

          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) hasFinal = true;
          }

          const trimmed = transcript.trim();
          if (!trimmed) return;

          let output: string;
          if (baseTextRef.current) {
            // Combinar texto previo con lo dictado
            output = `${baseTextRef.current} ${trimmed}`;
          } else {
            // Primera letra en mayúscula si es el inicio del paso
            output = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          }

          if (onResultCallbackRef.current) {
            onResultCallbackRef.current(output, hasFinal);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (sessionIdRef.current !== mySessionId) return;
          console.warn("[VoiceRecognition] Error:", event.error);

          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setErrorMessage("Permiso de micrófono denegado. Habilítalo en el navegador.");
          } else if (event.error === "no-speech") {
            // Silencio detectado — no mostrar error al usuario
          } else if (event.error !== "aborted") {
            setErrorMessage(`Error de voz: ${event.error}`);
          }

          // Invalidar la sesión antes de limpiar para que onend posterior no haga nada
          sessionIdRef.current += 1;
          destroyRecognition();
          setIsListening(false);
          setActiveId(null);
        };

        recognition.onend = () => {
          // Si ya fue invalidada (por stopListening u onerror), ignorar
          if (sessionIdRef.current !== mySessionId) return;
          // Sesión terminó naturalmente
          sessionIdRef.current += 1;
          destroyRecognition();
          setIsListening(false);
          setActiveId(null);
        };

        // Iniciar con fallback para InvalidStateError en Safari/iOS
        try {
          recognition.start();
        } catch (startErr: any) {
          if (startErr.name === "InvalidStateError") {
            // Audio session aún liberándose; reintentar en 150ms
            setTimeout(() => {
              if (sessionIdRef.current !== mySessionId) return;
              try {
                recognition.start();
              } catch (retryErr) {
                console.error("[VoiceRecognition] Reintento fallido:", retryErr);
                if (sessionIdRef.current === mySessionId) {
                  sessionIdRef.current += 1;
                  destroyRecognition();
                  setIsListening(false);
                  setActiveId(null);
                }
              }
            }, 150);
          } else {
            throw startErr;
          }
        }
      } catch (err) {
        console.error("[VoiceRecognition] No se pudo iniciar:", err);
        setErrorMessage("No se pudo activar el micrófono.");
        sessionIdRef.current += 1;
        destroyRecognition();
        setIsListening(false);
        setActiveId(null);
      }
    },
    [activeId, isListening, destroyRecognition, stopListening]
  );

  // Limpieza al desmontar el componente
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
