"use client";

import { useState, useEffect } from "react";
import { config } from "@/app/config/config";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export type { UserSettings as Settings } from "@/context/AppContext";
import type { UserSettings as Settings } from "@/context/AppContext";

export function useSettings() {
    const { pushAlert, userSettings, applySettings } = useApp();
    const [loading, setLoading] = useState(true);

    const authHeader = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
    });

    useEffect(() => {
        // Settings may already be in context (loaded by AppContext on user mount).
        // Still fetch to get the authoritative copy and mark loading done.
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { ok, data, message } = await apiFetch(`${config.backendUrl}/settings`, {
            headers: authHeader(),
        });
        setLoading(false);
        if (!ok) { pushAlert(message, "error"); return; }
        applySettings(data);
    };

    const updateField = async (field: keyof Omit<Settings, "_id">, value: any) => {
        if (!userSettings) return;
        const updated = { ...userSettings, [field]: value };
        applySettings(updated);

        const { ok, message } = await apiFetch(`${config.backendUrl}/settings/${userSettings._id}`, {
            method: "PUT",
            headers: authHeader(),
            body: JSON.stringify({ [field]: value }),
        });
        if (!ok) pushAlert(message, "error");
        else pushAlert(message, "success");
    };

    const patchLocal = (field: keyof Omit<Settings, "_id">, value: any) => {
        if (!userSettings) return;
        applySettings({ ...userSettings, [field]: value });
    };

    return { settings: userSettings, loading, updateField, patchLocal };
}
