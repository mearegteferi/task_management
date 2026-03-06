'use client';

import { Bell, Search, User, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
    const user = useAuthStore((state) => state.user);

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6 border-b border-border/50 bg-background/60 backdrop-blur-xl transition-all">
            <div className="flex w-full max-w-sm items-center gap-2">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search projects or tasks..."
                        className="w-full pl-10 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50 transition-all rounded-full h-10"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />

                <Button variant="ghost" size="icon" className="relative group h-10 w-10 rounded-full hover:bg-primary/10">
                    <Bell size={20} className="text-zinc-500 group-hover:text-primary transition-colors" />
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(255,0,255,0.5)]"></span>
                </Button>

                <div className="flex items-center gap-3 pl-3 border-l border-border/50">
                    <div className="hidden md:flex flex-col text-right">
                        <span className="text-sm font-bold tracking-tight text-foreground/90">{user?.full_name || 'User'}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest leading-none mt-0.5">Member</span>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer overflow-hidden border-2 border-background">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}
