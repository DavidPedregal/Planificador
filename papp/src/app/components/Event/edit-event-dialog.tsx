import React from "react";
import "./add-event-dialog.css";
import { useApp } from "@/context/AppContext";
import { useCalendarList } from "./hooks/useCalendarList";
import { useEditEventForm } from "./hooks/useEditEventForm";
import { EventDateStrip } from "./components/EventDateStrip";
import { EventColorPicker } from "./components/EventColorPicker";
import RecurrenceChoiceDialog from "@/app/components/shared/recurrenceChoiceDialog/recurrence-choice-dialog";

interface Props {
    open: boolean;
    eventId: string;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
}

const EditEventDialog: React.FC<Props> = ({ open, eventId, onClose, onSave, onDelete }) => {
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
        recurrenceChoiceOpen,
        pendingAction,
        loading,
        handleSaveClicked,
        handleDeleteClicked,
        onChooseSingle,
        onChooseFromThis,
        onChooseAll,
        onCancel,
    } = useEditEventForm({ open, eventId, calendars, pushAlert });

    if (!open) return null;

    const handleSuccess = (action: "save" | "delete") => {
        if (action === "save") onSave();
        else onDelete();
        onClose();
    };

    return (
        <>
            <div
                className="aed-overlay"
                onClick={(e) => e.target === e.currentTarget && onClose()}
                role="dialog"
                aria-modal="true"
                aria-label="Editar evento"
            >
                <div className="aed-dialog" style={{ "--aed-color": color } as React.CSSProperties}>

                    {/* Header */}
                    <div className="aed-header">
                        <div className="aed-header-left">
                            <div className="aed-header-dot" />
                            <span className="aed-title">
                                {loading ? "Cargando…" : "Editar tarea"}
                            </span>
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
                                onKeyDown={(e) => e.key === "Enter" && handleSaveClicked()}
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

                    </div>

                    {/* Footer */}
                    <div className="aed-footer">
                        <button className="aed-btn aed-btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button className="aed-btn aed-btn-delete" onClick={handleDeleteClicked}>
                            Eliminar evento
                        </button>
                        <button
                            className="aed-btn aed-btn-save"
                            onClick={handleSaveClicked}
                            disabled={!eventTitle.trim() || loading}
                            style={(!eventTitle.trim() || loading) ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                        >
                            Actualizar evento
                        </button>
                    </div>

                </div>
            </div>

            <RecurrenceChoiceDialog
                open={recurrenceChoiceOpen}
                action={pendingAction ?? "update"}
                title={pendingAction === "delete" ? "Eliminar evento recurrente" : "Actualizar evento recurrente"}
                message={
                    pendingAction === "delete"
                        ? "¿Quieres eliminar solo este evento o todos los eventos de la serie?"
                        : "¿Quieres actualizar solo este evento o todos los eventos de la serie?"
                }
                onChooseSingle={() => onChooseSingle(() => handleSuccess(pendingAction === "delete" ? "delete" : "save"))}
                onChooseFromThis={() => onChooseFromThis(() => handleSuccess(pendingAction === "delete" ? "delete" : "save"))}
                onChooseAll={() => onChooseAll(() => handleSuccess(pendingAction === "delete" ? "delete" : "save"))}
                onCancel={onCancel}
            />
        </>
    );
};

export default EditEventDialog;