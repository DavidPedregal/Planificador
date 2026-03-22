"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Login from "@/app/components/Login/login";
import "./Navbar.css";

export default function Navbar() {
    const { theme, toggleTheme, user, logout } = useApp();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-logo" onClick={() => router.push(user ? "/home" : "/")}>
                    <span className="navbar-logo-dot" />
                    Menti
                    {user && <span className="navbar-logo-user">{user.name}</span>}
                </div>
                <div className="navbar-actions">
                    <button className="navbar-theme-btn" onClick={toggleTheme} title="Cambiar tema">
                        {theme === "dark" ? "☀️" : "🌙"}
                    </button>
                    {user ? (
                        <button className="navbar-logout-btn" onClick={handleLogout}>
                            Cerrar sesión
                        </button>
                    ) : (
                        <Login />
                    )}
                </div>
            </nav>
        </>
    );
}