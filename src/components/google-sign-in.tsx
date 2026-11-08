import { Button } from "@/components/ui/button";
import { getT } from "@/i18n/server";
import { loginWithGoogle } from "@/lib/actions/auth";

export async function GoogleSignIn({ callbackUrl = "/trips" }: { callbackUrl?: string }) {
  const t = await getT("auth");
  return (
    <form action={loginWithGoogle} className="grid gap-3">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Button type="submit" variant="outline" className="w-full">
        <img src="/Google.svg" alt="" className="size-4" />
        {t("continueGoogle")}
      </Button>
    </form>
  );
}
