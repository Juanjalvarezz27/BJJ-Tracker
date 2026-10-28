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

  // Referencias mutables para evitar cierres obsoletos en los callbacks de audio
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

  // Detiene el reconocimiento actual de forma limpia
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar si ya estaba inactivo
      }
    }
    setIsListening(false);
    setActiveId(null);
  }, []);

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
      if (isListening && activeId === id) {
        stopListening();
        return;
      }

      // Si había otra sesión activa, abortarla primero
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
      }

      setErrorMessage(null);
      baseTextRef.current = initialText.trim();
      onResultCallbackRef.current = onResult;
      setActiveId(id);

      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // Dialecto en español basado en el navegador del usuario o es-ES por defecto
        const userLang = navigator.language || "es-ES";
        recognition.lang = userLang.startsWith("es") ? userLang : "es-ES";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let fullSessionTranscript = "";
          let hasFinal = false;

          for (let i = 0; i < event.results.length; i++) {
            const item = event.results[i];
            fullSessionTranscript += item[0].transcript;
            if (item.isFinal) {
              hasFinal = true;
            }
          }

          const trimmed = fullSessionTranscript.trim();
          if (!trimmed) return;

          // Primera letra en mayúscula para mantener redacción limpia
          const formattedSpoken =
            trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

          let combinedText = formattedSpoken;
          if (baseTextRef.current) {
            combinedText = `${baseTextRef.current} ${formattedSpoken}`;
          }

          if (onResultCallbackRef.current) {
            onResultCallbackRef.current(combinedText, hasFinal);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn("[VoiceRecognition] Error de audio:", event.error);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setErrorMessage("Permiso de micrófono denegado. Permite el acceso en la barra del navegador.");
          } else if (event.error === "no-speech") {
            // Silencio detectado, sin error para el usuario
          } else {
            setErrorMessage(`Aviso de voz: ${event.error}`);
          }
          setIsListening(false);
          setActiveId(null);
        };

        recognition.onend = () => {
          setIsListening(false);
          setActiveId(null);
        };

        // Invocación síncrona requerida por iOS Safari dentro del evento de click
        recognition.start();
      } catch (err) {
        console.error("[VoiceRecognition] Error al activar micrófono:", err);
        setErrorMessage("No se pudo activar el micrófono.");
        setIsListening(false);
        setActiveId(null);
      }
    },
    [activeId, isListening, stopListening]
  );

  // Limpieza al desmontar componentes
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorar
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    activeId,
    errorMessage,
    startListening,
    stopListening,
  };
}
