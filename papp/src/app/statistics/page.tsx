"use client";

import "./page.css";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, DownloadIcon } from "lucide-react";
import {
    PieChart, Pie, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useStatistics } from "./hooks/useStatistics";
import { downloadCsv, formatMinutes, tooltipStyle, COLOR_PLANNED, COLOR_ACTUAL } from "./statisticsUtils";

export default function StatisticsPage() {
    const { authReady } = useAuthGuard();
    const { t } = useTranslation();
    const router = useRouter();
    const {
        dataType, chartType, fromDate, toDate,
        loading, exportLoading, chartState,
        setChartType, setFromDate, setToDate,
        handleDataTypeChange, handleGenerate, handleExportAll,
    } = useStatistics();

    if (!authReady) return null;

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
                            onChange={e => handleDataTypeChange(e.target.value as any)}
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
                                onChange={e => setChartType(e.target.value as any)}
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
                        className="stats-download-btn"
                        onClick={handleExportAll}
                        disabled={exportLoading}
                    >
                        <DownloadIcon size="0.9rem" />
                        {exportLoading ? t("common.loading") : t("statistics.exportAll")}
                    </button>
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
                            <div className="stats-chart-header">
                                <h2 className="stats-section-title">
                                    {t(`statistics.dataTypes.${dataType}`)}
                                </h2>
                                <button
                                    className="stats-download-btn"
                                    onClick={() => downloadCsv(chartState, {
                                        subject: t("statistics.subject"),
                                        time:    t("statistics.time"),
                                        planned: t("statistics.planned"),
                                        actual:  t("statistics.actual"),
                                    })}
                                >
                                    <DownloadIcon size="0.9rem" />
                                    {t("statistics.download")}
                                </button>
                            </div>
                            <div className="stats-chart-container">
                                {chartState.kind === "subjectTime" && chartType === "pie" && (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie
                                                data={chartState.entries}
                                                dataKey="minutes"
                                                nameKey="name"
                                                cx="50%" cy="50%"
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
                                                angle={-30} textAnchor="end" interval={0}
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
                                                angle={-30} textAnchor="end" interval={0}
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
