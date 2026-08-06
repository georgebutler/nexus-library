"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotFoundActions() {
  const router = useRouter();

  const handleBack = () => {
    const referrer = document.referrer;

    if (referrer) {
      try {
        if (new URL(referrer).origin === window.location.origin) {
          router.back();
          return;
        }
      } catch {}
    }

    router.push("/");
  };

  return (
    <div className="not-found-actions">
      <a
        className={cn(buttonVariants(), "not-found-actions__primary")}
        href="/"
      >
        Return to Library
      </a>
      <Button onClick={handleBack} variant="outline">
        <ArrowLeft aria-hidden="true" data-icon="inline-start" />
        Go back
      </Button>
    </div>
  );
}
