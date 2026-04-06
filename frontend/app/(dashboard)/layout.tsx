'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { accessToken } = useAuthStore();
    const router = useRouter();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (!accessToken) {
            router.push('/login');
        }
    }, [accessToken, router]);

    if (!accessToken) {
        return null; // Or a loading spinner
    }

    return (
        <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
            <Sidebar
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto bg-[var(--surface-2)] p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
