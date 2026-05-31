"use client";
import "./page.css"
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Login from "@/app/components/login/login";
import { config } from "./config/config";

export default function Landing() {
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(config.backendUrl + "/users/verify", {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => {
            if (res.ok) router.push("/home");
            else {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        })
        .catch(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        });
    }, []);

    const previewWeekdays = t("landing.preview.weekdays", { returnObjects: true }) as string[];

    const calendarCells = [
        { n: "24" }, { n: "25", ev: { title: t("landing.preview.events.meeting"), c: "ev-purple" } },
        { n: "26" }, { n: "27", ev: { title: t("landing.preview.events.gym"), c: "ev-teal" } },
        { n: "28" }, { n: "1" }, { n: "2" },
        { n: "3" }, { n: "4", ev: { title: t("landing.preview.events.dentist"), c: "ev-coral" } },
        { n: "5" }, { n: "6", today: true, ev: { title: t("landing.preview.events.sprint"), c: "ev-purple" } },
        { n: "7" }, { n: "8" }, { n: "9" },
        { n: "10", ev: { title: t("landing.preview.events.gym"), c: "ev-teal" } }, { n: "11" },
        { n: "12", ev: { title: t("landing.preview.events.review"), c: "ev-purple" } },
        { n: "13" }, { n: "14" }, { n: "15" }, { n: "16" },
        { n: "17" }, { n: "18", ev: { title: t("landing.preview.events.dinner"), c: "ev-coral" } },
        { n: "19" }, { n: "20", ev: { title: t("landing.preview.events.gym"), c: "ev-teal" } },
        { n: "21" }, { n: "22" }, { n: "23" },
    ];

    const previewTasks = [
        { text: t("landing.preview.task1"), done: true },
        { text: t("landing.preview.task2"), done: false },
        { text: t("landing.preview.task3"), done: false },
        { text: t("landing.preview.task4"), done: true },
        { text: t("landing.preview.task5"), done: false },
    ];

    const features = [
        { icon: "📅", title: t("landing.features.calendarTitle"), desc: t("landing.features.calendarDesc") },
        { icon: "✅", title: t("landing.features.tasksTitle"), desc: t("landing.features.tasksDesc") },
        { icon: "🗂️", title: t("landing.features.multiCalTitle"), desc: t("landing.features.multiCalDesc") },
        { icon: "🔁", title: t("landing.features.recurringTitle"), desc: t("landing.features.recurringDesc") },
        { icon: "🔒", title: t("landing.features.googleTitle"), desc: t("landing.features.googleDesc") },
        { icon: "📱", title: t("landing.features.mobileTitle"), desc: t("landing.features.mobileDesc") },
    ];

    return (
        <>
            <div className="landing-root">
                <div className="landing-orb landing-orb-1" />
                <div className="landing-orb landing-orb-2" />

                {/* ── Hero ── */}
                <section className="landing-hero">
                    <h1 className="landing-hero-title">
                        {t("landing.hero.line1")}<br /><em>{t("landing.hero.line2")}</em>
                    </h1>
                    <p className="landing-hero-sub">
                        {t("landing.hero.subtitle")}
                    </p>
                    <div className="landing-hero-cta">
                        <Login />
                        <span className="landing-hero-note">{t("landing.hero.note")}</span>
                    </div>
                </section>

                {/* ── Preview ── */}
                <div className="landing-preview-wrapper">
                    <div className="landing-preview-frame">
                        <div className="landing-preview-bar">
                            <div className="landing-dot" style={{ background: "#ff5f57" }} />
                            <div className="landing-dot" style={{ background: "#febc2e" }} />
                            <div className="landing-dot" style={{ background: "#28c840" }} />
                        </div>
                        <div className="landing-preview-body">
                            <div className="landing-preview-sidebar">
                                <span className="landing-ps-label">{t("landing.preview.general")}</span>
                                <div className="landing-ps-item active">{t("landing.preview.navCalendar")}</div>
                                <div className="landing-ps-item">{t("landing.preview.navTasks")}</div>
                                <div className="landing-ps-item">{t("landing.preview.navSettings")}</div>
                                <span className="landing-ps-label">{t("landing.preview.calendarsLabel")}</span>
                                <div className="landing-ps-item">{t("landing.preview.personal")}</div>
                                <div className="landing-ps-item">{t("landing.preview.work")}</div>
                                <div className="landing-ps-item">{t("landing.preview.family")}</div>
                            </div>
                            <div className="landing-preview-cal">
                                <div className="landing-cal-header">
                                    <span className="landing-cal-title">{t("landing.preview.month")}</span>
                                    <div className="landing-cal-nav">
                                        <div className="landing-cal-nav-btn">‹</div>
                                        <div className="landing-cal-nav-btn">›</div>
                                    </div>
                                </div>
                                <div className="landing-cal-days">
                                    {previewWeekdays.map((d, i) => <span key={i}>{d}</span>)}
                                </div>
                                <div className="landing-cal-grid">
                                    {calendarCells.map((cell, i) => (
                                        <div key={i} className={`landing-cal-cell${cell.today ? " today" : ""}`}>
                                            <span>{cell.n}</span>
                                            {cell.ev && <div className={`landing-cal-event ${cell.ev.c}`}>{cell.ev.title}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="landing-preview-todo">
                                <div className="landing-todo-title">{t("landing.preview.tasksTitle")}</div>
                                {previewTasks.map((item, i) => (
                                    <div key={i} className="landing-todo-item">
                                        <div className={`landing-todo-check${item.done ? " done" : ""}`} />
                                        <span style={item.done ? { textDecoration: "line-through", opacity: 0.5 } : {}}>
                                            {item.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Features ── */}
                <section className="landing-features">
                    <p className="landing-section-tag">{t("landing.features.tag")}</p>
                    <h2 className="landing-section-title">{t("landing.features.titleLine1")}<br /><em>{t("landing.features.titleLine2")}</em></h2>
                    <div className="landing-features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="landing-feature-card">
                                <div className="landing-feature-icon">{f.icon}</div>
                                <div className="landing-feature-title">{f.title}</div>
                                <p className="landing-feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="landing-cta-section">
                    <div className="landing-cta-card">
                        <h2 className="landing-cta-title">{t("landing.cta.line1")}<br /><em>{t("landing.cta.line2")}</em></h2>
                        <p className="landing-cta-sub">{t("landing.cta.subtitle")}</p>
                        <Login />
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="landing-footer">
                    <span className="landing-footer-logo">{t("landing.footer.logo")}</span>
                    <span className="landing-footer-note">{t("landing.footer.made")}</span>
                </footer>
            </div>
        </>
    );
}
