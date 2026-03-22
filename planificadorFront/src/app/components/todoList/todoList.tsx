"use client";

import React, { useState } from "react";
import { Check, Plus, Trash2, Sun, Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
    id: number;
    text: string;
    completed: boolean;
    important: boolean;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

  .todo-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: 'DM Sans', sans-serif;
    background: var(--bg-surface, #16161f);
    color: var(--text-primary, #e8e8f0);
    overflow: hidden;
  }

  /* ── Header ── */
  .todo-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
    flex-shrink: 0;
  }
  .todo-header-top {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 4px;
  }
  .todo-header-icon {
    width: 32px; height: 32px; border-radius: 9px;
    background: var(--accent-muted, rgba(124,111,247,0.15));
    border: 1px solid rgba(124,111,247,0.25);
    display: flex; align-items: center; justify-content: center;
    color: var(--accent, #7c6ff7);
    flex-shrink: 0;
  }
  .todo-header-title {
    font-size: 1rem; font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-primary, #e8e8f0);
  }
  .todo-header-date {
    font-size: 0.72rem;
    color: var(--text-muted, #55556a);
    padding-left: 2px;
    text-transform: capitalize;
  }
  .todo-count-pill {
    margin-left: auto;
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    background: var(--accent-muted, rgba(124,111,247,0.12));
    color: var(--accent, #7c6ff7);
    border: 1px solid rgba(124,111,247,0.2);
    border-radius: 20px;
    padding: 2px 9px;
  }

  /* ── Add form ── */
  .todo-form {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.07));
    display: flex; gap: 8px;
    flex-shrink: 0;
  }
  .todo-input-wrap {
    flex: 1; position: relative;
    display: flex; align-items: center;
  }
  .todo-input-icon {
    position: absolute; left: 10px;
    color: var(--text-muted, #55556a);
    pointer-events: none;
    display: flex;
  }
  .todo-input {
    width: 100%;
    padding: 9px 12px 9px 34px;
    background: var(--bg-elevated, #1e1e2a);
    border: 1px solid var(--border, rgba(255,255,255,0.08));
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    color: var(--text-primary, #e8e8f0);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .todo-input::placeholder { color: var(--text-muted, #55556a); }
  .todo-input:focus {
    border-color: var(--accent, #7c6ff7);
    box-shadow: 0 0 0 3px var(--accent-muted, rgba(124,111,247,0.15));
  }
  .todo-add-btn {
    padding: 9px 14px;
    background: var(--accent, #7c6ff7);
    color: #fff;
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 3px 10px rgba(124,111,247,0.3);
    white-space: nowrap;
  }
  .todo-add-btn:hover {
    background: var(--accent-hover, #9d97f9);
    transform: translateY(-1px);
    box-shadow: 0 5px 16px rgba(124,111,247,0.4);
  }
  .todo-add-btn:active { transform: translateY(0); }

  /* ── List ── */
  .todo-list {
    flex: 1; overflow-y: auto;
    padding: 12px 12px 16px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .todo-list::-webkit-scrollbar { width: 3px; }
  .todo-list::-webkit-scrollbar-thumb {
    background: var(--border, rgba(255,255,255,0.1));
    border-radius: 2px;
  }

  /* ── Section label ── */
  .todo-section-label {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 8px 6px;
    font-size: 0.68rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-muted, #55556a);
  }
  .todo-section-label svg { opacity: 0.6; }

  /* ── Task item ── */
  .todo-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 10px;
    border-radius: 10px;
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s;
    cursor: default;
  }
  .todo-item:hover {
    background: var(--bg-elevated, rgba(255,255,255,0.04));
    border-color: var(--border, rgba(255,255,255,0.07));
  }
  .todo-item.completed { opacity: 0.5; }

  /* Check button */
  .todo-check {
    flex-shrink: 0;
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid var(--border-strong, rgba(255,255,255,0.2));
    background: none;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.15s;
    color: transparent;
  }
  .todo-check:hover {
    border-color: var(--accent, #7c6ff7);
    transform: scale(1.1);
  }
  .todo-check.done {
    background: var(--accent, #7c6ff7);
    border-color: var(--accent, #7c6ff7);
    color: #fff;
  }

  /* Text */
  .todo-text {
    flex: 1; font-size: 0.85rem;
    color: var(--text-primary, #e8e8f0);
    line-height: 1.4;
    word-break: break-word;
  }
  .todo-item.completed .todo-text {
    text-decoration: line-through;
    color: var(--text-muted, #55556a);
  }

  /* Star button */
  .todo-star {
    flex-shrink: 0; background: none; border: none; cursor: pointer;
    padding: 3px; border-radius: 6px;
    color: var(--text-muted, #55556a);
    transition: color 0.15s, transform 0.15s;
    display: flex;
  }
  .todo-star:hover { transform: scale(1.2); }
  .todo-star.important { color: #fbbf24; }

  /* Delete button */
  .todo-delete {
    flex-shrink: 0; background: none; border: none; cursor: pointer;
    padding: 3px; border-radius: 6px;
    color: var(--text-muted, #55556a);
    opacity: 0;
    transition: opacity 0.15s, color 0.15s;
    display: flex;
  }
  .todo-item:hover .todo-delete { opacity: 1; }
  .todo-delete:hover { color: #f76f6f; }

  /* ── Empty state ── */
  .todo-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 8px; padding: 32px;
    color: var(--text-muted, #55556a);
    text-align: center;
  }
  .todo-empty-icon {
    width: 40px; height: 40px; border-radius: 12px;
    background: var(--accent-muted, rgba(124,111,247,0.08));
    display: flex; align-items: center; justify-content: center;
    color: var(--accent, #7c6ff7); opacity: 0.5;
    margin-bottom: 4px;
  }
  .todo-empty p { font-size: 0.85rem; }
  .todo-empty span { font-size: 0.75rem; color: var(--text-muted); }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function TodoApp() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, text: "Completar el informe mensual",        completed: false, important: false },
        { id: 2, text: "Llamar al cliente sobre el proyecto", completed: false, important: true  },
        { id: 3, text: "Revisar correos pendientes",          completed: true,  important: false },
    ]);
    const [newTask, setNewTask] = useState("");

    const addTask = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newTask.trim()) return;
        setTasks(t => [...t, { id: Date.now(), text: newTask.trim(), completed: false, important: false }]);
        setNewTask("");
    };

    const toggleTask      = (id: number) => setTasks(t => t.map(x => x.id === id ? { ...x, completed: !x.completed } : x));
    const toggleImportant = (id: number) => setTasks(t => t.map(x => x.id === id ? { ...x, important: !x.important } : x));
    const deleteTask      = (id: number) => setTasks(t => t.filter(x => x.id !== id));

    const pending   = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    const todayLabel = new Date().toLocaleDateString("es-ES", {
        weekday: "long", day: "numeric", month: "long",
    });

    return (
        <>
            <style>{STYLES}</style>

            <div className="todo-root">

                {/* Header */}
                <div className="todo-header">
                    <div className="todo-header-top">
                        <div className="todo-header-icon">
                            <Sun size={15} />
                        </div>
                        <span className="todo-header-title">Mi día</span>
                        {pending.length > 0 && (
                            <span className="todo-count-pill">{pending.length}</span>
                        )}
                    </div>
                    <p className="todo-header-date">{todayLabel}</p>
                </div>

                {/* Add task */}
                <form className="todo-form" onSubmit={addTask}>
                    <div className="todo-input-wrap">
                        <span className="todo-input-icon"><Plus size={15} /></span>
                        <input
                            className="todo-input"
                            type="text"
                            placeholder="Añadir tarea…"
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                        />
                    </div>
                    <button className="todo-add-btn" type="submit">Añadir</button>
                </form>

                {/* List */}
                <div className="todo-list">
                    {tasks.length === 0 ? (
                        <div className="todo-empty">
                            <div className="todo-empty-icon"><Sun size={18} /></div>
                            <p>Sin tareas pendientes</p>
                            <span>¡Disfruta tu día!</span>
                        </div>
                    ) : (
                        <>
                            {/* Pendientes */}
                            {pending.map(task => (
                                <TaskItem
                                    key={task.id}
                                    task={task}
                                    onToggle={toggleTask}
                                    onStar={toggleImportant}
                                    onDelete={deleteTask}
                                />
                            ))}

                            {/* Completadas */}
                            {completed.length > 0 && (
                                <>
                                    <div className="todo-section-label">
                                        <Check size={11} />
                                        Completadas ({completed.length})
                                    </div>
                                    {completed.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={toggleTask}
                                            onStar={toggleImportant}
                                            onDelete={deleteTask}
                                        />
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

// ─── TaskItem ─────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onStar, onDelete }: {
    task: Task;
    onToggle: (id: number) => void;
    onStar:   (id: number) => void;
    onDelete: (id: number) => void;
}) {
    return (
        <div className={`todo-item${task.completed ? " completed" : ""}`}>
            <button
                className={`todo-check${task.completed ? " done" : ""}`}
                onClick={() => onToggle(task.id)}
                aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
            >
                {task.completed && <Check size={12} />}
            </button>

            <span className="todo-text">{task.text}</span>

            <button
                className={`todo-star${task.important ? " important" : ""}`}
                onClick={() => onStar(task.id)}
                aria-label={task.important ? "Quitar importancia" : "Marcar como importante"}
            >
                <Star size={14} fill={task.important ? "currentColor" : "none"} />
            </button>

            <button
                className="todo-delete"
                onClick={() => onDelete(task.id)}
                aria-label="Eliminar tarea"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}