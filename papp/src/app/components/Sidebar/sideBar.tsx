"use client";

import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import "./sideBar.css";
import AddCalendarDialog from "./add-calendar-dialog";
import ConfirmDialog from "./confirm-dialog";
import { config } from "@/app/config/config";
import EditCalendarDialog from "./edit-calendar-dialog";
import { Calendar, Subject } from "../Calendar/calendarHelper";
import AddSubjectDialog from "./add-subject-dialog";
import EditSubjectDialog from "./edit-subject-dialog";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { EditIcon, SettingsIcon, } from "lucide-react";
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal';
import ConstructionIcon from '@mui/icons-material/Construction';

interface SidebarProps {
    onCalendarVisibilityChange?: (visibleIds: string[]) => void;
    onCalendarDeleted?: () => void;
}

export default function Sidebar({ onCalendarVisibilityChange, onCalendarDeleted }: SidebarProps) {
    const { user } = useApp();
    const menuRef = useRef<HTMLDivElement>(null);
    const [defaultCalendars, setDefaultCalendars] = useState<Calendar[]>([]);
    const [customCalendars, setCustomCalendars] = useState<Calendar[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [addCalendarOpen, setAddCalendarOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editCalendarOpen, setEditCalendarOpen] = useState(false);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
    const [addSubjectOpen, setAddSubjectOpen] = useState(false);
    const [editSubjectOpen, setEditSubjectOpen] = useState(false);
    const [deleteSubjectConfirmOpen, setDeleteSubjectConfirmOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [openTools, setOpenTools] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchCalendars();
        fetchDefaultCalendars();
        fetchSubjects();
    }, [user]);


    const toggleVisibility = async (id: string) => {
        try {
            await fetch(config.backendUrl + `/calendars/toggleVisibility/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const updated = customCalendars.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
            setCustomCalendars(updated);
            const updatedDefault = defaultCalendars.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
            setDefaultCalendars(updatedDefault);
            onCalendarVisibilityChange?.(updated.filter(c => c.visible).map(c => c.id));
            onCalendarDeleted?.();
        } catch (error) {
            console.error("Error toggling calendar visibility:", error);
        }
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
        setCustomCalendars(prev => prev.filter(c => c.id !== selectedCalendarId));
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
        .then(data => {setCustomCalendars(data.map((cal: any) => (
            { 
                id: cal._id, 
                name: cal.name, 
                userId: cal.userId, 
                color: cal.color, 
                visible: cal.visible,
                isSystem: cal.isSystem ?? false,
            }
            )));
        })
        .catch(error => console.error("Error fetching calendars:", error));
    };

    const fetchDefaultCalendars = async () => {
        fetch(config.backendUrl + `/calendars/common`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        .then(res => res.json())
        .then(data => {setDefaultCalendars(data.map((cal: any) => (
            { 
                id: cal._id, 
                name: cal.name, 
                userId: cal.userId, 
                color: cal.color, 
                visible: cal.visible,
                isSystem: cal.isSystem ?? false,
            }
            )));
        })
        .catch(error => console.error("Error fetching calendars:", error));
    };


    const fetchSubjects = async () => {
        try {
            const res = await fetch(config.backendUrl + `/subjects`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            setSubjects(data.map((subj: any) => ({
                id: subj._id,
                name: subj.name,
            })));
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const handleDeleteSubject = (id: string) => {
        setSelectedSubjectId(id);
        setDeleteSubjectConfirmOpen(true);
    };

    const confirmDeleteSubject = async () => {
        if (!selectedSubjectId) return;

        try {
            await fetch(config.backendUrl + `/subjects/${selectedSubjectId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setSubjects(prev => prev.filter(s => s.id !== selectedSubjectId));
            setDeleteSubjectConfirmOpen(false);
            setSelectedSubjectId(null);
        } catch (error) {
            console.error("Error deleting subject:", error);
        }
    };

    const handleEditSubject = (id: string) => {
        setEditSubjectOpen(true);
        setSelectedSubjectId(id);
    };

    const sendPlanRequest = async () => {
        try {
            await fetch(config.backendUrl + `/plan`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
        } catch (error) {
            console.error("Error deleting subject:", error);
        }
    };

    return (
        <>
            <div className="sidebar">

                {/* ── General ── */}
                <span className="sidebar-label">General</span>
                <button className="sidebar-nav-item">
                    <SettingsIcon size={"1.25rem"}/>
                    Ajustes
                </button>
                <button className="sidebar-nav-item" onClick={sendPlanRequest}>
                    <AutoFixNormalIcon/>
                    Planificar
                </button>
                <button className="sidebar-nav-item" onClick={() => setOpenTools(true)}>
                    <ConstructionIcon/>
                    Herramientas
                </button>

                <div className="sidebar-divider" />

                {/* ── Calendarios ── */}
                <span className="sidebar-label">Calendarios por defecto</span>
                <div className="sidebar-default-calendars">
                    {defaultCalendars.map(cal => (
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
                        </div>
                    ))}
                </div>
                <span className="sidebar-label">Mis calendarios</span>

                <div className="sidebar-calendars">
                    {customCalendars.map(cal => (
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

                            {customCalendars.length > 1 && (
                            <button className="sidebar-cal-menu-btn danger" onClick={() => handleDelete(cal.id)}>
                                <DeleteForeverIcon fontSize="small"/>
                            </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Añadir calendario ── */}
                <>
                <button className="sidebar-add-btn" onClick={() => setAddCalendarOpen(true)}>
                    + Nuevo calendario
                </button>

                <div className="sidebar-divider" />

                {/* ── Mis asignaturas ── */}
                <span className="sidebar-label">Mis asignaturas</span>

                <div className="sidebar-subjects" ref={menuRef}>
                    {subjects.map(subj => (
                        <div key={subj.id} className="sidebar-subj-item">
                            <span className="sidebar-subj-name">{subj.name}</span>
                            
                            <button className="sidebar-subj-menu-btn" onClick={() => handleEditSubject(subj.id)}>
                                <EditIcon size={"1rem"}/>
                            </button>
                            <button className="sidebar-subj-menu-btn danger" onClick={() => handleDeleteSubject(subj.id)}>
                                <DeleteForeverIcon fontSize="small"/>
                            </button>
                        </div>
                    ))}
                </div>

                {/* ── Añadir asignatura ── */}
                <button className="sidebar-add-btn" onClick={() => setAddSubjectOpen(true)}>
                    + Nueva asignatura
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
                    calendar={defaultCalendars.concat(customCalendars).find(c => c.id === selectedCalendarId) || {
                        id: "",
                        name: "",
                        color: "",
                        visible: true,
                    }}
                    onClose={() => {setEditCalendarOpen(false); setSelectedCalendarId(null);}}
                    onSave={() => {fetchCalendars(); onCalendarDeleted?.();}}
                />

                <AddSubjectDialog
                    open={addSubjectOpen}
                    onClose={() => setAddSubjectOpen(false)}
                    onSave={fetchSubjects}
                />

                <EditSubjectDialog
                    open={editSubjectOpen}
                    subject={subjects.find(s => s.id === selectedSubjectId) || {
                        id: "",
                        name: "",
                    }}
                    onClose={() => {setEditSubjectOpen(false); setSelectedSubjectId(null);}}
                    onSave={fetchSubjects}
                />

                <ConfirmDialog
                    open={deleteSubjectConfirmOpen}
                    title="Eliminar asignatura"
                    message="¿Estás seguro de que deseas eliminar esta asignatura? Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    isDangerous={true}
                    onConfirm={confirmDeleteSubject}
                    onCancel={() => {
                        setDeleteSubjectConfirmOpen(false);
                        setSelectedSubjectId(null);
                    }}
                />
                </>
            </div>
        </>
    );
}