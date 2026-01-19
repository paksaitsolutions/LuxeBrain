'use client';

import { useState } from 'react';
import { showUndoToast, useUndo } from '@luxebrain/ui';
import { toast } from '@luxebrain/ui/toast';

export default function UndoDemoPage() {
  const [items, setItems] = useState([
    { id: 1, name: 'Item 1', status: 'active' },
    { id: 2, name: 'Item 2', status: 'active' },
    { id: 3, name: 'Item 3', status: 'active' },
  ]);
  const { createUndoAction } = useUndo();

  const deleteItem = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Save undo action to backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/undo/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: 'delete_item',
        data: { item_id: id, item },
        tenant_id: 'demo-tenant',
      }),
    });

    const { undo_id } = await res.json();

    // Remove item
    setItems(items.filter(i => i.id !== id));

    // Show undo toast
    showUndoToast({
      message: `Deleted ${item.name}`,
      onUndo: async () => {
        // Execute undo on backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/undo/execute/${undo_id}`, {
          method: 'POST',
        });

        // Restore item
        setItems(prev => [...prev, item].sort((a, b) => a.id - b.id));
      },
    });
  };

  const updateItemStatus = (id: number, newStatus: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const oldStatus = item.status;

    // Update item
    setItems(items.map(i => i.id === id ? { ...i, status: newStatus } : i));

    // Show undo toast
    showUndoToast({
      message: `Changed ${item.name} to ${newStatus}`,
      onUndo: () => {
        setItems(items.map(i => i.id === id ? { ...i, status: oldStatus } : i));
      },
    });
  };

  const bulkDelete = () => {
    const deletedItems = [...items];

    setItems([]);

    showUndoToast({
      message: `Deleted ${deletedItems.length} items`,
      onUndo: () => {
        setItems(deletedItems);
      },
      duration: 5000,
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Undo Functionality Demo</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Items</h2>
          <button
            onClick={bulkDelete}
            disabled={items.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            Delete All
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items. All deleted!</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">Status: {item.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateItemStatus(item.id, item.status === 'active' ? 'inactive' : 'active')}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Toggle Status
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">💡 Tip</p>
          <p className="text-sm text-blue-700 mt-1">
            After deleting or updating an item, you have 5 seconds to undo the action. 
            Look for the undo button at the bottom of the screen!
          </p>
        </div>
      </div>
    </div>
  );
}
