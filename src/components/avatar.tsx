import { StoredImage } from "@/components/stored-image";
import { memberColor } from "@/lib/member-color";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-20 text-2xl",
} as const;

export function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return letters || "?";
}

export function Avatar({
  name,
  userId,
  imageKey,
  size = "sm",
  className,
}: {
  name: string;
  userId?: string;
  imageKey?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const frame = cn("inline-flex shrink-0 items-center justify-center rounded-full", sizes[size], className);
  if (imageKey) {
    return <StoredImage src={`/api/files/${imageKey}`} alt="" className={cn(frame, "object-cover")} />;
  }
  return (
    <span
      className={cn(
        "font-medium text-white",
        frame,
        userId ? memberColor(userId) : "bg-muted text-muted-foreground",
      )}
      aria-hidden
    ><span className="leading-none [text-box:trim-both_cap_alphabetic]">{initials(name)}</span></span>
  );
}
