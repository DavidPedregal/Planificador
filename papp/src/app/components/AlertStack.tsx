// components/AlertStack.tsx
'use client';
import { useApp } from '../../context/AppContext';
import Alert from '@mui/material/Alert';

export default function AlertStack() {
  const { alerts } = useApp();

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
      {alerts.map(alert => (
        <Alert key={alert.id} variant="outlined" severity={alert.severity}>
          {alert.message}
        </Alert>
      ))}
    </div>
  );
}