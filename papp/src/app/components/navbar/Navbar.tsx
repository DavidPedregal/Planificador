"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import Login from "@/app/components/login/login";
import "./Navbar.css";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
];

export default function Navbar() {
    const { user, logout } = useApp();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!langOpen) return;
        const handler = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node))
                setLangOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [langOpen]);

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

    return (
        <>
            <nav className="navbar">
                <div className="navbar-logo" onClick={() => router.push(user ? "/home" : "/")}>
                    <span className="navbar-logo-dot" />
                    {t("navbar.logo")}
                    {user && <span className="navbar-logo-user">{user.name}</span>}
                </div>
                <div className="navbar-actions">
                    <div className="lang-dropdown" ref={langRef}>
                        <button
                            className="navbar-theme-btn lang-dropdown-btn"
                            onClick={() => setLangOpen(o => !o)}
                            title={t("navbar.changeLanguage")}
                        >
                            {currentLang.code.toUpperCase()}
                            <span className={`lang-chevron${langOpen ? " open" : ""}`}>▾</span>
                        </button>
                        {langOpen && (
                            <div className="lang-dropdown-menu">
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`lang-dropdown-item${lang.code === i18n.language ? " active" : ""}`}
                                        onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
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