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

export function useVoiceRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Referencias mutables para evitar cierres obsoletos en callbacks de audio
  const recognitionRef = useRef<any>(null);
  const onResultCallbackRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const baseTextRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  // Limpieza total y desvinculación de eventos de la instancia actual
  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      // Desvincular eventos para evitar que callbacks asíncronos pisen nuevo estado
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // Ignorar si ya estaba cerrado
      }
    }
  }, []);

  // Detiene el reconocimiento actual de forma limpia
  const stopListening = useCallback(() => {
    cleanupRecognition();
    setIsListening(false);
    setActiveId(null);
  }, [cleanupRecognition]);

  // Inicia la captura de voz para un campo de paso específico
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

      // Si se toca el mismo botón que ya está escuchando, se detiene
      if (recognitionRef.current && activeId === id) {
        stopListening();
        return;
      }

      // Si había otra sesión activa o previa, limpiarla por completo
      cleanupRecognition();

      setErrorMessage(null);
      baseTextRef.current = initialText.trim();
      onResultCallbackRef.current = onResult;
      setActiveId(id);

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        // Detección de WebKit / iOS para evitar bloqueo del audio session
        const isIOS =
          typeof navigator !== "undefined" &&
          (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

        // En iOS Safari continuous=true bloquea el hardware; continuous=false es la forma nativa
        recognition.continuous = !isIOS;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // Dialecto en español basado en navegador o es-ES por defecto
        const userLang = navigator.language || "es-ES";
        recognition.lang = userLang.startsWith("es") ? userLang : "es-ES";

        recognition.onstart = () => {
          if (recognitionRef.current !== recognition) return;
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          if (recognitionRef.current !== recognition) return;

          let sessionTranscript = "";
          let hasFinal = false;

          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            sessionTranscript += item[0].transcript;
            if (item.isFinal) {
              hasFinal = true;
            }
          }

          const trimmed = sessionTranscript.trim();
          if (!trimmed) return;

          let combinedText = "";
          if (baseTextRef.current) {
            const endsWithPunctuation = /[.!?]\s*$/.test(baseTextRef.current);
            const spokenFormatted = endsWithPunctuation
              ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
              : trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
            combinedText = `${baseTextRef.current} ${spokenFormatted}`;
          } else {
            combinedText = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
          }

          if (onResultCallbackRef.current) {
            onResultCallbackRef.current(combinedText, hasFinal);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (recognitionRef.current !== recognition) return;
          console.warn("[VoiceRecognition] Error de audio:", event.error);

          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setErrorMessage("Permiso de micrófono denegado. Permite el acceso en el navegador.");
          } else if (event.error === "no-speech") {
            // Silencio detectado, sin error invasivo
          } else if (event.error !== "aborted") {
            setErrorMessage(`Aviso de voz: ${event.error}`);
          }

          cleanupRecognition();
          setIsListening(false);
          setActiveId(null);
        };

        recognition.onend = () => {
          if (recognitionRef.current !== recognition) return;
          cleanupRecognition();
          setIsListening(false);
          setActiveId(null);
        };

        // En WebKit/Safari, iniciar de forma segura con fallback para InvalidStateError
        try {
          recognition.start();
        } catch (startErr: any) {
          if (startErr.name === "InvalidStateError") {
            // El hardware de audio anterior aún estaba liberando; reintentar tras micro-espera
            setTimeout(() => {
              try {
                if (recognitionRef.current === recognition) {
                  recognition.start();
                }
              } catch (retryErr) {
                console.error("[VoiceRecognition] Reintento fallido:", retryErr);
                cleanupRecognition();
                setIsListening(false);
                setActiveId(null);
              }
            }, 100);
          } else {
            throw startErr;
          }
        }
      } catch (err) {
        console.error("[VoiceRecognition] Error al activar micrófono:", err);
        setErrorMessage("No se pudo activar el micrófono.");
        cleanupRecognition();
        setIsListening(false);
        setActiveId(null);
      }
    },
    [activeId, cleanupRecognition, stopListening]
  );

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  return {
    isSupported,
    isListening,
    activeId,
    errorMessage,
    startListening,
    stopListening,
  };
}
