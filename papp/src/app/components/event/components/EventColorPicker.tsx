import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "@/app/components/shared/lib/eventTypes";

interface Props {
    useCustomColor: boolean;
    color: string;
    onToggleCustomColor: (enabled: boolean) => void;
    onColorChange: (color: string) => void;
}

export const EventColorPicker: React.FC<Props> = ({
    useCustomColor,
    color,
    onToggleCustomColor,
    onColorChange,
}) => {
    const { t } = useTranslation();

    return (
        <div className="aed-field">
            <label className="aed-label">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                        type="checkbox"
                        checked={useCustomColor}
                        onChange={(e) => onToggleCustomColor(e.target.checked)}
                        aria-label={t("event.customColor")}
                    />
                    <span>{t("event.customColor")}</span>
                </div>
            </label>
            {useCustomColor && (
                <div className="aed-colors">
                    {COLORS.map((c) => (
                        <button
                            key={c.value}
                            className={`aed-color-btn${color === c.value ? " active" : ""}`}
                            style={{ background: c.value }}
                            title={c.label}
                            onClick={() => onColorChange(c.value)}
                            aria-label={c.label}
                            aria-pressed={color === c.value}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
