"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  Users,
  Car,
  Activity,
  MessageSquare,
  Camera,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
} from "lucide-react";

// Types for analytics data
interface DashboardAnalytics {
  kpis: {
    total_detections: number;
    matched_detections: number;
    match_rate_percent: number;
    notification_success_rate: number;
    active_users: number;
    registered_plates: number;
    average_confidence: number;
  };
  activity_trends: {
    today: number;
    this_week: number;
    this_month: number;
    yesterday: number;
  };
  top_metrics: {
    most_detected_plates: Array<{ plate: string; count: number }>;
    busiest_locations: Array<{ location: string; count: number }>;
    active_cameras: Array<{ camera_id: string; count: number }>;
  };
  patterns: {
    hourly_distribution: Record<string, number>;
    peak_hour: number;
  };
  system_health: {
    database_status: string;
    total_records: number;
    last_detection: string;
  };
}

interface TrendsData {
  time_series: Record<string, number>;
  statistics: {
    total: number;
    average: number;
    peak: number;
    data_points: number;
  };
}

interface UserEngagement {
  overview: {
    total_users: number;
    active_users: number;
    users_with_detections: number;
    engagement_rate_percent: number;
    notification_engagement_percent: number;
  };
  top_active_users: Array<{
    user_id: number;
    name: string;
    phone: string;
    detection_count: number;
    notification_count: number;
    registered_plates: number;
  }>;
}

interface SystemPerformance {
  detection_performance: {
    total_detections: number;
    successful_detections: number;
    success_rate_percent: number;
    match_rate_percent: number;
    error_rate_percent: number;
  };
  confidence_analysis: {
    average_confidence: number;
    distribution: {
      high_confidence_count: number;
      medium_confidence_count: number;
      low_confidence_count: number;
      high_confidence_percent: number;
    };
  };
  notification_performance: {
    total_notifications: number;
    successful_notifications: number;
    success_rate_percent: number;
  };
}

