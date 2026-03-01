"use client";

import { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tractor, Users, Calendar, CheckSquare, LogOut, User as UserIcon, Home, CalendarCheck, SprayCan, Banknote, Gavel, WifiOff, Bot, Sparkles } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/context/localization-context';
import { LocalizationSwitcher } from './localization-switcher';

function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') {
        setIsOnline(window.navigator.onLine);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Badge variant="outline" className="flex items-center gap-2 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
      <WifiOff className="h-4 w-4" />
      <span>Sin Conexión</span>
    </Badge>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, profile } = useUser();
  const { t, language } = useLocalization();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const mainNavItem = { href: '/', label: t('nav.dashboard'), icon: LayoutDashboard };
  const setupNavItem = { href: '/setup', label: 'Constructor IA', icon: Sparkles };
  const assistantNavItem = { href: '/assistant', label: 'Asistente de Comandos', icon: Bot };
  const managementNavItems = [
    { href: '/lotes', label: 'Gestión de Lotes', icon: Tractor },
    { href: '/staff', label: t('nav.staff'), icon: Users },
    { href: '/tasks', label: t('nav.tasks'), icon: CheckSquare },
    { href: '/supplies', label: t('nav.supplies'), icon: SprayCan },
    { href: '/financials', label: t('nav.financials'), icon: Banknote },
    { href: '/calendar', label: t('nav.calendar'), icon: Calendar },
    { href: '/attendance', label: t('nav.attendance'), icon: CalendarCheck },
  ];
  const reportsNavItem = { href: '/reports', label: t('nav.reports'), icon: LayoutDashboard };
  const legalNavItem = { href: '/legal', label: t('nav.legal'), icon: Gavel };
  const allNavItems = [mainNavItem, setupNavItem, assistantNavItem, ...managementNavItems, reportsNavItem, legalNavItem];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      });
      // The AuthProvider will handle the redirect
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión.",
      });
    }
  };

  const currentPage = allNavItems.find(item => {
    if (item.href === '/') {
      return pathname === '/';
    }
    // Check if the current path starts with the item's href.
    // This handles nested routes correctly (e.g., /lotes/some-id).
    return pathname.startsWith(item.href);
  });


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="print:hidden">
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary">
                <Tractor className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-headline font-semibold text-primary group-data-[collapsible=icon]:hidden">
                Optimizador de Labores
              </h1>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname === '/'}
                    tooltip={{ children: mainNavItem.label }}
                  >
                    <Link href={mainNavItem.href}>
                      <mainNavItem.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{mainNavItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(setupNavItem.href)}
                    tooltip={{ children: setupNavItem.label }}
                  >
                    <Link href={setupNavItem.href}>
                      <setupNavItem.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{setupNavItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(assistantNavItem.href)}
                    tooltip={{ children: assistantNavItem.label }}
                  >
                    <Link href={assistantNavItem.href}>
                      <assistantNavItem.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{assistantNavItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator className='my-1' />
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label }}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarSeparator className='my-1' />
             <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(reportsNavItem.href)}
                    tooltip={{ children: reportsNavItem.label }}
                  >
                    <Link href={reportsNavItem.href}>
                      <reportsNavItem.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{reportsNavItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator className='my-1' />
            <SidebarMenu>
                <SidebarMenuItem>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(legalNavItem.href)}
                    tooltip={{ children: legalNavItem.label }}
                  >
                    <Link href={legalNavItem.href}>
                      <legalNavItem.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{legalNavItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
                      <Avatar className="h-8 w-8">
                          <AvatarFallback className='bg-primary text-primary-foreground'>
                              {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                      <div className="text-left group-data-[collapsible=icon]:hidden">
                          <p className="text-sm font-medium leading-none truncate">{profile?.name || user?.email}</p>
                      </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              null // User will be redirected to login, so no button is needed here
            )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-muted/40 flex flex-col">
           <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm print:hidden">
            <SidebarTrigger className="md:hidden" />
            <h1 className="flex-1 text-lg font-semibold md:text-xl">
              {currentPage?.label || 'Optimizador de Labores'}
            </h1>
            <div className="flex items-center gap-2">
              <OfflineIndicator />
              <LocalizationSwitcher />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 flex flex-col">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
