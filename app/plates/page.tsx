"use client";
import { useEffect, useState } from "react";
import PlateItem, { PlateRecord } from "@/components/PlateItem";

export default function PlatesPage() {
  const [plates, setPlates] = useState<PlateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plates on mount
  useEffect(() => {
    const fetchPlates = async () => {
      try {
        const res = await fetch("/api/plates");
        if (!res.ok) throw new Error("Failed to fetch plates");

        const data = await res.json();

        // 🔑 Normalize plain strings into PlateRecord[]
        const normalized: PlateRecord[] = (data.plates || []).map(
          (plate: string, idx: number) => ({
            id: String(idx), // fallback id
            plate,
            owner: "Unknown", // default until you add owners
            detectedAt: new Date().toISOString(),
          })
        );

        setPlates(normalized);
      } catch (err: any) {
        setError(err.message || "Error fetching plates");
      } finally {
        setLoading(false);
      }
    };

    fetchPlates();
  }, []);

  // Handle delete
  const handleDelete = async (record: PlateRecord) => {
    try {
      await fetch(`/api/plates/${record.id}`, { method: "DELETE" });
      setPlates((prev) => prev.filter((p) => p.id !== record.id));
    } catch (err) {
      console.error("❌ Delete failed:", err);
    }
  };

  // Handle copy
  const handleCopy = (record: PlateRecord) => {
    navigator.clipboard.writeText(record.plate);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">License Plate History</h1>
      <p className="text-gray-600 mb-6">
        Every time a camera captures and processes a vehicle, the detected plate
        number is stored here for review and action.
      </p>

      {/* Loading */}
      {loading && (
        <p className="text-gray-500 animate-pulse">
          Fetching detected plates...
        </p>
      )}

      {/* Error */}
      {error && <p className="text-red-500 font-medium">⚠️ {error}</p>}

      {/* Empty */}
      {!loading && plates.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium">No plates detected yet</p>
          <p className="text-sm">Capture an image to see results here.</p>
        </div>
      )}

      {/* Plates grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plates.map((p) => (
          <PlateItem
            key={p.id}
            record={p}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    </div>
  );
}
