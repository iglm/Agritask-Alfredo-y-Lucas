"use client";

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
import { LayoutDashboard, Tractor, Users, Calendar, CheckSquare, LogOut, User as UserIcon, Home, CalendarCheck, SprayCan, Banknote, Gavel, Bot, BarChart3 } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { ThemeToggle } from './theme-toggle';

const productiveUnitNavItem = { href: '/productive-unit', label: 'Unidad Productiva', icon: Home };
const mainNavItem = { href: '/', label: 'Panel', icon: LayoutDashboard };
const managementNavItems = [
  { href: '/lotes', label: 'Lotes', icon: Tractor },
  { href: '/staff', label: 'Personal', icon: Users },
  { href: '/tasks', label: 'Labores', icon: CheckSquare },
  { href: '/supplies', label: 'Insumos', icon: SprayCan },
  { href: '/financials', label: 'Finanzas', icon: Banknote },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/attendance', label: 'Asistencia', icon: CalendarCheck },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
];
const assistantNavItem = { href: '/assistant', label: 'Asistente IA', icon: Bot };
const legalNavItem = { href: '/legal', label: 'Legal y Contacto', icon: Gavel };
const allNavItems = [productiveUnitNavItem, mainNavItem, ...managementNavItems, assistantNavItem, legalNavItem];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const auth = useAuth();
  const { user, profile } = useUser();

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
                    isActive={pathname.startsWith(productiveUnitNavItem.href)}
                    tooltip={{ children: productiveUnitNavItem.label }}
                  >
                    <Link href={productiveUnitNavItem.href}>
                      <productiveUnitNavItem.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{productiveUnitNavItem.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator className='my-1' />
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
           <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 print:hidden">
            <SidebarTrigger className="md:hidden" />
            <h1 className="flex-1 text-lg font-semibold md:text-xl">
              {currentPage?.label || 'Optimizador de Labores'}
            </h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 sm:p-6 flex flex-col">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
