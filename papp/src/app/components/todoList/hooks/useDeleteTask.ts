import { useState } from "react";
import { DeleteMode } from "./useTasks";

interface UseDeleteTaskParams {
    deleteTask: (id: string, mode: DeleteMode) => Promise<boolean>;
}

// Gestiona el flujo de confirmación de recurrencia para el borrado
export function useDeleteTask({ deleteTask }: UseDeleteTaskParams) {
    const [recurrenceChoiceOpen, setRecurrenceChoiceOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string>("");

    const handleDeleteTask = (id: string, recurring: boolean) => {
        setSelectedTaskId(id);
        if (!recurring) {
            setConfirmOpen(true);
        } else {
            setRecurrenceChoiceOpen(true);
        }
    };

    const confirmDelete = async (mode: DeleteMode) => {
        if (selectedTaskId === "") return;
        await deleteTask(selectedTaskId, mode);
        setRecurrenceChoiceOpen(false);
        setSelectedTaskId("");
    };

    const cancelDelete = () => {
        setRecurrenceChoiceOpen(false);
        setSelectedTaskId("");
    };

    const confirmDeleteSingle = async () => {
        if (selectedTaskId === "") return;
        await deleteTask(selectedTaskId, "single");
        setConfirmOpen(false);
        setSelectedTaskId("");
    };

    const cancelConfirmDelete = () => {
        setConfirmOpen(false);
        setSelectedTaskId("");
    };

    return {
        recurrenceChoiceOpen,
        confirmOpen,
        handleDeleteTask,
        confirmDelete,
        cancelDelete,
        confirmDeleteSingle,
        cancelConfirmDelete,
    };
}