"use client";

import React, { useEffect, useState } from "react";
// import { Button, Modal } from "react-daisyui"; // Optional: for types if needed

type PlateRecord = {
  id: number;
  plate: string;
  owner: string;
  phone?: string;
  detected_at?: string;
};

export default function PlateManager() {
  const [plates, setPlates] = useState<PlateRecord[]>([]);
  const [plate, setPlate] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState<PlateRecord | null>(null);

  const fetchPlates = async () => {
    try {
      const res = await fetch("http://localhost:8000/plates");
      const data = await res.json();      
      setPlates(data || []);
    } catch (err) {
      console.error("Failed to fetch plates:", err);
    }
  };
  
  useEffect(() => {
    fetchPlates();
  }, []);

  const handleAddPlate = async () => {
    if (!plate || !owner) return alert("Plate and owner are required!");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/plates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate, owner, phone }),
      });

      const data = await res.json();
      setPlates((prev) => [...prev, data.plate]);
      setPlate("");
      setOwner("");
      setPhone("");
    } catch (err) {
      console.error("Error adding plate:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6 text-center">🚘 Plate Registry</h2>

      {/* Add Plate Form */}
      <div className="card bg-base-100 shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Add New Plate</h3>
        <div className="flex flex-col gap-3">
          <input
            className="input input-bordered w-full"
            placeholder="Plate Number"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
          <input
            className="input input-bordered w-full"
            placeholder="Owner Name"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
          <input
            className="input input-bordered w-full"
            placeholder="Phone Number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button
            className={`btn btn-primary mt-2 ${loading ? "loading" : ""}`}
            onClick={handleAddPlate}
            disabled={loading}
          >
            Add Plate
          </button>
        </div>
      </div>

      {/* Plates List */}
      <div className="flex justify-between">
        <h3 className="text-2xl font-semibold mb-4">Registered Plates</h3>{" "}
        <button onClick={fetchPlates} className="btn">referesh</button>
      </div>

      {plates.length === 0 ? (
        <p className="text-gray-500 text-center">No plates registered yet.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plates.map((p) => (
            <li
              key={p.id}
              className="card bg-base-100 shadow hover:shadow-lg cursor-pointer transition"
              onClick={() => setSelectedPlate(p)}
            >
              <div className="card-body flex flex-col">
                <span className="font-bold text-lg">{p.plate}</span>
                <span className="text-gray-500 text-sm">Owner: {p.owner}</span>
                {p.phone && (
                  <span className="text-gray-400 text-sm">📞 {p.phone}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal for more info */}
      {selectedPlate && (
        <input
          type="checkbox"
          id="plate-modal"
          className="modal-toggle"
          checked
          readOnly
        />
      )}
      <div className="modal" onClick={() => setSelectedPlate(null)}>
        <div
          className="modal-box relative"
          onClick={(e) => e.stopPropagation()}
        >
          <label
            htmlFor="plate-modal"
            className="btn btn-sm btn-circle absolute right-2 top-2"
            onClick={() => setSelectedPlate(null)}
          >
            ✕
          </label>
          <h3 className="font-bold text-xl mb-2">Plate Details</h3>
          {selectedPlate && (
            <div className="space-y-2">
              <p>
                <strong>Plate:</strong> {selectedPlate.plate}
              </p>
              <p>
                <strong>Owner:</strong> {selectedPlate.owner}
              </p>
              {selectedPlate.phone && (
                <p>
                  <strong>Phone:</strong> {selectedPlate.phone}
                </p>
              )}
              {selectedPlate.detected_at && (
                <p>
                  <strong>Detected At:</strong>{" "}
                  {new Date(selectedPlate.detected_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
