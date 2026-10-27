import { Suspense } from "react";
import { getPositionsAction, getCategoriesAction } from "@/app/actions";
import { MainAppContainer } from "@/components/MainAppContainer";

async function PositionsLoader() {
  const [positions, categories] = await Promise.all([
    getPositionsAction(),
    getCategoriesAction(),
  ]);
  return <MainAppContainer initialPositions={positions} initialCategories={categories} />;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-4">
          <div className="h-8 w-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
          </div>
        </div>
      }
    >
      <PositionsLoader />
    </Suspense>
  );
}
