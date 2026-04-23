import React, { useState, useEffect } from "react";
import "./add-event-dialog.css";
import EastIcon from '@mui/icons-material/East';
import { config } from "@/app/config/config";
import { CalendarEvent, EVENT_COLORS, Calendar} from "../Calendar/calendarHelper";
import RecurrenceChoiceDialog from "./recurrence-choice-dialog";


interface Props {
    open: boolean;
    event: CalendarEvent;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
}

const EditEventDialog: React.FC<Props> = ({open, event, onClose, onSave, onDelete}) => {
    const [eventTitle, setEventTitle] = useState(event.title);
    const [label, setLabel] = useState(event.label || "");
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [calendarId, setCalendarId] = useState(event.calendarId);
    const [color, setColor] = useState(event.color);
    const [useCustomColor, setUseCustomColor] = useState(false);
    const [start, setStart] = useState<Date>(typeof event.start === 'string' ? new Date(event.start) : event.start);
    const [end, setEnd] = useState<Date>(typeof event.end === 'string' ? new Date(event.end) : event.end);
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"update" | "delete" | null>(null);
    const [pendingEventData, setPendingEventData] = useState<any>(null);

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            fetchCalendars();
            setEventTitle(event.title);
            setLabel(event.label || "");
            setCalendarId(event.calendarId);
            setStart(typeof event.start === 'string' ? new Date(event.start) : event.start);
            setEnd(typeof event.end === 'string' ? new Date(event.end) : event.end);
            setColor(event.color);
            setUseCustomColor(!event.useCalendarColor);
        }
    }, [open, event]);

    const fetchCalendars = async () => {
        try {
            const res = await fetch(config.backendUrl + "/calendars", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            const customCalendars = data.map((cal: any) => ({ id: cal._id, name: cal.name, userId: cal.userId, color: cal.color }));
            
            const commonRes = await fetch(config.backendUrl + "/calendars/common", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const commonData = await commonRes.json();
            const commonCalendars = commonData
                .filter((cal: any) => cal.name !== "Planned")
                .map((cal: any) => ({ id: cal._id, name: cal.name, userId: cal.userId, color: cal.color }));
            
            setCalendars([...customCalendars, ...commonCalendars]);
        } catch (error) {
            console.error("Error fetching calendars:", error);
        }
    };

    const getDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getTimeString = (date: Date): string => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const createDateFromParts = (dateStr: string, timeStr: string): Date => {
        if (!dateStr || !timeStr) return new Date();
        return new Date(`${dateStr}T${timeStr}`);
    };

    const handleSaveClicked = async () => {
        if (!eventTitle.trim()) return;

        const getEventColor = () => {
            if (useCustomColor) {
                return color;
            }
            // Use calendar's color or default
            const selectedCalendar = calendars.find(cal => cal.id === calendarId);
            return selectedCalendar?.color || EVENT_COLORS[0].value;
        };

        const updatedEvent = {
            title: eventTitle,
            label: label || undefined,
            color: getEventColor(),
            calendarId,
            start: start,
            end: end,
            useCalendarColor: !useCustomColor,
        };

        setPendingEventData(updatedEvent);
        setPendingAction("update");
        setRecurrenceChoiceOpen(true);
    };

    const performUpdate = async (updatedEvent: any, updateMode: "single" | "all" | "fromThis") => {
        try {
            let url = config.backendUrl + `/events/${event.id}`;
            if (updateMode === "all") {
                url = config.backendUrl + `/events/all/${event.id}`;
            } else if (updateMode === "fromThis") {
                url = config.backendUrl + `/events/forward/${event.id}`;
            }
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(updatedEvent),
            });

            await response.json();
            onSave();
            onClose();
        } catch (error) {
            console.error("Error updating event:", error);
        }
    };

    const handleDeleteClicked = async () => {
        setPendingAction("delete");
        setRecurrenceChoiceOpen(true);
    };

    const performDelete = async (deleteMode: "single" | "all" | "fromThis") => {
        try {
            let url = config.backendUrl + `/events/${event.id}`;
            if (deleteMode === "all") {
                url = config.backendUrl + `/events/all/${event.id}`;
            } else if (deleteMode === "fromThis") {
                url = config.backendUrl + `/events/forward/${event.id}`;
            }
            await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            onDelete();
            onClose();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    if (!open) return null;

    return (
        <>
            <div
                className="aed-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
                role="dialog" aria-modal="true" aria-label="Editar evento"
            >
                <div className="aed-dialog" style={{ "--aed-color": color } as React.CSSProperties}>

                    {/* Header */}
                    <div className="aed-header">
                        <div className="aed-header-left">
                            <div className="aed-header-dot" />
                            <span className="aed-title">Editar evento</span>
                        </div>
                        <button className="aed-close" onClick={onClose} aria-label="Cerrar">✕</button>
                    </div>

                    {/* Date strip */}
                    <div className="aed-date-strip">
                        <div className="aed-date-field">
                            <span className="aed-date-icon">⏱</span>
                            <input
                                className="aed-date-input"
                                type="date"
                                value={getDateString(start)}
                                onChange={e => {
                                    const newStart = createDateFromParts(e.target.value, getTimeString(start));
                                    setStart(newStart);
                                    if (end <= newStart) {
                                        setEnd(new Date(newStart.getTime() + 60 * 60 * 1000));
                                    }
                                }}
                            />
                        </div>
                        <span className="aed-date-arrow"><EastIcon /></span>
                        <div className="aed-date-field">
                            <input
                                className="aed-date-input"
                                type="date"
                                value={getDateString(end)}
                                min={getDateString(start)}
                                onChange={e => setEnd(createDateFromParts(e.target.value, getTimeString(end)))}
                            />
                        </div>
                    </div>

                    {/* Time strip */}
                    <div className="aed-date-strip">
                        <div className="aed-date-field">
                            <input
                                className="aed-date-input"
                                type="time"
                                value={getTimeString(start)}
                                onChange={e => {
                                    const newStart = createDateFromParts(getDateString(start), e.target.value);
                                    setStart(newStart);
                                    if (end <= newStart) {
                                        setEnd(new Date(newStart.getTime() + 60 * 60 * 1000));
                                    }
                                }}
                            />
                        </div>
                        <span className="aed-date-arrow"><EastIcon /></span>
                        <div className="aed-date-field">
                            <input
                                className="aed-date-input"
                                type="time"
                                value={getTimeString(end)}
                                onChange={e => setEnd(createDateFromParts(getDateString(end), e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Body */}
                    <div className="aed-body">

                        {/* Título */}
                        <div className="aed-field">
                            <label className="aed-label">Título</label>
                            <input
                                className="aed-input"
                                type="text"
                                placeholder="Añadir título…"
                                value={eventTitle}
                                onChange={e => setEventTitle(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === "Enter" && handleSaveClicked()}
                            />
                        </div>

                        {/* Calendario */}
                        <div className="aed-field">
                            <label className="aed-label">Calendario</label>
                            <select
                                className="aed-input aed-select"
                                value={calendarId}
                                onChange={e => {
                                    setCalendarId(e.target.value);
                                }}
                            >
                                {calendars.map(cal => (
                                    <option key={cal.id} value={cal.id}>{cal.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Label */}
                        <div className="aed-field">
                            <label className="aed-label">Etiqueta</label>
                            <input
                                className="aed-input"
                                type="text"
                                placeholder="Añadir etiqueta (opcional)…"
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                            />
                        </div>

                        {/* Color */}
                        <div className="aed-field">
                            <label className="aed-label">
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={useCustomColor}
                                        onChange={e => setUseCustomColor(e.target.checked)}
                                    />
                                    <span>Usar color personalizado</span>
                                </div>
                            </label>
                            {useCustomColor && (
                                <div className="aed-colors">
                                    {EVENT_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            className={`aed-color-btn${color === c.value ? " active" : ""}`}
                                            style={{ background: c.value }}
                                            title={c.label}
                                            onClick={() => setColor(c.value)}
                                            aria-label={c.label}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="aed-footer">
                        <button className="aed-btn aed-btn-cancel" onClick={onClose}>Cancelar</button>
                        <button className="aed-btn aed-btn-delete" onClick={handleDeleteClicked}>
                            Eliminar evento
                        </button>
                        <button
                            className="aed-btn aed-btn-save"
                            onClick={handleSaveClicked}
                            disabled={!eventTitle.trim()}
                            style={!eventTitle.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                        >
                            Actualizar evento
                        </button>
                    </div>
                </div>
            </div>

            <RecurrenceChoiceDialog
                open={recurrenceChoiceOpen}
                action={pendingAction || "update"}
                title={pendingAction === "delete" ? "Eliminar evento recurrente" : "Actualizar evento recurrente"}
                message={pendingAction === "delete" 
                    ? "¿Quieres eliminar solo este evento o todos los eventos de la serie?" 
                    : "¿Quieres actualizar solo este evento o todos los eventos de la serie?"}
                onChooseSingle={() => {
                    if (pendingAction === "update" && pendingEventData) {
                        performUpdate(pendingEventData, "single");
                    } else if (pendingAction === "delete") {
                        performDelete("single");
                    }
                    setRecurrenceChoiceOpen(false);
                    setPendingAction(null);
                    setPendingEventData(null);
                }}
                onChooseFromThis={() => {
                    if (pendingAction === "update" && pendingEventData) {
                        performUpdate(pendingEventData, "fromThis");
                    } else if (pendingAction === "delete") {
                        performDelete("fromThis");
                    }
                    setRecurrenceChoiceOpen(false);
                    setPendingAction(null);
                    setPendingEventData(null);
                }}
                onChooseAll={() => {
                    if (pendingAction === "update" && pendingEventData) {
                        performUpdate(pendingEventData, "all");
                    } else if (pendingAction === "delete") {
                        performDelete("all");
                    }
                    setRecurrenceChoiceOpen(false);
                    setPendingAction(null);
                    setPendingEventData(null);
                }}
                onCancel={() => {
                    setRecurrenceChoiceOpen(false);
                    setPendingAction(null);
                    setPendingEventData(null);
                }}
            />

        </>
    );
};

export default EditEventDialog;
