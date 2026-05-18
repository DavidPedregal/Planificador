"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import Login from "@/app/components/login/login";
import "./Navbar.css";

export default function Navbar() {
    const { theme, toggleTheme, user, logout } = useApp();
    const router = useRouter();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-logo" onClick={() => router.push(user ? "/home" : "/")}>
                    <span className="navbar-logo-dot" />
                    {t("navbar.logo")}
                    {user && <span className="navbar-logo-user">{user.name}</span>}
                </div>
                <div className="navbar-actions">
                    <button className="navbar-theme-btn" onClick={toggleTheme} title={t("navbar.changeTheme")}>
                        {theme === "dark" ? "☀️" : "🌙"}
                    </button>
                    {user ? (
                        <button className="navbar-logout-btn" onClick={handleLogout}>
                            {t("navbar.logout")}
                        </button>
                    ) : (
                        <Login />
                    )}
                </div>
            </nav>
        </>
    );
}