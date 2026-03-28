"use client";
import "./page.css"
import { useRouter } from "next/navigation";

import { useState, useEffect } from "react";
import Login from "@/app/components/Login/login";
import { config } from "./config/config";

export default function Landing() {
    const router = useRouter();

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

    return (
        <>
            <div className="landing-root">
                <div className="landing-orb landing-orb-1" />
                <div className="landing-orb landing-orb-2" />               

                {/* ── Hero ── */}
                <section className="landing-hero">
                    <h1 className="landing-hero-title">
                        Todo en su<br /><em>lugar y momento</em>
                    </h1>
                    <p className="landing-hero-sub">
                        Calendarios, tareas y recordatorios en un solo espacio. Diseñado para quienes necesitan claridad, no caos.
                    </p>
                    <div className="landing-hero-cta">
                        <Login />
                        <span className="landing-hero-note">sin contraseña · sin registro · gratis</span>
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
                                <span className="landing-ps-label">General</span>
                                <div className="landing-ps-item active">📅 Calendario</div>
                                <div className="landing-ps-item">✅ Tareas</div>
                                <div className="landing-ps-item">⚙️ Ajustes</div>
                                <span className="landing-ps-label">Calendarios</span>
                                <div className="landing-ps-item">🟣 Personal</div>
                                <div className="landing-ps-item">🟢 Trabajo</div>
                                <div className="landing-ps-item">🟠 Familia</div>
                            </div>
                            <div className="landing-preview-cal">
                                <div className="landing-cal-header">
                                    <span className="landing-cal-title">Marzo 2025</span>
                                    <div className="landing-cal-nav">
                                        <div className="landing-cal-nav-btn">‹</div>
                                        <div className="landing-cal-nav-btn">›</div>
                                    </div>
                                </div>
                                <div className="landing-cal-days">
                                    {["L","M","X","J","V","S","D"].map(d => <span key={d}>{d}</span>)}
                                </div>
                                <div className="landing-cal-grid">
                                    {[
                                        { n: "24" }, { n: "25", ev: { t: "Reunión", c: "ev-purple" } },
                                        { n: "26" }, { n: "27", ev: { t: "Gym", c: "ev-teal" } },
                                        { n: "28" }, { n: "1" }, { n: "2" },
                                        { n: "3" }, { n: "4", ev: { t: "Dentista", c: "ev-coral" } },
                                        { n: "5" }, { n: "6", today: true, ev: { t: "Sprint", c: "ev-purple" } },
                                        { n: "7" }, { n: "8" }, { n: "9" },
                                        { n: "10", ev: { t: "Gym", c: "ev-teal" } }, { n: "11" },
                                        { n: "12", ev: { t: "Review", c: "ev-purple" } },
                                        { n: "13" }, { n: "14" }, { n: "15" }, { n: "16" },
                                        { n: "17" }, { n: "18", ev: { t: "Cena", c: "ev-coral" } },
                                        { n: "19" }, { n: "20", ev: { t: "Gym", c: "ev-teal" } },
                                        { n: "21" }, { n: "22" }, { n: "23" },
                                    ].map((cell, i) => (
                                        <div key={i} className={`landing-cal-cell${cell.today ? " today" : ""}`}>
                                            <span>{cell.n}</span>
                                            {cell.ev && <div className={`landing-cal-event ${cell.ev.c}`}>{cell.ev.t}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="landing-preview-todo">
                                <div className="landing-todo-title">Tareas</div>
                                {[
                                    { text: "Revisar PR", done: true },
                                    { text: "Preparar demo", done: false },
                                    { text: "Actualizar docs", done: false },
                                    { text: "Standup", done: true },
                                    { text: "Deploy staging", done: false },
                                ].map((item, i) => (
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
                    <p className="landing-section-tag">Funcionalidades</p>
                    <h2 className="landing-section-title">Pensado para<br /><em>cómo trabajas</em></h2>
                    <div className="landing-features-grid">
                        {[
                            { icon: "📅", title: "Calendario inteligente", desc: "Vista por día, semana o mes. Eventos con recurrencia, colores por calendario y arrastrar para reorganizar." },
                            { icon: "✅", title: "Lista de tareas", desc: "Gestiona tus pendientes junto al calendario. Sin cambiar de pestaña, sin perder el contexto." },
                            { icon: "🗂️", title: "Múltiples calendarios", desc: "Personal, trabajo, familia… cada uno con su color. Actívalos o ocúltalos según lo que necesites ver." },
                            { icon: "🔁", title: "Eventos periódicos", desc: "Diario, semanal, mensual o anual. Configura cuándo termina la repetición o con cuántas ocurrencias." },
                            { icon: "🔒", title: "Acceso seguro con Google", desc: "Sin contraseñas que recordar. Entra con tu cuenta de Google de forma segura en un clic." },
                            { icon: "📱", title: "Adaptado a móvil", desc: "Sidebar y lista de tareas como paneles deslizables. La misma experiencia en cualquier dispositivo." },
                        ].map((f, i) => (
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
                        <h2 className="landing-cta-title">Empieza a<br /><em>organizarte hoy</em></h2>
                        <p className="landing-cta-sub">Un solo clic con tu cuenta de Google. Nada más.</p>
                        <Login />
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="landing-footer">
                    <span className="landing-footer-logo">Menti</span>
                    <span className="landing-footer-note">Hecho con ☕ — David Pedregal Ribas</span>
                </footer>
            </div>
        </>
    );
}