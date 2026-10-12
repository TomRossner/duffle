import { Button } from "@/components/ui/button";
import { loginWithGoogle } from "@/lib/actions/auth";

export function GoogleSignIn({ callbackUrl = "/trips" }: { callbackUrl?: string }) {
  return (
    <form action={loginWithGoogle} className="grid gap-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button type="submit" variant="outline" className="w-full">
        <img src="/Google.svg" alt="" className="size-4" />
        Continue with Google
      </Button>
    </form>
  );
}
