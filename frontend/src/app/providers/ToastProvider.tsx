'use client';
import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: { borderRadius: '10px', fontSize: '14px' },
        success: { iconTheme: { primary: '#0D9488', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
      }}
    />
  );
}
