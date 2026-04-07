import React, { useState, useEffect } from "react";
import "./add-event-dialog.css";
import { config } from "@/app/config/config";
import { CalendarEvent, FREQUENCY_TYPE, RecurrenceRule, EVENT_COLORS, WEEKDAYS, 
    WEEKDAY_LABELS, FREQ_OPTIONS, formatDateTimeLocal, 
    Calendar} from "./calendarHelper";
import ConfirmDialog from "../Sidebar/confirm-dialog";
import { set } from "mongoose";


interface Props {
    open: boolean;
    event: CalendarEvent;
    onClose: () => void;
    onSave: (updatedEvent: any) => void;
    onDelete: (deletedEventId: string) => void;
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
    const [recurrence, setRecurrence] = useState<RecurrenceRule>({
        frequencyType: FREQUENCY_TYPE.NONE, frequencyInterval: 1, frequencyDaysOfWeek: [],
        frequencyEndType: "never", frequencyEndDate: "", frequencyOccurrencesLeft: 1,
    });
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
            
            // Load recurrence rule - handle both nested and flat property structures
            const frequencyDaysOfWeekData = (event as any).frequencyDaysOfWeek || event.recurrenceRule?.frequencyDaysOfWeek;
            const daysArray = Array.isArray(frequencyDaysOfWeekData) 
                ? frequencyDaysOfWeekData 
                : (frequencyDaysOfWeekData ? [] : []);
            
