"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Sun, AlertTriangle, ChevronDown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useTasks } from "./hooks/useTasks";
import { useDeleteTask } from "./hooks/useDeleteTask";
import { TaskItem } from "./components/taskItem";
import AddTaskDialog from "./add-task-dialog";
import EditTaskDialog from "./edit-task-dialog";
import RecurrenceChoiceDialog from "@/app/components/shared/recurrenceChoiceDialog/recurrence-choice-dialog";
import "./todoList.css";

export default function TodoList() {
    const { pushAlert } = useApp();
    const { t, i18n } = useTranslation();
    const { overdue, pending, completed, fetchTasks, deleteTask, addTasks } = useTasks({ pushAlert });
    const { recurrenceChoiceOpen, handleDeleteTask, confirmDelete, cancelDelete } = useDeleteTask({ deleteTask });

    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string>("");
    const [completedExpanded, setCompletedExpanded] = useState(false);

    const handleEditTask = (id: string) => {
        setSelectedTaskId(id);
        setEditDialogOpen(true);
    };

    const locale = i18n.language === "es" ? "es-ES" : "en-US";
    const todayLabel = new Date().toLocaleDateString(locale, {
        weekday: "long", day: "numeric", month: "long",
    });

    const totalPending = overdue.length + pending.length;

    return (
        <div className="todo-root">

            {/* Header */}
            <div className="todo-header">
                <div className="todo-header-top">
                    <div className="todo-header-icon"><Sun size={15} /></div>
                    <span className="todo-header-title">{t("todo.title")}</span>
                    {totalPending > 0 && (
                        <span className="todo-count-pill">{totalPending}</span>
                    )}
                    <div className="todo-form">
                        <button className="todo-add-btn" onClick={() => setAddDialogOpen(true)}>
                            {t("todo.add")}
                        </button>
                    </div>
                </div>
                <p className="todo-header-date">{todayLabel}</p>
            </div>

            {/* List */}
            <div className="todo-list">
                {totalPending === 0 && completed.length === 0 ? (
                    <div className="todo-empty">
                        <div className="todo-empty-icon"><Sun size={18} /></div>
                        <p>{t("todo.noTasks")}</p>
                        <span>{t("todo.enjoyDay")}</span>
                    </div>
                ) : (
                    <>
                        {/* Retrasadas */}
                        {overdue.length > 0 && (
                            <>
                                <div className="todo-section-label todo-section-overdue">
                                    <AlertTriangle size={11} />
                                    {t("todo.overdue", { count: overdue.length })}
                                </div>
                                {overdue.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onEdit={handleEditTask}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                                {pending.length > 0 && <div className="todo-section-divider" />}
                            </>
                        )}

                        {/* Pendientes */}
                        {pending.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                            />
                        ))}

                        {/* Completadas */}
                        {completed.length > 0 && (
                            <>
                                <button
                                    className="todo-section-label todo-section-collapsible"
                                    onClick={() => setCompletedExpanded(prev => !prev)}
                                >
                                    <Check size={11} />
                                    {t("todo.completed", { count: completed.length })}
                                    <ChevronDown
                                        size={12}
                                        className={`todo-section-chevron${completedExpanded ? " expanded" : ""}`}
                                    />
                                </button>
                                {completedExpanded && completed.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        onEdit={handleEditTask}
                                        onDelete={handleDeleteTask}
                                    />
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Diálogos */}
            <AddTaskDialog
                open={addDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSave={(newTasks) => {
                    addTasks(Array.isArray(newTasks) ? newTasks : [newTasks]);
                    setAddDialogOpen(false);
                }}
            />

            <EditTaskDialog
                open={editDialogOpen}
                taskId={selectedTaskId}
                onClose={() => setEditDialogOpen(false)}
                onSave={fetchTasks}
            />

            <RecurrenceChoiceDialog
                open={recurrenceChoiceOpen}
                action="delete"
                title={t("todo.deleteRecurringTitle")}
                message={t("todo.deleteRecurringMsg")}
                onChooseSingle={() => confirmDelete("single")}
                onChooseFromThis={() => confirmDelete("fromThis")}
                onChooseAll={() => confirmDelete("all")}
                onCancel={cancelDelete}
            />
        </div>
    );
}
