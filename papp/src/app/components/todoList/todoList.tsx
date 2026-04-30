"use client";

import React, { useEffect, useState } from "react";
import { Check, Sun, EditIcon } from "lucide-react";
import { config } from "@/app/config/config";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddTaskDialog from "./add-task-dialog";
import "./todoList.css";
import EditTaskDialog from "./edit-task-dialog";
import RecurrenceChoiceDialog from "../Event/recurrence-choice-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
    id: number;
    title: string;
    completed: boolean;
    estimatedTime: number;
    finishDate: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapTask(data: any): Task {
    return {
        id: data._id, // Use _id from backend as id
        title: data.title,
        completed: data.completed,
        finishDate: new Date(data.finishDate),
        estimatedTime: data.estimatedTime,
    };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TodoList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);

    const handleToggleTask = async (id: number) => {
        try {
            let url = config.backendUrl + `/tasks/toggle/${id}`;
            await fetch(url, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            fetchTasks();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    };

    const handleEditTask  = (id: number) => {
        setSelectedTaskId(id);
        setEditDialogOpen(true);
    };

    const handleDeleteTask = (id: number) => {
        setRecurrenceChoiceOpen(true);
        setSelectedTaskId(id);
    };

    const deleteTask = async () => {
        try {
            let url = config.backendUrl + `/tasks/${selectedTaskId}`;
            await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setTasks(t => t.filter(x => x.id !== selectedTaskId));
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    }

    const deleteTaskFromThis = async () => {
        try {
            let url = config.backendUrl + `/tasks/forward/${selectedTaskId}`;
            await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            await fetchTasks();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    }

    const deleteTaskSeries = async () => {
        try {
            let url = config.backendUrl + `/tasks/all/${selectedTaskId}`;
            await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            await fetchTasks();
        } catch (error) {
            console.error("Error deleting event:", error);
        }
    }

    const pending   = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    const todayLabel = new Date().toLocaleDateString("es-ES", {
        weekday: "long", day: "numeric", month: "long",
    });

    const fetchTasks = async () => {
        try {
            const res = await fetch(config.backendUrl + "/tasks", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            const data = await res.json();
            
            const mappedTasks = data.map((task: any) => (
                mapTask(task)
            )).sort((a: Task, b: Task) => a.finishDate.getTime() - b.finishDate.getTime());
            setTasks(mappedTasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }   
    };


    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <div className="todo-root">

            {/* Header */}
                <div className="todo-header">
                    <div className="todo-header-top">
                        <div className="todo-header-icon">
                            <Sun size={15} />
                        </div>
                        <span className="todo-header-title">Tareas</span>
                        {pending.length > 0 && (
                            <span className="todo-count-pill">{pending.length}</span>
                        )}

                        {/* Add task */}
                        <div className="todo-form">
                            <button className="todo-add-btn" onClick={() => setAddDialogOpen(true)}>Añadir</button>
                        </div>
                    </div>
                    <p className="todo-header-date">{todayLabel}</p>
                </div>

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
                                    onToggle={handleToggleTask}
                                    onEdit={handleEditTask}
                                    onDelete={handleDeleteTask}
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
                                            onToggle={handleToggleTask}
                                            onEdit={handleEditTask}
                                            onDelete={handleDeleteTask}
                                        />
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </div>

                <AddTaskDialog
                    open={addDialogOpen}
                    onClose={() => setAddDialogOpen(false)}
                    onSave={(newTasks) => {
                        if (Array.isArray(newTasks)) {
                            const mappedNewTasks = newTasks.map(mapTask);
                            const orderedTasks = [...tasks, ...mappedNewTasks].sort((a: Task, b: Task) => a.finishDate.getTime() - b.finishDate.getTime());
                            setTasks(orderedTasks);
                        } else {
                            const newTaskMapped = mapTask(newTasks);
                            const orderedTasks = [...tasks, newTaskMapped].sort((a: Task, b: Task) => a.finishDate.getTime() - b.finishDate.getTime());
                            setTasks(orderedTasks);
                        }
                        setAddDialogOpen(false);
                    }}
                />

                <RecurrenceChoiceDialog
                    open={recurrenceChoiceOpen}
                    action="delete"
                    title="Eliminar tarea recurrente"
                    message="¿Quieres eliminar solo esta tarea o todas las tareas de la serie?"
                    onChooseSingle={() => {
                        deleteTask();
                        setRecurrenceChoiceOpen(false);
                    }}
                    onChooseFromThis={() => {
                        deleteTaskFromThis();
                        setRecurrenceChoiceOpen(false);
                    }}
                    onChooseAll={() => {
                        deleteTaskSeries();
                        setRecurrenceChoiceOpen(false);
                    }}
                    onCancel={() => setRecurrenceChoiceOpen(false)}
                />


                <EditTaskDialog
                    open={editDialogOpen}
                    taskId={selectedTaskId}
                    onClose={() => setEditDialogOpen(false)}
                    onSave={() => {
                        fetchTasks();
                    }}
                />
            </div>
        );
    }


// ─── TaskItem ─────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onEdit, onDelete }: {
    task: Task;
    onToggle: (id: number) => void;
    onEdit:   (id: number) => void;
    onDelete: (id: number) => void;
}) {
    return (
        <div className={`todo-item${task.completed ? " completed" : ""}`}>

            <div className="todo-content">
                <span className="todo-text">{task.title}</span>
                <div className="todo-meta">
                    <span className="todo-time">⏱ {task.estimatedTime}m</span>
                    <span className="todo-date">📅 {task.finishDate.toLocaleDateString("es-ES")}</span>
                </div>
            </div>

            <button
                className="todo-edit"
                onClick={() => onEdit(task.id)}
                aria-label="Editar tarea"
            >
                <EditIcon size={"1rem"}/>
            </button>

            <button
                className="todo-delete"
                onClick={() => onDelete(task.id)}
                aria-label="Eliminar tarea"
            >
                <DeleteForeverIcon fontSize="small" />
            </button>
        </div>
    );
}