            const recurrenceRule = event.recurrenceRule || {
                frequencyType: (event as any).frequencyType || FREQUENCY_TYPE.NONE,
                frequencyInterval: (event as any).frequencyInterval || 1,
                frequencyDaysOfWeek: daysArray,
                frequencyEndType: (event as any).frequencyEndType || "never",
                frequencyEndDate: (event as any).frequencyEndDate || "",
                frequencyOccurrencesLeft: (event as any).frequencyOccurrencesLeft || 1,
            };
            setRecurrence(recurrenceRule);
        }
    }, [open, event]);

    const fetchCalendars = async () => {
        try {
            const res = await fetch(config.backendUrl + "/calendars", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            setCalendars(data.map((cal: any) => ({ id: cal._id, name: cal.name, userId: cal.userId, color: cal.color })));
        } catch (error) {
            console.error("Error fetching calendars:", error);
        }
    };

    if (!open) return null;

    const toggleWeekday = (day: number) => {
        setRecurrence(r => {
            // Ensure frequencyDaysOfWeek is always an array
            const currentDays = Array.isArray(r.frequencyDaysOfWeek) ? r.frequencyDaysOfWeek : [];
            const newDays = currentDays.includes(day)
                ? currentDays.filter(d => d !== day)
                : [...currentDays, day];
            
            return {
                ...r,
                frequencyDaysOfWeek: newDays,
            };
        });
    };

    const handleSave = async () => {
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
            frequencyType: recurrence.frequencyType,
            frequencyInterval: recurrence.frequencyInterval,
            frequencyDaysOfWeek: recurrence.frequencyDaysOfWeek,
            frequencyEndType: recurrence.frequencyEndType,
            frequencyEndDate: recurrence.frequencyEndDate,
            frequencyOccurrencesLeft: recurrence.frequencyOccurrencesLeft,
        };
        try {
            const response = await fetch(config.backendUrl + `/events/${event.id}`, {
                method: "PUT",
                 headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(updatedEvent),
            });

            const updated = await response.json();
            onSave(updated);
            onClose();
        } catch (error) {
            console.error("Error updating event:", error);
        }
    };

    const handleDelete = async () => {
        try {
            await fetch(config.backendUrl + `/events/${event.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            onDelete(event.id);
            onClose();
            setConfirmDeleteOpen(false);
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const showWeekdays = recurrence.frequencyType === FREQUENCY_TYPE.WEEKS;
    const showEndOptions = recurrence.frequencyType !== FREQUENCY_TYPE.NONE;

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
                                type="datetime-local"
                                value={formatDateTimeLocal(start)}
                                onChange={e => {
                                    const newStart = new Date(e.target.value);
                                    setStart(newStart);
                                    // Si el fin queda antes que el inicio, lo adelanta 1h automáticamente
                                    if (end <= newStart) {
                                        setEnd(new Date(newStart.getTime() + 60 * 60 * 1000));
                                    }
                                }}
                            />
                        </div>
                        <span className="aed-date-arrow">→</span>
                        <div className="aed-date-field">
                            <input
                                className="aed-date-input"
                                type="datetime-local"
                                value={formatDateTimeLocal(end)}
                                min={formatDateTimeLocal(start)}
                                onChange={e => setEnd(new Date(e.target.value))}
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
                                onKeyDown={e => e.key === "Enter" && handleSave()}
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

                        {/* Periodicidad */}
                        <div className="aed-field">
                            <label className="aed-label">Periodicidad</label>
                            <div className="aed-recurrence-box">
                                <select
                                    className="aed-input aed-select"
                                    style={{ margin: 0 }}
                                    value={recurrence.frequencyType}
                                    onChange={e => setRecurrence(r => ({ ...r, frequencyType: e.target.value as RecurrenceRule["frequencyType"] }))}
                                >
                                    {FREQ_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                {recurrence.frequencyType !== FREQUENCY_TYPE.NONE && (
                                    <div className="aed-row">
                                        <span className="aed-row-label">Cada</span>
                                        <input
                                            className="aed-input"
                                            type="number" min={1} max={99}
                                            value={recurrence.frequencyInterval}
                                            onChange={e => setRecurrence(r => ({ ...r, frequencyInterval: Math.max(1, +e.target.value) }))}
                                            style={{ width: 64, flex: "none", textAlign: "center" }}
                                        />
                                        <span className="aed-row-label">
                      {{ daily: "día(s)", weekly: "semana(s)", monthly: "mes(es)", yearly: "año(s)" }[recurrence.frequencyType]}
                    </span>
                                    </div>
                                )}

                                {showWeekdays && (
                                    <div className="aed-field">
                                        <span className="aed-label">Días de la semana</span>
                                        <div className="aed-weekdays">
                                            {WEEKDAYS.map((d, i) => (
                                                <button
                                                    key={`weekday-${i}`}
                                                    className={`aed-wd-btn${recurrence.frequencyDaysOfWeek?.includes(i) ? " active" : ""}`}
                                                    onClick={() => toggleWeekday(i)}
                                                    title={WEEKDAY_LABELS[i]}
                                                >{d}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {showEndOptions && (
                                    <div className="aed-field">
                                        <span className="aed-label">Finaliza</span>
                                        <div className="aed-end-options">
                                            {(["never", "on", "after"] as const).map(type => (
                                                <label key={type} className="aed-radio-row">
                                                    <div
                                                        className={`aed-radio${recurrence.frequencyEndType === type ? " checked" : ""}`}
                                                        onClick={() => setRecurrence(r => ({ ...r, frequencyEndType: type }))}
                                                    />
                                                    <span className="aed-radio-label" onClick={() => setRecurrence(r => ({ ...r, frequencyEndType: type }))}>
                            {{ never: "Nunca", on: "El día", after: "Después de" }[type]}
                          </span>
                                                    {type === "on" && recurrence.frequencyEndType === "on" && (
                                                        <input
                                                            className="aed-input"
                                                            type="date"
                                                            value={recurrence.frequencyEndDate}
                                                            min={formatDateTimeLocal(start).slice(0, 10)}
                                                            onChange={e => setRecurrence(r => ({ ...r, frequencyEndDate: e.target.value }))}
                                                            style={{ marginLeft: 8, flex: 1 }}
                                                        />
                                                    )}
                                                    {type === "after" && recurrence.frequencyEndType === "after" && (
                                                        <div className="aed-row" style={{ marginLeft: 8, flex: 1 }}>
                                                            <input
                                                                className="aed-input"
                                                                type="number" min={1} max={999}
                                                                value={recurrence.frequencyOccurrencesLeft}
                                                                onChange={e => setRecurrence(r => ({ ...r, frequencyOccurrencesLeft: Math.max(1, +e.target.value) }))}
                                                                style={{ width: 64, flex: "none", textAlign: "center" }}
                                                            />
                                                            <span className="aed-row-label">ocurrencias</span>
                                                        </div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="aed-footer">
                        <button className="aed-btn aed-btn-cancel" onClick={onClose}>Cancelar</button>
                        <button className="aed-btn aed-btn-delete" onClick={() => setConfirmDeleteOpen(true)}>
                            Eliminar evento
                        </button>
                        <button
                            className="aed-btn aed-btn-save"
                            onClick={handleSave}
                            disabled={!eventTitle.trim()}
                            style={!eventTitle.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                        >
                            Actualizar evento
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={confirmDeleteOpen}
                title="Eliminar evento"
                message="¿Estás seguro de que quieres eliminar este evento?"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />

        </>
    );
};

export default EditEventDialog;
