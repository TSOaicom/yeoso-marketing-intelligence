import { cn } from "@/lib/utils";

export function GlassPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-background/70 backdrop-blur-xl shadow-[0_30px_120px_-40px_rgba(0,0,0,0.55)]",
        className,
      )}
      {...props}
    />
  );
}
