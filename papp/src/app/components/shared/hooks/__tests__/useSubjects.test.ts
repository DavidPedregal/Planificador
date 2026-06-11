import { renderHook, act, waitFor } from "@testing-library/react";
import { useSubjects } from "../useSubjects";

const pushAlert = jest.fn();

const mockSubjectsRaw = [
    { _id: "s1", name: "Matemáticas" },
    { _id: "s2", name: "Física" },
];

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockSubjectsRaw, message: "OK" }),
    }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

// ── fetchSubjects ─────────────────────────────────────────────────────────────

describe("useSubjects - fetchSubjects", () => {
    it("carga las asignaturas cuando enabled=true", async () => {
        const { result } = renderHook(() => useSubjects({ enabled: true, pushAlert }));
        await waitFor(() => expect(result.current.subjects.length).toBe(2));
        expect(result.current.subjects[0]).toEqual({ id: "s1", name: "Matemáticas" });
        expect(result.current.subjects[1]).toEqual({ id: "s2", name: "Física" });
    });

    it("no hace fetch cuando enabled=false", () => {
        renderHook(() => useSubjects({ enabled: false, pushAlert }));
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("lista de asignaturas empieza vacía", () => {
        const { result } = renderHook(() => useSubjects({ enabled: false, pushAlert }));
        expect(result.current.subjects).toEqual([]);
    });

    it("llama a pushAlert con error si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error del servidor" }),
        }) as jest.Mock;
        renderHook(() => useSubjects({ enabled: true, pushAlert }));
        await waitFor(() =>
            expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "error")
        );
    });

    it("fetchSubjects manual carga datos aunque enabled=false", async () => {
        const { result } = renderHook(() => useSubjects({ enabled: false, pushAlert }));
        await act(async () => { await result.current.fetchSubjects(); });
        await waitFor(() => expect(result.current.subjects.length).toBe(2));
    });
});

// ── deleteSubject ─────────────────────────────────────────────────────────────

describe("useSubjects - deleteSubject", () => {
    beforeEach(() => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: mockSubjectsRaw }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ message: "Eliminada" }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: [mockSubjectsRaw[1]] }),
            }) as jest.Mock;
    });

    it("envía DELETE a /subjects/:id", async () => {
        const { result } = renderHook(() => useSubjects({ enabled: true, pushAlert }));
        await waitFor(() => expect(result.current.subjects.length).toBe(2));
        await act(async () => { await result.current.deleteSubject("s1"); });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/subjects/s1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });

    it("llama a pushAlert con success tras borrar", async () => {
        const { result } = renderHook(() => useSubjects({ enabled: true, pushAlert }));
        await waitFor(() => expect(result.current.subjects.length).toBe(2));
        await act(async () => { await result.current.deleteSubject("s1"); });
        expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "success");
    });

    it("recarga la lista de asignaturas tras borrar", async () => {
        const { result } = renderHook(() => useSubjects({ enabled: true, pushAlert }));
        await waitFor(() => expect(result.current.subjects.length).toBe(2));
        await act(async () => { await result.current.deleteSubject("s1"); });
        await waitFor(() => expect(result.current.subjects.length).toBe(1));
    });

    it("llama a pushAlert con error si DELETE falla y no recarga", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ data: mockSubjectsRaw }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ message: "Error" }),
            }) as jest.Mock;

        const { result } = renderHook(() => useSubjects({ enabled: true, pushAlert }));
        await waitFor(() => expect(result.current.subjects.length).toBe(2));

        const fetchCountBefore = (global.fetch as jest.Mock).mock.calls.length;
        await act(async () => { await result.current.deleteSubject("s1"); });

        expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "error");
        expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCountBefore + 1);
    });
});
