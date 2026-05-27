"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DownloadIcon } from "lucide-react";
import { Calendar } from "@/app/components/shared/lib/eventTypes";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import "../event/add-event-dialog.css";
import "./export-dialog.css";

interface ExportDialogProps {
    open: boolean;
    calendars: Calendar[];
    onClose: () => void;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function formatTime(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

const ExportDialog: React.FC<ExportDialogProps> = ({ open, calendars, onClose }) => {
    const { t } = useTranslation();
    const { pushAlert } = useApp();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) setSelected(new Set(calendars.map(c => c.id)));
    }, [open, calendars]);

    if (!open) return null;

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleExport = async () => {
        setLoading(true);
        const { ok, data, message } = await apiFetch(`${config.backendUrl}/events`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setLoading(false);
        if (!ok) { pushAlert(message, "error"); return; }

        const calendarMap = new Map(calendars.map(c => [c.id, c.name]));
        const events = (data as any[]).filter(e => selected.has(e.calendarId));

        const rows = [
            [t("export.colName"), t("export.colCalendar"), t("export.colStartDate"), t("export.colStartTime"), t("export.colEndDate"), t("export.colEndTime")],
            ...events.map(e => {
                const start = new Date(e.start);
                const end = new Date(e.end);
                return [
                    e.title,
                    calendarMap.get(e.calendarId) ?? e.calendarId,
                    formatDate(start),
                    formatTime(start),
                    formatDate(end),
                    formatTime(end),
                ];
            }),
        ];

        const csv = rows
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `calendar-export-${formatDate(new Date())}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        onClose();
    };

    return (
        <div
            className="aed-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            role="dialog"
            aria-modal="true"
            aria-label={t("sidebar.toolsExport")}
        >
            <div className="aed-dialog" style={{ "--aed-color": "#7c6ff7" } as React.CSSProperties}>
                <div className="aed-header">
                    <div className="aed-header-left">
                        <div className="aed-header-dot" />
                        <span className="aed-title">{t("sidebar.toolsExport")}</span>
                    </div>
                    <button className="aed-close" onClick={onClose} aria-label={t("common.close")}>✕</button>
                </div>

                <div className="aed-body">
                    <div className="aed-field">
                        <label className="aed-label">{t("export.selectCalendars")}</label>
                        <div className="export-cal-list">
                            {calendars.map(cal => (
                                <button
                                    key={cal.id}
                                    className="export-cal-item"
                                    onClick={() => toggle(cal.id)}
                                >
                                    <div
                                        className={`export-cal-checkbox${selected.has(cal.id) ? " checked" : ""}`}
                                        style={selected.has(cal.id) ? { background: cal.color, borderColor: "transparent" } : {}}
                                    >
                                        <svg viewBox="0 0 8 8" fill="none" width="8" height="8">
                                            <path d="M1 4l2.5 2.5L7 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="export-cal-name">{cal.name.startsWith("calendar.") ? t(cal.name) : cal.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="aed-footer">
                    <button className="aed-button" onClick={onClose}>
                        {t("common.cancel")}
                    </button>
                    <button
                        className="aed-button primary"
                        onClick={handleExport}
                        disabled={loading || selected.size === 0}
                    >
                        <DownloadIcon size="0.9rem" />
                        {loading ? t("common.loading") : t("export.download")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportDialog;