export default function AnalyticsPage() {
  // State management
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [userEngagement, setUserEngagement] = useState<UserEngagement | null>(null);
  const [systemPerformance, setSystemPerformance] = useState<SystemPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("week");
  const [selectedMetric, setSelectedMetric] = useState<"detections" | "matches" | "notifications">("detections");

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
 = "http://localhost:8000";

  // Color schemes for charts
  const COLORS = {
    primary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#06B6D4",
    purple: "#8B5CF6",
  };

  const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.error, COLORS.info, COLORS.purple];

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all analytics data in parallel
      const [dashboardRes, trendsRes, engagementRes, performanceRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard`),
        fetch(`${API_BASE}/analytics/trends?period=${selectedPeriod}&metric=${selectedMetric}`),
        fetch(`${API_BASE}/analytics/user-engagement`),
        fetch(`${API_BASE}/analytics/system-performance`),
      ]);

      if (!dashboardRes.ok || !trendsRes.ok || !engagementRes.ok || !performanceRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const [dashboard, trends, engagement, performance] = await Promise.all([
        dashboardRes.json(),
        trendsRes.json(),
        engagementRes.json(),
        performanceRes.json(),
      ]);

      setDashboardData(dashboard);
      setTrendsData(trends);
      setUserEngagement(engagement);
      setSystemPerformance(performance);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Export analytics data
  const exportData = async (format: "json" | "csv" = "json") => {
    try {
      const response = await fetch(`${API_BASE}/analytics/export?format=${format}&include_raw_data=false`);
      if (!response.ok) throw new Error("Export failed");

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(`Export failed: ${err.message}`);
    }
  };

  // Effects
  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedMetric]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedMetric]);

  // Prepare chart data
  const prepareTimeSeriesData = (timeSeries: Record<string, number>) => {
    return Object.entries(timeSeries).map(([time, value]) => ({
      time,
      value,
    }));
  };

  const prepareHourlyData = (hourlyDistribution: Record<string, number>) => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map((hour) => ({
      hour: `${hour}:00`,
      detections: hourlyDistribution[hour.toString()] || 0,
    }));
  };

  const prepareConfidenceData = (distribution: any) => {
    return [
      { name: "High (≥80%)", value: distribution.high_confidence_count, color: COLORS.success },
      { name: "Medium (60-79%)", value: distribution.medium_confidence_count, color: COLORS.warning },
      { name: "Low (<60%)", value: distribution.low_confidence_count, color: COLORS.error },
    ];
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg mb-4"></div>
            <p className="text-lg">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="alert alert-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive insights into system performance, user engagement, and detection patterns
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Selector */}
          <select
            className="select select-bordered"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>

          {/* Metric Selector */}
          <select
            className="select select-bordered"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
          >
            <option value="detections">Detections</option>
            <option value="matches">Matches</option>
            <option value="notifications">Notifications</option>
          </select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={fetchAnalyticsData}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="btn btn-primary" onClick={() => exportData("json")}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-primary">
              <Activity className="w-8 h-8" />
            </div>
            <div className="stat-title">Total Detections</div>
            <div className="stat-value text-primary">{dashboardData.kpis.total_detections.toLocaleString()}</div>
            <div className="stat-desc">
              {dashboardData.activity_trends.today} today (+
              {((dashboardData.activity_trends.today - dashboardData.activity_trends.yesterday) /
                Math.max(dashboardData.activity_trends.yesterday, 1) *
                100
              ).toFixed(1)}
              %)
            </div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-success">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="stat-title">Match Rate</div>
            <div className="stat-value text-success">{dashboardData.kpis.match_rate_percent}%</div>
            <div className="stat-desc">{dashboardData.kpis.matched_detections} matches found</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-info">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="stat-title">SMS Success</div>
            <div className="stat-value text-info">{dashboardData.kpis.notification_success_rate}%</div>
            <div className="stat-desc">Notification delivery rate</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-xl">
            <div className="stat-figure text-warning">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="stat-title">Avg Confidence</div>
            <div className="stat-value text-warning">{dashboardData.kpis.average_confidence}%</div>
            <div className="stat-desc">Detection accuracy</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trends Chart */}
        {trendsData && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends
                </h2>
                <div className="badge badge-info">
                  {selectedPeriod} view
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prepareTimeSeriesData(trendsData.time_series)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{trendsData.statistics.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{trendsData.statistics.average.toFixed(1)}</div>
                  <div className="text-sm text-gray-500">Average</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{trendsData.statistics.peak}</div>
                  <div className="text-sm text-gray-500">Peak</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hourly Patterns */}
        {dashboardData && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title">
                  <Clock className="w-5 h-5 mr-2" />
                  Hourly Detection Patterns
                </h2>
                <div className="badge badge-success">
                  Peak: {dashboardData.patterns.peak_hour}:00
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareHourlyData(dashboardData.patterns.hourly_distribution)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="detections" fill={COLORS.success} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Distribution */}
        {systemPerformance && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title">
                  <PieChartIcon className="w-5 h-5 mr-2" />
                  Detection Confidence
                </h2>
                <div className="badge badge-info">
                  Avg: {systemPerformance.confidence_analysis.average_confidence}%
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareConfidenceData(systemPerformance.confidence_analysis.distribution)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareConfidenceData(systemPerformance.confidence_analysis.distribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* System Performance */}
        {systemPerformance && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <Activity className="w-5 h-5 mr-2" />
                System Performance
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Detection Success Rate</span>
                    <span className="text-sm font-bold">
                      {systemPerformance.detection_performance.success_rate_percent}%
                    </span>
                  </div>
                  <progress
                    className="progress progress-success w-full"
                    value={systemPerformance.detection_performance.success_rate_percent}
                    max="100"
                  ></progress>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Match Rate</span>
                    <span className="text-sm font-bold">
                      {systemPerformance.detection_performance.match_rate_percent}%
                    </span>
                  </div>
                  <progress
                    className="progress progress-info w-full"
                    value={systemPerformance.detection_performance.match_rate_percent}
                    max="100"
                  ></progress>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">SMS Success Rate</span>
                    <span className="text-sm font-bold">
                      {systemPerformance.notification_performance.success_rate_percent}%
                    </span>
                  </div>
                  <progress
                    className="progress progress-warning w-full"
                    value={systemPerformance.notification_performance.success_rate_percent}
                    max="100"
                  ></progress>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {systemPerformance.detection_performance.successful_detections}
                    </div>
                    <div className="text-sm text-gray-500">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-info">
                      {systemPerformance.notification_performance.successful_notifications}
                    </div>
                    <div className="text-sm text-gray-500">SMS Sent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Metrics Tables */}
      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Most Detected Plates */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <Car className="w-5 h-5 mr-2" />
                Most Detected Plates
              </h2>
              <div className="space-y-3">
                {dashboardData.top_metrics.most_detected_plates.slice(0, 5).map((plate, index) => (
                  <div key={plate.plate} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="badge badge-primary">{index + 1}</div>
                      <span className="font-mono font-bold">{plate.plate}</span>
                    </div>
                    <div className="badge badge-outline">{plate.count}x</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Busiest Locations */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                Busiest Locations
              </h2>
              <div className="space-y-3">
                {dashboardData.top_metrics.busiest_locations.slice(0, 5).map((location, index) => (
                  <div key={location.location} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="badge badge-success">{index + 1}</div>
                      <span className="truncate">{location.location}</span>
                    </div>
                    <div className="badge badge-outline">{location.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Cameras */}
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">
                <Camera className="w-5 h-5 mr-2" />
                Active Cameras
              </h2>
              <div className="space-y-3">
                {dashboardData.top_metrics.active_cameras.slice(0, 5).map((camera, index) => (
                  <div key={camera.camera_id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="badge badge-info">{index + 1}</div>
                      <span>{camera.camera_id}</span>
                    </div>
                    <div className="badge badge-outline">{camera.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Engagement */}
      {userEngagement && (
        <div className="card bg-base-100 shadow-lg mb-8">
          <div className="card-body">
            <h2 className="card-title mb-6">
              <Users className="w-5 h-5 mr-2" />
              User Engagement Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{userEngagement.overview.total_users}</div>
                <div className="text-sm text-gray-500">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">{userEngagement.overview.active_users}</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-info">{userEngagement.overview.users_with_detections}</div>
                <div className="text-sm text-gray-500">With Detections</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning">
                  {userEngagement.overview.engagement_rate_percent}%
                </div>
                <div className="text-sm text-gray-500">Engagement Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple">
                  {userEngagement.overview.notification_engagement_percent}%
                </div>
                <div className="text-sm text-gray-500">SMS Engagement</div>
              </div>
            </div>

            {/* Top Active Users */}
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Detections</th>
                    <th>Notifications</th>
                    <th>Plates</th>
                  </tr>
                </thead>
                <tbody>
                  {userEngagement.top_active_users.slice(0, 10).map((user, index) => (
                    <tr key={user.user_id}>
                      <td>
                        <div className="badge badge-primary">{index + 1}</div>
                      </td>
                      <td>
                        <div>
                          <div className="font-bold">{user.name}</div>
                          <div className="text-sm opacity-50">{user.phone}</div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-success">{user.detection_count}</div>
                      </td>
                      <td>
                        <div className="badge badge-info">{user.notification_count}</div>
                      </td>
                      <td>
                        <div className="badge badge-warning">{user.registered_plates}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      {dashboardData && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h2 className="card-title mb-4">
              <Activity className="w-5 h-5 mr-2" />
              System Health Status
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="w-8 h-8 text-success mr-2" />
                  <span className="text-lg font-semibold">Database</span>
                </div>
                <div className="badge badge-success">{dashboardData.system_health.database_status}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {dashboardData.system_health.total_records.toLocaleString()} records
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Activity className="w-8 h-8 text-info mr-2" />
                  <span className="text-lg font-semibold">Activity</span>
                </div>
                <div className="badge badge-info">
                  {dashboardData.activity_trends.today > 0 ? "Active" : "Idle"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {dashboardData.activity_trends.today} detections today
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-8 h-8 text-warning mr-2" />
                  <span className="text-lg font-semibold">Last Detection</span>
                </div>
                <div className="text-sm">
                  {dashboardData.system_health.last_detection !== "No detections yet"
                    ? new Date(dashboardData.system_health.last_detection).toLocaleString()
                    : "No detections yet"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}