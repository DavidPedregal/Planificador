import React, { useState, useEffect } from "react";
import "../Event/add-event-dialog.css";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { config } from "@/app/config/config";

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}

const AddSubjectDialog: React.FC<Props> = ({ open, onClose, onSave }) => {
    const { pushAlert } = useApp();
    const [name, setName] = useState("");

    useEffect(() => {
        if (open) setName("");
    }, [open]);

    if (!open) return null;

    const handleSave = async () => {
        if (!name.trim()) return;

        const { ok, message } = await apiFetch(config.backendUrl + "/subjects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ name }),
        });

        pushAlert(message, ok ? "success" : "error");
        if (ok) { onSave(); onClose(); }
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog" aria-modal="true" aria-label="Crear asignatura"
        >
            <div className="aed-dialog" style={{ "--aed-color": "#34d399" } as React.CSSProperties}>

                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">Nueva asignatura</span>
                    </div>
                    <button className="aed-close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>

                <div className="aed-body">
                    <div className="aed-field">
                        <label className="aed-label">Nombre</label>
                        <input
                            className="aed-input"
                            type="text"
                            placeholder="Nombre de la asignatura…"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
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
                        Guardar asignatura
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AddSubjectDialog;