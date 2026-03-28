"use client";

import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import "./sideBar.css";
import AddCalendarDialog from "./add-calendar-dialog";
import ConfirmDialog from "./confirm-dialog";
import { config } from "@/app/config/config";
import EditCalendarDialog from "./edit-calendar-dialog";
import { Calendar } from "../Calendar/calendarHelper";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { EditIcon, SettingsIcon, } from "lucide-react";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

interface SidebarProps {
    onCalendarVisibilityChange?: (visibleIds: string[]) => void;
    onCalendarDeleted?: () => void;
}

export default function Sidebar({ onCalendarVisibilityChange, onCalendarDeleted }: SidebarProps) {
    const { user } = useApp();
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);
    const [addCalendarOpen, setAddCalendarOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editCalendarOpen, setEditCalendarOpen] = useState(false);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchCalendars();
    }, [user]);


    const toggleVisibility = (id: string) => {
        const updated = calendars.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
        setCalendars(updated);
        onCalendarVisibilityChange?.(updated.filter(c => c.visible).map(c => c.id));
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
        setCalendars(prev => prev.filter(c => c.id !== selectedCalendarId));
        setDeleteConfirmOpen(false);
        setSelectedCalendarId(null);
        onCalendarDeleted?.();
    };

    const handleEdit = (id: string) => {
        setEditCalendarOpen(true);
        setSelectedCalendarId(id);
    };

    const fetchCalendars = async () => {
        fetch(config.backendUrl + `/calendars`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then(res => res.json())
        .then(data => {setCalendars(data.map((cal: any) => (
            { 
                id: cal._id, 
                name: cal.name, 
                userId: cal.userId, 
                color: cal.color, 
                visible: cal.visible
            }
            )));
        })
        .catch(error => console.error("Error fetching calendars:", error));
    };

    return (
        <>
            <div className="sidebar">

                {/* ── General ── */}
                <span className="sidebar-label">General</span>
                <button className="sidebar-nav-item active">
                    <PersonOutlineIcon/>
                    Perfil
                </button>
                <button className="sidebar-nav-item">
                    <SettingsIcon size={"1.25rem"}/>
                    Ajustes
                </button>

                <div className="sidebar-divider" />

                {/* ── Calendarios ── */}
                <span className="sidebar-label">Mis calendarios</span>

                <div className="sidebar-calendars" ref={menuRef}>
                    {calendars.map(cal => (
                        <div key={cal.id} className="sidebar-cal-item">
                            <div
                                className={`sidebar-cal-checkbox${cal.visible ? " checked" : ""}`}
                                style={cal.visible ? { background: cal.color } : {}}
                                onClick={() => toggleVisibility(cal.id)}
                            >
                                <svg className="sidebar-cal-checkbox-tick" viewBox="0 0 8 8" fill="none">
                                    <path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <span className="sidebar-cal-name">{cal.name}</span>
                            
                            <button className="sidebar-cal-menu-btn" onClick={() => handleEdit(cal.id)}>
                                <EditIcon size={"1rem"}/>
                            </button>
                            <button className="sidebar-cal-menu-btn danger" onClick={() => handleDelete(cal.id)}>
                                <DeleteForeverIcon fontSize="small"/>
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
                
                <EditCalendarDialog
                    open={editCalendarOpen}
                    calendar={calendars.find(c => c.id === selectedCalendarId) || {
                        id: "",
                        name: "",
                        color: "",
                        visible: true,
                    }}
                    onClose={() => {setEditCalendarOpen(false); setSelectedCalendarId(null);}}
                    onSave={() => {fetchCalendars(); onCalendarDeleted?.();}}
                />

                </>
            </div>
        </>
    );
}