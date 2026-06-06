"use client";

import "./page.css";
import { useEffect, useRef, useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useSettings } from "./hooks/useSettings";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import ConfirmDialog from "@/app/components/sidebar/confirm-dialog";

export default function SettingsPage() {
    const { authReady } = useAuthGuard();
    const { t } = useTranslation();
    const router = useRouter();
    const { user, theme, logout, pushAlert } = useApp();
    const { settings, loading, updateField, patchLocal } = useSettings();

    const [startHour, setStartHour] = useState(8);
    const [endHour, setEndHour] = useState(20);
    const [hourError, setHourError] = useState("");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const colorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (settings) {
            setStartHour(settings.startHour);
            setEndHour(settings.endHour);
        }
    }, [settings]);

    const handleThemeChange = (newTheme: "dark" | "light") => {
        updateField("theme", newTheme);
    };

    const handleColorChange = (color: string) => {
        patchLocal("systemColor", color);
        if (colorTimeoutRef.current) clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = setTimeout(() => updateField("systemColor", color), 400);
    };

    const handleViewChange = (view: string) => {
        updateField("defaultCalendarView", view as any);
    };

    const validateAndSaveHours = (newStart: number, newEnd: number) => {
        if (newStart >= newEnd) {
            setHourError(t("settings.hourError"));
            return;
        }
        setHourError("");
        if (newStart !== settings?.startHour) updateField("startHour", newStart);
        if (newEnd !== settings?.endHour) updateField("endHour", newEnd);
    };

    const handleDeleteAccount = async () => {
        setDeleteDialogOpen(false);
        const { ok, message } = await apiFetch(`${config.backendUrl}/users/account`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!ok) { pushAlert(message, "error"); return; }
        logout();
        router.push("/");
    };

    if (!authReady) return null;

    return (
        <div className="settings-page">
            <div className="settings-header">
                <button className="settings-back-btn" onClick={() => router.push("/home")}>
                    <ChevronLeftIcon size="1.1rem" />
                    {t("settings.back")}
                </button>
                <h1 className="settings-title">{t("settings.title")}</h1>
            </div>

            {loading ? (
                <p className="settings-loading">{t("common.loading")}</p>
            ) : settings && (
                <>
                    {/* Appearance */}
                    <section className="settings-section">
                        <h2 className="settings-section-title">{t("settings.appearance")}</h2>

                        <div className="settings-row">
                            <span className="settings-label">{t("settings.theme")}</span>
                            <div className="settings-theme-toggle">
                                <button
                                    className={`settings-theme-btn${theme === "dark" ? " active" : ""}`}
                                    onClick={() => handleThemeChange("dark")}
                                >
                                    🌙 {t("settings.themeDark")}
                                </button>
                                <button
                                    className={`settings-theme-btn${theme === "light" ? " active" : ""}`}
                                    onClick={() => handleThemeChange("light")}
                                >
                                    ☀️ {t("settings.themeLight")}
                                </button>
                            </div>
                        </div>

                        <div className="settings-row">
                            <span className="settings-label">{t("settings.systemColor")}</span>
                            <div className="settings-color-row">
                                <input
                                    type="color"
                                    className="settings-color-input"
                                    value={settings.systemColor.slice(0, 7)}
                                    onChange={e => handleColorChange(e.target.value)}
                                />
                                <span className="settings-color-value">{settings.systemColor.slice(0, 7)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Calendar */}
                    <section className="settings-section">
                        <h2 className="settings-section-title">{t("settings.calendar")}</h2>

                        <div className="settings-row">
                            <span className="settings-label">{t("settings.defaultView")}</span>
                            <select
                                className="settings-select"
                                value={settings.defaultCalendarView}
                                onChange={e => handleViewChange(e.target.value)}
                            >
                                {(["dayGridMonth", "timeGridWeek", "timeGridDay", "listWeek"] as const).map(v => (
                                    <option key={v} value={v}>{t(`settings.views.${v}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="settings-row">
                            <span className="settings-label">{t("settings.slotDuration")}</span>
                            <select
                                className="settings-select"
                                value={settings.slotDuration}
                                onChange={e => updateField("slotDuration", e.target.value)}
                            >
                                <option value="00:15:00">{t("settings.slotDurations.15min")}</option>
                                <option value="00:30:00">{t("settings.slotDurations.30min")}</option>
                                <option value="01:00:00">{t("settings.slotDurations.1hour")}</option>
                            </select>
                        </div>

                        <div className="settings-row">
                            <span className="settings-label">{t("settings.startHour")}</span>
                            <input
                                type="number"
                                className="settings-number-input"
                                min={0}
                                max={endHour-1}
                                value={startHour}
                                onChange={e => setStartHour(Number(e.target.value))}
                            />
                        </div>

                        <div className="settings-row">
                            <span className="settings-label">{t("settings.endHour")}</span>
                            <input
                                type="number"
                                className="settings-number-input"
                                min={startHour+1}
                                max={24}
                                value={endHour}
                                onChange={e => setEndHour(Number(e.target.value))}
                            />
                        </div>

                        {hourError && <p className="settings-error">{hourError}</p>}

                        <div className="settings-hours-save-row">
                            <button
                                className="settings-save-btn"
                                onClick={() => validateAndSaveHours(startHour, endHour)}
                            >
                                {t("common.saveChanges")}
                            </button>
                        </div>
                    </section>

                    {/* Account */}
                    <section className="settings-section">
                        {/* <h2 className="settings-section-title"></h2> */}

                        <div className="settings-row">
                            <span className="settings-label">{t("settings.deleteAccount")}</span>
                            <button
                                className="settings-danger-btn"
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                {t("settings.deleteAccountBtn")}
                            </button>
                        </div>
                    </section>
                </>
            )}

            <ConfirmDialog
                open={deleteDialogOpen}
                title={t("settings.deleteAccountTitle")}
                message={t("settings.deleteAccountMsg")}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                isDangerous
                onConfirm={handleDeleteAccount}
                onCancel={() => setDeleteDialogOpen(false)}
            />
        </div>
    );
}
