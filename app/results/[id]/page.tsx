"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore, useHydrated } from "@/lib/store";
import { Container } from "@/components/layout/page-shell";
import { ResultsView } from "@/components/results/results-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const attempt = useStore((s) => s.history.find((h) => h.id === params.id));

  if (!hydrated) {
    return (
      <Container narrow>
        <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
          Loading results…
        </div>
      </Container>
    );
  }

  if (!attempt) {
    return (
      <Container narrow>
        <div className="grid min-h-[50vh] place-items-center gap-4 text-center">
          <div>
            <h1 className="text-xl font-bold">Attempt not found</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This run may have been cleared from history.
            </p>
            <Link
              href="/history"
              className={cn(buttonVariants(), "mt-4 h-10 px-4")}
            >
              Back to history
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container narrow>
      <ResultsView attempt={attempt} celebrate />
    </Container>
  );
}
