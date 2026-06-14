"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { config } from "@/app/config/config";
import { CHART_COLORS, triggerCsvDownload } from "../statisticsUtils";
import type { DataType, ChartType, ChartState } from "../statisticsTypes";

type RawEvent     = { calendarId: string; title: string; start: string; end: string; label?: string };
type RawPlanEvent = { calendarId: string; title: string; start: string; end: string; status: string; userTime?: number };

export function useStatistics() {
    const { t } = useTranslation();
    const { pushAlert } = useApp();

    const [dataType, setDataType]           = useState<DataType>("subjectTime");
    const [chartType, setChartType]         = useState<ChartType>("pie");
    const [fromDate, setFromDate]           = useState("");
    const [toDate, setToDate]               = useState("");
    const [loading, setLoading]             = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [chartState, setChartState]       = useState<ChartState | null>(null);

    const handleDataTypeChange = (value: DataType) => {
        setDataType(value);
        setChartState(null);
    };

    const handleGenerate = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (fromDate) params.set("from", fromDate);
        if (toDate)   params.set("to",   toDate);

        const endpoint = dataType === "subjectTime" ? "subject-time" : "comparison-time";
        const { ok, data, message } = await apiFetch(
            `${config.backendUrl}/statistics/${endpoint}?${params}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        setLoading(false);
        if (!ok) { pushAlert(message, "error"); return; }

        if (dataType === "subjectTime") {
            const raw = data as Array<{ name: string | null; minutes: number }>;
            setChartState({
                kind: "subjectTime",
                entries: raw.map((d, i) => ({
                    ...d,
                    name: d.name ?? t("statistics.noSubject"),
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                })),
            });
        } else {
            const raw = data as Array<{ name: string | null; planned: number; actual: number }>;
            setChartState({
                kind: "comparisonTime",
                entries: raw.map(d => ({ ...d, name: d.name ?? t("statistics.noSubject") })),
            });
        }
    };

    const handleExportAll = async () => {
        setExportLoading(true);
        const authHeader = { Authorization: `Bearer ${localStorage.getItem("token")}` };

        const [eventsRes, calendarsRes, systemCalendarsRes, planRes] = await Promise.all([
            apiFetch(`${config.backendUrl}/events`,            { headers: authHeader }),
            apiFetch(`${config.backendUrl}/calendars`,         { headers: authHeader }),
            apiFetch(`${config.backendUrl}/calendars/common`,  { headers: authHeader }),
            apiFetch(`${config.backendUrl}/plan`,              { headers: authHeader }),
        ]);

        setExportLoading(false);

        if (!eventsRes.ok)          { pushAlert(eventsRes.message,          "error"); return; }
        if (!calendarsRes.ok)       { pushAlert(calendarsRes.message,       "error"); return; }
        if (!systemCalendarsRes.ok) { pushAlert(systemCalendarsRes.message, "error"); return; }
        if (!planRes.ok)            { pushAlert(planRes.message,            "error"); return; }

        const allCalendars = [
            ...(calendarsRes.data       as Array<{ _id: string; name: string }>),
            ...(systemCalendarsRes.data as Array<{ _id: string; name: string }>),
        ];
        const calendarMap = new Map<string, string>(
            allCalendars.map(cal => [
                cal._id,
                cal.name.startsWith("calendar.") ? t(cal.name) : cal.name,
            ])
        );

        const formatDate = (d: string) => {
            const dt = new Date(d);
            const pad = (n: number) => String(n).padStart(2, "0");
            return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        };

        const combined = [
            ...(eventsRes.data as RawEvent[]).map(ev => ({
                calendarId: ev.calendarId, title: ev.title,
                start: ev.start, end: ev.end,
                label: ev.label ?? "", actualTime: "",
            })),
            ...(planRes.data as RawPlanEvent[]).map(pev => ({
                calendarId: pev.calendarId, title: pev.title,
                start: pev.start, end: pev.end,
                label: "", actualTime: pev.status === "completed" && pev.userTime != null
                    ? String(pev.userTime) : "",
            })),
        ].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        const rows = [
            [
                t("statistics.export.calendar"),
                t("statistics.export.name"),
                t("statistics.export.label"),
                t("statistics.export.start"),
                t("statistics.export.end"),
                t("statistics.export.actualTime"),
            ],
            ...combined.map(row => [
                calendarMap.get(row.calendarId) ?? "",
                row.title,
                row.label,
                formatDate(row.start),
                formatDate(row.end),
                row.actualTime,
            ]),
        ];

        triggerCsvDownload(rows, `mentiplan-export-${new Date().toISOString().slice(0, 10)}.csv`);
    };

    return {
        dataType, chartType, fromDate, toDate,
        loading, exportLoading, chartState,
        setChartType, setFromDate, setToDate,
        handleDataTypeChange, handleGenerate, handleExportAll,
    };
}
