"use client";

import React from "react";
import type { MediaLink } from "@/types/bjj";

interface MediaEmbedProps {
  mediaLink: MediaLink;
}

export function MediaEmbed({ mediaLink }: MediaEmbedProps) {
  // Extrae el ID de video para URLs de YouTube (incluye shorts y enlaces acortados)
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtu.be")) {
        return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
      }
      if (parsed.pathname.includes("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("?")[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
      }
      const v = parsed.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      if (parsed.pathname.includes("/embed/")) return url;
    } catch {
      // Retorna URL original si el parseo falla
    }
    return url;
  };

  // Extrae el ID de video de TikTok
  const getTikTokEmbedUrl = (url: string) => {
    const match = url.match(/\/video\/(\d+)/);
    if (match && match[1]) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    return url;
  };

  if (mediaLink.platform === "YOUTUBE") {
    const embedUrl = getYouTubeEmbedUrl(mediaLink.url);
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-black aspect-video shadow-sm">
        <iframe
          src={embedUrl}
          title="Demostración técnica en YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  if (mediaLink.platform === "TIKTOK") {
    const embedUrl = getTikTokEmbedUrl(mediaLink.url);
    return (
      <div className="w-full flex justify-center py-2">
        <div className="w-full max-w-[340px] h-[580px] overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.08] shadow-sm bg-black">
          <iframe
            src={embedUrl}
            title="Clip técnico en TikTok"
            allow="fullscreen"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <a
      href={mediaLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl"
    >
      Ver recurso externo
    </a>
  );
}

export default MediaEmbed;
