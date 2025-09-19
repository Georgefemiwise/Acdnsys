import React from "react";
import { Copy, Trash2 } from "lucide-react";

export type PlateRecord = {
  id?: string;
  plate: string;
  owner?: string;
};

type Props = {
  record: PlateRecord;
  onDelete?: (r: PlateRecord) => void;
  onCopy?: (r: PlateRecord) => void;
};

export default function PlateItem({ record, onDelete, onCopy }: Props) {
  const { plate, owner } = record;

  return (
    <li className="flex items-center justify-between bg-white border rounded-xl px-5 py-4 mb-3 shadow-sm hover:shadow-md transition">
      {/* Plate Info */}
      <div className="flex flex-col">
        <span className="text-lg font-mono font-bold tracking-widest px-3 py-1 border rounded bg-gray-50 text-gray-800">
          {plate}
        </span>
        {owner && (
          <span className="text-xs text-gray-500 mt-1">Owner: {owner}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Copy */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(plate);
            onCopy?.(record);
          }}
          className="p-2 rounded-full hover:bg-gray-100 transition"
          title="Copy plate"
        >
          <Copy size={18} className="text-gray-600" />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete?.(record)}
          className="p-2 rounded-full hover:bg-red-50 transition"
          title="Delete plate"
        >
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>
    </li>
  );
}
