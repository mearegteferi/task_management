"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { User, Token } from "@/types";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: Token) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchUser = async () => {
        try {
            const response = await api.get<User>("/api/v1/users/me");
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user", error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = Cookies.get("access_token");
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
            if (pathname !== "/login") {
                router.push("/login"); // Redirect to login if no token
            }
        }
    }, []);

    const login = (token: Token) => {
        Cookies.set("access_token", token.access_token);
        Cookies.set("refresh_token", token.refresh_token); // Optional: Handle refresh token
        fetchUser();
        router.push("/");
    };

    const logout = () => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
