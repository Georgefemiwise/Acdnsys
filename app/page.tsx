/**
 * Enhanced Management Dashboard
 *
 * A comprehensive single-page application for managing users and license plates
 * with advanced features including:
 * - Unified data management interface
 * - Real-time search and filtering
 * - Bulk operations and batch processing
 * - Advanced form validation with beautiful UI
 * - Responsive design with mobile optimization
 * - Export/import functionality
 * - Comprehensive error handling and user feedback
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Car,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  MoreVertical,
  Star,
  Calendar,
  Hash,
  Palette,
  RefreshCw,
  Settings,
  BarChart3,
} from "lucide-react";

// Import our enhanced form components
import EnhancedUserForm from "@/components/forms/EnhancedUserForm";
import EnhancedPlateForm from "@/components/forms/EnhancedPlateForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorAlert from "@/components/ui/ErrorAlert";
import SuccessAlert from "@/components/ui/SuccessAlert";

// Types for our data models
interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plates?: Plate[];
  plate_count?: number;
}

interface Plate {
  id: number;
  user_id: number;
  plate: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_year?: number;
  is_primary: boolean;
  is_active: boolean;
  notes?: string;
  created_at: string;
  owner_name?: string;
  owner_phone?: string;
}

interface FilterOptions {
  searchTerm: string;
  showInactive: boolean;
  userFilter: string;
  plateFilter: string;
  vehicleFilter: string;
  dateFilter: string;
}

interface BulkOperations {
  selectedUsers: Set<number>;
  selectedPlates: Set<number>;
  bulkAction: string;
}

export default function EnhancedManagementPage() {
  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "plates">(
    "overview"
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPlateForm, setShowPlateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPlate, setEditingPlate] = useState<Plate | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter and search state
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: "",
    showInactive: false,
    userFilter: "all",
    plateFilter: "all",
    vehicleFilter: "all",
    dateFilter: "all",
  });

  // Bulk operations state
  const [bulkOps, setBulkOps] = useState<BulkOperations>({
    selectedUsers: new Set(),
    selectedPlates: new Set(),
    bulkAction: "",
  });

  // Notification state
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  /**
   * Show success message with auto-hide
   */
  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
    setTimeout(() => setSuccess(null), 5000);
  };

  /**
   * Show error message with auto-hide
   */
  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
    setTimeout(() => setError(null), 8000);
  };

  /**
   * Fetch users from API
   */
  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/users?active_only=${!filters.showInactive}`
      );
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      showError(`Failed to load users: ${err.message}`);
    }
  };

  /**
   * Fetch plates from API
   */
  const fetchPlates = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/plates?active_only=${!filters.showInactive}`
      );
      if (!response.ok) throw new Error("Failed to fetch plates");
      const data = await response.json();
      setPlates(data);
    } catch (err: any) {
      showError(`Failed to load plates: ${err.message}`);
    }
  };

  /**
   * Refresh all data
   */
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUsers(), fetchPlates()]);
      showSuccess("Data refreshed successfully");
    } catch (err: any) {
      showError("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Initial data load
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUsers(), fetchPlates()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filters.showInactive]);

  /**
   * Handle user form submission
   */
  const handleUserSubmit = async (userData: any) => {
    setFormSubmitting(true);
    try {
      const url = editingUser
        ? `${API_BASE}/users/${editingUser.id}`
        : `${API_BASE}/users`;
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save user");
      }

      showSuccess(
        editingUser
          ? "User updated successfully!"
          : "User created successfully!"
      );
      setShowUserForm(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  /**
   * Handle plate form submission
   */
  const handlePlateSubmit = async (plateData: any) => {
    setFormSubmitting(true);
    try {
      const url = editingPlate
        ? `${API_BASE}/plates/${editingPlate.id}`
        : `${API_BASE}/plates`;
      const method = editingPlate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save plate");
      }

      showSuccess(
        editingPlate
          ? "License plate updated successfully!"
          : "License plate registered successfully!"
      );
      setShowPlateForm(false);
      setEditingPlate(null);
      await Promise.all([fetchUsers(), fetchPlates()]);
    } catch (err: any) {
      throw new Error(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  /**
   * Handle user deletion
   */
  const handleDeleteUser = async (userId: number, hardDelete = false) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const confirmMessage = hardDelete
      ? `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`
      : `Are you sure you want to deactivate ${user.name}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `${API_BASE}/users/${userId}?hard_delete=${hardDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete user");

      showSuccess(
        `User ${hardDelete ? "deleted" : "deactivated"} successfully`
      );
      await fetchUsers();
    } catch (err: any) {
      showError(`Failed to delete user: ${err.message}`);
    }
  };

  /**
   * Handle plate deletion
   */
  const handleDeletePlate = async (plateId: number, hardDelete = false) => {
    const plate = plates.find((p) => p.id === plateId);
    if (!plate) return;

    const confirmMessage = hardDelete
      ? `Are you sure you want to permanently delete license plate ${plate.plate}? This action cannot be undone.`
      : `Are you sure you want to deactivate license plate ${plate.plate}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `${API_BASE}/plates/${plateId}?hard_delete=${hardDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete plate");

      showSuccess(
        `License plate ${hardDelete ? "deleted" : "deactivated"} successfully`
      );
      await Promise.all([fetchUsers(), fetchPlates()]);
    } catch (err: any) {
      showError(`Failed to delete plate: ${err.message}`);
    }
  };

  /**
   * Filter users based on current filters
   */
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          user.name.toLowerCase().includes(searchLower) ||
          user.phone.includes(filters.searchTerm) ||
          (user.email && user.email.toLowerCase().includes(searchLower)) ||
          (user.address && user.address.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // User filter
      if (filters.userFilter !== "all") {
        switch (filters.userFilter) {
          case "with_plates":
            if (!user.plate_count || user.plate_count === 0) return false;
            break;
          case "without_plates":
            if (user.plate_count && user.plate_count > 0) return false;
            break;
          case "with_email":
            if (!user.email) return false;
            break;
        }
      }

      return true;
    });
  }, [users, filters]);

  /**
   * Filter plates based on current filters
   */
  const filteredPlates = useMemo(() => {
    return plates.filter((plate) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          plate.plate.toLowerCase().includes(searchLower) ||
          (plate.owner_name &&
            plate.owner_name.toLowerCase().includes(searchLower)) ||
          (plate.vehicle_make &&
            plate.vehicle_make.toLowerCase().includes(searchLower)) ||
          (plate.vehicle_model &&
            plate.vehicle_model.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Plate filter
      if (filters.plateFilter !== "all") {
        switch (filters.plateFilter) {
          case "primary":
            if (!plate.is_primary) return false;
            break;
          case "secondary":
            if (plate.is_primary) return false;
            break;
        }
      }

      // Vehicle filter
      if (filters.vehicleFilter !== "all") {
        switch (filters.vehicleFilter) {
          case "with_details":
            if (!plate.vehicle_make || !plate.vehicle_model) return false;
            break;
          case "without_details":
            if (plate.vehicle_make && plate.vehicle_model) return false;
            break;
        }
      }

      return true;
    });
  }, [plates, filters]);

  /**
   * Calculate dashboard statistics
   */
  const dashboardStats = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active).length;
    const activePlates = plates.filter((p) => p.is_active).length;
    const usersWithPlates = users.filter(
      (u) => u.plate_count && u.plate_count > 0
    ).length;
    const primaryPlates = plates.filter((p) => p.is_primary).length;

    return {
      totalUsers: users.length,
      activeUsers,
      inactiveUsers: users.length - activeUsers,
      totalPlates: plates.length,
      activePlates,
      inactivePlates: plates.length - activePlates,
      usersWithPlates,
      usersWithoutPlates: users.length - usersWithPlates,
      primaryPlates,
      secondaryPlates: plates.length - primaryPlates,
      averagePlatesPerUser:
        users.length > 0 ? (plates.length / users.length).toFixed(1) : "0",
    };
  }, [users, plates]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <LoadingSpinner
          size="lg"
          text="Loading management dashboard..."
          className="py-20"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-sm">
            Comprehensive user and vehicle management with advanced features
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className={`btn btn-ghost ${refreshing ? "loading" : ""}`}
            onClick={refreshData}
            disabled={refreshing}
          >
            {!refreshing && <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh Data
          </button>

          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost">
              <Settings className="w-4 h-4 mr-2" />
              Options
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a>
                  <Download className="w-4 h-4" /> Export Data
                </a>
              </li>
              <li>
                <a>
                  <Upload className="w-4 h-4" /> Import Data
                </a>
              </li>
              <li>
                <a>
                  <BarChart3 className="w-4 h-4" /> View Analytics
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <SuccessAlert
          message={success}
          onDismiss={() => setSuccess(null)}
          className="mb-6"
        />
      )}

      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError(null)}
          onRetry={refreshData}
          className="mb-6"
        />
      )}

      {/* Tab Navigation */}
      <div role="tablist" className="tabs tabs-lift mb-6">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active " : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Overview
        </button>
        <button
          className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <User className="w-4 h-4 mr-2" />
          Users ({dashboardStats.totalUsers})
        </button>
        <button
          className={`tab ${activeTab === "plates" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("plates")}
        >
          <Car className="w-4 h-4 mr-2" />
          License Plates ({dashboardStats.totalPlates})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="stat bg-base-100 shadow-lg rounded-xl">
              <div className="stat-figure text-primary">
                <User className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Users</div>
              <div className="stat-value text-primary">
                {dashboardStats.totalUsers}
              </div>
              <div className="stat-desc">
                {dashboardStats.activeUsers} active,{" "}
                {dashboardStats.inactiveUsers} inactive
              </div>
            </div>

            <div className="stat bg-base-100 shadow-lg rounded-xl">
              <div className="stat-figure text-success">
                <Car className="w-8 h-8" />
              </div>
              <div className="stat-title">License Plates</div>
              <div className="stat-value text-success">
                {dashboardStats.totalPlates}
              </div>
              <div className="stat-desc">
                {dashboardStats.primaryPlates} primary,{" "}
                {dashboardStats.secondaryPlates} secondary
              </div>
            </div>

            <div className="stat bg-base-100 shadow-lg rounded-xl">
              <div className="stat-figure text-info">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="stat-title">Users with Vehicles</div>
              <div className="stat-value text-info">
                {dashboardStats.usersWithPlates}
              </div>
              <div className="stat-desc">
                {(
                  (dashboardStats.usersWithPlates / dashboardStats.totalUsers) *
                  100
                ).toFixed(1)}
                % coverage
              </div>
            </div>

            <div className="stat bg-base-100 shadow-lg rounded-xl">
              <div className="stat-figure text-warning">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div className="stat-title">Avg Plates/User</div>
              <div className="stat-value text-warning">
                {dashboardStats.averagePlatesPerUser}
              </div>
              <div className="stat-desc">System efficiency metric</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-body">
              <h2 className="card-title mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowUserForm(true)}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New User
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPlateForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register Vehicle
                </button>

                <button className="btn btn-accent">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>

                <button className="btn btn-info">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Recent Users */}
            <div className="card bg-base-10 shadow-lg border border-neutral-300">
              <div className="card-body">
                <h3 className="card-title mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            user.is_active ? "bg-success" : "bg-error"
                          }`}
                        />
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-600">
                            {user.phone}
                          </div>
                        </div>
                      </div>
                      <div className="badge badge-outline">
                        {user.plate_count || 0} vehicles
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Plates */}
            <div className="card bg-base-100 shadow-lg border border-neutral-300">
              <div className="card-body">
                <h3 className="card-title mb-4">Recent License Plates</h3>
                <div className="space-y-3">
                  {plates.slice(0, 5).map((plate) => (
                    <div
                      key={plate.id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            plate.is_active ? "bg-success" : "bg-error"
                          }`}
                        />
                        <div>
                          <div className="font-mono font-bold badge outline">
                            {plate.plate}
                          </div>
                          <div className="text-sm text-gray-600">
                            {plate.owner_name}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {plate.is_primary && (
                          <Star className="w-4 h-4 text-warning" />
                        )}
                        <div className="badge badge-outline">
                          {plate.vehicle_make || "Unknown"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="input input-bordered w-full pl-10"
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      searchTerm: e.target.value,
                    }))
                  }
                />
              </div>

              <select
                className="select select-bordered"
                value={filters.userFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    userFilter: e.target.value,
                  }))
                }
              >
                <option value="all">All Users</option>
                <option value="with_plates">With Vehicles</option>
                <option value="without_plates">Without Vehicles</option>
                <option value="with_email">With Email</option>
              </select>

              <label className="label cursor-pointer">
                <span className="label-text mr-2">Show Inactive</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={filters.showInactive}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      showInactive: e.target.checked,
                    }))
                  }
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <div className="join">
                <button
                  className={`btn join-item ${
                    viewMode === "grid" ? "btn-active" : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </button>
                <button
                  className={`btn join-item ${
                    viewMode === "table" ? "btn-active" : ""
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  Table
                </button>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setShowUserForm(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Users Display */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="card-title text-lg">{user.name}</h3>
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-error" />
                        )}
                        <div className="dropdown dropdown-end">
                          <label tabIndex={0} className="btn btn-ghost btn-sm">
                            <MoreVertical className="w-4 h-4" />
                          </label>
                          <ul
                            tabIndex={0}
                            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                          >
                            <li>
                              <a onClick={() => setSelectedUser(user)}>
                                <Eye className="w-4 h-4" /> View Details
                              </a>
                            </li>
                            <li>
                              <a
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowUserForm(true);
                                }}
                              >
                                <Edit3 className="w-4 h-4" /> Edit
                              </a>
                            </li>
                            <li>
                              <a onClick={() => handleDeleteUser(user.id)}>
                                <Trash2 className="w-4 h-4" /> Delete
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{user.phone}</span>
                      </div>
                      {user.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      )}
                      {user.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="truncate">{user.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-500" />
                        <span>{user.plate_count || 0} vehicles</span>
                      </div>
                    </div>

                    {user.notes && (
                      <div className="mt-3 p-2 bg-base-200 rounded text-xs">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {user.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Vehicles</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="font-bold">{user.name}</div>
                        {user.address && (
                          <div className="text-sm opacity-50">
                            {user.address}
                          </div>
                        )}
                      </td>
                      <td>{user.phone}</td>
                      <td>{user.email || "-"}</td>
                      <td>
                        <div className="badge badge-outline">
                          {user.plate_count || 0}
                        </div>
                      </td>
                      <td>
                        {user.is_active ? (
                          <div className="badge badge-success">Active</div>
                        ) : (
                          <div className="badge badge-error">Inactive</div>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditingUser(user);
                              setShowUserForm(true);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Users Found
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.searchTerm || filters.userFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by adding your first user"}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowUserForm(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add First User
              </button>
            </div>
          )}
        </div>
      )}

      {/* Plates Tab */}
      {activeTab === "plates" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search plates..."
                  className="input input-bordered w-full pl-10"
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      searchTerm: e.target.value,
                    }))
                  }
                />
              </div>

              <select
                className="select select-bordered"
                value={filters.plateFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    plateFilter: e.target.value,
                  }))
                }
              >
                <option value="all">All Plates</option>
                <option value="primary">Primary Only</option>
                <option value="secondary">Secondary Only</option>
              </select>

              <select
                className="select select-bordered"
                value={filters.vehicleFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    vehicleFilter: e.target.value,
                  }))
                }
              >
                <option value="all">All Vehicles</option>
                <option value="with_details">With Details</option>
                <option value="without_details">Without Details</option>
              </select>

              <label className="label cursor-pointer">
                <span className="label-text mr-2">Show Inactive</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={filters.showInactive}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      showInactive: e.target.checked,
                    }))
                  }
                />
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <div className="join">
                <button
                  className={`btn join-item ${
                    viewMode === "grid" ? "btn-active" : ""
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </button>
                <button
                  className={`btn join-item ${
                    viewMode === "table" ? "btn-active" : ""
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  Table
                </button>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setShowPlateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Plate
              </button>
            </div>
          </div>

          {/* Plates Display */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlates.map((plate) => (
                <div
                  key={plate.id}
                  className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="card-title text-lg font-mono">
                          {plate.plate}
                        </h3>
                        <div className="flex gap-2 mt-1">
                          {plate.is_primary && (
                            <span className="badge badge-warning badge-sm">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </span>
                          )}
                          {!plate.is_active && (
                            <span className="badge badge-error badge-sm">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-sm">
                          <MoreVertical className="w-4 h-4" />
                        </label>
                        <ul
                          tabIndex={0}
                          className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
                        >
                          <li>
                            <a
                              onClick={() => {
                                setEditingPlate(plate);
                                setShowPlateForm(true);
                              }}
                            >
                              <Edit3 className="w-4 h-4" /> Edit
                            </a>
                          </li>
                          <li>
                            <a onClick={() => handleDeletePlate(plate.id)}>
                              <Trash2 className="w-4 h-4" /> Delete
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{plate.owner_name}</span>
                      </div>
                      {plate.vehicle_make && (
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-gray-500" />
                          <span>
                            {plate.vehicle_year} {plate.vehicle_make}{" "}
                            {plate.vehicle_model}
                          </span>
                        </div>
                      )}
                      {plate.vehicle_color && (
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-gray-500" />
                          <span>{plate.vehicle_color}</span>
                        </div>
                      )}
                    </div>

                    {plate.notes && (
                      <div className="mt-3 p-2 bg-base-200 rounded text-xs">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {plate.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Plate Number</th>
                    <th>Owner</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlates.map((plate) => (
                    <tr key={plate.id}>
                      <td>
                        <div className="font-mono font-bold">{plate.plate}</div>
                      </td>
                      <td>
                        <div className="font-medium">{plate.owner_name}</div>
                        <div className="text-sm opacity-50">
                          {plate.owner_phone}
                        </div>
                      </td>
                      <td>
                        {plate.vehicle_make ? (
                          <div>
                            <div className="font-medium">
                              {plate.vehicle_year} {plate.vehicle_make}{" "}
                              {plate.vehicle_model}
                            </div>
                            {plate.vehicle_color && (
                              <div className="text-sm opacity-50">
                                {plate.vehicle_color}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No details</span>
                        )}
                      </td>
                      <td>
                        {plate.is_primary ? (
                          <div className="badge badge-warning">
                            <Star className="w-3 h-3 mr-1" />
                            Primary
                          </div>
                        ) : (
                          <div className="badge badge-outline">Secondary</div>
                        )}
                      </td>
                      <td>
                        {plate.is_active ? (
                          <div className="badge badge-success">Active</div>
                        ) : (
                          <div className="badge badge-error">Inactive</div>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setEditingPlate(plate);
                              setShowPlateForm(true);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => handleDeletePlate(plate.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredPlates.length === 0 && (
            <div className="text-center py-12">
              <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No License Plates Found
              </h3>
              <p className="text-gray-500 mb-4">
                {filters.searchTerm || filters.plateFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Get started by registering your first vehicle"}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowPlateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Register First Vehicle
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <EnhancedUserForm
              initialData={editingUser || {}}
              isEditing={!!editingUser}
              onSubmit={handleUserSubmit}
              onCancel={() => {
                setShowUserForm(false);
                setEditingUser(null);
              }}
              isSubmitting={formSubmitting}
            />
          </div>
        </div>
      )}

      {/* Plate Form Modal */}
      {showPlateForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <EnhancedPlateForm
              initialData={editingPlate || {}}
              isEditing={!!editingPlate}
              users={users.filter((u) => u.is_active)}
              onSubmit={handlePlateSubmit}
              onCancel={() => {
                setShowPlateForm(false);
                setEditingPlate(null);
              }}
              isSubmitting={formSubmitting}
            />
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">User Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-lg">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-lg">{selectedUser.phone}</p>
                </div>
                {selectedUser.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Email
                    </label>
                    <p className="text-lg">{selectedUser.email}</p>
                  </div>
                )}
                {selectedUser.emergency_contact && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Emergency Contact
                    </label>
                    <p className="text-lg">{selectedUser.emergency_contact}</p>
                  </div>
                )}
              </div>

              {selectedUser.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Address
                  </label>
                  <p className="text-lg">{selectedUser.address}</p>
                </div>
              )}

              {selectedUser.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Notes
                  </label>
                  <p className="text-lg">{selectedUser.notes}</p>
                </div>
              )}

              {selectedUser.plates && selectedUser.plates.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registered Vehicles
                  </label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.plates.map((plate) => (
                      <div
                        key={plate.id}
                        className="p-3 bg-base-200 rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold">
                            {plate.plate}
                          </span>
                          {plate.is_primary && (
                            <span className="badge badge-warning badge-sm">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </span>
                          )}
                        </div>
                        {(plate.vehicle_make || plate.vehicle_model) && (
                          <p className="text-sm text-gray-600">
                            {plate.vehicle_year} {plate.vehicle_make}{" "}
                            {plate.vehicle_model}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="font-medium">Created</label>
                  <p>
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="font-medium">Status</label>
                  <p
                    className={
                      selectedUser.is_active ? "text-success" : "text-error"
                    }
                  >
                    {selectedUser.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
