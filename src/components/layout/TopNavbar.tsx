import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Sparkles,
  Home,
  Trophy,
  History,
  Megaphone,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  Settings,
  Wallet,
  User
} from "lucide-react";
import { useTheme } from "next-themes";

import { appRoutes, createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

const navItems = [
  { label: "Início", to: appRoutes.Home, icon: Home },
  { label: "Novo Sorteio", to: appRoutes.NewDraw, icon: Trophy },
  { label: "Histórico", to: appRoutes.DrawHistory, icon: History },
  { label: "Campanhas", to: appRoutes.Campaigns, icon: Megaphone }
];

const moreItems = [
  { label: "Organizações", to: createPageUrl("Settings"), icon: Settings },
  { label: "Parceiros", to: createPageUrl("Partners"), icon: User },
  { label: "Carteira", to: createPageUrl("Wallet"), icon: Wallet }
];

export function TopNavbar() {
  const { setTheme, resolvedTheme = "dark" } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const renderNavLink = (item: typeof navItems[number]) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition",
          "border-white/5 text-slate-200/80 hover:text-white hover:bg-white/5",
          isActive &&
            "bg-violet-500/20 text-violet-50 border-violet-500/40 shadow-[0_0_0_1px_rgba(139,92,246,0.35)]"
        )
      }
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
    </NavLink>
  );

  return (
    <div className="sticky top-4 z-50 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-2xl shadow-lg shadow-violet-500/10">
          {/* Left: logo */}
          <Link to={appRoutes.Home} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Winners Club</div>
              <div className="text-xs text-slate-300">Sistema de Sorteios</div>
            </div>
          </Link>

          {/* Center: nav desktop */}
          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map(renderNavLink)}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-slate-200/90 hover:text-white hover:bg-white/10"
                >
                  <span>Mais</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[12rem]">
                <DropdownMenuLabel>Mais opções</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {moreItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <NavLink
                      to={item.to}
                      className="flex items-center gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10"
              onClick={toggleTheme}
              aria-label="Alternar tema"
            >
              {!mounted ? (
                <Sun className="h-5 w-5" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-slate-200/90 hover:text-white hover:bg-white/10"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage />
                    <AvatarFallback className="bg-violet-500 text-white text-sm">
                      G
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-white">
                      Gabriel Afinovicz
                    </span>
                    <span className="text-xs text-slate-300">Admin</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[13rem]">
                <DropdownMenuLabel>Perfil</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to={createPageUrl("Settings")} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to={createPageUrl("Wallet")} className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <span>Carteira</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-rose-400 hover:text-rose-200">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden rounded-full border border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="top"
                className="bg-slate-900/90 backdrop-blur-2xl border-b border-white/10 text-slate-100"
              >
                <SheetHeader>
                  <SheetTitle>Navegação</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-2">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl border transition",
                            "border-white/5 text-slate-200/90 hover:text-white hover:bg-white/5",
                            isActive &&
                              "bg-violet-500/20 text-violet-50 border-violet-500/40"
                          )
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SheetClose>
                  ))}
                  <div className="pt-2">
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                      Mais
                    </div>
                    <div className="flex flex-col gap-2">
                      {moreItems.map((item) => (
                        <SheetClose asChild key={item.to}>
                          <NavLink
                            to={item.to}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/5 text-slate-200/90 hover:text-white hover:bg-white/5"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </NavLink>
                        </SheetClose>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopNavbar;

