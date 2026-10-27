# BJJ Notes

Aplicación web para el registro, estudio y seguimiento de técnicas, posiciones y sesiones de entrenamiento de Brazilian Jiu-Jitsu.

## Tecnologías

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com)
- **Base de Datos:** PostgreSQL (Neon)

## Primeros Pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copia el archivo `.env.example` a `.env` y define tu cadena de conexión:
```bash
cp .env.example .env
```

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con Turbopack.
- `npm run build`: Genera la versión optimizada para producción.
- `npm run start`: Inicia el servidor en modo producción.
- `npm run lint`: Ejecuta el análisis estático de código con ESLint.
