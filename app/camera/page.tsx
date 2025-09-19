"use client";
import React, { useRef, useState, useEffect } from "react";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");

  // Fetch available video devices
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((deviceInfos) => {
        const cams = deviceInfos.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        if (cams.length > 0) {
          setSelectedDevice(cams[0].deviceId); // default to first camera
        }
      })
      .catch((err) => console.error("Error enumerating devices:", err));
  }, []);

  // Start camera stream
  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  // Capture snapshot and send to backend
  const captureImage = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw frame from video into canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg"); // base64
    setCaptured(dataUrl);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: dataUrl }), // sending as `imageUrl`
      });

      const json = await res.json();
      setResult(json);
    } catch (err) {
      console.error("Error sending image:", err);
      setResult({ error: "Failed to get response" });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Camera selector */}
      {devices.length > 1 && (
        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          {devices.map((device, idx) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${idx + 1}`}
            </option>
          ))}
        </select>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded shadow max-w-md"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="space-x-2">
        <button onClick={startCamera} className="btn btn-primary">
          Start Camera
        </button>
        <button onClick={captureImage} className="btn btn-secondary">
          Capture & Send
        </button>
      </div>

      {captured && (
        <div>
          <h3 className="font-bold mt-4">Captured Image:</h3>
          <img src={captured} alt="snapshot" className="rounded shadow mt-2" />
        </div>
      )}

      {result && (
        <div className="bg-grayh-100 p-4 mt-4 rounded w-full max-w-md">
          <h3 className="font-bold">Backend Response:</h3>
          <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
