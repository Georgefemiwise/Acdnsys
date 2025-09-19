"use client";

import { useEffect, useState } from "react";

export default function TestPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:8000/ping")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setData({ error: err.message }));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Test FastAPI → Next.js</h1>
      <pre className="bg-gray-900 p-2 rounded mt-2">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
