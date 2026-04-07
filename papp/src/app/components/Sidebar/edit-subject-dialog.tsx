import React, { useState, useEffect } from "react";
import "../Calendar/add-event-dialog.css";
import { config } from "@/app/config/config";
import { Subject } from "../Calendar/calendarHelper";

interface Props {
    open: boolean;
    subject: Subject;
    onClose: () => void;
    onSave: () => void;
}

const EditSubjectDialog: React.FC<Props> = ({ open, subject, onClose, onSave }) => {
    const [subjectName, setSubjectName] = useState(subject.name);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setSubjectName(subject.name);
            setError("");
        }
    }, [open, subject]);

    const handleSave = async () => {
        if (!subjectName.trim()) {
            setError("El nombre de la asignatura es requerido");
            return;
        }

        try {
            const response = await fetch(config.backendUrl + `/subjects/${subject.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ name: subjectName }),
            });

            if (!response.ok) throw new Error("Error actualizar asignatura");
            onSave();
            onClose();
        } catch (err) {
            setError("Error al actualizar la asignatura");
            console.error(err);
        }
    };

    if (!open) return null;

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog" aria-modal="true" aria-label="Crear asignatura"
        >
            <div className="aed-dialog" style={{ "--aed-color": "#34d399" } as React.CSSProperties}>

                {/* Header */}
                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">Actualizar asignatura</span>
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
                            placeholder="Nombre de la asignatura…"
                            value={subjectName}
                            onChange={e => setSubjectName(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === "Enter" && handleSave()}
                        />
                    </div>                           

                </div>

                {/* Footer */}
                <div className="aed-footer">
                    <button className="aed-btn aed-btn-cancel" onClick={onClose}>Cancelar</button>
                    <button
                        className="aed-btn aed-btn-save"
                        onClick={handleSave}
                        disabled={!subjectName.trim()}
                        style={!subjectName.trim() ? { opacity: 0.45, cursor: "not-allowed" } : {}}
                    >
                        Actualizar asignatura
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSubjectDialog;
