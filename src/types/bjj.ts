import type {
  Category,
  Position,
  Technique,
  MediaLink,
  TrainingActivity,
  MediaPlatform,
} from "@prisma/client";

export type {
  Category,
  Position,
  Technique,
  MediaLink,
  TrainingActivity,
  MediaPlatform,
};

// Modelos relacionales compuestos inferidos de Prisma
export type PositionWithRelations = Position & {
  category?: Category | null;
  techniques: Technique[];
  mediaLinks: MediaLink[];
  _count?: {
    techniques: number;
  };
};

export type CategoryWithPositions = Category & {
  positions: PositionWithRelations[];
};

export type TechniqueWithRelations = Technique & {
  position?: Position;
  mediaLinks: MediaLink[];
  trainingActivities: TrainingActivity[];
};

// Navegacion inferior de 2 modulos (Posiciones y Mis Tecnicas)
export type AppTab = "posiciones" | "tecnicas";

// Navegacion global previa
export type GlobalTab = "diario" | "tecnicas" | "secuencias" | "objetivos" | "perfil";

// Control segmentado superior estilo iOS
export type SegmentedView = "biblioteca" | "mis_movimientos" | "probar_tarde";

// Resumen mensual para graficos de frecuencia
export interface MonthlyActivitySummary {
  month: string;
  count: number;
}
