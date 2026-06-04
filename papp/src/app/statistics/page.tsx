"use client";

import "./page.css";
import { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";
import { config } from "@/app/config/config";
import {
    PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

type DataType = "subjectTime" | "comparisonTime";
type ChartType = "pie" | "bar";

interface SubjectTimeDatum {
    name: string;
    minutes: number;
    fill: string;
}

interface ComparisonDatum {
    name: string;
    planned: number;
    actual: number;
}

type ChartState =
    | { kind: "subjectTime"; entries: SubjectTimeDatum[] }
    | { kind: "comparisonTime"; entries: ComparisonDatum[] };

const CHART_COLORS = [
    "#6366f1", "#f59e0b", "#10b981", "#ef4444",
    "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6",
];
const COLOR_PLANNED = "#6366f1";
const COLOR_ACTUAL  = "#10b981";

function formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

const tooltipStyle = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-primary)",
};

export default function StatisticsPage() {
    useAuthGuard();
    const { t } = useTranslation();
    const router = useRouter();
    const { user, pushAlert } = useApp();

    const [dataType, setDataType] = useState<DataType>("subjectTime");
    const [chartType, setChartType] = useState<ChartType>("pie");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [chartState, setChartState] = useState<ChartState | null>(null);

    if (!user) return null;

    const handleDataTypeChange = (value: DataType) => {
        setDataType(value);
        setChartState(null);
    };

    const handleGenerate = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);

        const endpoint = dataType === "subjectTime" ? "subject-time" : "comparison-time";
        const url = `${config.backendUrl}/statistics/${endpoint}?${params.toString()}`;
        const { ok, data, message } = await apiFetch(url, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        setLoading(false);
        if (!ok) { pushAlert(message, "error"); return; }

        if (dataType === "subjectTime") {
            const raw = data as Array<{ name: string; minutes: number }>;
            setChartState({
                kind: "subjectTime",
                entries: raw.map((d, i) => ({ ...d, fill: CHART_COLORS[i % CHART_COLORS.length] })),
            });
        } else {
            setChartState({
                kind: "comparisonTime",
                entries: data as ComparisonDatum[],
            });
        }
    };

    const isEmpty = chartState?.entries.length === 0;

    return (
        <div className="stats-page">
            <div className="stats-header">
                <button className="stats-back-btn" onClick={() => router.push("/home")}>
                    <ChevronLeftIcon size="1.1rem" />
                    {t("settings.back")}
                </button>
                <h1 className="stats-title">{t("statistics.title")}</h1>
            </div>

            <section className="stats-section">
                <div className="stats-controls">
                    <div className="stats-control-row">
                        <label className="stats-label">{t("statistics.data")}</label>
                        <select
                            className="stats-select"
                            value={dataType}
                            onChange={e => handleDataTypeChange(e.target.value as DataType)}
                        >
                            <option value="subjectTime">{t("statistics.dataTypes.subjectTime")}</option>
                            <option value="comparisonTime">{t("statistics.dataTypes.comparisonTime")}</option>
                        </select>
                    </div>

                    {dataType === "subjectTime" && (
                        <div className="stats-control-row">
                            <label className="stats-label">{t("statistics.chartType")}</label>
                            <select
                                className="stats-select"
                                value={chartType}
                                onChange={e => setChartType(e.target.value as ChartType)}
                            >
                                <option value="pie">{t("statistics.chartTypes.pie")}</option>
                                <option value="bar">{t("statistics.chartTypes.bar")}</option>
                            </select>
                        </div>
                    )}

                    <div className="stats-control-row stats-control-row--dates">
                        <label className="stats-label">{t("statistics.dateRange")}</label>
                        <div className="stats-date-range">
                            <input
                                type="date"
                                className="stats-date-input"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                            />
                            <span className="stats-date-sep">—</span>
                            <input
                                type="date"
                                className="stats-date-input"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="stats-controls-footer">
                    <button
                        className="stats-generate-btn"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? t("common.loading") : t("statistics.generate")}
                    </button>
                </div>
            </section>

            {chartState && (
                <section className="stats-section stats-chart-section">
                    {isEmpty ? (
                        <p className="stats-empty">{t("statistics.noData")}</p>
                    ) : (
                        <>
                            <h2 className="stats-section-title">
                                {t(`statistics.dataTypes.${dataType}`)}
                            </h2>
                            <div className="stats-chart-container">
                                {chartState.kind === "subjectTime" && chartType === "pie" && (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={chartState.entries}
                                                dataKey="minutes"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={110}
                                                fill="fill"
                                                label={({ name, percent }) =>
                                                    percent != null
                                                        ? `${name} (${(percent * 100).toFixed(0)}%)`
                                                        : name
                                                }
                                                labelLine={false}
                                            />
                                            <Tooltip
                                                formatter={(v: unknown) => [
                                                    typeof v === "number" ? formatMinutes(v) : String(v),
                                                    t("statistics.time"),
                                                ]}
                                                contentStyle={tooltipStyle}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}

                                {chartState.kind === "subjectTime" && chartType === "bar" && (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={chartState.entries}
                                            margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                                                angle={-30}
                                                textAnchor="end"
                                                interval={0}
                                            />
                                            <YAxis
                                                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                                                tickFormatter={formatMinutes}
                                            />
                                            <Tooltip
                                                formatter={(v: unknown) => [
                                                    typeof v === "number" ? formatMinutes(v) : String(v),
                                                    t("statistics.time"),
                                                ]}
                                                contentStyle={tooltipStyle}
                                            />
                                            <Bar dataKey="minutes" fill="fill" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}

                                {chartState.kind === "comparisonTime" && (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart
                                            data={chartState.entries}
                                            margin={{ top: 10, right: 20, left: 10, bottom: 50 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                                                angle={-30}
                                                textAnchor="end"
                                                interval={0}
                                            />
                                            <YAxis
                                                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                                                tickFormatter={formatMinutes}
                                            />
                                            <Tooltip
                                                formatter={(v: unknown, name: unknown) => [
                                                    typeof v === "number" ? formatMinutes(v) : String(v),
                                                    name === "planned"
                                                        ? t("statistics.planned")
                                                        : t("statistics.actual"),
                                                ]}
                                                contentStyle={tooltipStyle}
                                            />
                                            <Legend
                                                formatter={name =>
                                                    name === "planned"
                                                        ? t("statistics.planned")
                                                        : t("statistics.actual")
                                                }
                                                wrapperStyle={{ color: "var(--text-secondary)", fontSize: 13 }}
                                            />
                                            <Bar dataKey="planned" fill={COLOR_PLANNED} radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="actual"  fill={COLOR_ACTUAL}  radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
