import { renderHook, waitFor } from "@testing-library/react";
import { useCalendarList } from "../useCalendarList";
import { Calendar } from "../../../calendar/calendarHelper";

const pushAlert = jest.fn();

const mockCustomCalendars = [
    { _id: "cal1", name: "Personal", color: "#ff0000", visible: true },
    { _id: "cal2", name: "Trabajo", color: "#00ff00", visible: true },
];

const mockCommonCalendars = [
    { _id: "com1", name: "Plannable", color: "#0000ff", visible: true },
    { _id: "com2", name: "Planned", color: "#cccccc", visible: true }, // debe filtrarse
];

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");

    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes("/calendars/common")) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ data: mockCommonCalendars, message: "Ok" }),
            });
        }
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: mockCustomCalendars, message: "Ok" }),
        });
    }) as jest.Mock;
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("useCalendarList", () => {
    it("no hace fetch cuando open=false", () => {
        renderHook(() => useCalendarList(false, pushAlert));
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("devuelve lista vacía inicialmente", () => {
        const { result } = renderHook(() => useCalendarList(false, pushAlert));
        expect(result.current.calendars).toEqual([]);
    });

    it("hace fetch cuando open=true y devuelve calendarios mapeados", async () => {
        const { result } = renderHook(() => useCalendarList(true, pushAlert));

        await waitFor(() => {
            expect(result.current.calendars.length).toBeGreaterThan(0);
        });

        // Calendarios custom presentes
        expect(result.current.calendars).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: "cal1", name: "Personal" }),
                expect.objectContaining({ id: "cal2", name: "Trabajo" }),
            ])
        );
    });

    it("filtra el calendario 'Planned' de los comunes", async () => {
        const { result } = renderHook(() => useCalendarList(true, pushAlert));

        await waitFor(() => {
            expect(result.current.calendars.length).toBeGreaterThan(0);
        });

        const names = result.current.calendars.map((c) => c.name);
        expect(names).not.toContain("Planned");
        expect(names).toContain("Plannable");
    });

    it("antepone los calendarios custom a los comunes", async () => {
        const { result } = renderHook(() => useCalendarList(true, pushAlert));

        await waitFor(() => {
            expect(result.current.calendars.length).toBeGreaterThan(0);
        });

        expect(result.current.calendars[0].id).toBe("cal1");
        expect(result.current.calendars[1].id).toBe("cal2");
    });

    it("maneja errores de fetch sin lanzar excepción", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error del servidor" }),
        }) as jest.Mock;

        const { result } = renderHook(() => useCalendarList(true, pushAlert));

        // Esperar un tick para que el efecto se ejecute
        await new Promise((r) => setTimeout(r, 0));

        expect(result.current.calendars).toEqual([]);
    });
});
