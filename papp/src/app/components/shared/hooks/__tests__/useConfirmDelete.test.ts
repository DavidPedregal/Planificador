import { renderHook, act } from "@testing-library/react";
import { useConfirmDelete } from "../useConfirmDelete";

const mockOnConfirm = jest.fn().mockResolvedValue(true);

function makeHook() {
    return renderHook(() => useConfirmDelete<string>({ onConfirm: mockOnConfirm }));
}

beforeEach(() => jest.clearAllMocks());

describe("useConfirmDelete - estado inicial", () => {
    it("open empieza en false", () => {
        const { result } = makeHook();
        expect(result.current.open).toBe(false);
    });

    it("selectedId empieza en null", () => {
        const { result } = makeHook();
        expect(result.current.selectedId).toBeNull();
    });
});

describe("useConfirmDelete - handleDelete", () => {
    it("abre el diálogo y guarda el id", () => {
        const { result } = makeHook();
        act(() => { result.current.handleDelete("abc"); });
        expect(result.current.open).toBe(true);
        expect(result.current.selectedId).toBe("abc");
    });
});

describe("useConfirmDelete - confirm", () => {
    it("llama a onConfirm con el id seleccionado", async () => {
        const { result } = makeHook();
        act(() => { result.current.handleDelete("abc"); });
        await act(async () => { await result.current.confirm(); });
        expect(mockOnConfirm).toHaveBeenCalledWith("abc");
    });

    it("cierra el diálogo si onConfirm devuelve true", async () => {
        const { result } = makeHook();
        act(() => { result.current.handleDelete("abc"); });
        await act(async () => { await result.current.confirm(); });
        expect(result.current.open).toBe(false);
        expect(result.current.selectedId).toBeNull();
    });

    it("no cierra el diálogo si onConfirm devuelve false", async () => {
        const failConfirm = jest.fn().mockResolvedValue(false);
        const { result } = renderHook(() => useConfirmDelete<string>({ onConfirm: failConfirm }));
        act(() => { result.current.handleDelete("abc"); });
        await act(async () => { await result.current.confirm(); });
        expect(result.current.open).toBe(true);
    });

    it("no llama a onConfirm si selectedId es null", async () => {
        const { result } = makeHook();
        await act(async () => { await result.current.confirm(); });
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });
});

describe("useConfirmDelete - cancel", () => {
    it("cierra el diálogo sin llamar a onConfirm", () => {
        const { result } = makeHook();
        act(() => { result.current.handleDelete("abc"); });
        act(() => { result.current.cancel(); });
        expect(result.current.open).toBe(false);
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });
});