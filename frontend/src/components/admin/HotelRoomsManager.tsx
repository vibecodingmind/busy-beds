'use client';

import { useState, useEffect } from 'react';
import { admin } from '@/lib/api';
import type { HotelRoom } from '@/lib/api';

export default function HotelRoomsManager({ hotelId }: { hotelId: number }) {
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Partial<HotelRoom> | null>(null);
  
  const [form, setForm] = useState({
    room_type: '',
    description: '',
    base_price: 100,
    currency: 'USD',
    amenities: '' as string, // Comma separated for form
    max_occupancy: 2,
    is_active: true
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await admin.hotels.rooms.list(hotelId);
      setRooms(res.rooms);
    } catch (err) {
      console.error(err);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [hotelId]);

  const handleEdit = (room: HotelRoom) => {
    setCurrentRoom(room);
    setForm({
      room_type: room.room_type,
      description: room.description || '',
      base_price: room.base_price,
      currency: room.currency,
      amenities: room.amenities ? room.amenities.join(', ') : '',
      max_occupancy: room.max_occupancy,
      is_active: room.is_active
    });
    setIsEditing(true);
  };

  const handleNew = () => {
    setCurrentRoom(null);
    setForm({
      room_type: '',
      description: '',
      base_price: 100,
      currency: 'USD',
      amenities: '',
      max_occupancy: 2,
      is_active: true
    });
    setIsEditing(true);
  };

  const handleDelete = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await admin.hotels.rooms.delete(roomId);
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (err) {
      alert('Failed to delete room');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amenitiesArray = form.amenities
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);
      
    const payload = {
      ...form,
      amenities: amenitiesArray
    };

    try {
      if (currentRoom?.id) {
        await admin.hotels.rooms.update(currentRoom.id, payload);
      } else {
        await admin.hotels.rooms.create(hotelId, payload);
      }
      
      await fetchRooms();
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save room details');
    }
  };

  if (loading && rooms.length === 0) {
    return <div className="p-4 text-center">Loading rooms...</div>;
  }

  return (
    <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Room Types & Pricing</h2>
        {!isEditing && (
          <button
            onClick={handleNew}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Room Type
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-semibold">{currentRoom ? 'Edit Room' : 'New Room Type'}</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Room Type Name</label>
              <input
                required
                type="text"
                className="w-full rounded border p-2 dark:border-zinc-700 dark:bg-zinc-800"
                value={form.room_type}
                onChange={e => setForm({ ...form, room_type: e.target.value })}
                placeholder="e.g. Standard Queen, Deluxe Suite"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Base Price</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded border p-2 dark:border-zinc-700 dark:bg-zinc-800"
                  value={form.base_price}
                  onChange={e => setForm({ ...form, base_price: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Currency</label>
                <input
                  required
                  type="text"
                  className="w-full rounded border p-2 dark:border-zinc-700 dark:bg-zinc-800"
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description (Optional)</label>
              <textarea
                className="w-full rounded border p-2 dark:border-zinc-700 dark:bg-zinc-800"
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            
            <div>
              <label className="mb-1 block text-sm font-medium">Amenities (comma separated)</label>
              <input
                type="text"
                className="w-full rounded border p-2 dark:border-zinc-700 dark:bg-zinc-800"
                value={form.amenities}
                onChange={e => setForm({ ...form, amenities: e.target.value })}
                placeholder="WiFi, TV, Ocean View"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Max Occupancy</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full rounded border p-2 dark:border-zinc-700 dark:bg-zinc-800"
                  value={form.max_occupancy}
                  onChange={e => setForm({ ...form, max_occupancy: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90">
              Save Room
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded bg-zinc-200 px-4 py-2 text-black hover:bg-zinc-300 dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {rooms.length === 0 ? (
            <p className="text-sm text-zinc-500">No rooms added yet. Click "Add Room Type" to create one.</p>
          ) : (
            rooms.map(room => (
              <div key={room.id} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {room.room_type}
                    {!room.is_active && <span className="text-xs rounded-full bg-red-100 text-red-800 px-2 py-0.5">Inactive</span>}
                  </h4>
                  <p className="text-sm font-medium text-primary mt-1">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: room.currency }).format(room.base_price)} / night
                  </p>
                  <div className="mt-1 text-xs text-zinc-500 max-w-lg truncate">
                    {room.amenities?.join(', ') || 'No amenities listed'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(room)}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
