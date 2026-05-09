import Link from "next/link";
import { PwaRegister } from "@/components/pwa-register";

const navItems = [
  { href: "/home", label: "Dashboard" },
  { href: "/videos", label: "Videos" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07110d] text-[#f7f1df]">
      <PwaRegister />
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,#31533f_0,#12362b_24%,#07110d_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#07110d_0%,rgba(7,17,13,.92)_34%,rgba(7,17,13,.25)_72%,#07110d_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(0deg,#07110d_0%,rgba(7,17,13,0)_100%)]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#07110d]/88 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link className="flex min-w-0 items-center gap-3" href="/home">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#f4c542] text-lg font-black text-[#12362b]">
              OU
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold uppercase tracking-[0.18em] text-[#f4c542]">
                Desbravadores Play
              </span>
              <span className="block truncate text-base font-semibold text-white">Ordem Unida</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                className="h-9 rounded-md px-4 py-2 text-sm font-bold text-white/72 transition hover:bg-white/10 hover:text-white"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="relative z-10 pt-16">{children}</div>
    </main>
  );
}
