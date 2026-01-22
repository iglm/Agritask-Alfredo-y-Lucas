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
import { LayoutDashboard, Tractor, Users, Calendar, CheckSquare, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lots', label: 'Lotes', icon: Tractor },
  { href: '/staff', label: 'Personal', icon: Users },
  { href: '/tasks', label: 'Labores', icon: CheckSquare },
  { href: '/calendar', label: 'Agenda', icon: Calendar },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      tooltip={{ children: item.label }}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="#" passHref legacyBehavior>
                    <SidebarMenuButton tooltip={{children: "Settings"}}>
                      <Settings className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{children: "User Profile"}}>
                    <Avatar className="h-8 w-8">
                       <AvatarImage src="https://picsum.photos/seed/user/40/40" data-ai-hint="person portrait" />
                       <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                     <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                       <span className="text-sm font-semibold">Juan Diaz</span>
                       <span className="text-xs text-muted-foreground">Admin</span>
                     </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-muted/40">
           <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold md:text-xl">
              {currentPage?.label || 'AgriTask Master'}
            </h1>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
