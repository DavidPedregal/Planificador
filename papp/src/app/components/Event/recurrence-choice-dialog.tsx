import React from "react";
import "./add-event-dialog.css"; // Reuse the confirm dialog styles

interface Props {
    open: boolean;
    action: "update" | "delete";
    onChooseSingle: () => void;
    onChooseAll: () => void;
    onCancel: () => void;
}

const RecurrenceChoiceDialog: React.FC<Props> = ({ open, action, onChooseSingle, onChooseAll, onCancel }) => {
    if (!open) return null;

    const title = action === "delete" ? "Eliminar evento recurrente" : "Actualizar evento recurrente";
    const message = action === "delete" 
        ? "¿Quieres eliminar solo este evento o todos los eventos de la serie?"
        : "¿Quieres actualizar solo este evento o todos los eventos de la serie?";
    const buttonLabel = action === "delete" ? "Eliminar" : "Actualizar";

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="aed-dialog" style={{ "--aed-color": action === "delete" ? "#ef4444" : "#7c6ff7" } as React.CSSProperties}>
                {/* Header */}
                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">{title}</span>
                    </div>
                    <button className="aed-close" onClick={onCancel} aria-label="Cerrar">✕</button>
                </div>

                {/* Body */}
                <div className="aed-body">
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#b8b8cc", lineHeight: 1.5 }}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="aed-footer">
                    <button className="aed-btn aed-btn-cancel" onClick={onCancel}>
                        Cancelar
                    </button>
                    <button className="aed-btn aed-btn-cancel" onClick={onChooseSingle}>
                        {buttonLabel} solo este evento
                    </button>
                    <button className="aed-btn aed-btn-save" onClick={onChooseAll}>
                        {buttonLabel} toda la serie
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecurrenceChoiceDialog;
