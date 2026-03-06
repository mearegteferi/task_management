'use client';

import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { AnalyticsResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    BarChart3,
    Loader2,
    PieChart,
    TrendingUp,
    Zap,
    Activity,
    Target,
    Sparkles,
    MousePointer2,
    Clock,
    Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function AnalyticsPage() {
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

    const totalTaskCount = analytics?.total_tasks || 0;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-black tracking-tighter text-foreground">
                    Neural <span className="text-primary italic">Analytics</span>
                </h1>
                <p className="text-zinc-500 text-sm font-medium flex items-center gap-2">
                    <Activity size={14} className="text-accent" />
                    Quantify your creative momentum and execution flow.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Project Hub Distribution */}
                <motion.div variants={item} className="lg:col-span-5 h-full">
                    <Card className="h-full border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden flex flex-col p-6">
                        <CardHeader className="p-0 mb-8">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                    <PieChart size={20} className="text-primary" />
                                    Project Distribution
                                </CardTitle>
                                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3">Live Feed</Badge>
                            </div>
                            <CardDescription className="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-widest">Status breakdown across all streams</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col justify-center space-y-8">
                            {analytics?.projects_by_status.map((stat, idx) => (
                                <div key={stat.status} className="space-y-3 group">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className="text-zinc-500 group-hover:text-primary transition-colors">{stat.status.replace('_', ' ')}</span>
                                        <span className="text-foreground">{stat.count} <span className="text-primary italic">({Math.round((stat.count / (analytics.total_projects || 1)) * 100)}%)</span></span>
                                    </div>
                                    <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stat.count / (analytics.total_projects || 1)) * 100}%` }}
                                            transition={{ duration: 1.5, delay: 0.5 + (idx * 0.1), ease: "circOut" }}
                                            className={cn(
                                                "h-full rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)] transition-all group-hover:brightness-110",
                                                stat.status === 'done' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                                    stat.status === 'in_progress' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                                                        'bg-gradient-to-r from-slate-400 to-slate-600'
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="pt-6 border-t border-border/50">
                                <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-black/20 flex items-center justify-between group cursor-pointer hover:bg-primary/5 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Target size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Global Target</span>
                                            <span className="text-xs font-black text-foreground">{analytics?.total_projects} Active Streams</span>
                                        </div>
                                    </div>
                                    <MousePointer2 size={16} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Progress Velocity Chart (Mocked Visual) */}
                <motion.div variants={item} className="lg:col-span-7">
                    <Card className="h-full border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden flex flex-col p-6">
                        <CardHeader className="p-0 mb-8">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                    <TrendingUp size={20} className="text-accent" />
                                    Momentum Velocity
                                </CardTitle>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => <div key={i} className="h-1 w-4 rounded-full bg-primary/20" />)}
                                </div>
                            </div>
                            <CardDescription className="text-xs font-medium text-zinc-500 mt-1 uppercase tracking-widest">Completion trajectory and task throughput</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col">
                            <div className="flex-1 min-h-[300px] relative flex items-end justify-between px-4 pb-8 border-b border-border/50">
                                {/* Visual placeholder for a complex chart */}
                                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                    <div key={i} className="flex flex-col items-center gap-4 group h-full justify-end">
                                        <div className="relative w-12">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                transition={{ duration: 1, delay: 0.8 + (i * 0.05), ease: "backOut" }}
                                                className="w-full rounded-2xl bg-gradient-to-t from-primary/20 to-primary/80 group-hover:from-primary/40 group-hover:to-accent transition-all cursor-pointer shadow-lg shadow-primary/5 min-h-[10px]"
                                            />
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[9px] px-2 py-1 rounded-md font-bold shadow-xl ring-1 ring-white/10">
                                                {Math.round(h * 1.2)}%
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-primary transition-colors">
                                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i]}
                                        </span>
                                    </div>
                                ))}
                                {/* Decorative grid lines */}
                                <div className="absolute inset-x-0 top-0 h-full flex flex-col justify-between pointer-events-none opacity-5">
                                    {[...Array(5)].map((_, i) => <div key={i} className="w-full h-[1px] bg-foreground" />)}
                                </div>
                            </div>

                            <div className="pt-8 grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-accent animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Flow Efficiency</span>
                                    </div>
                                    <div className="text-3xl font-black tracking-tighter text-foreground">84.2%</div>
                                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "84.2%" }}
                                            transition={{ duration: 1.5, delay: 1 }}
                                            className="h-full bg-accent"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sync Frequency</span>
                                    </div>
                                    <div className="text-3xl font-black tracking-tighter text-foreground">1.8 <span className="text-sm text-zinc-400 tracking-normal px-1">p/day</span></div>
                                    <div className="flex gap-1">
                                        {[...Array(8)].map((_, i) => (
                                            <div key={i} className={cn("h-1.5 flex-1 rounded-full", i < 6 ? "bg-primary" : "bg-zinc-100 dark:bg-zinc-800")} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Bottom Insight Tiles */}
            <div className="grid gap-6 md:grid-cols-3">
                {[
                    { title: 'Neural Capacity', val: '92%', icon: BarChart3, sub: 'Optimized workspace', color: 'text-primary' },
                    { title: 'Avg. Sync Time', val: '4.2 Days', icon: Clock, sub: 'Improving velocity', color: 'text-accent' },
                    { title: 'Security Health', val: 'STABLE', icon: Shield, sub: 'Verified connection', color: 'text-green-500' }
                ].map((insight, idx) => (
                    <motion.div key={idx} variants={item}>
                        <Card className="border-none shadow-2xl shadow-primary/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl overflow-hidden group hover:scale-[1.02] transition-transform">
                            <CardHeader className="p-6 pb-2">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center justify-between">
                                    {insight.title}
                                    <insight.icon size={14} className={insight.color} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <div className="text-4xl font-black tracking-tighter text-foreground mb-1">{insight.val}</div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
                                    <Sparkles size={10} className="text-primary" />
                                    {insight.sub}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="p-8 rounded-[3rem] bg-gradient-to-r from-primary to-accent overflow-hidden relative group">
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div
                    animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute -right-20 -top-20 h-64 w-64 bg-white/10 rounded-full blur-3xl pointer-events-none"
                />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-white space-y-2 text-center md:text-left">
                        <h2 className="text-3xl font-black tracking-tighter italic uppercase underline decoration-accent decoration-4 underline-offset-8">Aura Intelligence</h2>
                        <p className="text-sm font-black tracking-widest opacity-80 uppercase">AI-Driven insight synchronization active</p>
                    </div>
                    <Button className="h-14 px-8 rounded-2xl bg-white text-primary font-black italic tracking-widest shadow-2xl shadow-black/20 hover:scale-110 active:scale-95 transition-all">
                        REGENERATE REPORT
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
