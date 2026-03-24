"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCookie, setCookie, deleteCookie, auth as authApi } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ["/login", "/register", "/verify-otp", "/forgot-password", "/reset-password"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = publicPaths.some((path) => pathname?.startsWith(path));

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = getCookie("user");

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(savedUser));
          setUser(parsedUser);
        } catch {
          deleteCookie("user");
        }
      }

      try {
        const currentUser = await authApi.me();
        setUser(currentUser);
        setToken("session");
        setCookie("user", encodeURIComponent(JSON.stringify(currentUser)));
      } catch {
        deleteCookie("user");
        setToken(null);
        setUser(null);
        if (!isPublicPath) {
          router.push("/login");
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [router, isPublicPath]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login({ email, password });
      const { user: userData } = response;

      setUser(userData);
      setToken("session");
      setCookie("user", encodeURIComponent(JSON.stringify(userData)));

      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue local cleanup even if server logout fails.
    }

    setUser(null);
    setToken(null);
    deleteCookie("user");
    router.push("/login");
  }, [router]);

  const setAuth = useCallback((userData: User) => {
    setUser(userData);
    setToken("session");
    setCookie("user", encodeURIComponent(JSON.stringify(userData)));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
