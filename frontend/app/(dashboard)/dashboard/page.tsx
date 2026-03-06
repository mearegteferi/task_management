'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsService } from '@/services/analytics.service';
import { AnalyticsResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, CheckSquare, TrendingUp, Zap, Clock, Star, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function DashboardPage() {
    const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await analyticsService.getAnalytics();
                setAnalytics(data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = [
        { title: 'Total Projects', value: analytics?.total_projects || 0, icon: Briefcase, color: 'from-blue-500 to-cyan-500', label: 'Active in workspace' },
        { title: 'Task Progress', value: analytics?.total_tasks || 0, icon: CheckSquare, color: 'from-indigo-500 to-violet-500', label: 'Across all streams' },
        { title: 'Productivity', value: '84%', icon: TrendingUp, color: 'from-accent to-pink-500', label: 'Completion efficiency' },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 p-1"
        >
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black tracking-tighter text-foreground">
                    Dashboard <span className="text-primary italic">Overview</span>
                </h1>
                <p className="text-foreground/50 text-sm font-medium flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" />
                    Welcome back! Here&apos;s your productivity aura today.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat, idx) => (
                    <motion.div key={idx} variants={item}>
                        <Card className="relative overflow-hidden group border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl">
                            <div className={stat.color + " absolute top-0 left-0 w-1 h-full opacity-70"}></div>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-xs uppercase font-bold tracking-widest text-foreground/50">{stat.title}</CardTitle>
                                <div className={stat.color + " p-2 rounded-xl bg-gradient-to-br text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform"}>
                                    <stat.icon size={16} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black tracking-tighter text-foreground">{stat.value}</div>
                                <p className="text-[10px] font-bold text-foreground/40 mt-1 uppercase tracking-tighter">{stat.label}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                <motion.div variants={item} className="lg:col-span-4">
                    <Card className="h-[400px] border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl overflow-hidden flex flex-col">
                        <CardHeader className="border-b border-border/50 bg-secondary/30">
                            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                <Zap size={18} className="text-accent" />
                                Project Velocity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-end justify-around p-8 pb-12">
                            {analytics?.projects_by_status.map((stat) => (
                                <div key={stat.status} className="flex flex-col items-center gap-4 group h-full justify-end">
                                    <div className="relative w-14">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(stat.count / (analytics.total_projects || 1)) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className="w-full rounded-2xl bg-gradient-to-t from-primary to-accent shadow-xl shadow-primary/20 group-hover:brightness-110 transition-all cursor-pointer min-h-[8px]"
                                        />
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md font-bold">
                                            {stat.count}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50 group-hover:text-primary transition-colors whitespace-nowrap">
                                        {stat.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="lg:col-span-3">
                    <Card className="h-[400px] border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl overflow-hidden flex flex-col">
                        <CardHeader className="border-b border-border/50 bg-secondary/30">
                            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                <Clock size={18} className="text-primary" />
                                Priority Spectrum
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                {[
                                    { label: 'High Priority', val: 75, color: 'bg-red-500' },
                                    { label: 'Standard', val: 45, color: 'bg-primary' },
                                    { label: 'Low Urgency', val: 20, color: 'bg-zinc-400' }
                                ].map((p, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/50">
                                            <span>{p.label}</span>
                                            <span>{p.val}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${p.val}%` }}
                                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                                className={cn("h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]", p.color)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 rounded-2xl bg-accent/5 border border-accent/10 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                                    <Star size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <span className="text-xs font-black uppercase tracking-widest text-accent">Optimization Tip</span>
                                    <p className="text-[11px] font-medium text-foreground/50 leading-tight mt-0.5">Focus on 2 high-priority tasks today to maximize your aura.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
