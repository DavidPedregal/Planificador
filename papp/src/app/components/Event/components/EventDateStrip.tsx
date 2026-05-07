import React from "react";
import EastIcon from "@mui/icons-material/East";

interface Props {
    start: Date;
    end: Date;
    onStartChange: (date: Date) => void;
    onEndChange: (date: Date) => void;
    mode: "date" | "time";
}

function getDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getTimeString(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function createDateFromParts(dateStr: string, timeStr: string): Date {
    if (!dateStr || !timeStr) return new Date();
    return new Date(`${dateStr}T${timeStr}`);
}

export const EventDateStrip: React.FC<Props> = ({ start, end, onStartChange, onEndChange, mode }) => {
    const isDate = mode === "date";

    const handleStartChange = (value: string) => {
        const newStart = isDate
            ? createDateFromParts(value, getTimeString(start))
            : createDateFromParts(getDateString(start), value);
        onStartChange(newStart);
        // Auto-advance end if it would be before start
        if (end <= newStart) {
            onEndChange(new Date(newStart.getTime() + 60 * 60 * 1000));
        }
    };

    const handleEndChange = (value: string) => {
        const newEnd = isDate
            ? createDateFromParts(value, getTimeString(end))
            : createDateFromParts(getDateString(end), value);
        onEndChange(newEnd);
    };

    return (
        <div className="aed-date-strip">
            <div className="aed-date-field">
                {isDate && <span className="aed-date-icon">⏱</span>}
                <input
                    className="aed-date-input"
                    type={isDate ? "date" : "time"}
                    value={isDate ? getDateString(start) : getTimeString(start)}
                    min={isDate ? undefined : undefined}
                    aria-label={isDate ? "Fecha de inicio" : "Hora de inicio"}
                    onChange={(e) => handleStartChange(e.target.value)}
                />
            </div>
            <span className="aed-date-arrow">
                <EastIcon />
            </span>
            <div className="aed-date-field">
                <input
                    className="aed-date-input"
                    type={isDate ? "date" : "time"}
                    value={isDate ? getDateString(end) : getTimeString(end)}
                    min={isDate ? getDateString(start) : undefined}
                    aria-label={isDate ? "Fecha de fin" : "Hora de fin"}
                    onChange={(e) => handleEndChange(e.target.value)}
                />
            </div>
        </div>
    );
};
