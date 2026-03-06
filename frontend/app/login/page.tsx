'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Sparkles, Zap, Shield, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const { token, user } = await authService.login(formData);
            setAuth(user, token.access_token, token.refresh_token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-950">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        rotate: [90, 0, 90],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-accent p-[2px] shadow-2xl shadow-primary/20 mb-4"
                    >
                        <div className="h-full w-full rounded-[14px] bg-zinc-900 flex items-center justify-center">
                            <Zap size={32} className="text-white fill-white animate-pulse" />
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tighter text-white">
                        Project <span className="text-primary italic">Aura</span>
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Neural Synchronization</p>
                </div>

                <Card className="border-none shadow-3xl bg-white/5 dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-2xl font-black tracking-tight text-white">Welcome back</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium">Identify yourself to enter the stream</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-500"
                                    >
                                        <AlertCircle size={16} />
                                        <p>{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                <div className="space-y-2 group">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">Neural Address</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@nexus.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 pl-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-2xl text-white placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-primary transition-colors">Security Key</Label>
                                    </div>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-12 pl-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-2xl text-white placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="p-8 pt-0 flex flex-col space-y-6">
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black italic tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all border-none"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <span className="flex items-center gap-2">
                                        INITIATE SYNC <Sparkles size={16} />
                                    </span>
                                )}
                            </Button>

                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                    New to the orbit?{' '}
                                    <Link href="/register" className="text-primary hover:text-accent transition-colors underline decoration-2 underline-offset-4">
                                        Create Identity
                                    </Link>
                                </p>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
