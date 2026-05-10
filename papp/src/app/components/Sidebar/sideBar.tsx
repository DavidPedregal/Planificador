"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { EditIcon, SettingsIcon } from "lucide-react";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AutoFixNormalIcon from "@mui/icons-material/AutoFixNormal";
import ConstructionIcon from "@mui/icons-material/Construction";
import { useSidebarCalendars } from "./hooks/useSidebarCalendars";
import { useSubjects } from "@/app/components/shared/hooks/useSubjects";
import { useConfirmDelete } from "@/app/components/shared/hooks/useConfirmDelete";
import AddCalendarDialog from "./add-calendar-dialog";
import EditCalendarDialog from "./edit-calendar-dialog";
import AddSubjectDialog from "./add-subject-dialog";
import EditSubjectDialog from "./edit-subject-dialog";
import ConfirmDialog from "./confirm-dialog";
import "./sideBar.css";

interface SidebarProps {
    onCalendarVisibilityChange?: (visibleIds: string[]) => void;
    onCalendarDeleted?: () => void;
}

export default function Sidebar({ onCalendarVisibilityChange, onCalendarDeleted }: SidebarProps) {
    const { user, pushAlert } = useApp();
    const enabled = !!user;

    const {
        customCalendars,
        defaultCalendars,
        fetchCustomCalendars,
        refetchAll,
        toggleVisibility,
        deleteCalendar,
    } = useSidebarCalendars({
        enabled,
        pushAlert,
        onVisibilityChange: onCalendarVisibilityChange,
        onCalendarDeleted,
    });

    const { subjects, fetchSubjects, deleteSubject } = useSubjects({ enabled, pushAlert });

    // ── Confirm delete calendars ──────────────────────────────────────────────
    const calendarConfirm = useConfirmDelete<string>({ onConfirm: deleteCalendar });

    // ── Confirm delete subjects ───────────────────────────────────────────────
    const subjectConfirm = useConfirmDelete<string>({ onConfirm: deleteSubject });

    // ── Edit calendar ─────────────────────────────────────────────────────────
    const [editCalendarOpen, setEditCalendarOpen] = useState(false);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

    const handleEditCalendar = (id: string) => {
        setSelectedCalendarId(id);
        setEditCalendarOpen(true);
    };

    // ── Edit subject ──────────────────────────────────────────────────────────
    const [editSubjectOpen, setEditSubjectOpen] = useState(false);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    const handleEditSubject = (id: string) => {
        setSelectedSubjectId(id);
        setEditSubjectOpen(true);
    };

    // ── Add dialogs ───────────────────────────────────────────────────────────
    const [addCalendarOpen, setAddCalendarOpen] = useState(false);
    const [addSubjectOpen, setAddSubjectOpen] = useState(false);

    // ── Plan request ──────────────────────────────────────────────────────────
    const sendPlanRequest = async () => {
        const { ok, message } = await apiFetch(`${config.backendUrl}/plan`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        pushAlert(message, ok ? "success" : "error");
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const allCalendars = [...defaultCalendars, ...customCalendars];
    const selectedCalendar = allCalendars.find(c => c.id === selectedCalendarId) ?? {
        id: "", name: "", color: "", visible: true,
    };
    const selectedSubject = subjects.find(s => s.id === selectedSubjectId) ?? {
        id: "", name: "",
    };

    return (
        <>
            <div className="sidebar">

                {/* ── General ── */}
                <span className="sidebar-label">General</span>
                <button className="sidebar-nav-item">
                    <SettingsIcon size="1.25rem" />
                    Ajustes
                </button>
                <button className="sidebar-nav-item" onClick={sendPlanRequest}>
                    <AutoFixNormalIcon />
                    Planificar
                </button>
                <button className="sidebar-nav-item">
                    <ConstructionIcon />
                    Herramientas
                </button>

                <div className="sidebar-divider" />

                {/* ── Calendarios por defecto ── */}
                <span className="sidebar-label">Calendarios por defecto</span>
                <div className="sidebar-default-calendars">
                    {defaultCalendars.map(cal => (
                        <CalendarItem
                            key={cal.id}
                            name={cal.name}
                            color={cal.color}
                            visible={cal.visible}
                            onToggle={() => toggleVisibility(cal.id)}
                        />
                    ))}
                </div>

                {/* ── Mis calendarios ── */}
                <span className="sidebar-label">Mis calendarios</span>
                <div className="sidebar-calendars">
                    {customCalendars.map(cal => (
                        <CalendarItem
                            key={cal.id}
                            name={cal.name}
                            color={cal.color}
                            visible={cal.visible}
                            onToggle={() => toggleVisibility(cal.id)}
                            onEdit={() => handleEditCalendar(cal.id)}
                            onDelete={customCalendars.length > 1 ? () => calendarConfirm.handleDelete(cal.id) : undefined}
                        />
                    ))}
                </div>

                <button className="sidebar-add-btn" onClick={() => setAddCalendarOpen(true)}>
                    + Nuevo calendario
                </button>

                <div className="sidebar-divider" />

                {/* ── Asignaturas ── */}
                <span className="sidebar-label">Mis asignaturas</span>
                <div className="sidebar-subjects">
                    {subjects.map(subj => (
                        <div key={subj.id} className="sidebar-subj-item">
                            <span className="sidebar-subj-name">{subj.name}</span>
                            <button className="sidebar-subj-menu-btn" onClick={() => handleEditSubject(subj.id)}>
                                <EditIcon size="1rem" />
                            </button>
                            <button className="sidebar-subj-menu-btn danger" onClick={() => subjectConfirm.handleDelete(subj.id)}>
                                <DeleteForeverIcon fontSize="small" />
                            </button>
                        </div>
                    ))}
                </div>
                <button className="sidebar-add-btn" onClick={() => setAddSubjectOpen(true)}>
                    + Nueva asignatura
                </button>

            </div>

            {/* ── Diálogos ── */}
            <AddCalendarDialog
                open={addCalendarOpen}
                onClose={() => setAddCalendarOpen(false)}
                onSave={fetchCustomCalendars}
            />

            <EditCalendarDialog
                open={editCalendarOpen}
                calendar={selectedCalendar}
                onClose={() => { setEditCalendarOpen(false); setSelectedCalendarId(null); }}
                onSave={() => { refetchAll(); onCalendarDeleted?.(); }}
            />

            <ConfirmDialog
                open={calendarConfirm.open}
                title="Eliminar calendario"
                message="¿Estás seguro de que deseas eliminar este calendario? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDangerous={true}
                onConfirm={calendarConfirm.confirm}
                onCancel={calendarConfirm.cancel}
            />

            <AddSubjectDialog
                open={addSubjectOpen}
                onClose={() => setAddSubjectOpen(false)}
                onSave={fetchSubjects}
            />

            <EditSubjectDialog
                open={editSubjectOpen}
                subject={selectedSubject}
                onClose={() => { setEditSubjectOpen(false); setSelectedSubjectId(null); }}
                onSave={fetchSubjects}
            />

            <ConfirmDialog
                open={subjectConfirm.open}
                title="Eliminar asignatura"
                message="¿Estás seguro de que deseas eliminar esta asignatura? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDangerous={true}
                onConfirm={subjectConfirm.confirm}
                onCancel={subjectConfirm.cancel}
            />
        </>
    );
}

// ── CalendarItem ──────────────────────────────────────────────────────────────

interface CalendarItemProps {
    name: string;
    color: string;
    visible: boolean;
    onToggle: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

function CalendarItem({ name, color, visible, onToggle, onEdit, onDelete }: CalendarItemProps) {
    return (
        <div className="sidebar-cal-item">
            <div
                className={`sidebar-cal-checkbox${visible ? " checked" : ""}`}
                style={visible ? { background: color } : {}}
                onClick={onToggle}
            >
                <svg className="sidebar-cal-checkbox-tick" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="sidebar-cal-name">{name}</span>
            {onEdit && (
                <button className="sidebar-cal-menu-btn" onClick={onEdit}>
                    <EditIcon size="1rem" />
                </button>
            )}
            {onDelete && (
                <button className="sidebar-cal-menu-btn danger" onClick={onDelete}>
                    <DeleteForeverIcon fontSize="small" />
                </button>
            )}
        </div>
    );
}