"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { config } from "@/app/config/config";

type Theme = "dark" | "light";

interface User {
    id: string;
    name: string;
    email: string;
}

export interface UserSettings {
    _id: string;
    systemColor: string;
    theme: "dark" | "light";
    defaultCalendarView: "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";
    startHour: number;
    endHour: number;
}

interface AppContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    alerts: AppAlert[];
    pushAlert: (message: string, severity: AlertSeverity) => void;
    userSettings: UserSettings | null;
    applySettings: (s: UserSettings) => void;
}

export type AlertSeverity = 'success' | 'warning' | 'error';

export interface AppAlert {
    message: string;
    severity: AlertSeverity;
    id: number;
}

function applyAccentColor(hex: string) {
    const h = hex.slice(0, 7);
    const r = parseInt(h.slice(1, 3), 16);
    const g = parseInt(h.slice(3, 5), 16);
    const b = parseInt(h.slice(5, 7), 16);
    const rh = Math.round(r + (255 - r) * 0.2);
    const gh = Math.round(g + (255 - g) * 0.2);
    const bh = Math.round(b + (255 - b) * 0.2);
    const hover = `#${rh.toString(16).padStart(2, "0")}${gh.toString(16).padStart(2, "0")}${bh.toString(16).padStart(2, "0")}`;
    const root = document.documentElement;
    root.style.setProperty("--accent", h);
    root.style.setProperty("--accent-hover", hover);
    root.style.setProperty("--accent-muted", `rgba(${r},${g},${b},0.15)`);
    root.style.setProperty("--accent-muted2", `rgba(${r},${g},${b},0.08)`);
}

function clearAccentColor() {
    const root = document.documentElement;
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-hover");
    root.style.removeProperty("--accent-muted");
    root.style.removeProperty("--accent-muted2");
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [user, setUser] = useState<User | null>(null);
    const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
    const [alerts, setAlerts] = useState<AppAlert[]>([]);

    const alertIdRef = useRef(0);
    const pushAlert = useCallback((message: string, severity: AlertSeverity) => {
        const id = ++alertIdRef.current;
        setAlerts(prev => [...prev, { message, severity, id }]);
        const timer = setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== id));
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const applySettings = useCallback((s: UserSettings) => {
        setUserSettings(s);
        setTheme(s.theme);
        applyAccentColor(s.systemColor);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // Restore user from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
    }, []);

    // Fetch and apply settings whenever the user changes
    useEffect(() => {
        if (!user) { setUserSettings(null); return; }
        const token = localStorage.getItem("token");
        if (!token) return;
        fetch(`${config.backendUrl}/settings`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(body => { if (body.data) applySettings(body.data); })
            .catch(() => {});
    }, [user]);

    const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setUserSettings(null);
        clearAccentColor();
    };

    return (
        <AppContext.Provider value={{
            theme, toggleTheme, setTheme,
            user, setUser, logout,
            alerts, pushAlert,
            userSettings, applySettings,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
    return ctx;
}
