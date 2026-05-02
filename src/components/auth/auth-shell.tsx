import Link from "next/link";

import { cn } from "@/utils";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthShell({ title, description, children, footer, className }: AuthShellProps) {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%),linear-gradient(to_bottom,#0b1220,#050814_70%)] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_40%)]" />
            <div className="relative flex h-full flex-col justify-between gap-12">
              <div>
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10">A</span>
                  ALTFaze
                </Link>
                <div className="mt-10 max-w-md space-y-5">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300/90">Secure authentication</p>
                  <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">{title}</h1>
                  <p className="max-w-lg text-base leading-8 text-white/72">{description}</p>
                </div>
              </div>

              <div className="grid gap-4 text-sm text-white/72 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  OTP email login with 5 minute expiry.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Secure reset links with 15 minute expiry.
                </div>
              </div>
            </div>
          </div>

          <div className={cn("rounded-[2rem] border border-white/10 bg-white p-6 shadow-2xl shadow-black/20 sm:p-8", className)}>
            {children}
            {footer ? <div className="mt-8 border-t border-slate-200 pt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}