"use client";

import React, { useEffect, useState } from "react";
import { Check, Sun, EditIcon } from "lucide-react";
import { config } from "@/app/config/config";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddTaskDialog from "./add-task-dialog";
import "./todoList.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Task {
    id: number;
    title: string;
    completed: boolean;
    estimatedTime: number;
    finishDate: Date;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TodoList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [addDialogOpen, setAddDialogOpen] = useState(false);

    const toggleTask = (id: number) => setTasks(t => t.map(x => x.id === id ? { ...x, completed: !x.completed } : x));
    const editTask  = (id: number) => console.log("Edit task:", id);
    const deleteTask = (id: number) => setTasks(t => t.filter(x => x.id !== id));

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
          
          const mappedTasks = data.map((cal: any) => ({
              id: cal._id, // Use _id from backend as id
              name: cal.name,
              color: cal.color,
              visible: cal.visible,
          }));
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
                        <span className="todo-header-title">Mi día</span>
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
                                    onToggle={toggleTask}
                                    onEdit={editTask}
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
                                            onEdit={editTask}
                                            onDelete={deleteTask}
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
                onSave={(newTask) => {
                    setTasks([...tasks, newTask]);
                    setAddDialogOpen(false);
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
            <button
                className={`todo-check${task.completed ? " done" : ""}`}
                onClick={() => onToggle(task.id)}
                aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
            >
                {task.completed && <Check size={12} />}
            </button>

            <div className="todo-content">
                <span className="todo-text">{task.title}</span>
                <div className="todo-meta">
                    <span className="todo-time">⏱ {task.estimatedTime}m</span>
                    <span className="todo-date">📅 {new Date(task.finishDate).toLocaleDateString("es-ES")}</span>
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