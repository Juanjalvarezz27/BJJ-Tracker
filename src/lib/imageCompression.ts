/**
 * Utilidad de compresión y optimización de imágenes en el cliente (Browser).
 * Reduce drásticamente el peso de imágenes tomadas con cámaras de smartphones (5MB - 15MB)
 * a un tamaño ultraligero (~30KB - 80KB) mediante reescalado proporcional y codificación WebP/JPEG,
 * evitando cuellos de botella en la red, saturación en Vercel y sobrecostos en Neon PostgreSQL.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0 (0.70 ofrece compresión máxima con alta nitidez)
}

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Normaliza y sanea URLs de imagen para su renderizado seguro en Next.js.
 * Evita errores en URLs Base64 o Blob y escapa espacios en rutas de assets locales.
 */
export function safeImageSrc(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  try {
    return encodeURI(trimmed);
  } catch {
    return trimmed;
  }
}

/**
 * Determina si la URL es una imagen embebida en memoria (Data URL o Blob)
 */
export function isDataOrBlob(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("data:") || trimmed.startsWith("blob:");
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  // Verificación amplia de imagen para cámaras móviles (incluyendo HEIC / formatos sin mime explícito)
  const isImageFile =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|heic|heif|bmp|svg)$/i.test(file.name);

  // Si no es imagen o no estamos en navegador, retornar el archivo original
  if (typeof window === "undefined" || !isImageFile) {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
    };
  }

  const {
    maxWidth = 960,
    maxHeight = 960,
    quality = 0.7,
  } = options;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        // Cálculo de dimensiones manteniendo relación de aspecto
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Crear canvas optimizado
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) {
          throw new Error("No se pudo obtener el contexto 2D del canvas");
        }

        // Suavizado de imagen de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Intentar compresión moderna en WebP (máximo ahorro de bytes)
        const mimeType = "image/webp";
        const fallbackMime = "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback directo a JPEG si WebP no fue soportado
              canvas.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    fileToDataUrl(file).then((dataUrl) => {
                      resolve({
                        file,
                        dataUrl,
                        originalSize: file.size,
                        compressedSize: file.size,
                        compressionRatio: 0,
                      });
                    });
                    return;
                  }
                  finalizeResult(fallbackBlob, fallbackMime);
                },
                fallbackMime,
                quality
              );
              return;
            }

            finalizeResult(blob, mimeType);
          },
          mimeType,
          quality
        );

        function finalizeResult(blob: Blob, actualMime: string) {
          const ext = actualMime === "image/webp" ? ".webp" : ".jpg";
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${baseName}${ext}`, {
            type: actualMime,
            lastModified: Date.now(),
          });

          const dataUrl = canvas.toDataURL(actualMime, quality);
          const originalSize = file.size;
          const compressedSize = blob.size;
          const compressionRatio = Math.round(
            ((originalSize - compressedSize) / originalSize) * 100
          );

          if (process.env.NODE_ENV !== "production") {
            console.log(
              `[ImageCompressor] ${(originalSize / 1024).toFixed(1)} KB -> ${(compressedSize / 1024).toFixed(1)} KB (-${compressionRatio}%)`
            );
          }

          resolve({
            file: compressedFile,
            dataUrl,
            originalSize,
            compressedSize,
            compressionRatio,
          });
        }
      } catch (err) {
        console.error("Error al comprimir imagen en canvas:", err);
        fileToDataUrl(file).then((dataUrl) => {
          resolve({
            file,
            dataUrl,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
          });
        });
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.error("Error al cargar imagen para compresión:", err);
      fileToDataUrl(file).then((dataUrl) => {
        resolve({
          file,
          dataUrl,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
        });
      });
    };

    img.src = objectUrl;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  });
}
