import React, { useState, useEffect } from "react";
import "../Event/add-event-dialog.css";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { config } from "@/app/config/config";
import { COLORS, Calendar } from "@/app/components/shared/lib/eventTypes";

interface Props {
    open: boolean;
    calendar: Calendar;
    onClose: () => void;
    onSave: () => void;
}

const EditCalendarDialog: React.FC<Props> = ({ open, calendar, onClose, onSave }) => {
    const { pushAlert } = useApp();
    const [name, setName] = useState(calendar.name);
    const [color, setColor] = useState(calendar.color);

    useEffect(() => {
        if (open) {
            setName(calendar.name);
            setColor(calendar.color);
        }
    }, [open, calendar]);

    if (!open) return null;

    const handleSave = async () => {
        if (!name.trim()) return;

        const { ok, message } = await apiFetch(`${config.backendUrl}/calendars/${calendar.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ name, color }),
        });

        pushAlert(message, ok ? "success" : "error");
        if (ok) { onSave(); onClose(); }
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog" aria-modal="true" aria-label="Editar calendario"
        >
            <div className="aed-dialog" style={{ "--aed-color": color } as React.CSSProperties}>

                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">Editar calendario</span>
                    </div>
                    <button className="aed-close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>

                <div className="aed-body">
                    <div className="aed-field">
                        <label className="aed-label">Nombre</label>
                        <input
                            className="aed-input"
                            type="text"
                            placeholder="Nombre del calendario…"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                    </div>
                    <div className="aed-field">
                        <label className="aed-label">Color</label>
                        <div className="aed-colors">
                            {COLORS.map((c) => (
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

                <div className="aed-footer">
                    <button className="aed-btn aed-btn-cancel" onClick={onClose}>Cancelar</button>
                    <button
                        className="aed-btn aed-btn-save"
                        onClick={handleSave}
                        disabled={!name.trim()}
                        style={!name.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                        Guardar cambios
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditCalendarDialog;