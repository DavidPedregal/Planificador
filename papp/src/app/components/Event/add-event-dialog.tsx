import React from "react";
import "./add-event-dialog.css";
import { useCalendarList } from "./hooks/useCalendarList";
import { useEventForm } from "./hooks/useEventForm";
import { EventDateStrip } from "./components/EventDateStrip";
import { EventColorPicker } from "./components/EventColorPicker";
import { RecurrenceForm } from "@/app/components/shared/recurrenceForm/recurrenceForm";
import { useApp } from "@/context/AppContext";

interface Props {
    open: boolean;
    start: Date;
    end: Date;
    onClose: () => void;
    onSave: () => void;
}

const AddEventDialog: React.FC<Props> = ({ open, start: propsStart, end: propsEnd, onClose, onSave }) => {
    const { pushAlert } = useApp();
    const { calendars } = useCalendarList(open, pushAlert);
    const {
        eventTitle, setEventTitle,
        label, setLabel,
        calendarId, setCalendarId,
        color, setColor,
        useCustomColor, setUseCustomColor,
        start, setStart,
        end, setEnd,
        recurrence, setRecurrence,
        toggleWeekday,
        handleSave,
    } = useEventForm({ open, propsStart, propsEnd, calendars, pushAlert });

    if (!open || !start || !end) return null;

    const onClickSave = async () => {
        const ok = await handleSave();
        if (ok) {
            onSave();
            onClose();
        }
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label="Crear evento"
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

                {/* Fechas y horas */}
                <EventDateStrip mode="date" start={start} end={end} onStartChange={setStart} onEndChange={setEnd} />
                <EventDateStrip mode="time" start={start} end={end} onStartChange={setStart} onEndChange={setEnd} />

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
                            onChange={(e) => setEventTitle(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && onClickSave()}
                        />
                    </div>

                    {/* Calendario */}
                    <div className="aed-field">
                        <label className="aed-label">Calendario</label>
                        <select
                            className="aed-input aed-select"
                            value={calendarId}
                            onChange={(e) => setCalendarId(e.target.value)}
                            aria-label="Seleccionar calendario"
                        >
                            {calendars.map((cal) => (
                                <option key={cal.id} value={cal.id}>{cal.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Etiqueta */}
                    <div className="aed-field">
                        <label className="aed-label">Etiqueta</label>
                        <input
                            className="aed-input"
                            type="text"
                            placeholder="Añadir etiqueta (opcional)…"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>

                    {/* Color */}
                    <EventColorPicker
                        useCustomColor={useCustomColor}
                        color={color}
                        onToggleCustomColor={setUseCustomColor}
                        onColorChange={setColor}
                    />

                    {/* Periodicidad */}
                    <RecurrenceForm
                        recurrence={recurrence}
                        start={start}
                        onChange={setRecurrence}
                        onToggleWeekday={toggleWeekday}
                    />

                </div>

                {/* Footer */}
                <div className="aed-footer">
                    <button className="aed-btn aed-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="aed-btn aed-btn-save"
                        onClick={onClickSave}
                        disabled={!eventTitle.trim()}
                        style={!eventTitle.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                        Guardar evento
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddEventDialog;
