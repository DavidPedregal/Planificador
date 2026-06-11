import { renderHook, waitFor } from "@testing-library/react";
import { useAuthGuard } from "../useAuthGuard";

const mockLogout = jest.fn();
const mockReplace = jest.fn();

jest.mock("@/context/AppContext", () => ({
    useApp: () => ({ logout: mockLogout }),
}));

jest.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;
    jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

// ── Sin token ─────────────────────────────────────────────────────────────────

describe("useAuthGuard - sin token", () => {
    it("llama a logout y redirige a / si no hay token", async () => {
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
        renderHook(() => useAuthGuard());
        await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
        expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("authReady permanece false si no hay token", async () => {
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
        const { result } = renderHook(() => useAuthGuard());
        await waitFor(() => expect(mockLogout).toHaveBeenCalled());
        expect(result.current.authReady).toBe(false);
    });
});

// ── Con token válido ──────────────────────────────────────────────────────────

describe("useAuthGuard - token válido", () => {
    beforeEach(() => {
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue("valid-token");
        global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock;
    });

    it("no llama a logout ni redirige si el token es válido", async () => {
        const { result } = renderHook(() => useAuthGuard());
        await waitFor(() => expect(result.current.authReady).toBe(true));
        expect(mockLogout).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();
    });

    it("authReady pasa a true tras verificación exitosa", async () => {
        const { result } = renderHook(() => useAuthGuard());
        await waitFor(() => expect(result.current.authReady).toBe(true));
    });

    it("envía el token en la cabecera Authorization", async () => {
        const { result } = renderHook(() => useAuthGuard());
        await waitFor(() => expect(result.current.authReady).toBe(true));
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/users/verify"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer valid-token",
                }),
            })
        );
    });
});

// ── Con token inválido ────────────────────────────────────────────────────────

describe("useAuthGuard - token inválido", () => {
    beforeEach(() => {
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue("bad-token");
        global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    });

    it("llama a logout y redirige si la verificación falla", async () => {
        renderHook(() => useAuthGuard());
        await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
        expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("authReady permanece false si la verificación falla", async () => {
        const { result } = renderHook(() => useAuthGuard());
        await waitFor(() => expect(mockLogout).toHaveBeenCalled());
        expect(result.current.authReady).toBe(false);
    });
});

// ── Error de red ──────────────────────────────────────────────────────────────

describe("useAuthGuard - error de red", () => {
    beforeEach(() => {
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue("some-token");
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error")) as jest.Mock;
    });

    it("llama a logout y redirige si el fetch lanza una excepción", async () => {
        renderHook(() => useAuthGuard());
        await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
        expect(mockReplace).toHaveBeenCalledWith("/");
    });
});
