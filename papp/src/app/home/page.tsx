"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import Calendar from "@/app/components/calendar/calendar";
import TodoList from "@/app/components/todoList/todoList";
import "./home.css";
import Sidebar from "../components/sidebar/sideBar";


export default function Home() {
    const [drawerOpen, setDrawerOpen] = useState<"sidebar" | "todo" | null>(null);
    const [refreshEvents, setRefreshEvents] = useState(0);
    const { t } = useTranslation();

    const closeDrawer = () => setDrawerOpen(null);

    return (
        <>
            <div className="home-root">

                {/* ── Sidebar izquierdo ─────────────────────────────────────────── */}
                <aside className="home-sidebar" aria-label={t("home.sidebarAriaLabel")}>
                   <Sidebar onCalendarDeleted={() => setRefreshEvents(prev => prev + 1)} />
                </aside>

                {/* ── Calendario (centro) ───────────────────────────────────────── */}
                <main className="home-calendar" aria-label={t("home.calendarAriaLabel")}>
                    <div className="home-calendar-inner">
                        <Calendar refreshTrigger={refreshEvents} />
                    </div>
                </main>

                {/* ── To do-list (derecha) ───────────────────────────────────────── */}
                <aside className="home-todo" aria-label={t("home.taskListAriaLabel")}>
                    <div className="home-todo-inner">
                        <TodoList />
                    </div>
                </aside>
            </div>

            {/* ── FABs móvil ────────────────────────────────────────────────────── */}
            <div className="mobile-fab-group" role="group" aria-label={t("home.panelsAriaLabel")}>
                <button
                    className={`mobile-fab${drawerOpen === "sidebar" ? " active" : ""}`}
                    onClick={() => setDrawerOpen(d => d === "sidebar" ? null : "sidebar")}
                    aria-label={t("home.openSettingsAriaLabel")}
                    title={t("home.settingsTitle")}
                >⚙️</button>
                <button
                    className={`mobile-fab${drawerOpen === "todo" ? " active" : ""}`}
                    onClick={() => setDrawerOpen(d => d === "todo" ? null : "todo")}
                    aria-label={t("home.openTaskListAriaLabel")}
                    title={t("home.tasksTitle")}
                >✅</button>
            </div>

            {/* ── Drawer overlay ─────────────────────────────────────────────────── */}
            {drawerOpen && (
                <div
                    className="mobile-drawer-overlay open"
                    onClick={closeDrawer}
                    aria-hidden="true"
                />
            )}

            {/* Drawer sidebar */}
            {drawerOpen === "sidebar" && (
                <div className="mobile-drawer drawer-left" role="dialog" aria-label={t("home.settingsTitle")}>
                    <div className="mobile-drawer-header">
                        <span className="mobile-drawer-title">{t("home.settingsTitle")}</span>
                        <button className="mobile-drawer-close" onClick={closeDrawer}>✕</button>
                    </div>
                    <div className="mobile-drawer-body">
                        <Sidebar onCalendarDeleted={() => setRefreshEvents(prev => prev + 1)} />
                    </div>
                </div>
            )}

            {/* Drawer todo-list */}
            {drawerOpen === "todo" && (
                <div className="mobile-drawer drawer-right" role="dialog" aria-label={t("home.taskListAriaLabel")}>
                    <div className="mobile-drawer-header">
                        <span className="mobile-drawer-title">{t("home.tasksTitle")}</span>
                        <button className="mobile-drawer-close" onClick={closeDrawer}>✕</button>
                    </div>
                    <div className="mobile-drawer-body" style={{ padding: 0 }}>
                        <TodoList />
                    </div>
                </div>
            )}
        </>
    );
}
