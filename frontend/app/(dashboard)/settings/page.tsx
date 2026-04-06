'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, LogOut } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

function getErrorMessage(error: unknown, fallback: string) {
    if (
        typeof error === 'object'
        && error !== null
        && 'response' in error
        && typeof (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail === 'string'
    ) {
        return (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback;
    }

    return fallback;
}

export default function SettingsPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const [fullName, setFullName] = useState(user?.full_name ?? '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        setFullName(user?.full_name ?? '');
    }, [user?.full_name]);

    const trimmedFullName = fullName.trim();
    const hasProfileChanges = useMemo(
        () => trimmedFullName !== (user?.full_name ?? ''),
        [trimmedFullName, user?.full_name]
    );

    const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !hasProfileChanges) {
            return;
        }

        setProfileError('');
        setProfileMessage('');
        setIsSavingProfile(true);

        try {
            const updatedUser = await authService.updateProfile({
                full_name: trimmedFullName || null,
            });
            updateUser(updatedUser);
            setProfileMessage('Profile updated.');
        } catch (error: unknown) {
            setProfileError(getErrorMessage(error, 'Unable to update your profile right now.'));
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setPasswordError('');
        setPasswordMessage('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError('Fill in all password fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }

        setIsUpdatingPassword(true);

        try {
            const response = await authService.updatePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });
            setPasswordMessage(response.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: unknown) {
            setPasswordError(getErrorMessage(error, 'Unable to update your password right now.'));
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSignOut = () => {
        clearAuth();
        router.push('/login');
    };

    return (
        <div className="page-shell max-w-5xl">
            <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your profile, password, and theme.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                            <CardDescription>Update your account details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="settings-name">Full name</Label>
                                    <Input
                                        id="settings-name"
                                        value={fullName}
                                        onChange={(event) => setFullName(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="settings-email">Email</Label>
                                    <Input id="settings-email" value={user?.email || ''} readOnly className="bg-secondary" />
                                </div>

                                {profileError && (
                                    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                                        <AlertCircle className="h-4 w-4" />
                                        {profileError}
                                    </div>
                                )}
                                {profileMessage && (
                                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-300">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {profileMessage}
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={!hasProfileChanges || isSavingProfile}>
                                        {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Save profile
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>Update your password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">Current password</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(event) => setCurrentPassword(event.target.value)}
                                    />
                                </div>
                                <div className="grid gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">New password</Label>
                                        <Input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(event) => setNewPassword(event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirm password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                        />
                                    </div>
                                </div>

                                {passwordError && (
                                    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200">
                                        <AlertCircle className="h-4 w-4" />
                                        {passwordError}
                                    </div>
                                )}
                                {passwordMessage && (
                                    <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/25 dark:bg-green-500/10 dark:text-green-300">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {passwordMessage}
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isUpdatingPassword}>
                                        {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Update password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme</CardTitle>
                            <CardDescription>Switch between light and dark mode.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current appearance</span>
                            <ThemeToggle />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>Basic account information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Email</span>
                                <span className="text-foreground">{user?.email || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Full name</span>
                                <span className="text-foreground">{user?.full_name || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="button" variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        Log out
                    </Button>
                </div>
            </div>
        </div>
    );
}
