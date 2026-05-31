"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useEffect } from "react";

export default function StatisticsPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user, theme, logout, pushAlert } = useApp();

    useEffect(() => {
        if (!user) router.push("/");
    }, [user]);
    
    return (
        <div>
            <h1>Statistics</h1>
            <p>This is the statistics page.</p>
        </div>
    );
}