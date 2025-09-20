"use client";
import React, { useEffect, useState } from "react";

type Plate = {
  id: string;
  plate: string;
  owner?: string;
  detectedAt?: string;
};

export default function PlateManager() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [newPlate, setNewPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "http://localhost:8000";

  // Fetch all plates
  const fetchPlates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/plates`);
      if (!res.ok) throw new Error("Failed to fetch plates");
      const data = await res.json();
      setPlates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlates();
  }, []);

  // Create a new plate
  const createPlate = async () => {
    if (!newPlate) return;
    try {
      await fetch(`${API_BASE}/plates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: newPlate }),
      });
      setNewPlate("");
      fetchPlates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Update a plate
  const updatePlate = async (id: string) => {
    const updatedPlate = prompt("Enter new plate value:");
    if (!updatedPlate) return;
    try {
      await fetch(`${API_BASE}/plates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate: updatedPlate }),
      });
      fetchPlates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete a plate
  const deletePlate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plate?")) return;
    try {
      await fetch(`${API_BASE}/plates/${id}`, { method: "DELETE" });
      fetchPlates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Plate Manager</h1>

      {/* Create */}
      <div className="flex mb-4 gap-2">
        <input
          type="text"
          placeholder="New plate"
          value={newPlate}
          onChange={(e) => setNewPlate(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <button
          onClick={createPlate}
          className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* List plates */}
      <ul className="space-y-2">
        {plates.map((plate) => (
          <li
            key={plate.id}
            className="flex justify-between items-center bg-gray-50 p-2 rounded shadow-sm"
          >
            <span>{plate.plate}</span>
            <div className="flex gap-2">
              <button
                onClick={() => updatePlate(plate.id)}
                className="text-yellow-500 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => deletePlate(plate.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
