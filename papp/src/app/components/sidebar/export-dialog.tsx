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

function pad2(n: number) { return String(n).padStart(2, "0"); }
function formatDate(d: Date) { return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; }
function formatTime(d: Date) { return `${d.getHours()}.${pad2(d.getMinutes())}`; }
function formatIcsDate(d: Date) {
    return `${d.getUTCFullYear()}${pad2(d.getUTCMonth()+1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00Z`;
}
function buildIcs(events: any[]) {
    const vevents = events.map((e, i) => [
        "BEGIN:VEVENT",
        `UID:mentiplan-${i}-${Date.now()}@mentiplan`,
        `DTSTART:${formatIcsDate(new Date(e.start))}`,
        `DTEND:${formatIcsDate(new Date(e.end))}`,
        `SUMMARY:${String(e.title).replace(/[\\;,]/g, c => `\\${c}`)}`,
        "END:VEVENT",
    ].join("\r\n")).join("\r\n");
    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Mentiplan//EN\r\n${vevents}\r\nEND:VCALENDAR`;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ open, calendars, onClose }) => {
    const { t } = useTranslation();
    const { pushAlert } = useApp();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [label, setLabel] = useState("");
    const [format, setFormat] = useState<"csv" | "ical">("csv");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setSelected(new Set(calendars.map(c => c.id)));
            setLabel("");
            setFormat("csv");
        }
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

        const trimmedLabel = label.trim();
        const events = (data as any[]).filter(e =>
            selected.has(e.calendarId) &&
            (!trimmedLabel || e.label === trimmedLabel)
        );

        const today = new Date();
        const dateSuffix = `${today.getFullYear()}${pad2(today.getMonth()+1)}${pad2(today.getDate())}`;

        let content: string;
        let mimeType: string;
        let filename: string;

        if (format === "ical") {
            content = buildIcs(events);
            mimeType = "text/calendar;charset=utf-8;";
            filename = `calendar-export-${dateSuffix}.ics`;
        } else {
            const rows = [
                ["Subject", "Start Date", "Start Time", "End Date", "End Time", "Description", "Location"],
                ...events.map(e => {
                    const start = new Date(e.start);
                    const end = new Date(e.end);
                    return [e.title, formatDate(start), formatTime(start), formatDate(end), formatTime(end), "", ""];
                }),
            ];
            content = "" + rows
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
                .join("\n");
            mimeType = "text/csv;charset=utf-8;";
            filename = `calendar-export-${dateSuffix}.csv`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
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
                    <div className="aed-field">
                        <label className="aed-label">{t("export.labelFilter")}</label>
                        <input
                            className="aed-input"
                            type="text"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            placeholder={t("export.labelFilterPlaceholder")}
                        />
                    </div>
                    <div className="aed-field">
                        <label className="aed-label">{t("export.format")}</label>
                        <select
                            className="aed-input"
                            value={format}
                            onChange={e => setFormat(e.target.value as "csv" | "ical")}
                        >
                            <option value="csv">CSV</option>
                            <option value="ical">iCal (.ics)</option>
                        </select>
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
