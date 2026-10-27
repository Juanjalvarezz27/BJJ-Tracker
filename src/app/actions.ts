"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import type {
  PositionWithRelations,
  Technique,
  CategoryWithPositions,
  MediaLink,
  MediaPlatform,
} from "@/types/bjj";

// Obtiene las 4 categorias principales con sus posiciones
export async function getCategoriesAction(): Promise<CategoryWithPositions[]> {
  try {
    return await prisma.category.findMany({
      include: {
        positions: {
          include: {
            category: true,
            techniques: {
              orderBy: { sortOrder: "asc" },
            },
            mediaLinks: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return [];
  }
}

// Obtiene o inicializa las posiciones base de Jiu-Jitsu
export async function getPositionsAction(): Promise<PositionWithRelations[]> {
  try {
    const existing = await prisma.position.findMany({
      include: {
        category: true,
        techniques: {
          orderBy: { sortOrder: "asc" },
        },
        mediaLinks: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    if (existing.length > 0) {
      return existing;
    }

    // Inicializacion con las 4 categorias principales
    const mainCategories = [
      { name: "Posiciones", sortOrder: 1 },
      { name: "Guardias", sortOrder: 2 },
      { name: "Derribos", sortOrder: 3 },
      { name: "Pases", sortOrder: 4 },
    ];

    const catMap: Record<string, string> = {};
    for (const cat of mainCategories) {
      const created = await prisma.category.create({ data: cat });
      catMap[cat.name] = created.id;
    }

    // Inicializacion con las posiciones base asignadas a su categoria padre
    const initialPositions = [
      {
        title: "Montada",
        subtitle: "Full Mount / Tate Shiho Gatame",
        description: "Control dominante a horcajadas sobre el torso del rival. Otorga máxima ventaja gravitatoria para finalizaciones y golpes.",
        imageUrl: "/assets/Montada.png",
        categoryId: catMap["Posiciones"],
        sortOrder: 1,
        notes: "Mantener caderas bajas y rodillas altas bajo las axilas del rival.",
        techniques: {
          create: [
            {
              title: "Barra de Brazo (Armbar)",
              sortOrder: 1,
              steps: [
                "Subir a montada alta colocando tus rodillas en las axilas del oponente.",
                "Atrapar un brazo cruzado contra tu pecho con ambas manos.",
                "Apoyar una mano en el tatami junto a su cabeza y rotar tu cadera.",
                "Pasar la pierna sobre su cabeza, juntar rodillas con fuerza.",
                "Mantener el pulgar del rival hacia el techo y elevar la cadera suavemente.",
              ],
            },
            {
              title: "Estrangulamiento Ezequiel",
              sortOrder: 2,
              steps: [
                "Deslizar cuatro dedos de una mano dentro de la manga de tu otro brazo.",
                "Pasar el antebrazo libre por detrás de la nuca del rival.",
                "Cruzar la otra mano sobre su tráquea aplicando presión con la muñeca tipo guillotina.",
                "Cerrar la tijera apretando ambos codos hacia tu pecho.",
              ],
            },
            {
              title: "Americana / Keylock",
              sortOrder: 3,
              steps: [
                "Fijar el codo del oponente a 90 grados contra la lona con tu palma sobre su muñeca.",
                "Deslizar tu otro brazo por debajo de su tríceps y capturar tu propia muñeca.",
                "Arrastrar el dorso de su mano hacia abajo mientras elevas el codo suavemente.",
              ],
            },
          ],
        },
      },
      {
        title: "Control de Espalda",
        subtitle: "Back Control / Back Mount",
        description: "La posición de mayor puntuación y amenaza de sumisión en BJJ. Control con ganchos o triángulo de cuerpo y agarre seatbelt.",
        imageUrl: "/assets/Controldela espalda.png",
        categoryId: catMap["Posiciones"],
        sortOrder: 2,
        notes: "Mantener siempre tu cabeza pegada a su oreja del lado que pasa el brazo sobre su hombro.",
        techniques: {
          create: [
            {
              title: "Mata-León (Rear Naked Choke)",
              sortOrder: 1,
              steps: [
                "Deslizar el brazo de ataque profundo por debajo de la barbilla del rival.",
                "Asegurar el bíceps de tu brazo opuesto con la mano que estrangula.",
                "Esconder la mano de soporte detrás de la nuca del rival.",
                "Inhalar profundo, juntar codos y expandir el pecho sin arquear la espalda.",
              ],
            },
            {
              title: "Bow and Arrow Choke",
              sortOrder: 2,
              steps: [
                "Abrir la solapa del kimono del rival y meter un agarre profundo de pulgar dentro.",
                "Con la mano secundaria agarrar el pantalón del rival a la altura de la rodilla exterior.",
                "Pasar tu pierna sobre su hombro para inmovilizar su torso.",
                "Arquear tu cuerpo extendiendo la pierna y traccionando la solapa como un arco.",
              ],
            },
          ],
        },
      },
      {
        title: "Guardia Cerrada",
        subtitle: "Closed Guard / Do Jime",
        description: "El fundamento defensivo y de contragolpe de BJJ. Permite romper postura, atacar sumisiones a brazos y cuello, o ejecutar raspados.",
        imageUrl: "/assets/Guaridacerrada.png",
        categoryId: catMap["Guardias"],
        sortOrder: 1,
        notes: "Usa tus rodillas para jalar constantemente al rival hacia ti y romper su base.",
        techniques: {
          create: [
            {
              title: "Triángulo (Sankaku Jime)",
              sortOrder: 1,
              steps: [
                "Controlar una muñeca del rival y empujarla hacia su abdomen mientras jalas el otro brazo.",
                "Abrir la guardia y lanzar las piernas rápidamente sobre su nuca, atrapando un brazo dentro.",
                "Cruzar el brazo atrapado del oponente hacia tu costado opuesto.",
                "Tomar tu propia espinilla con la mano opuesta para asegurar el ángulo.",
                "Cerrar la corva de tu otra pierna sobre tu empeine formando el candado y apretar rodillas.",
              ],
            },
            {
              title: "Raspado de Tijera (Scissor Sweep)",
              sortOrder: 2,
              steps: [
                "Abrir guardia colocándote sobre tu cadera lateral, manteniendo control de solapa y manga.",
                "Cruzar la espinilla superior sobre el pecho del rival.",
                "Colocar la pierna inferior pegada al tatami detrás de su rodilla de apoyo.",
                "Tirar de la manga hacia ti mientras pateas en tijera para derribarlo y montar.",
              ],
            },
          ],
        },
      },
      {
        title: "Control Lateral",
        subtitle: "Side Control / 100 Kilos / Yoko Shiho Gatame",
        description: "Posición perpendicular de dominación con pecho sobre esternón, bloqueando giros y salidas de cadera.",
        imageUrl: "/assets/Controllateral.png",
        categoryId: catMap["Posiciones"],
        sortOrder: 3,
        notes: "Controlar la cabeza con crossface pesado para obligar al rival a mirar en dirección contraria.",
        techniques: {
          create: [
            {
              title: "Kimura desde Lateral",
              sortOrder: 1,
              steps: [
                "Aislar la muñeca del rival cuando intente empujar tu cadera.",
                "Pasar tu brazo por encima y rodear su tríceps capturando tu propia muñeca en figura de 4.",
                "Dar un paso sobre su cabeza para neutralizar su puente.",
                "Girar los hombros y llevar la mano en arco hacia su espalda alta.",
              ],
            },
          ],
        },
      },
    ];

    for (const item of initialPositions) {
      await prisma.position.create({
        data: item,
      });
    }

    return await prisma.position.findMany({
      include: {
        category: true,
        techniques: {
          orderBy: { sortOrder: "asc" },
        },
        mediaLinks: true,
      },
      orderBy: { sortOrder: "asc" },
    });
  } catch (error) {
    console.error("Error al obtener o sembrar posiciones:", error);
    return [];
  }
}

// Agrega una nueva tecnica o movimiento a una posicion especifica
export async function createTechniqueAction(data: {
  positionId: string;
  title: string;
  steps: string[];
}): Promise<{ success: boolean; technique?: Technique; error?: string }> {
  try {
    const count = await prisma.technique.count({
      where: { positionId: data.positionId },
    });

    const newTechnique = await prisma.technique.create({
      data: {
        positionId: data.positionId,
        title: data.title.trim(),
        steps: data.steps.filter((s) => s.trim().length > 0),
        sortOrder: count + 1,
      },
    });

    revalidatePath("/");
    return { success: true, technique: newTechnique };
  } catch (error: unknown) {
    console.error("Error al crear técnica:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al crear técnica";
    return { success: false, error: message };
  }
}

// Actualiza los datos de una técnica existente (título y pasos de ejecución)
export async function updateTechniqueAction(data: {
  id: string;
  title?: string;
  steps: string[];
}): Promise<{ success: boolean; technique?: Technique; error?: string }> {
  try {
    const updated = await prisma.technique.update({
      where: { id: data.id },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        steps: data.steps.map((s) => s.trim()).filter((s) => s.length > 0),
      },
    });

    revalidatePath("/");
    return { success: true, technique: updated };
  } catch (error: unknown) {
    console.error("Error al actualizar técnica:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar técnica";
    return { success: false, error: message };
  }
}

// Sube un archivo de imagen para una posicion
export async function uploadPositionImageAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "No se seleccionó ningún archivo de imagen" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Asegurar directorio public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Sanitizar extension y crear nombre único
    const rawExt = path.extname(file.name) || ".png";
    const ext = rawExt.replace(/[^a-zA-Z0-9.]/g, "") || ".png";
    const filename = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    return { success: true, url: `/uploads/${filename}` };
  } catch (error: unknown) {
    console.error("Error al subir archivo de imagen:", error);
    const message = error instanceof Error ? error.message : "Error al guardar la imagen";
    return { success: false, error: message };
  }
}

// Agrega una nueva posicion personalizada asignada opcionalmente a una categoria padre
export async function createPositionAction(data: {
  title: string;
  subtitle?: string;
  description?: string;
  categoryId?: string | null;
  imageUrl?: string | null;
}): Promise<{ success: boolean; position?: PositionWithRelations; error?: string }> {
  try {
    const count = await prisma.position.count();
    const newPosition = await prisma.position.create({
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        description: data.description?.trim() || null,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl?.trim() || null,
        sortOrder: count + 1,
      },
      include: {
        category: true,
        techniques: true,
        mediaLinks: true,
      },
    });

    revalidatePath("/");
    return { success: true, position: newPosition };
  } catch (error: unknown) {
    console.error("Error al crear posición:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al crear posición";
    return { success: false, error: message };
  }
}

// Elimina una tecnica
export async function deleteTechniqueAction(techniqueId: string): Promise<{ success: boolean }> {
  try {
    await prisma.technique.delete({
      where: { id: techniqueId },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar técnica:", error);
    return { success: false };
  }
}

// Actualiza las notas personales de una posicion
export async function updatePositionNotesAction(
  positionId: string,
  notes: string
): Promise<{ success: boolean }> {
  try {
    await prisma.position.update({
      where: { id: positionId },
      data: { notes },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar notas:", error);
    return { success: false };
  }
}

// Actualiza una posicion existente (titulo, categoria, descripcion, imagen)
export async function updatePositionAction(data: {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
}): Promise<{ success: boolean; position?: PositionWithRelations; error?: string }> {
  try {
    const updated = await prisma.position.update({
      where: { id: data.id },
      data: {
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || null,
        description: data.description?.trim() || null,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      },
      include: {
        category: true,
        techniques: { orderBy: { sortOrder: "asc" } },
        mediaLinks: true,
      },
    });

    revalidatePath("/");
    return { success: true, position: updated };
  } catch (error: unknown) {
    console.error("Error al actualizar posición:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar posición";
    return { success: false, error: message };
  }
}

// Elimina una posicion y sus tecnicas asociadas en cascada
export async function deletePositionAction(
  positionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.position.delete({
      where: { id: positionId },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar posición:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar posición";
    return { success: false, error: message };
  }
}

// Crea un enlace de video o tutorial (YouTube o TikTok) para una posicion o tecnica
export async function createMediaLinkAction(data: {
  positionId?: string;
  techniqueId?: string;
  url: string;
  platform?: MediaPlatform;
}): Promise<{ success: boolean; mediaLink?: MediaLink; error?: string }> {
  try {
    const isTikTok = data.url.toLowerCase().includes("tiktok.com");
    const platform: MediaPlatform = data.platform || (isTikTok ? "TIKTOK" : "YOUTUBE");

    const created = await prisma.mediaLink.create({
      data: {
        url: data.url.trim(),
        platform,
        positionId: data.positionId || null,
        techniqueId: data.techniqueId || null,
      },
    });

    revalidatePath("/");
    return { success: true, mediaLink: created };
  } catch (error: unknown) {
    console.error("Error al crear enlace multimedia:", error);
    const message = error instanceof Error ? error.message : "Error al guardar el enlace";
    return { success: false, error: message };
  }
}

// Elimina un enlace multimedia
export async function deleteMediaLinkAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.mediaLink.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error al eliminar enlace multimedia:", error);
    const message = error instanceof Error ? error.message : "Error al eliminar enlace";
    return { success: false, error: message };
  }
}
