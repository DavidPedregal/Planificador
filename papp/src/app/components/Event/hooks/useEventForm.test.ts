import { renderHook, act, waitFor } from "@testing-library/react";
import { useEventForm } from "./useEventForm";
import { Calendar, FREQUENCY_TYPE } from "@/app/components/calendar/calendarHelper";

const pushAlert = jest.fn();

const mockCalendars : Calendar[] = [
    { id: "cal1", name: "Personal", color: "#ff0000", visible: true },
    { id: "cal2", name: "Trabajo",  color: "#00ff00", visible: true },
];

const baseStart = new Date("2025-06-01T10:00:00");
const baseEnd = new Date("2025-06-01T11:00:00");

function makeHook(open = true, calendars = mockCalendars) {
    return renderHook(() =>
        useEventForm({ open, propsStart: baseStart, propsEnd: baseEnd, calendars, pushAlert })
    );
}

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("mock-token");
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Evento creado" }),
    }) as jest.Mock;
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("useEventForm - estado inicial", () => {
    it("inicializa eventTitle vacío", () => {
        const { result } = makeHook();
        expect(result.current.eventTitle).toBe("");
    });

    it("inicializa start y end con los props recibidos", () => {
        const { result } = makeHook();
        expect(result.current.start).toEqual(baseStart);
        expect(result.current.end).toEqual(baseEnd);
    });

    it("inicializa recurrence con NONE", () => {
        const { result } = makeHook();
        expect(result.current.recurrence.frequencyType).toBe(FREQUENCY_TYPE.NONE);
    });

    it("selecciona el primer calendario al recibir la lista", () => {
        const { result } = makeHook();
        expect(result.current.calendarId).toBe("cal1");
    });
});

describe("useEventForm - reset al abrir", () => {
    it("resetea eventTitle al pasar open de false a true", () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) =>
                useEventForm({ open, propsStart: baseStart, propsEnd: baseEnd, calendars: mockCalendars, pushAlert }),
            { initialProps: { open: true } }
        );

        act(() => { result.current.setEventTitle("Mi evento"); });
        expect(result.current.eventTitle).toBe("Mi evento");

        rerender({ open: false });
        rerender({ open: true });

        expect(result.current.eventTitle).toBe("");
    });

    it("resetea recurrence al abrir", () => {
        const { result, rerender } = renderHook(
            ({ open }: { open: boolean }) =>
            useEventForm({ open, propsStart: baseStart, propsEnd: baseEnd, calendars: mockCalendars, pushAlert  }),
            { initialProps: { open: true } }
        );

        act(() => {
            result.current.setRecurrence((r) => ({ ...r, frequencyType: FREQUENCY_TYPE.DAYS }));
        });

        rerender({ open: false });
        rerender({ open: true });

        expect(result.current.recurrence.frequencyType).toBe(FREQUENCY_TYPE.NONE);
    });
});

describe("useEventForm - toggleWeekday", () => {
    it("añade un día al activarlo", () => {
        const { result } = makeHook();
        act(() => { result.current.toggleWeekday(1); }); // lunes
        expect(result.current.recurrence.frequencyDaysOfWeek).toContain(1);
    });

    it("elimina un día al pulsarlo de nuevo", () => {
        const { result } = makeHook();
        act(() => { result.current.toggleWeekday(1); });
        act(() => { result.current.toggleWeekday(1); });
        expect(result.current.recurrence.frequencyDaysOfWeek).not.toContain(1);
    });

    it("puede tener múltiples días activos", () => {
        const { result } = makeHook();
        act(() => { result.current.toggleWeekday(1); });
        act(() => { result.current.toggleWeekday(3); });
        expect(result.current.recurrence.frequencyDaysOfWeek).toEqual(
            expect.arrayContaining([1, 3])
        );
    });
});

describe("useEventForm - handleSave", () => {
    it("devuelve false si el título está vacío", async () => {
        const { result } = makeHook();
        let ok: boolean;
        await act(async () => { ok = await result.current.handleSave(); });
        expect(ok!).toBe(false);
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it("hace POST y devuelve true con título válido", async () => {
        const { result } = makeHook();
        act(() => { result.current.setEventTitle("Reunión"); });

        let ok: boolean;
        await act(async () => { ok = await result.current.handleSave(); });

        expect(ok!).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/events"),
            expect.objectContaining({ method: "POST" })
        );
    });

    it("incluye el título en el body del POST", async () => {
        const { result } = makeHook();
        act(() => { result.current.setEventTitle("Reunión"); });

        await act(async () => { await result.current.handleSave(); });

        const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(body.title).toBe("Reunión");
    });

    it("devuelve false si el fetch falla", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: "Error del servidor" }),
        }) as jest.Mock;
        const { result } = makeHook();
        act(() => { result.current.setEventTitle("Reunión"); });

        let ok: boolean;
        await act(async () => { ok = await result.current.handleSave(); });

        expect(ok!).toBe(false);
    });

    it("llama a pushAlert con success al guardar correctamente", async () => {
        const pushAlert = jest.fn();
        const { result } = renderHook(() =>
            useEventForm({ open: true, propsStart: baseStart, propsEnd: baseEnd, calendars: mockCalendars, pushAlert })
        );
        act(() => { result.current.setEventTitle("Reunión"); });
        await act(async () => { await result.current.handleSave(); });
        expect(pushAlert).toHaveBeenCalledWith(expect.any(String), "success");
    });
});
