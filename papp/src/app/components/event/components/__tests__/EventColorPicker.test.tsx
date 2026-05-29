import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventColorPicker } from "../EventColorPicker";
import { COLORS } from "@/app/components/shared/lib/eventTypes";

const baseProps = {
    useCustomColor: false,
    color: COLORS[0].value,
    onToggleCustomColor: jest.fn(),
    onColorChange: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

// ── Checkbox ──────────────────────────────────────────────────────────────────

describe("EventColorPicker - checkbox", () => {
    it("el checkbox aparece desmarcado cuando useCustomColor=false", () => {
        render(<EventColorPicker {...baseProps} useCustomColor={false} />);
        const checkbox = screen.getByLabelText("Usar color personalizado");
        expect(checkbox).not.toBeChecked();
    });

    it("el checkbox aparece marcado cuando useCustomColor=true", () => {
        render(<EventColorPicker {...baseProps} useCustomColor={true} />);
        const checkbox = screen.getByLabelText("Usar color personalizado");
        expect(checkbox).toBeChecked();
    });

    it("llama a onToggleCustomColor con true al marcar el checkbox", async () => {
        const onToggle = jest.fn();
        render(<EventColorPicker {...baseProps} onToggleCustomColor={onToggle} />);
        await userEvent.click(screen.getByLabelText("Usar color personalizado"));
        expect(onToggle).toHaveBeenCalledWith(true);
    });

    it("llama a onToggleCustomColor con false al desmarcar el checkbox", async () => {
        const onToggle = jest.fn();
        render(<EventColorPicker {...baseProps} useCustomColor={true} onToggleCustomColor={onToggle} />);
        await userEvent.click(screen.getByLabelText("Usar color personalizado"));
        expect(onToggle).toHaveBeenCalledWith(false);
    });
});

// ── Paleta de colores ─────────────────────────────────────────────────────────

describe("EventColorPicker - paleta de colores", () => {
    it("no muestra los botones de color cuando useCustomColor=false", () => {
        render(<EventColorPicker {...baseProps} useCustomColor={false} />);
        expect(screen.queryByLabelText(COLORS[0].label)).not.toBeInTheDocument();
    });

    it("muestra todos los botones de color cuando useCustomColor=true", () => {
        render(<EventColorPicker {...baseProps} useCustomColor={true} />);
        COLORS.forEach((c) => {
            expect(screen.getByLabelText(c.label)).toBeInTheDocument();
        });
    });

    it("llama a onColorChange con el valor correcto al pulsar un color", async () => {
        const onColorChange = jest.fn();
        render(<EventColorPicker {...baseProps} useCustomColor={true} onColorChange={onColorChange} />);
        await userEvent.click(screen.getByLabelText(COLORS[1].label));
        expect(onColorChange).toHaveBeenCalledWith(COLORS[1].value);
    });

    it("el botón del color activo tiene aria-pressed=true", () => {
        render(<EventColorPicker {...baseProps} useCustomColor={true} color={COLORS[2].value} />);
        expect(screen.getByLabelText(COLORS[2].label)).toHaveAttribute("aria-pressed", "true");
    });

    it("los botones de colores inactivos tienen aria-pressed=false", () => {
        render(<EventColorPicker {...baseProps} useCustomColor={true} color={COLORS[0].value} />);
        expect(screen.getByLabelText(COLORS[1].label)).toHaveAttribute("aria-pressed", "false");
    });
});
