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
    it("usa 'Update' como etiqueta cuando action=update, kind=event", () => {
        render(<RecurrenceChoiceDialog {...baseProps} action="update" kind="event" />);
        expect(screen.getByText("Update only this event")).toBeInTheDocument();
        expect(screen.getByText("Update from this event onwards")).toBeInTheDocument();
        expect(screen.getByText("Update the entire series")).toBeInTheDocument();
    });

    it("usa 'Delete' como etiqueta cuando action=delete, kind=event", () => {
        render(<RecurrenceChoiceDialog {...baseProps} action="delete" kind="event" />);
        expect(screen.getByText("Delete only this event")).toBeInTheDocument();
        expect(screen.getByText("Delete from this event onwards")).toBeInTheDocument();
        expect(screen.getByText("Delete the entire series")).toBeInTheDocument();
    });
});

describe("RecurrenceChoiceDialog - etiquetas de botones para tareas", () => {
    it("usa etiquetas de tarea cuando kind=task y action=update", () => {
        render(<RecurrenceChoiceDialog {...baseProps} kind="task" action="update" />);
        expect(screen.getByText("Update only this task")).toBeInTheDocument();
        expect(screen.getByText("Update from this task onwards")).toBeInTheDocument();
        expect(screen.getByText("Update the entire series")).toBeInTheDocument();
    });

    it("usa etiquetas de tarea cuando kind=task y action=delete", () => {
        render(<RecurrenceChoiceDialog {...baseProps} kind="task" action="delete" />);
        expect(screen.getByText("Delete only this task")).toBeInTheDocument();
        expect(screen.getByText("Delete from this task onwards")).toBeInTheDocument();
        expect(screen.getByText("Delete the entire series")).toBeInTheDocument();
    });
});

describe("RecurrenceChoiceDialog - callbacks", () => {
    it("llama a onChooseSingle al pulsar el primer botón", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Update only this event"));
        expect(baseProps.onChooseSingle).toHaveBeenCalledTimes(1);
    });

    it("llama a onChooseFromThis al pulsar el segundo botón", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Update from this event onwards"));
        expect(baseProps.onChooseFromThis).toHaveBeenCalledTimes(1);
    });

    it("llama a onChooseAll al pulsar el tercer botón", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Update the entire series"));
        expect(baseProps.onChooseAll).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar Cancel", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Cancel"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar ✕", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByLabelText("Close"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar el overlay", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });
});
