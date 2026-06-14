import type { ChartState } from "./statisticsTypes";

export const CHART_COLORS = [
    "#6366f1", "#f59e0b", "#10b981", "#ef4444",
    "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6",
];
export const COLOR_PLANNED = "#6366f1";
export const COLOR_ACTUAL  = "#10b981";

export const tooltipStyle = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-primary)",
};

export function csvCell(value: string): string {
    if (value.includes(";") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function downloadCsv(
    state: ChartState,
    labels: { subject: string; time: string; planned: string; actual: string }
) {
    let rows: string[][];

    if (state.kind === "subjectTime") {
        rows = [
            [labels.subject, `${labels.time} (min)`],
            ...state.entries.map(e => [e.name, String(e.minutes)]),
        ];
    } else {
        rows = [
            [labels.subject, `${labels.planned} (min)`, `${labels.actual} (min)`],
            ...state.entries.map(e => [e.name, String(e.planned), String(e.actual)]),
        ];
    }

    triggerCsvDownload(rows, `mentiplan-statistics-${new Date().toISOString().slice(0, 10)}.csv`);
}

export function triggerCsvDownload(rows: string[][], filename: string) {
    const csv = "﻿" + rows.map(row => row.map(csvCell).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}
