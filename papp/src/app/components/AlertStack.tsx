'use client';
import { useApp } from '../../context/AppContext';

const SEVERITY_COLOR: Record<string, string> = {
    success: '#22c55e',
    error:   '#ef4444',
    warning: '#f59e0b',
    info:    '#3b82f6',
};

const SEVERITY_ICON: Record<string, string> = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
};

export default function AlertStack() {
    const { alerts, theme } = useApp();
    const isDark = theme === 'dark';
    const bg   = isDark ? '#f0f0f6' : '#1e1e2a';
    const text = isDark ? '#1a1a22' : '#e8e8f0';

    return (
        <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 9999,
        }}>
            {alerts.map(alert => {
                const color = SEVERITY_COLOR[alert.severity] ?? SEVERITY_COLOR.info;
                return (
                    <div key={alert.id} role="alert" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: bg,
                        color: text,
                        borderLeft: `4px solid ${color}`,
                        borderRadius: '10px',
                        padding: '12px 18px',
                        minWidth: '260px',
                        maxWidth: '400px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        fontFamily: 'DM Sans, sans-serif',
                    }}>
                        <span style={{ color, fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                            {SEVERITY_ICON[alert.severity] ?? SEVERITY_ICON.info}
                        </span>
                        {alert.message}
                    </div>
                );
            })}
        </div>
    );
}
