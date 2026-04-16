import React from "react";
import "./recurrence-choice-dialog.css"; // Reuse the confirm dialog styles

interface Props {
    open: boolean;
    action: "update" | "delete";
    onChooseSingle: () => void;
    onChooseFromThis: () => void;
    onChooseAll: () => void;
    onCancel: () => void;
}

const RecurrenceChoiceDialog: React.FC<Props> = ({ open, action, onChooseSingle, onChooseFromThis, onChooseAll, onCancel }) => {
    if (!open) return null;

    const title = action === "delete" ? "Eliminar evento recurrente" : "Actualizar evento recurrente";
    const message = action === "delete" 
        ? "¿Quieres eliminar solo este evento o todos los eventos de la serie?"
        : "¿Quieres actualizar solo este evento o todos los eventos de la serie?";
    const buttonLabel = action === "delete" ? "Eliminar" : "Actualizar";

    return (
        <div
            className="rcd-overlay"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="rcd-dialog" style={{ "--rcd-color": action === "delete" ? "#ef4444" : "#7c6ff7" } as React.CSSProperties}>
                {/* Header */}
                <div className="rcd-header">
                    <div className="rcd-header-left">
                        <div className="rcd-header-dot" />
                        <span className="rcd-title">{title}</span>
                    </div>
                    <button className="rcd-close" onClick={onCancel} aria-label="Cerrar">✕</button>
                </div>

                {/* Body */}
                <div className="rcd-body">
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#b8b8cc", lineHeight: 1.5 }}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="rcd-footer">
                    <button className="rcd-btn rcd-btn-cancel" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button className="rcd-btn rcd-btn-save" onClick={onChooseSingle}>
                        {buttonLabel} solo este evento
                    </button>
                    <button className="rcd-btn rcd-btn-save" onClick={onChooseFromThis}>
                        {buttonLabel} a partir de este evento
                    </button>
                    <button className="rcd-btn rcd-btn-save" onClick={onChooseAll}>
                        {buttonLabel} toda la serie
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecurrenceChoiceDialog;
