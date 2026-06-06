import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskItem } from "../taskItem";
import { Task } from "../../hooks/useTasks";

const mockTask: Task = {
    id: 42,
    title: "Estudiar Matemáticas",
    estimatedTime: 90,
    finishDate: new Date("2026-06-01T00:00:00"),
    completed: false,
    recurring: false,
};

const baseProps = {
    task: mockTask,
    onEdit:   jest.fn(),
    onDelete: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Renderizado ───────────────────────────────────────────────────────────────

describe("TaskItem - renderizado", () => {
    it("muestra el título de la tarea", () => {
        render(<TaskItem {...baseProps} />);
        expect(screen.getByText("Estudiar Matemáticas")).toBeInTheDocument();
    });

    it("muestra el tiempo estimado en minutos", () => {
        render(<TaskItem {...baseProps} />);
        expect(screen.getByText(/90m/)).toBeInTheDocument();
    });

    it("muestra la fecha de entrega localizada", () => {
        render(<TaskItem {...baseProps} />);
        const expectedDate = mockTask.finishDate.toLocaleDateString("en-US");
        expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
    });

    it("no tiene la clase 'completed' cuando la tarea no está completada", () => {
        const { container } = render(<TaskItem {...baseProps} />);
        expect(container.firstChild).not.toHaveClass("completed");
    });

    it("tiene la clase 'completed' cuando la tarea está completada", () => {
        const { container } = render(
            <TaskItem {...baseProps} task={{ ...mockTask, completed: true }} />
        );
        expect(container.firstChild).toHaveClass("completed");
    });

    it("no muestra el icono de recurrencia en tareas no recurrentes", () => {
        const { container } = render(<TaskItem {...baseProps} />);
        expect(container.querySelector(".lucide-repeat-2")).toBeNull();
    });

    it("muestra el icono de recurrencia en tareas recurrentes", () => {
        render(<TaskItem {...baseProps} task={{ ...mockTask, recurring: true }} />);
        const title = screen.getByText("Estudiar Matemáticas");
        expect(title.querySelector("svg")).toBeInTheDocument();
    });
});

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe("TaskItem - callbacks", () => {
    it("llama a onEdit con el id correcto al pulsar editar", async () => {
        const onEdit = jest.fn();
        render(<TaskItem {...baseProps} onEdit={onEdit} />);
        await userEvent.click(screen.getByLabelText("Edit task"));
        expect(onEdit).toHaveBeenCalledWith(42);
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it("llama a onDelete con el id y recurring correcto al pulsar eliminar", async () => {
        const onDelete = jest.fn();
        render(<TaskItem {...baseProps} onDelete={onDelete} />);
        await userEvent.click(screen.getByLabelText("Delete task"));
        expect(onDelete).toHaveBeenCalledWith(42, false);
        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("onEdit no llama a onDelete y viceversa", async () => {
        const onEdit   = jest.fn();
        const onDelete = jest.fn();
        render(<TaskItem {...baseProps} onEdit={onEdit} onDelete={onDelete} />);

        await userEvent.click(screen.getByLabelText("Edit task"));
        expect(onDelete).not.toHaveBeenCalled();

        await userEvent.click(screen.getByLabelText("Delete task"));
        expect(onEdit).toHaveBeenCalledTimes(1);
    });
});
