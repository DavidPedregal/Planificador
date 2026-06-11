import { renderHook, act } from "@testing-library/react";
import { useDeleteTask } from "../useDeleteTask";

const mockDeleteTask = jest.fn().mockResolvedValue(true);

function makeHook() {
    return renderHook(() => useDeleteTask({ deleteTask: mockDeleteTask }));
}

beforeEach(() => jest.clearAllMocks());

describe("useDeleteTask - estado inicial", () => {
    it("recurrenceChoiceOpen empieza en false", () => {
        const { result } = makeHook();
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });
});

describe("useDeleteTask - handleDeleteTask", () => {
    it("abre el diálogo de recurrencia", () => {
        const { result } = makeHook();
        act(() => { result.current.handleDeleteTask("42", true); });
        expect(result.current.recurrenceChoiceOpen).toBe(true);
    });
});

describe("useDeleteTask - confirmDelete", () => {
    it("llama a deleteTask con el id y modo correctos", async () => {
        const { result } = makeHook();
        act(() => { result.current.handleDeleteTask("42", true); });
        await act(async () => { await result.current.confirmDelete("single"); });
        expect(mockDeleteTask).toHaveBeenCalledWith("42", "single");
    });

    it("cierra el diálogo tras confirmar", async () => {
        const { result } = makeHook();
        act(() => { result.current.handleDeleteTask("42", true); });
        await act(async () => { await result.current.confirmDelete("all"); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
    });

    it("no llama a deleteTask si no hay selectedTaskId", async () => {
        const { result } = makeHook();
        await act(async () => { await result.current.confirmDelete("single"); });
        expect(mockDeleteTask).not.toHaveBeenCalled();
    });
});

describe("useDeleteTask - cancelDelete", () => {
    it("cierra el diálogo sin llamar a deleteTask", () => {
        const { result } = makeHook();
        act(() => { result.current.handleDeleteTask("42", true); });
        act(() => { result.current.cancelDelete(); });
        expect(result.current.recurrenceChoiceOpen).toBe(false);
        expect(mockDeleteTask).not.toHaveBeenCalled();
    });
});