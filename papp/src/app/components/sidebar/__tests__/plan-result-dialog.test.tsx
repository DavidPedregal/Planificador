import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlanResultDialog from "../plan-result-dialog";

const baseProps = {
    open: true,
    loading: false,
    warnings: [],
    onClose: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("PlanResultDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<PlanResultDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<PlanResultDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
});

// ── Estado de carga ───────────────────────────────────────────────────────────

describe("PlanResultDialog - estado de carga", () => {
    it("muestra 'Planificando…' en el header", () => {
        render(<PlanResultDialog {...baseProps} loading={true} />);
        expect(screen.getByText("Planificando…")).toBeInTheDocument();
    });

    it("muestra el texto de generación del plan", () => {
        render(<PlanResultDialog {...baseProps} loading={true} />);
        expect(screen.getByText("Generando tu plan…")).toBeInTheDocument();
    });

    it("no muestra el botón de cerrar durante la carga", () => {
        render(<PlanResultDialog {...baseProps} loading={true} />);
        expect(screen.queryByLabelText("Cerrar")).not.toBeInTheDocument();
        expect(screen.queryByText("Cerrar")).not.toBeInTheDocument();
    });

    it("no llama a onClose al pulsar el overlay durante la carga", async () => {
        const onClose = jest.fn();
        render(<PlanResultDialog {...baseProps} loading={true} onClose={onClose} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(onClose).not.toHaveBeenCalled();
    });
});

// ── Resultado sin warnings ────────────────────────────────────────────────────

describe("PlanResultDialog - éxito sin tareas sin planificar", () => {
    it("muestra el título 'Resultado del plan'", () => {
        render(<PlanResultDialog {...baseProps} warnings={[]} />);
        expect(screen.getByText("Resultado del plan")).toBeInTheDocument();
    });

    it("muestra el mensaje de éxito total", () => {
        render(<PlanResultDialog {...baseProps} warnings={[]} />);
        expect(screen.getByText(/Todas las tareas han sido planificadas/)).toBeInTheDocument();
    });

    it("no muestra la sección de tareas sin planificar", () => {
        render(<PlanResultDialog {...baseProps} warnings={[]} />);
        expect(screen.queryByText("Tareas sin planificar")).not.toBeInTheDocument();
    });
});

// ── Resultado con warnings ────────────────────────────────────────────────────

describe("PlanResultDialog - resultado con tareas sin planificar", () => {
    const warnings = [
        { taskId: "t1", title: "Matemáticas", message: "No hay tiempo antes del deadline" },
        { taskId: "t2", title: "Historia",    message: "Tiempo insuficiente disponible" },
    ];

    it("muestra el conteo correcto en plural", () => {
        render(<PlanResultDialog {...baseProps} warnings={warnings} />);
        expect(screen.getByText(/2 tareas no pudieron/)).toBeInTheDocument();
    });

    it("usa singular cuando hay exactamente 1 warning", () => {
        render(<PlanResultDialog {...baseProps} warnings={[warnings[0]]} />);
        expect(screen.getByText(/1 tarea no pudo/)).toBeInTheDocument();
    });

    it("muestra la etiqueta 'Tareas sin planificar'", () => {
        render(<PlanResultDialog {...baseProps} warnings={warnings} />);
        expect(screen.getByText("Tareas sin planificar")).toBeInTheDocument();
    });

    it("muestra el título de cada tarea sin planificar", () => {
        render(<PlanResultDialog {...baseProps} warnings={warnings} />);
        expect(screen.getByText("Matemáticas")).toBeInTheDocument();
        expect(screen.getByText("Historia")).toBeInTheDocument();
    });

    it("muestra el mensaje de cada warning", () => {
        render(<PlanResultDialog {...baseProps} warnings={warnings} />);
        expect(screen.getByText("No hay tiempo antes del deadline")).toBeInTheDocument();
        expect(screen.getByText("Tiempo insuficiente disponible")).toBeInTheDocument();
    });
});

// ── Cerrar ────────────────────────────────────────────────────────────────────

describe("PlanResultDialog - cerrar", () => {
    it("llama a onClose al pulsar el botón Cerrar", async () => {
        const onClose = jest.fn();
        render(<PlanResultDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el botón ✕", async () => {
        const onClose = jest.fn();
        render(<PlanResultDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("llama a onClose al pulsar el overlay", async () => {
        const onClose = jest.fn();
        render(<PlanResultDialog {...baseProps} onClose={onClose} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
