"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { config } from "@/app/config/config";

export function useAuthGuard() {
    const { user, logout } = useApp();
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token || !user) {
            logout();
            router.replace("/");
            return;
        }

        fetch(`${config.backendUrl}/users/verify`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
            if (!res.ok) {
                logout();
                router.replace("/");
            }
        }).catch(() => {
            logout();
            router.replace("/");
        });
    }, []);
}
