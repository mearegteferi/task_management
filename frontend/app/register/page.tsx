'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle2, Zap, Sparkles, User, Shield, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getErrorMessage(error: unknown) {
    if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
    ) {
        const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
        if (typeof detail === 'string') {
            return detail;
        }
        if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') {
            return detail[0].msg;
        }
    }

    return 'Registration failed. Please try again.';
}

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await authService.register({
                email,
                password,
                full_name: fullName,
            });
            setIsSuccess(true);
            setTimeout(() => router.push('/login'), 2000);
        } catch (error: unknown) {
            setError(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-md"
                >
                    <Card className="border-none shadow-3xl bg-white/5 dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[3.5rem] p-12 text-center overflow-hidden">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200 }}
                            className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-green-500/20 shadow-lg shadow-green-500/20"
                        >
                            <CheckCircle2 className="h-12 w-12 text-green-500 animate-pulse" />
                        </motion.div>
                        <CardTitle className="text-3xl font-black tracking-tighter text-white mb-4">Account Created</CardTitle>
                        <CardDescription className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                            Redirecting to sign in...
                        </CardDescription>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-950">
            {/* Cinematic Background Elements */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{
                        scale: [1.2, 1, 1.2],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent to-primary p-[2px] shadow-2xl shadow-accent/20 mb-4"
                    >
                        <div className="h-full w-full rounded-[14px] bg-zinc-900 flex items-center justify-center">
                            <Sparkles size={32} className="text-white fill-white" />
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                        Create <span className="text-accent">Account</span>
                    </h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Set up your workspace access</p>
                </div>

                <Card className="border-none shadow-3xl bg-white/5 dark:bg-zinc-900/40 backdrop-blur-2xl rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-10 pb-4">
                        <CardTitle className="text-2xl font-black tracking-tight text-white">Create Account</CardTitle>
                        <CardDescription className="text-zinc-500 font-medium">Enter your details to start managing projects and tasks</CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="p-10 pt-0 space-y-6">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-3 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-500"
                                    >
                                        <AlertCircle size={16} />
                                        <p>{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid gap-6">
                                <div className="space-y-2 group">
                                    <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-accent transition-colors">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-accent transition-colors" />
                                        <Input
                                            id="fullName"
                                            placeholder="Example: Jane Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            className="h-12 pl-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-2xl text-white placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-accent/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-accent transition-colors">Email Address</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-accent transition-colors" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 pl-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-2xl text-white placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-accent/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-focus-within:text-accent transition-colors">Password</Label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-accent transition-colors" />
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="h-12 pl-12 bg-white/5 dark:bg-black/20 border-white/10 rounded-2xl text-white placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-accent/50 transition-all font-medium"
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-zinc-600 italic px-2">Minimum 8 characters required</p>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="p-10 pt-0 flex flex-col space-y-6">
                            <Button
                                type="submit"
                                className="w-full h-14 rounded-[1.5rem] bg-accent hover:bg-accent/90 text-white font-black italic tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all border-none"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <span className="flex items-center gap-2">
                                        Create Account <Zap size={16} fill="currentColor" />
                                    </span>
                                )}
                            </Button>

                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-accent hover:text-primary transition-colors underline decoration-2 underline-offset-4">
                                        Sign In
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
