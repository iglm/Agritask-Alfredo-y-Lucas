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
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tractor, Users, Calendar, CheckSquare, LogOut, User as UserIcon, LogIn, Cloud, WifiOff } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const navItems = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/lots', label: 'Lotes', icon: Tractor },
  { href: '/staff', label: 'Personal', icon: Users },
  { href: '/tasks', label: 'Labores', icon: CheckSquare },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
];

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

  const currentPage = navItems.find(item => item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href)));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary">
                <Tractor className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-headline font-semibold text-primary group-data-[collapsible=icon]:hidden">
                AgriTask
              </h1>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
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
          </SidebarContent>
          <SidebarFooter>
              <div className="flex items-center justify-center gap-1.5 rounded-md text-xs p-2 bg-muted text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                       {user ? ( <Cloud className="h-4 w-4 text-primary" /> ) : ( <WifiOff className="h-4 w-4" /> )}
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                        <p>{user ? "Conectado. Tus datos se guardan en la nube." : "Modo local. Inicia sesión para sincronizar."}</p>
                    </TooltipContent>
                </Tooltip>
                 <span className="group-data-[collapsible=icon]:hidden">
                    {user ? 'Online' : 'Modo Local'}
                </span>
            </div>
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
                          <p className="text-xs text-muted-foreground leading-none mt-0.5">Suscripción: {profile?.subscription === 'premium' ? 'Premium' : 'Gratuita'}</p>
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
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="p-2 group-data-[collapsible=icon]:p-0">
                <Button asChild className="w-full">
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Iniciar Sesión</span>
                  </Link>
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-muted/40">
           <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold md:text-xl">
              {pathname === '/profile' ? 'Perfil' : (currentPage?.label || 'AgriTask')}
            </h1>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
