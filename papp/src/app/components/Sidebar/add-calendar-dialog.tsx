import React, { useState, useEffect } from "react";
import "../Calendar/add-event-dialog.css";
import { config } from "@/app/config/config";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CALENDAR_COLORS = [
    { label: "Índigo",    value: "#7c6ff7" },
    { label: "Cielo",     value: "#38bdf8" },
    { label: "Esmeralda", value: "#34d399" },
    { label: "Ámbar",     value: "#fbbf24" },
    { label: "Rosa",      value: "#f472b6" },
    { label: "Coral",     value: "#f76f6f" },
    { label: "Violeta",   value: "#c084fc" },
    { label: "Lima",      value: "#a3e635" },
];

const AddCalendarDialog: React.FC<Props> = ({ open, onClose, onSave }) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState(CALENDAR_COLORS[0].value);

    useEffect(() => {
        if (open) {
            setName("");
            setColor(CALENDAR_COLORS[0].value);
        }
    }, [open]);

    if (!open) return null;

    const handleSave = async () => {
        if (!name.trim()) return;

        try {
            await fetch(config.backendUrl + "/calendars", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ name, color }),
            });

            onSave();
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

export default AddCalendarDialog;