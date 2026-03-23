"use client";

import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import "./sideBar.css";
import AddCalendarDialog from "./add-calendar-dialog";
import ConfirmDialog from "./confirm-dialog";
import { config } from "@/app/config/config";

interface Calendar {
    _id: string;
    name: string;
    color: string;
    visible: boolean;
}

interface SidebarProps {
    onCalendarVisibilityChange?: (visibleIds: string[]) => void;
}

const COLORS = [
    "#7c6ff7", "#1d9e75", "#d85a30",
    "#e94f8a", "#3b82f6", "#f59e0b",
];

export default function Sidebar({ onCalendarVisibilityChange }: SidebarProps) {
    const { user } = useApp();
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);
    const [addCalendarOpen, setAddCalendarOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchCalendars();
    }, [user]);


    const toggleVisibility = (id: string) => {
        const updated = calendars.map(c => c._id === id ? { ...c, visible: !c.visible } : c);
        setCalendars(updated);
        onCalendarVisibilityChange?.(updated.filter(c => c.visible).map(c => c._id));
    };

    const handleDelete = (id: string) => {
        setSelectedCalendarId(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCalendarId) return;
        
        await fetch(config.backendUrl + `/calendars/${selectedCalendarId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setCalendars(prev => prev.filter(c => c._id !== selectedCalendarId));
        setDeleteConfirmOpen(false);
        setSelectedCalendarId(null);
    };

    const handleEdit = (id: string) => {
        // TODO: abrir dialog de edición
    };

    const fetchCalendars = async () => {
        fetch(config.backendUrl + `/calendars`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
            .then(res => res.json())
            .then(data => setCalendars(data.map((c: Omit<Calendar, "visible">) => ({ ...c, visible: true }))));
    };

    return (
        <>
            <div className="sidebar">

                {/* ── General ── */}
                <span className="sidebar-label">General</span>
                <button className="sidebar-nav-item active">
                    <svg className="sidebar-nav-icon" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Perfil
                </button>
                <button className="sidebar-nav-item">
                    <svg className="sidebar-nav-icon" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.36 3.64l-1.06 1.06M4.7 11.3l-1.06 1.06M12.36 12.36l-1.06-1.06M4.7 4.7 3.64 3.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Ajustes
                </button>

                <div className="sidebar-divider" />

                {/* ── Calendarios ── */}
                <span className="sidebar-label">Mis calendarios</span>

                <div className="sidebar-calendars" ref={menuRef}>
                    {calendars.map(cal => (
                        <div key={cal._id} className="sidebar-cal-item">
                            <div
                                className={`sidebar-cal-checkbox${cal.visible ? " checked" : ""}`}
                                style={cal.visible ? { background: cal.color } : {}}
                                onClick={() => toggleVisibility(cal._id)}
                            >
                                <svg className="sidebar-cal-checkbox-tick" viewBox="0 0 8 8" fill="none">
                                    <path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <span className="sidebar-cal-name">{cal.name}</span>
                            
                            <button className="sidebar-cal-menu-btn" onClick={() => handleEdit(cal._id)}>
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                    <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                </svg>
                            </button>
                            <button className="sidebar-cal-menu-btn danger" onClick={() => handleDelete(cal._id)}>
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                    <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>

                {/* ── Añadir calendario ── */}
                <>
                <button className="sidebar-add-btn" onClick={() => setAddCalendarOpen(true)}>
                    + Nuevo calendario
                </button>

                <AddCalendarDialog
                    open={addCalendarOpen}
                    onClose={() => setAddCalendarOpen(false)}
                    onSave={fetchCalendars}
                    />

                <ConfirmDialog
                    open={deleteConfirmOpen}
                    title="Eliminar calendario"
                    message="¿Estás seguro de que deseas eliminar este calendario? Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    isDangerous={true}
                    onConfirm={confirmDelete}
                    onCancel={() => {
                        setDeleteConfirmOpen(false);
                        setSelectedCalendarId(null);
                    }}
                    />
                </>
            </div>
        </>
    );
}