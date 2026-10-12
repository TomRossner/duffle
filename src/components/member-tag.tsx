import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

export function MemberTag({
  userId,
  name,
  imageKey,
  className,
}: {
  userId: string;
  name: string;
  imageKey?: string | null;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Avatar name={name} userId={userId} imageKey={imageKey} />
      <span>{name}</span>
    </span>
  );
}
