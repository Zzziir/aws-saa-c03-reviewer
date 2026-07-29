"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BookOpen,
  BarChart3,
  History,
  Bookmark,
  Library,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/history", label: "History", icon: History },
  { href: "/flagged", label: "Flagged", icon: Bookmark },
  { href: "/services", label: "Services", icon: Library },
];

// Bottom bar shows the five most-used destinations on small screens.
const BOTTOM = ["/", "/practice", "/analytics", "/history", "/services"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6 shrink-0"
      aria-hidden
      fill="none"
    >
      <path
        d="M12 2 3 6.5v11L12 22l9-4.5v-11L12 2Z"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m3 6.5 9 4.5 9-4.5M12 11v11"
        stroke="var(--brand)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}

// Auth screens render standalone, without the app nav.
const CHROMELESS = ["/session", "/login", "/signup", "/auth"];

export function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  if (CHROMELESS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  async function signOut() {
    setSigningOut(true);
    await getSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-ink/95 text-white backdrop-blur supports-[backdrop-filter]:bg-ink/85">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display text-[15px] font-bold tracking-tight transition-transform active:scale-[0.97]"
          >
            <BrandMark />
            <span className="hidden sm:inline">SAA-C03 Reviewer</span>
            <span className="font-mono text-[11px] font-medium tracking-[0.12em] text-white/40">
              by Lance Candelaria
            </span>
          </Link>
          <nav className="ml-auto hidden items-center gap-0.5 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors duration-150",
                    active
                      ? "bg-brand text-ink"
                      : "text-white/65 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-0.5 md:ml-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmOpen(true)}
              aria-label="Sign out"
              className="text-white/65 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {NAV.filter((n) => BOTTOM.includes(n.href)).map(
            ({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors",
                    active ? "text-brand-deep" : "text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-[22px]", active && "fill-brand/15")}
                  />
                  {label}
                </Link>
              );
            },
          )}
        </div>
      </nav>

      {/* Sign-out confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll need to sign back in to access your progress. Your data
              is saved to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={signingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={signOut}
              disabled={signingOut}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
