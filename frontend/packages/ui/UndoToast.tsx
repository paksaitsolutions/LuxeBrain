/**
 * Undo Toast Component
 * Copyright © 2024 Paksa IT Solutions
 */

'use client';

import { toast } from 'react-hot-toast';

interface UndoToastOptions {
  message: string;
  onUndo: () => void | Promise<void>;
  duration?: number;
}

export function showUndoToast({ message, onUndo, duration = 5000 }: UndoToastOptions) {
  let undoClicked = false;

  const toastId = toast(
    (t) => (
      <div className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <button
          onClick={async () => {
            undoClicked = true;
            toast.dismiss(t.id);
            await onUndo();
            toast.success('Action undone');
          }}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium"
        >
          Undo
        </button>
      </div>
    ),
    {
      duration,
      position: 'bottom-center',
    }
  );

  return toastId;
}

export function useUndo() {
  const createUndoAction = (message: string, onUndo: () => void | Promise<void>) => {
    return showUndoToast({ message, onUndo });
  };

  return { createUndoAction };
}
