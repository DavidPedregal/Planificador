import React, { useState } from "react";
import "./edit-plan-event-dialog.css";
import { config } from "@/app/config/config";
import CloseIcon from '@mui/icons-material/Close';

interface Props {
    open: boolean;
    planEventId: String;
    onClose: () => void;
    onSave: (status: string) => void;
    onDelete: () => void;
}

const EditPlanEventDialog: React.FC<Props> = ({open, planEventId, onClose, onSave, onDelete}) => {
    const [actualTime, setActualTime] = useState<string>("");

    const handleMarkCompleted = async () => {
        try{
            const [hours, minutes] = actualTime.split(":").map(Number);
            fetch(config.backendUrl + `/plan/${planEventId}`, {
                method: "PUT",
                    headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ userTime: (hours*60 + minutes), status: "completed" }),
            });
            onSave("completed");
        } catch (error) {
            console.error("Error marking event as completed:", error);
        }
        onClose();
    };

    const handleMarkUncompleted = () => {
        try {
            fetch(config.backendUrl + `/plan/${planEventId}`, {
                method: "PUT",
                    headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ status: "uncompleted" }),
            });
            onSave("uncompleted");
        } catch (error) {
            console.error("Error marking event as uncompleted:", error);
        }
        onClose();
    };

    const handleDelete = () => {

        onDelete();
        onClose();
    };

    if (!open) return null;
    return (
        <div className="eped-overlay">
            <div className="eped-dialog">
                {/* Header */}
                <div className="eped-header">
                    <div className="eped-header-left">
                        <div className="eped-header-dot"></div>
                        <h2 className="eped-title">Edit Planned Event</h2>
                    </div>
                    <button 
                        className="eped-close" 
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <CloseIcon fontSize="inherit" />
                    </button>
                </div>

                {/* Body */}
                <div className="eped-body">
                    <div className="eped-field">
                        <label className="eped-label">Actual Time</label>
                        <input
                            type="time"
                            value={actualTime}
                            onChange={(e) => setActualTime(e.target.value)}
                            className="eped-input eped-time-input"
                            placeholder="HH:MM"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="eped-footer">
                    <button 
                        className="eped-btn eped-btn-cancel"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="eped-btn eped-btn-secondary"
                        onClick={handleMarkUncompleted}
                    >
                        Mark as Uncompleted
                    </button>
                    <button 
                        className="eped-btn eped-btn-danger"
                        onClick={handleDelete}
                    >
                        Delete
                    </button>
                    <button 
                        className="eped-btn eped-btn-primary"
                        onClick={handleMarkCompleted}
                        disabled={!actualTime}
                    >
                        Mark as Completed
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPlanEventDialog;