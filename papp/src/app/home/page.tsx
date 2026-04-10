"use client";

import { useState } from "react";
import Calendar from "@/app/components/calendar/calendar";
import TodoList from "@/app/components/todoList/todoList";
import "./home.css";
import Sidebar from "../components/Sidebar/sideBar";


export default function Home() {
    const [drawerOpen, setDrawerOpen] = useState<"sidebar" | "todo" | null>(null);
    const [refreshEvents, setRefreshEvents] = useState(0);

    const closeDrawer = () => setDrawerOpen(null);

    return (
        <>
            <div className="home-root">

                {/* ── Sidebar izquierdo ─────────────────────────────────────────── */}
                <aside className="home-sidebar" aria-label="Barra lateral">
                   <Sidebar onCalendarDeleted={() => setRefreshEvents(prev => prev + 1)} />
                </aside>

                {/* ── Calendario (centro) ───────────────────────────────────────── */}
                <main className="home-calendar" aria-label="Calendario">
                    <div className="home-calendar-inner">
                        <Calendar refreshTrigger={refreshEvents} />
                    </div>
                </main>

                {/* ── To do-list (derecha) ───────────────────────────────────────── */}
                <aside className="home-todo" aria-label="Lista de tareas">
                    <div className="home-todo-inner">
                        <TodoList />
                    </div>
                </aside>
            </div>

            {/* ── FABs móvil ────────────────────────────────────────────────────── */}
            <div className="mobile-fab-group" role="group" aria-label="Paneles">
                <button
                    className={`mobile-fab${drawerOpen === "sidebar" ? " active" : ""}`}
                    onClick={() => setDrawerOpen(d => d === "sidebar" ? null : "sidebar")}
                    aria-label="Abrir configuración"
                    title="Configuración"
                >⚙️</button>
                <button
                    className={`mobile-fab${drawerOpen === "todo" ? " active" : ""}`}
                    onClick={() => setDrawerOpen(d => d === "todo" ? null : "todo")}
                    aria-label="Abrir lista de tareas"
                    title="Tareas"
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
                <div className="mobile-drawer drawer-left" role="dialog" aria-label="Configuración">
                    <div className="mobile-drawer-header">
                        <span className="mobile-drawer-title">Configuración</span>
                        <button className="mobile-drawer-close" onClick={closeDrawer}>✕</button>
                    </div>
                    <div className="mobile-drawer-body">
                        {/* Aquí irá tu componente de sidebar cuando lo tengas */}
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            Tu sidebar de configuración aparecerá aquí.
                        </p>
                    </div>
                </div>
            )}

            {/* Drawer todo-list */}
            {drawerOpen === "todo" && (
                <div className="mobile-drawer drawer-right" role="dialog" aria-label="Lista de tareas">
                    <div className="mobile-drawer-header">
                        <span className="mobile-drawer-title">Tareas</span>
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