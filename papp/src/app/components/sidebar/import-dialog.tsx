"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UploadIcon } from "lucide-react";
import { Calendar } from "@/app/components/shared/lib/eventTypes";
import { config } from "@/app/config/config";
import { useApp } from "@/context/AppContext";
import "../event/add-event-dialog.css";
import "./import-dialog.css";

interface ImportDialogProps {
    open: boolean;
    calendars: Calendar[];
    onClose: () => void;
    onImported: () => void;
}

const ImportDialog: React.FC<ImportDialogProps> = ({ open, calendars, onClose, onImported }) => {
    const { t } = useTranslation();
    const { pushAlert } = useApp();

    const [file, setFile]           = useState<File | null>(null);
    const [calendarId, setCalendarId] = useState("");
    const [label, setLabel]         = useState("");
    const [loading, setLoading]     = useState(false);
    const fileInputRef              = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setFile(null);
            setLabel("");
            setCalendarId(calendars[0]?.id ?? "");
        }
    }, [open, calendars]);

    if (!open) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] ?? null);
    };

    const handleImport = async () => {
        if (!file || !calendarId) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("calendarId", calendarId);
        if (label.trim()) formData.append("label", label.trim());

        setLoading(true);
        try {
            const res = await fetch(`${config.backendUrl}/events/import`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: formData,
            });
            const json = await res.json();
            if (res.ok) {
                pushAlert(t("import.success", { count: json.data?.count ?? 0 }), "success");
                onImported();
                onClose();
            } else {
                pushAlert(json.message ?? t("common.error"), "error");
            }
        } catch {
            pushAlert(t("common.error"), "error");
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !!file && !!calendarId && !loading;

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={t("sidebar.toolsImport")}
        >
            <div className="aed-dialog" style={{ "--aed-color": "#7c6ff7" } as React.CSSProperties}>
                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">{t("sidebar.toolsImport")}</span>
                    </div>
                    <button className="aed-close" onClick={onClose} aria-label={t("common.close")}>✕</button>
                </div>

                <div className="aed-body">
                    {/* File picker */}
                    <div className="aed-field">
                        <label className="aed-label">{t("import.file")}</label>
                        <div
                            className={`import-dropzone${file ? " has-file" : ""}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadIcon size="1.2rem" className="import-dropzone-icon" />
                            <span className="import-dropzone-text">
                                {file ? file.name : t("import.filePlaceholder")}
                            </span>
                            <span className="import-dropzone-hint">.csv · .ics</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.ics"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Calendar selector */}
                    <div className="aed-field">
                        <label className="aed-label">{t("import.calendar")}</label>
                        <select
                            className="aed-input aed-select"
                            value={calendarId}
                            onChange={(e) => setCalendarId(e.target.value)}
                        >
                            {calendars.map(cal => (
                                <option key={cal.id} value={cal.id}>
                                    {cal.name.startsWith("calendar.") ? t(cal.name) : cal.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Optional label */}
                    <div className="aed-field">
                        <label className="aed-label">{t("import.label")}</label>
                        <input
                            className="aed-input"
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder={t("import.labelPlaceholder")}
                        />
                    </div>
                </div>

                <div className="aed-footer">
                    <button className="aed-button" onClick={onClose}>
                        {t("common.cancel")}
                    </button>
                    <button
                        className="aed-button primary"
                        onClick={handleImport}
                        disabled={!canSubmit}
                    >
                        <UploadIcon size="0.9rem" />
                        {loading ? t("common.loading") : t("import.submit")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportDialog;
