import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecurrenceChoiceDialog from "./recurrence-choice-dialog";

const baseProps = {
    open: true,
    action: "update" as const,
    kind: "event" as const,
    title: "Update recurring event",
    message: "Do you want to update only this event or the entire series?",
    onChooseSingle: jest.fn(),
    onChooseFromThis: jest.fn(),
    onChooseAll: jest.fn(),
    onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe("RecurrenceChoiceDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<RecurrenceChoiceDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("muestra el título y el mensaje", () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        expect(screen.getByText(baseProps.title)).toBeInTheDocument();
        expect(screen.getByText(baseProps.message)).toBeInTheDocument();
    });
});

describe("RecurrenceChoiceDialog - etiquetas de botones para eventos", () => {
    it("usa 'Actualizar' como etiqueta cuando action=update, kind=event", () => {
        render(<RecurrenceChoiceDialog {...baseProps} action="update" kind="event" />);
        expect(screen.getByText("Actualizar solo este evento")).toBeInTheDocument();
        expect(screen.getByText("Actualizar a partir de este evento")).toBeInTheDocument();
        expect(screen.getByText("Actualizar toda la serie")).toBeInTheDocument();
    });

    it("usa 'Eliminar' como etiqueta cuando action=delete, kind=event", () => {
        render(<RecurrenceChoiceDialog {...baseProps} action="delete" kind="event" />);
        expect(screen.getByText("Eliminar solo este evento")).toBeInTheDocument();
        expect(screen.getByText("Eliminar a partir de este evento")).toBeInTheDocument();
        expect(screen.getByText("Eliminar toda la serie")).toBeInTheDocument();
    });
});

describe("RecurrenceChoiceDialog - etiquetas de botones para tareas", () => {
    it("usa etiquetas de tarea cuando kind=task y action=update", () => {
        render(<RecurrenceChoiceDialog {...baseProps} kind="task" action="update" />);
        expect(screen.getByText("Actualizar solo esta tarea")).toBeInTheDocument();
        expect(screen.getByText("Actualizar a partir de esta tarea")).toBeInTheDocument();
        expect(screen.getByText("Actualizar toda la serie")).toBeInTheDocument();
    });

    it("usa etiquetas de tarea cuando kind=task y action=delete", () => {
        render(<RecurrenceChoiceDialog {...baseProps} kind="task" action="delete" />);
        expect(screen.getByText("Eliminar solo esta tarea")).toBeInTheDocument();
        expect(screen.getByText("Eliminar a partir de esta tarea")).toBeInTheDocument();
        expect(screen.getByText("Eliminar toda la serie")).toBeInTheDocument();
    });
});

describe("RecurrenceChoiceDialog - callbacks", () => {
    it("llama a onChooseSingle al pulsar el primer botón", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Actualizar solo este evento"));
        expect(baseProps.onChooseSingle).toHaveBeenCalledTimes(1);
    });

    it("llama a onChooseFromThis al pulsar el segundo botón", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Actualizar a partir de este evento"));
        expect(baseProps.onChooseFromThis).toHaveBeenCalledTimes(1);
    });

    it("llama a onChooseAll al pulsar el tercer botón", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Actualizar toda la serie"));
        expect(baseProps.onChooseAll).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar Cancelar", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar ✕", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar el overlay", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });
});
