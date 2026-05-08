import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecurrenceChoiceDialog from "./recurrence-choice-dialog";

const baseProps = {
    open: true,
    action: "update" as const,
    title: "Actualizar evento recurrente",
    message: "¿Quieres actualizar solo este evento o todos los eventos de la serie?",
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

describe("RecurrenceChoiceDialog - etiquetas de botones", () => {
    it("usa 'Actualizar' como etiqueta cuando action=update", () => {
        render(<RecurrenceChoiceDialog {...baseProps} action="update" />);
        expect(screen.getByText("Actualizar solo este evento")).toBeInTheDocument();
        expect(screen.getByText("Actualizar a partir de este evento")).toBeInTheDocument();
        expect(screen.getByText("Actualizar toda la serie")).toBeInTheDocument();
    });

    it("usa 'Eliminar' como etiqueta cuando action=delete", () => {
        render(<RecurrenceChoiceDialog {...baseProps} action="delete" />);
        expect(screen.getByText("Eliminar solo este evento")).toBeInTheDocument();
        expect(screen.getByText("Eliminar a partir de este evento")).toBeInTheDocument();
        expect(screen.getByText("Eliminar toda la serie")).toBeInTheDocument();
    });
});

describe("RecurrenceChoiceDialog - callbacks", () => {
    it("llama a onChooseSingle al pulsar 'solo este evento'", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Actualizar solo este evento"));
        expect(baseProps.onChooseSingle).toHaveBeenCalledTimes(1);
    });

    it("llama a onChooseFromThis al pulsar 'a partir de este evento'", async () => {
        render(<RecurrenceChoiceDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Actualizar a partir de este evento"));
        expect(baseProps.onChooseFromThis).toHaveBeenCalledTimes(1);
    });

    it("llama a onChooseAll al pulsar 'toda la serie'", async () => {
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