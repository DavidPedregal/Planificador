import React, { useState, useEffect } from "react";
import "./add-event-dialog.css";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserCalendar {
    id: string;
    name: string;
}

export interface RecurrenceRule {
    frequency: typeof FREQUENCY_TYPE[keyof typeof FREQUENCY_TYPE];
    interval: number;
    daysOfWeek?: number[]; // 0=Sun … 6=Sat
    endType: "never" | "on" | "after";
    endDate?: string;
    occurrences?: number;
}

interface Props {
    open: boolean;
    start: Date;
    end: Date;
    calendars: UserCalendar[];
    onClose: () => void;
    onSave: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FREQUENCY_TYPE = {
    NONE: "none",
    DAYS: "day",
    WEEKS: "week",
    MONTHS: "month",
    YEARS: "year",
}

const EVENT_COLORS = [
    { label: "Índigo",    value: "#7c6ff7" },
    { label: "Cielo",     value: "#38bdf8" },
    { label: "Esmeralda", value: "#34d399" },
    { label: "Ámbar",     value: "#fbbf24" },
    { label: "Rosa",      value: "#f472b6" },
    { label: "Coral",     value: "#f76f6f" },
    { label: "Violeta",   value: "#c084fc" },
    { label: "Lima",      value: "#a3e635" },
];

const WEEKDAYS = ["D", "L", "M", "X", "J", "V", "S"];
const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const FREQ_OPTIONS = [
    { value: FREQUENCY_TYPE.NONE,   label: "Sin repetición" },
    { value: FREQUENCY_TYPE.DAYS,   label: "Diario" },
    { value: FREQUENCY_TYPE.WEEKS,  label: "Semanal" },
    { value: FREQUENCY_TYPE.MONTHS, label: "Mensual" },
    { value: FREQUENCY_TYPE.YEARS,  label: "Anual" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateTimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const AddEventDialog: React.FC<Props> = ({open, start, end, calendars, onClose, onSave,}) => {
    const [eventTitle, setEventTitle] = useState("");
    const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? "");
    const [color, setColor] = useState(EVENT_COLORS[0].value);
    const [recurrence, setRecurrence] = useState<RecurrenceRule>({
        frequency: FREQUENCY_TYPE.NONE, interval: 1, daysOfWeek: [],
        endType: "never", endDate: "", occurrences: 1,
    });

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            setEventTitle("");
            setCalendarId(calendars[0]?.id ?? "");
            setColor(EVENT_COLORS[0].value);
            setRecurrence({ frequency: FREQUENCY_TYPE.NONE, interval: 1, daysOfWeek: [], endType: "never", endDate: "", occurrences: 1 });
        }
    }, [open, calendars]);

    if (!open || !start || !end) return null;

    const toggleWeekday = (day: number) => {
        setRecurrence(r => ({
            ...r,
            daysOfWeek: r.daysOfWeek?.includes(day)
                ? r.daysOfWeek.filter(d => d !== day)
                : [...(r.daysOfWeek ?? []), day],
        }));
    };

    const handleSave = async () => {
        if (!eventTitle.trim()) return;

        const newEvent = {
            userId: "",
            title: eventTitle,
            color,
            calendarId,
            startDate: start,
            finishDate: end,
            ...(recurrence.frequency !== "none" && {
                frequency: recurrence.interval,
                frequencyType: recurrence.frequency,
                frequencyFinishDate: recurrence.endDate,
            }),
        };
        try {
            await fetch("http://localhost:8000/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newEvent),
            }).then(data => {console.log(data)});

            onSave();
            onClose();
        } catch (error) {
            console.error("Error guardando evento:", error);
        }
    };

    const showWeekdays = recurrence.frequency === FREQUENCY_TYPE.WEEKS;
    const showEndOptions = recurrence.frequency !== "none";

    return (
        <>
            <div
                className="aed-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
                role="dialog" aria-modal="true" aria-label="Crear evento"
            >
                <div className="aed-dialog" style={{ "--aed-color": color } as React.CSSProperties}>

                    {/* Header */}
                    <div className="aed-header">
                        <div className="aed-header-left">
                            <div className="aed-header-dot" />
                            <span className="aed-title">Nuevo evento</span>
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
                                    start = newStart;
                                    // Si el fin queda antes que el inicio, lo adelanta 1h automáticamente
                                    end = end <= newStart
                                        ? new Date(newStart.getTime() + 60 * 60 * 1000)
                                        : end;
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
                                onChange={e => end = new Date(e.target.value) }
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
                                onChange={e => setCalendarId(e.target.value)}
                            >
                                {calendars.map(cal => (
                                    <option key={cal.id} value={cal.id}>{cal.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Color */}
                        <div className="aed-field">
                            <label className="aed-label">Color</label>
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
                        </div>

                        {/* Periodicidad */}
                        <div className="aed-field">
                            <label className="aed-label">Periodicidad</label>
                            <div className="aed-recurrence-box">
                                <select
                                    className="aed-input aed-select"
                                    style={{ margin: 0 }}
                                    value={recurrence.frequency}
                                    onChange={e => setRecurrence(r => ({ ...r, frequency: e.target.value as RecurrenceRule["frequency"] }))}
                                >
                                    {FREQ_OPTIONS.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                {recurrence.frequency !== "none" && (
                                    <div className="aed-row">
                                        <span className="aed-row-label">Cada</span>
                                        <input
                                            className="aed-input"
                                            type="number" min={1} max={99}
                                            value={recurrence.interval}
                                            onChange={e => setRecurrence(r => ({ ...r, interval: Math.max(1, +e.target.value) }))}
                                            style={{ width: 64, flex: "none", textAlign: "center" }}
                                        />
                                        <span className="aed-row-label">
                      {{ daily: "día(s)", weekly: "semana(s)", monthly: "mes(es)", yearly: "año(s)" }[recurrence.frequency]}
                    </span>
                                    </div>
                                )}

                                {showWeekdays && (
                                    <div className="aed-field">
                                        <span className="aed-label">Días de la semana</span>
                                        <div className="aed-weekdays">
                                            {WEEKDAYS.map((d, i) => (
                                                <button
                                                    key={i}
                                                    className={`aed-wd-btn${recurrence.daysOfWeek?.includes(i) ? " active" : ""}`}
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
                                                        className={`aed-radio${recurrence.endType === type ? " checked" : ""}`}
                                                        onClick={() => setRecurrence(r => ({ ...r, endType: type }))}
                                                    />
                                                    <span className="aed-radio-label" onClick={() => setRecurrence(r => ({ ...r, endType: type }))}>
                            {{ never: "Nunca", on: "El día", after: "Después de" }[type]}
                          </span>
                                                    {type === "on" && recurrence.endType === "on" && (
                                                        <input
                                                            className="aed-input"
                                                            type="date"
                                                            value={recurrence.endDate}
                                                            min={formatDateTimeLocal(start).slice(0, 10)}
                                                            onChange={e => setRecurrence(r => ({ ...r, endDate: e.target.value }))}
                                                            style={{ marginLeft: 8, flex: 1 }}
                                                        />
                                                    )}
                                                    {type === "after" && recurrence.endType === "after" && (
                                                        <div className="aed-row" style={{ marginLeft: 8, flex: 1 }}>
                                                            <input
                                                                className="aed-input"
                                                                type="number" min={1} max={999}
                                                                value={recurrence.occurrences}
                                                                onChange={e => setRecurrence(r => ({ ...r, occurrences: Math.max(1, +e.target.value) }))}
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
                        <button
                            className="aed-btn aed-btn-save"
                            onClick={handleSave}
                            disabled={!eventTitle.trim()}
                            style={!eventTitle.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                        >
                            Guardar evento
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddEventDialog;