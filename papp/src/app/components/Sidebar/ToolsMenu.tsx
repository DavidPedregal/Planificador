"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRightIcon, UploadIcon, DownloadIcon } from "lucide-react";
import ConstructionIcon from "@mui/icons-material/Construction";
import AutoFixNormalIcon from "@mui/icons-material/AutoFixNormal";
import LabelOffIcon from "@mui/icons-material/LabelOff";

interface ToolsMenuProps {
    onReplan: () => void;
    onDeleteByLabel: () => void;
}

export default function ToolsMenu({ onReplan, onDeleteByLabel }: ToolsMenuProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const replan = () => {
        setOpen(false);
        onReplan();
    };

    return (
        <div className="tools-menu-wrapper" ref={ref}>
            <button
                className={`sidebar-nav-item${open ? " active" : ""}`}
                onClick={() => setOpen(o => !o)}
            >
                <ConstructionIcon style={{ fontSize: "1.25rem" }} />
                <span style={{ flex: 1 }}>{t("sidebar.tools")}</span>
                <ChevronRightIcon
                    size="0.9rem"
                    className={`tools-menu-arrow${open ? " open" : ""}`}
                />
            </button>

            {open && (
                <div className="tools-menu-dropdown">
                    <button className="sidebar-dropdown-item" onClick={() => replan()}>
                        <AutoFixNormalIcon style={{ fontSize: "1rem" }} />
                        {t("sidebar.toolsReplan")}
                    </button>
                    <button className="sidebar-dropdown-item" onClick={() => { setOpen(false); onDeleteByLabel(); }}>
                        <LabelOffIcon style={{ fontSize: "1rem" }} />
                        {t("sidebar.toolsDeleteByLabel")}
                    </button>
                    <button className="sidebar-dropdown-item" onClick={() => setOpen(false)}>
                        <UploadIcon size="1rem" />
                        {t("sidebar.toolsImport")}
                    </button>
                    <button className="sidebar-dropdown-item" onClick={() => setOpen(false)}>
                        <DownloadIcon size="1rem" />
                        {t("sidebar.toolsExport")}
                    </button>
                </div>
            )}
        </div>
    );
}
