import { renderHook, act, waitFor } from "@testing-library/react";
import { useSidebarCalendars } from "../hooks/useSidebarCalendars";

const pushAlert = jest.fn();
const onVisibilityChange = jest.fn();
const onCalendarDeleted = jest.fn();

const mockCustom = [
    { _id: "cal1", name: "Personal", color: "#ff0000", visible: true },
    { _id: "cal2", name: "Trabajo",  color: "#00ff00", visible: false },
];
const mockDefault = [
    { _id: "def1", name: "Festivos", color: "#0000ff", visible: true },
];

function makeHook(enabled = true) {
    return renderHook(() =>
        useSidebarCalendars({ enabled, pushAlert, onVisibilityChange, onCalendarDeleted })
    );
}

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes("/calendars/common")) {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockDefault, message: "OK" }) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: mockCustom, message: "OK" }) });
    }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

describe("useSidebarCalendars - fetch inicial", () => {
    it("no hace fetch cuando enabled=false", () => {
        makeHook(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("carga calendarios custom y default al montar", async () => {
        const { result } = makeHook();
        await waitFor(() => {
            expect(result.current.customCalendars.length).toBe(2);
            expect(result.current.defaultCalendars.length).toBe(1);
        });
    });

    it("mapea correctamente los calendarios", async () => {
        const { result } = makeHook();
        await waitFor(() => expect(result.current.customCalendars.length).toBe(2));
        expect(result.current.customCalendars[0]).toEqual({
            id: "cal1", name: "Personal", color: "#ff0000", visible: true,
        });
    });
});

describe("useSidebarCalendars - toggleVisibility", () => {
    it("hace PUT a /calendars/toggleVisibility/:id", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockDefault, message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: {},          message: "OK" }) }) // toggle PUT
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) }) // refetch custom
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockDefault, message: "OK" }) }) as jest.Mock; // refetch default

        const { result } = makeHook();
        await waitFor(() => expect(result.current.customCalendars.length).toBe(2));

        await act(async () => { await result.current.toggleVisibility("cal1"); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/calendars/toggleVisibility/cal1"),
            expect.objectContaining({ method: "PUT" })
        );
    });

    it("llama a pushAlert con error si el toggle falla", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true,  json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) })
            .mockResolvedValueOnce({ ok: true,  json: () => Promise.resolve({ data: mockDefault, message: "OK" }) })
            .mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ data: null, message: "Error" }) }) as jest.Mock;

        const { result } = makeHook();
        await waitFor(() => expect(result.current.customCalendars.length).toBe(2));

        await act(async () => { await result.current.toggleVisibility("cal1"); });
        expect(pushAlert).toHaveBeenCalledWith("Error", "error");
    });
});

describe("useSidebarCalendars - deleteCalendar", () => {
    it("hace DELETE a /calendars/:id", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockDefault, message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: {},          message: "Eliminado" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) }) as jest.Mock;

        const { result } = makeHook();
        await waitFor(() => expect(result.current.customCalendars.length).toBe(2));

        await act(async () => { await result.current.deleteCalendar("cal1"); });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/calendars/cal1"),
            expect.objectContaining({ method: "DELETE" })
        );
    });

    it("llama a pushAlert con success al borrar", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockDefault, message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: {},          message: "Eliminado" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) }) as jest.Mock;

        const { result } = makeHook();
        await waitFor(() => expect(result.current.customCalendars.length).toBe(2));

        await act(async () => { await result.current.deleteCalendar("cal1"); });
        expect(pushAlert).toHaveBeenCalledWith("Eliminado", "success");
    });

    it("llama a onCalendarDeleted tras borrar", async () => {
        global.fetch = jest.fn()
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockDefault, message: "OK" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: {},          message: "Eliminado" }) })
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: mockCustom,  message: "OK" }) }) as jest.Mock;

        const { result } = makeHook();
        await waitFor(() => expect(result.current.customCalendars.length).toBe(2));

        await act(async () => { await result.current.deleteCalendar("cal1"); });
        expect(onCalendarDeleted).toHaveBeenCalled();
    });
});