"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  ChartSpline,
  CheckCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { Avatar, RoleBadge } from "@/components/ui";
import { cn, relativeTime } from "@/lib/format";
import { apiFetch } from "@/lib/client";
import type { Role } from "@/lib/constants";

type ShellUser = { id: string; name: string; email: string; role: Role; department: string | null };

type NavItem = { href: string; label: string; icon: React.ReactNode; admin?: boolean };

const WORKSPACE: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { href: "/complaints", label: "Complaints", icon: <Ticket className="size-4" /> },
  { href: "/analytics", label: "Analytics", icon: <ChartSpline className="size-4" /> },
];

const ADMIN: NavItem[] = [
  { href: "/admin/users", label: "People", icon: <Users className="size-4" />, admin: true },
  { href: "/admin/settings", label: "SLA policy", icon: <Settings2 className="size-4" />, admin: true },
];

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/complaints": "Complaints",
  "/complaints/new": "Raise a complaint",
  "/analytics": "Analytics",
  "/admin/users": "People",
  "/admin/settings": "SLA policy",
  "/notifications": "Notifications",
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/complaints/")) return "Complaint detail";
  return "Complaint Management System";
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function signOut() {
    setSigningOut(true);
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/");
    router.refresh();
  }

  const visibleAdmin = ADMIN.filter((item) => !item.admin || user.role === "ADMIN");

  const nav = (onNavigate?: () => void) => (
    <nav className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3 px-2">
        <span className="brand-mark grid size-10 place-items-center rounded-2xl text-sm font-bold text-white">CMS</span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-slate-900">Complaint Desk</p>
          <p className="text-[11px] text-slate-500">TTL grievance system</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="mono-label px-2 pb-1">Workspace</p>
        {WORKSPACE.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn("nav-link", isActive(pathname, item.href) && "nav-link-active")}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      {visibleAdmin.length > 0 ? (
        <div className="space-y-1">
          <p className="mono-label px-2 pb-1">Administration</p>
          {visibleAdmin.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn("nav-link", isActive(pathname, item.href) && "nav-link-active")}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-auto space-y-3">
        <Link
          href="/complaints/new"
          onClick={onNavigate}
          className="btn btn-primary w-full shadow-glow"
        >
          <Plus className="size-4" />
          New complaint
        </Link>

        <div className="rounded-2xl border border-white/80 bg-white/70 p-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <RoleBadge role={user.role} />
            <button
              onClick={signOut}
              disabled={signingOut}
              className="btn btn-ghost px-2 py-1.5 text-[11px]"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
              {signingOut ? "…" : "Sign out"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-white/70 bg-white/55 px-4 py-6 backdrop-blur-xl lg:block">
        {nav()}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-slate-900/25 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[290px] border-r border-white/70 bg-white/90 px-4 py-6 shadow-2xl backdrop-blur-xl transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-3 rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
          {nav(() => setMobileOpen(false))}
        </aside>
      </div>

      <div className="lg:pl-[264px]">
        <Topbar
          user={user}
          title={titleFor(pathname)}
          onMenu={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ user, title, onMenu }: { user: ShellUser; title: string; onMenu: () => void }) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<
    { id: string; title: string; body: string; href: string | null; read: boolean; createdAt: string }[]
  >([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: typeof items; unreadCount: number }>("/api/notifications");
      setItems(data.items);
      setUnread(data.unreadCount);
    } catch {
      /* silent: the bell is not critical */
    }
  }, []);

  useEffect(() => {
    // Async fetch on mount; state is set after the awaited request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    function handler(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function markAll() {
    await apiFetch("/api/notifications", { method: "POST", body: JSON.stringify({}) }).catch(() => null);
    setUnread(0);
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  function search(event: React.FormEvent) {
    event.preventDefault();
    router.push(`/complaints?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="hidden text-[11px] text-slate-500 sm:block">
            {user.department ? `${user.department} · ` : ""}
            signed in as {user.role.toLowerCase()}
          </p>
        </div>

        <form onSubmit={search} className="ml-auto hidden items-center md:flex">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reference or title…"
              className="input w-64 pl-9 text-xs"
              aria-label="Search complaints"
            />
          </label>
        </form>

        <div className="relative ml-auto md:ml-2" ref={panelRef}>
          <button
            onClick={() => setOpen((value) => !value)}
            className="relative rounded-xl border border-white/80 bg-white/70 p-2.5 text-slate-600 transition hover:text-indigo-600"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </button>

          {open ? (
            <div className="absolute right-0 top-12 w-[340px] overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Notifications</p>
                <button onClick={markAll} className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700">
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              </div>
              <div className="max-h-[340px] overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">You are all caught up.</p>
                ) : (
                  items.slice(0, 8).map((item) => (
                    <Link
                      key={item.id}
                      href={item.href || "/notifications"}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block border-b border-slate-50 px-4 py-3 transition hover:bg-indigo-50/50",
                        !item.read && "bg-indigo-50/40",
                      )}
                    >
                      <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{item.body}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{relativeTime(item.createdAt)}</p>
                    </Link>
                  ))
                )}
              </div>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block bg-slate-50/70 px-4 py-2.5 text-center text-[11px] font-medium text-slate-600 hover:text-indigo-600"
              >
                View all notifications
              </Link>
            </div>
          ) : null}
        </div>

        <Link href="/dashboard" className="hidden items-center gap-2 rounded-xl px-1 py-1 sm:flex" title={user.name}>
          <Avatar name={user.name} size="sm" />
        </Link>
        {user.role === "ADMIN" ? (
          <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 sm:inline-flex">
            <ShieldCheck className="size-3" /> Admin
          </span>
        ) : null}
      </div>
    </header>
  );
}
