export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-foreground/60">
        <span className="h-2 w-2 animate-pulse rounded-full bg-foreground/40" />
        Loading BizFlow…
      </div>
    </div>
  );
}
