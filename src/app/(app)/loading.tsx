export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-44 animate-pulse rounded-lg bg-surface-raised" />
      <div className="h-28 animate-pulse rounded-xl bg-surface" />
      <div className="h-48 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}
