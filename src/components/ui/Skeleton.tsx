import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-zinc-800/50 animate-pulse rounded-md",
        className
      )}
    />
  );
}

