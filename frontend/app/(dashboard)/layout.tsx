'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, accessToken } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!accessToken) {
            router.push('/login');
        }
    }, [accessToken, router]);

    if (!accessToken) {
        return null; // Or a loading spinner
    }

    return (
        <div className="flex h-screen bg-background text-foreground transition-colors duration-500">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6 transition-all duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
}
