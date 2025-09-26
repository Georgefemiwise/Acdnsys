"use client";

import React, { useEffect, useState } from "react";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Car, 
  MapPin, 
  Camera,
  MessageSquare,
  TrendingUp,
  Activity,
  AlertTriangle
} from "lucide-react";

interface DetectionRecord {
  id: number;
  plate_number: string;
  confidence: number;
  camera_id?: string;
  location?: string;
  detected_at: string;
  matched_user_id?: number;
  notification_sent: boolean;
  matched_user?: {
    name: string;
    phone: string;
  };
}

interface DetectionStats {
  total_detections: number;
  matched_detections: number;
  notifications_sent: number;
  match_rate_percent: number;
  notification_success_rate_percent: number;
  recent_detections_24h: number;
  top_detected_plates: Array<{ plate: string; count: number }>;
  average_confidence: number;
}

export default function DetectionPage() {
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched">("all");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch detection history
  const fetchDetections = async () => {
    try {
      const matchedOnly = filter === "matched";
      const response = await fetch(`${API_BASE}/detection?limit=100&matched_only=${matchedOnly}`);
      
      if (!response.ok) throw new Error("Failed to fetch detections");
      
      const data = await response.json();
      setDetections(data);
    } catch (err: any) {
      setError(err.message || "Error fetching detections");
    }
  };

  // Fetch detection statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/detection/stats");
      
      if (!response.ok) throw new Error("Failed to fetch stats");
      
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      console.error("Error fetching stats:", err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDetections(), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, [filter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDetections();
      fetchStats();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter]);

  // Filter detections based on selected filter
  const filteredDetections = detections.filter(detection => {
    if (filter === "matched") return detection.matched_user_id;
    if (filter === "unmatched") return !detection.matched_user_id;
    return true;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-success";
    if (confidence >= 0.6) return "text-warning";
    return "text-error";
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchDetections();
    fetchStats();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Detection Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time monitoring of license plate detections, matches, and notifications
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-primary">
              <Activity className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Detections</div>
            <div className="stat-value text-primary">{stats.total_detections}</div>
            <div className="stat-desc">
              {stats.recent_detections_24h} in last 24h
            </div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">Match Rate</div>
            <div className="stat-value text-success">{stats.match_rate_percent}%</div>
            <div className="stat-desc">
              {stats.matched_detections} matches found
            </div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-info">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="stat-title">Notifications</div>
            <div className="stat-value text-info">{stats.notification_success_rate_percent}%</div>
            <div className="stat-desc">
              {stats.notifications_sent} SMS sent
            </div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-warning">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="stat-title">Avg Confidence</div>
            <div className="stat-value text-warning">{stats.average_confidence}%</div>
            <div className="stat-desc">
              Detection accuracy
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        {/* Filter Tabs */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${filter === "all" ? "tab-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Detections
          </button>
          <button
            className={`tab ${filter === "matched" ? "tab-active" : ""}`}
            onClick={() => setFilter("matched")}
          >
            Matched Only
          </button>
          <button
            className={`tab ${filter === "unmatched" ? "tab-active" : ""}`}
            onClick={() => setFilter("unmatched")}
          >
            Unmatched Only
          </button>
        </div>

        {/* Refresh Button */}
        <button
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <Activity className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error mb-6">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <span className="ml-4 text-lg">Loading detection data...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDetections.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <Camera className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Detections Found</h3>
          <p className="text-center max-w-md">
            {filter === "all" 
              ? "No license plates have been detected yet. Start capturing images to see results here."
              : filter === "matched"
              ? "No matched detections found. Detected plates will appear here when they match registered users."
              : "No unmatched detections found. All detected plates have been matched to registered users."
            }
          </p>
        </div>
      )}

      {/* Detection History */}
      {!loading && filteredDetections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">
            Detection History ({filteredDetections.length})
          </h2>
          
          <div className="grid gap-4">
            {filteredDetections.map((detection) => (
              <div
                key={detection.id}
                className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="card-body">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main Detection Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-mono font-bold bg-gray-100 px-3 py-1 rounded">
                          {detection.plate_number}
                        </span>
                        
                        {/* Match Status */}
                        {detection.matched_user_id ? (
                          <div className="badge badge-success gap-2">
                            <CheckCircle className="w-3 h-3" />
                            Matched
                          </div>
                        ) : (
                          <div className="badge badge-warning gap-2">
                            <XCircle className="w-3 h-3" />
                            No Match
                          </div>
                        )}

                        {/* Notification Status */}
                        {detection.notification_sent && (
                          <div className="badge badge-info gap-2">
                            <MessageSquare className="w-3 h-3" />
                            SMS Sent
                          </div>
                        )}
                      </div>

                      {/* Detection Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{formatDate(detection.detected_at)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className={getConfidenceColor(detection.confidence)}>
                            {(detection.confidence * 100).toFixed(1)}% confidence
                          </span>
                        </div>

                        {detection.camera_id && (
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-gray-500" />
                            <span>{detection.camera_id}</span>
                          </div>
                        )}

                        {detection.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{detection.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Matched User Info */}
                      {detection.matched_user && (
                        <div className="mt-3 p-3 bg-success/10 rounded-lg">
                          <div className="flex items-center gap-2 text-success">
                            <User className="w-4 h-4" />
                            <span className="font-semibold">
                              Matched to: {detection.matched_user.name}
                            </span>
                            <span className="text-sm opacity-75">
                              ({detection.matched_user.phone})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Detected Plates */}
      {stats && stats.top_detected_plates.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Most Detected Plates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.top_detected_plates.slice(0, 6).map((plateData, index) => (
              <div key={plateData.plate} className="card bg-base-100 shadow">
                <div className="card-body">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-lg">
                      {plateData.plate}
                    </span>
                    <div className="badge badge-primary">
                      {plateData.count} times
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    {/* </div>
  );
} */}

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
      {/* {!loading && plates.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium">No plates detected yet</p>
          <p className="text-sm">Capture an image to see results here.</p>
        </div>
      )} */}

      {/* Plates grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* {plates.map((p) => (
          <PlateItem
            key={p.id}
            record={p}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        ))} */}
      </ul>
    </div>
  );
}
