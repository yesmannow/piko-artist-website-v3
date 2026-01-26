"use client";

import React from 'react';

export type Task = {
  id: string;
  label: string;
  progress?: number; // 0..1
  cancellable?: boolean;
  retryable?: boolean;
};

export interface StatusBarProps {
  tasks: Task[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export function StatusBar({ tasks, onCancel, onRetry }: StatusBarProps) {
  if (!tasks || tasks.length === 0) return null;
  
  return (
    <div
      className="status-bar"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0,0,0,0.6)',
        color: '#fff',
        padding: '8px 12px',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
      }}
    >
      {tasks.map((t) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ minWidth: 160 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
            {typeof t.progress === 'number' && (
              <div
                style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    width: `${Math.round(t.progress * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg,#4af2c5,#a855f7)',
                  }}
                />
              </div>
            )}
          </div>

          {t.cancellable && (
            <button
              onClick={() => onCancel?.(t.id)}
              aria-label={`Cancel ${t.label}`}
              className="btn-small"
              style={{
                padding: '4px 8px',
                fontSize: 12,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
          {t.retryable && (
            <button
              onClick={() => onRetry?.(t.id)}
              aria-label={`Retry ${t.label}`}
              className="btn-small"
              style={{
                padding: '4px 8px',
                fontSize: 12,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
