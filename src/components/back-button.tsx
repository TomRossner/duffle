"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const history = useRef<string[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const stack = history.current;
    if (stack[stack.length - 1] === pathname) {
      setCanGoBack(stack.length > 1);
      return;
    }
    if (stack.length > 1 && stack[stack.length - 2] === pathname) stack.pop();
    else stack.push(pathname);
    setCanGoBack(stack.length > 1);
  }, [pathname]);

  if (!canGoBack) return null;

  return (
    <Button type="button" variant="ghost" size="sm" className="-ml-2.5 mb-4" onClick={() => router.back()}>
      <ArrowLeft />
      Back
    </Button>
  );
}
