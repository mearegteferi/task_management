'use client';

import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    User,
    Lock,
    Bell,
    Moon,
    Zap,
    Shield,
    Sparkles,
    Activity,
    ChevronRight,
    Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function SettingsPage() {
    const user = useAuthStore((state) => state.user);

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 max-w-5xl"
        >
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black tracking-tighter text-foreground">
                    Nexus <span className="text-primary italic">Settings</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                    <Shield size={14} className="text-accent" />
                    Configure your neural node and interface preferences.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Profile Section */}
                <motion.div variants={item} className="lg:col-span-8 space-y-8">
                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="p-8 border-b border-border/50 bg-gradient-to-r from-zinc-50/50 to-transparent dark:from-zinc-900/50">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <User size={20} className="text-primary" />
                                Profile Identity
                            </CardTitle>
                            <CardDescription className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Update your presence in the stream</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="relative group">
                                    <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-primary to-accent p-[2px] shadow-xl shadow-primary/20">
                                        <div className="h-full w-full rounded-[1.8rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                            <User size={40} className="text-zinc-400" />
                                        </div>
                                    </div>
                                    <Button size="icon" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-white dark:bg-zinc-950 shadow-lg border border-border/50 text-primary hover:scale-110 transition-transform">
                                        <Camera size={14} />
                                    </Button>
                                </div>
                                <div className="flex-1 grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Signature Name</Label>
                                        <Input id="name" defaultValue={user?.full_name || ''} className="h-12 bg-white/50 dark:bg-black/20 border-none rounded-2xl shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50 font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Neural Address</Label>
                                        <Input id="email" defaultValue={user?.email || ''} readOnly className="h-12 bg-zinc-100/50 dark:bg-zinc-800/50 border-none rounded-2xl text-zinc-500 font-bold" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button className="h-12 px-8 rounded-2xl bg-primary text-white font-black italic shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                    SAVE IDENTITY
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="p-8 border-b border-border/50 bg-gradient-to-r from-zinc-50/50 to-transparent dark:from-zinc-900/50">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Lock size={20} className="text-accent" />
                                Security Protocols
                            </CardTitle>
                            <CardDescription className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Manage your neural encryption keys</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="current" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Current Key</Label>
                                <Input id="current" type="password" placeholder="••••••••••••" className="h-12 bg-white/50 dark:bg-black/20 border-none rounded-2xl shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50" />
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="new" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">New Neural Key</Label>
                                    <Input id="new" type="password" className="h-12 bg-white/50 dark:bg-black/20 border-none rounded-2xl shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Confirm Sync</Label>
                                    <Input id="confirm" type="password" className="h-12 bg-white/50 dark:bg-black/20 border-none rounded-2xl shadow-inner focus-visible:ring-1 focus-visible:ring-primary/50" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button variant="outline" className="h-12 px-8 rounded-2xl border-primary/20 bg-primary/5 text-primary font-black italic hover:bg-primary/10 transition-all">
                                    RE-ENCRYPT
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Sidebar Info */}
                <motion.div variants={item} className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden p-8">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Appearance</span>
                                    <h3 className="text-xl font-black tracking-tighter">Aura Theme</h3>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-primary shadow-inner">
                                    <Moon size={20} />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-zinc-500 leading-relaxed italic">&quot;Adjust the chromatic flow of your interface to match your creative aura.&quot;</p>

                            <div className="p-4 rounded-[1.5rem] bg-zinc-50/50 dark:bg-black/20 ring-1 ring-border/50 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Sparkles size={16} className="text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Toggle Mode</span>
                                </div>
                                <ThemeToggle />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden p-8 relative group">
                        <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Node Status</span>
                                <h3 className="text-xl font-black tracking-tighter">Health Metrics</h3>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Latency', val: '12ms', icon: Activity, color: 'text-green-500' },
                                    { label: 'Uptime', val: '99.9%', icon: Zap, color: 'text-primary' },
                                    { label: 'Neural Load', val: 'Low', icon: Sparkles, color: 'text-accent' }
                                ].map((stat, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <stat.icon size={14} className={stat.color} />
                                            <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">{stat.label}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-foreground">{stat.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-black shadow-inner ring-1 ring-border/50 flex items-center justify-between group cursor-pointer hover:ring-primary/50 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-[1.2rem] bg-red-500/10 flex items-center justify-center text-red-500">
                                <Shield size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Hazard Zone</span>
                                <p className="text-[9px] font-bold text-zinc-500 mt-0.5 uppercase tracking-tighter italic">Terminate Neural Link</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
