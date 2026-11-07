import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignOutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button type="submit" variant="outline" size="sm" className={cn(
          "gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/40",
          className,
        )}>
        <LogOut className="size-4" />
        {label}
      </Button>
    </form>
  );
}
