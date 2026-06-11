import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteByLabelDialog from "../delete-by-label-dialog";

const baseProps = {
    open: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("DeleteByLabelDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<DeleteByLabelDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("el input empieza vacío al abrirse", () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        expect(screen.getByRole("textbox")).toHaveValue("");
    });
});

// ── Botón Eliminar ────────────────────────────────────────────────────────────

describe("DeleteByLabelDialog - botón Eliminar", () => {
    it("está deshabilitado cuando el input está vacío", () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        expect(screen.getByText("Eliminar")).toBeDisabled();
    });

    it("se habilita al escribir texto", async () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        await userEvent.type(screen.getByRole("textbox"), "trabajo");
        expect(screen.getByText("Eliminar")).toBeEnabled();
    });

    it("llama a onConfirm con el texto recortado al pulsar Eliminar", async () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        await userEvent.type(screen.getByRole("textbox"), "  trabajo  ");
        await userEvent.click(screen.getByText("Eliminar"));
        expect(baseProps.onConfirm).toHaveBeenCalledWith("trabajo");
        expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it("llama a onConfirm al presionar Enter con texto", async () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        await userEvent.type(screen.getByRole("textbox"), "trabajo{Enter}");
        expect(baseProps.onConfirm).toHaveBeenCalledWith("trabajo");
    });

    it("no llama a onConfirm al presionar Enter con input vacío", async () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        await userEvent.type(screen.getByRole("textbox"), "{Enter}");
        expect(baseProps.onConfirm).not.toHaveBeenCalled();
    });
});

// ── Cancelar ──────────────────────────────────────────────────────────────────

describe("DeleteByLabelDialog - cancelar", () => {
    it("llama a onCancel al pulsar Cancelar", async () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar ✕", async () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar el overlay", async () => {
        render(<DeleteByLabelDialog {...baseProps} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    });
});
