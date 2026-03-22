"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [user, setUser] = useState<User | null>(null);

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
        <AppContext.Provider value={{ theme, toggleTheme, user, setUser, logout }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
    return ctx;
}