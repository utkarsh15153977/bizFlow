export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-live="polite" aria-busy="true">
      <div className="h-8 w-48 rounded-md bg-border" />
      <div className="h-4 w-72 rounded-md bg-border" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 rounded-xl bg-border" />
        <div className="h-28 rounded-xl bg-border" />
        <div className="h-28 rounded-xl bg-border" />
        <div className="h-28 rounded-xl bg-border" />
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
