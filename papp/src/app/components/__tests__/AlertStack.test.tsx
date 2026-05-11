import React from "react";
import { render, screen } from "@testing-library/react";
import AlertStack from "../AlertStack";

jest.mock("@/context/AppContext", () => ({
    useApp: jest.fn(),
}));

import { useApp } from "@/context/AppContext";
const mockUseApp = useApp as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe("AlertStack", () => {
    it("no muestra alertas cuando la lista está vacía", () => {
        mockUseApp.mockReturnValue({ alerts: [] });
        render(<AlertStack />);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("muestra una alerta cuando hay un elemento", () => {
        mockUseApp.mockReturnValue({
            alerts: [{ id: "1", message: "Guardado correctamente", severity: "success" }],
        });
        render(<AlertStack />);
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText("Guardado correctamente")).toBeInTheDocument();
    });

    it("muestra todas las alertas cuando hay varias", () => {
        mockUseApp.mockReturnValue({
            alerts: [
                { id: "1", message: "Error de red",           severity: "error"   },
                { id: "2", message: "Guardado correctamente", severity: "success" },
                { id: "3", message: "Aviso",                  severity: "warning" },
            ],
        });
        render(<AlertStack />);
        expect(screen.getAllByRole("alert")).toHaveLength(3);
        expect(screen.getByText("Error de red")).toBeInTheDocument();
        expect(screen.getByText("Guardado correctamente")).toBeInTheDocument();
        expect(screen.getByText("Aviso")).toBeInTheDocument();
    });

    it("renderiza cada alerta con su mensaje correcto", () => {
        mockUseApp.mockReturnValue({
            alerts: [
                { id: "a", message: "Primera alerta", severity: "info"  },
                { id: "b", message: "Segunda alerta", severity: "error" },
            ],
        });
        render(<AlertStack />);
        expect(screen.getByText("Primera alerta")).toBeInTheDocument();
        expect(screen.getByText("Segunda alerta")).toBeInTheDocument();
    });
});
