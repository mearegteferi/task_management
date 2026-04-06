'use client';

import { Menu, Search, User } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from './ThemeToggle';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface NavbarProps {
    onOpenMobileMenu: () => void;
}

export function Navbar({ onOpenMobileMenu }: NavbarProps) {
    const user = useAuthStore((state) => state.user);

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/96 px-4 shadow-sm backdrop-blur sm:px-6">
            <div className="flex flex-1 items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 lg:hidden"
                    onClick={onOpenMobileMenu}
                >
                    <Menu className="h-4 w-4" />
                </Button>
                <div className="relative hidden w-full max-w-sm sm:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" />
                    <Input
                        type="search"
                        placeholder="Search projects or tasks"
                        className="h-10 w-full rounded-lg pl-10"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                <div className="flex items-center gap-3 border-l border-border pl-3">
                    <div className="hidden text-right md:flex md:flex-col">
                        <span className="text-sm font-medium text-foreground">
                            {user?.full_name || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {user?.email || 'Member'}
                        </span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-foreground">
                        <User size={18} />
                    </div>
                </div>
            </div>
        </header>
    );
}
