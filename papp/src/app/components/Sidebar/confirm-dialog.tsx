import React from "react";
import "../Event/add-event-dialog.css";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDangerous = false,
    onConfirm,
    onCancel,
}) => {
    if (!open) return null;

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onCancel()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <div className="aed-dialog" style={{ "--aed-color": isDangerous ? "#ef4444" : "#7c6ff7" } as React.CSSProperties}>
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
                    <button className="aed-button" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button 
                        className={`aed-button ${isDangerous ? "danger" : "primary"}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
