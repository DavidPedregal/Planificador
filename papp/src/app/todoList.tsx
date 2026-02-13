import React, { useState } from 'react';
import { Check, Plus, Trash2, Circle, Sun } from 'lucide-react';

export default function TodoApp() {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Completar el informe mensual', completed: false, important: false },
        { id: 2, text: 'Llamar al cliente sobre el proyecto', completed: false, important: true },
        { id: 3, text: 'Revisar correos pendientes', completed: true, important: false }
    ]);
    const [newTask, setNewTask] = useState('');

    const addTask = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newTask.trim()) {
            setTasks([...tasks, {
                id: Date.now(),
                text: newTask,
                completed: false,
                important: false
            }]);
            setNewTask('');
        }
    };

    const toggleTask = (id: number) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const toggleImportant = (id: number) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, important: !task.important } : task
        ));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    const incompleteTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    return (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <Sun className="w-7 h-7" />
                        <h1 className="text-2xl font-semibold">Mi día</h1>
                    </div>
                    <p className="text-blue-100 text-sm">
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                {/* Add Task Form */}
                <div className="p-6 border-b border-gray-200">
                    <form onSubmit={addTask} className="flex gap-3">
                        <div className="flex-1 relative">
                            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Agregar una tarea"
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transition-all font-medium"
                        >
                            Agregar
                        </button>
                    </form>
                </div>

                {/* Tasks List */}
                <div className="p-6">
                    {/* Incomplete Tasks */}
                    <div className="space-y-2 mb-6">
                        {incompleteTasks.map(task => (
                            <div
                                key={task.id}
                                className="group flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                            >
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors flex items-center justify-center"
                                >
                                    <Circle className="w-4 h-4 text-gray-300" />
                                </button>

                                <span className="flex-1 text-gray-800">{task.text}</span>

                                <button
                                    onClick={() => toggleImportant(task.id)}
                                    className={`flex-shrink-0 transition-all ${
                                        task.important
                                            ? 'text-yellow-500'
                                            : 'text-gray-300 hover:text-yellow-400'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill={task.important ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Completed Tasks */}
                    {completedTasks.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                                <Check className="w-4 h-4" />
                                <span>Completadas ({completedTasks.length})</span>
                            </div>
                            <div className="space-y-2">
                                {completedTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="group flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 opacity-60"
                                    >
                                        <button
                                            onClick={() => toggleTask(task.id)}
                                            className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center"
                                        >
                                            <Check className="w-4 h-4 text-white" />
                                        </button>

                                        <span className="flex-1 text-gray-500 line-through">{task.text}</span>

                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tasks.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <Sun className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No tienes tareas pendientes</p>
                            <p className="text-sm mt-1">¡Disfruta tu día!</p>
                        </div>
                    )}
                </div>
            </div>
    );
}