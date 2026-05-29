import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "../confirm-dialog";

const baseProps = {
    open: true,
    title: "Eliminar elemento",
    message: "¿Estás seguro de que deseas continuar?",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Visibilidad ───────────────────────────────────────────────────────────────

describe("ConfirmDialog - visibilidad", () => {
    it("no renderiza nada cuando open=false", () => {
        const { container } = render(<ConfirmDialog {...baseProps} open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("muestra el diálogo cuando open=true", () => {
        render(<ConfirmDialog {...baseProps} />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("muestra el título", () => {
        render(<ConfirmDialog {...baseProps} />);
        expect(screen.getByText("Eliminar elemento")).toBeInTheDocument();
    });

    it("muestra el mensaje", () => {
        render(<ConfirmDialog {...baseProps} />);
        expect(screen.getByText("¿Estás seguro de que deseas continuar?")).toBeInTheDocument();
    });
});

// ── Textos de los botones ─────────────────────────────────────────────────────

describe("ConfirmDialog - textos de botones", () => {
    it("usa 'Confirmar' y 'Cancelar' por defecto", () => {
        render(<ConfirmDialog {...baseProps} />);
        expect(screen.getByText("Confirmar")).toBeInTheDocument();
        expect(screen.getByText("Cancelar")).toBeInTheDocument();
    });

    it("usa los textos personalizados cuando se proporcionan", () => {
        render(<ConfirmDialog {...baseProps} confirmText="Eliminar" cancelText="Volver" />);
        expect(screen.getByText("Eliminar")).toBeInTheDocument();
        expect(screen.getByText("Volver")).toBeInTheDocument();
    });
});

// ── Callbacks ─────────────────────────────────────────────────────────────────

describe("ConfirmDialog - callbacks", () => {
    it("llama a onConfirm al pulsar el botón de confirmación", async () => {
        const onConfirm = jest.fn();
        render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
        await userEvent.click(screen.getByText("Confirmar"));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar el botón Cancelar", async () => {
        const onCancel = jest.fn();
        render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
        await userEvent.click(screen.getByText("Cancelar"));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar el botón ✕", async () => {
        const onCancel = jest.fn();
        render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
        await userEvent.click(screen.getByLabelText("Cerrar"));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("llama a onCancel al pulsar el overlay", async () => {
        const onCancel = jest.fn();
        render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
        await userEvent.click(screen.getByRole("dialog"));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
