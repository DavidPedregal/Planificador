import React, { useState, useEffect } from "react";
import "../Calendar/add-event-dialog.css";
import { config } from "@/app/config/config";
import { CALENDAR_COLORS, Calendar } from "../Calendar/calendarHelper";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
    open: boolean;
    calendar: Calendar;
    onClose: () => void;
    onSave: (updatedCalendar: Calendar) => void;
}

const EditCalendarDialog: React.FC<Props> = ({ open, calendar, onClose, onSave }) => {
    const [name, setName] = useState(calendar.name);
    const [color, setColor] = useState(calendar.color);

    useEffect(() => {
        if (open) {
            setName(calendar.name);
            setColor(calendar.color);
        }
    }, [open]);

    if (!open) return null;

    const handleSave = async () => {
        if (!name.trim()) return;

        try {
            const response = await fetch(config.backendUrl + `/calendars/${calendar.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ name, color }),
            });

            const updated = await response.json();
            onSave(updated);
            onClose();
        } catch (error) {
            console.error("Error guardando calendario:", error);
        }
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog" aria-modal="true" aria-label="Crear calendario"
        >
            <div className="aed-dialog" style={{ "--aed-color": color } as React.CSSProperties}>

                {/* Header */}
                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">Nuevo calendario</span>
                    </div>
                    <button className="aed-close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>

                {/* Body */}
                <div className="aed-body">

                    {/* Nombre */}
                    <div className="aed-field">
                        <label className="aed-label">Nombre</label>
                        <input
                            className="aed-input"
                            type="text"
                            placeholder="Nombre del calendario…"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === "Enter" && handleSave()}
                        />
                    </div>

                    {/* Color */}
                    <div className="aed-field">
                        <label className="aed-label">Color</label>
                        <div className="aed-colors">
                            {CALENDAR_COLORS.map(c => (
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

                </div>

                {/* Footer */}
                <div className="aed-footer">
                    <button className="aed-btn aed-btn-cancel" onClick={onClose}>Cancelar</button>
                    <button
                        className="aed-btn aed-btn-save"
                        onClick={handleSave}
                        disabled={!name.trim()}
                        style={!name.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                        Guardar calendario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCalendarDialog;