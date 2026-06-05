// Skeleton placeholders that mirror ItemCard's layout, shown while items load.

const SKELETON_COUNT = 8;

function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-charcoal bg-obsidian p-4">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="h-9 w-9 shrink-0 rounded-[9px] bg-ash" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3 w-2/3 rounded bg-ash" />
          <div className="h-2.5 w-1/2 rounded bg-ash" />
        </div>
      </div>
      <div className="h-3 w-20 rounded bg-ash" />
    </div>
  );
}

export function ItemGridSkeleton() {
  return (
    <div
      aria-hidden
      className="grid animate-pulse grid-cols-1 gap-3.5 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
