"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { config } from "@/app/config/config";

export function useAuthGuard(): { authReady: boolean } {
    const { logout } = useApp();
    const router = useRouter();
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            logout();
            router.replace("/");
            return;
        }

        fetch(`${config.backendUrl}/users/verify`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
            if (res.ok) {
                setAuthReady(true);
            } else {
                logout();
                router.replace("/");
            }
        }).catch(() => {
            logout();
            router.replace("/");
        });
    }, []);

    return { authReady };
}
