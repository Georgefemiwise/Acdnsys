"use client";
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

export default function CameraCapture() {
  const webcamRef = useRef<Webcam>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Fetch available video devices
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((deviceInfos) => {
        const cams = deviceInfos.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        if (cams.length > 0) {
          setSelectedDevice(cams[0].deviceId);
        }
      })
      .catch((err) => console.error("Error enumerating devices:", err));
  }, []);

  // Capture snapshot and send to backend
  const captureImage = async () => {
    setLoading(true);
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setCaptured(imageSrc);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageSrc }),
      });

      const json = await res.json();
      setLoading(false);
      setResult(json["roboflow"]);
    } catch (err) {
      setLoading(false);
      console.error("Error sending image:", err);
      setResult({ error: "Failed to get response" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:items-center space-y-4 w-full">
      {/* Camera selector */}
      {devices.length > 1 && (
        <>
          <p className="text-xs opacity-40">Select a camera </p>
          <select
            className="select select-bordered w-full max-w-xs mb-5 capitalize"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {devices.map((device, idx) => (
              <option
                key={device.deviceId}
                value={device.deviceId}
              >
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Camera preview */}
      <p className="text-xs opacity-40">
        Take a picture of a{" "}
        <span className="text-primary font-extrabold">{"Car's"}</span> front
        view.
      </p>
      <div className="relative w-full max-w-md md:aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ deviceId: selectedDevice }}
          className="w-full h-full object-cover"
        />

        {/* Floating captured preview */}
        {captured && (
          <img
            src={captured}
            alt="snapshot"
            className="
              absolute top-2 right-2 
              rounded shadow-md border opacity-70
              w-[15%]        /* mobile: 10% of width */
              md:w-[25%]     /* desktop: 25% of width */
            "
          />
        )}

        {/* Shutter button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={captureImage}
            className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-md active:scale-95 transition"
          />
        </div>
      </div>

      {/* Backend result */}
      <div className="p-4 mt-4 rounded w-full max-w-md">
        <h3 className="font-bold">Backend Response:</h3>
        {!loading ? (
          result && (
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          )
        ) : (
          <div className="">
            <span className="loading loading-ball loading-xs"></span>
            <span className="loading loading-ball loading-sm"></span>
            <span className="loading loading-ball loading-md"></span>
            <span className="loading loading-ball loading-lg"></span>
            <span className="loading loading-ball loading-xl"></span>
          </div>
        )}
      </div>
    </div>
  );
}
