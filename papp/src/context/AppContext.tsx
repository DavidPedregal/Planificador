"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Theme = "dark" | "light";

interface User {
    id: string;
    name: string;
    email: string;
}

interface AppContextType {
    theme: Theme;
    toggleTheme: () => void;
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    alerts: AppAlert[];
    pushAlert: (message: string, severity: AlertSeverity) => void
}

export type AlertSeverity = 'success' | 'warning' | 'error';

export interface AppAlert {
  message: string;
  severity: AlertSeverity;
  id: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [user, setUser] = useState<User | null>(null);

    // AppContext.tsx
    const [alerts, setAlerts] = useState<AppAlert[]>([]);

    const alertIdRef = useRef(0);
    const pushAlert = useCallback((message: string, severity: AlertSeverity) => {
        const id = ++alertIdRef.current;
        setAlerts(prev => [...prev, { message, severity, id }]);

        // Auto-dismiss después de 4s
        const timer = setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== id));
        }, 4000);
        return () => clearTimeout(timer); // por si lo necesitas en algún useEffect
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // Al cargar, recupera el usuario guardado si existe
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AppContext.Provider value={{ theme, toggleTheme, user, setUser, logout, alerts, pushAlert }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
    return ctx;
}