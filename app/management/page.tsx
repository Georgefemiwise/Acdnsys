"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Car, 
  Phone, 
  Mail, 
  MapPin, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Eye,
  EyeOff
} from "lucide-react";

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
  owner_name?: string;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergency_contact: string;
  notes: string;
}

interface PlateFormData {
  user_id: number;
  plate: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_year: string;
  is_primary: boolean;
}

export default function ManagementPage() {
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [plates, setPlates] = useState<Plate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "plates">("users");
  const [showInactive, setShowInactive] = useState(false);

  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPlateForm, setShowPlateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPlate, setEditingPlate] = useState<Plate | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form data
  const [userFormData, setUserFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact: "",
    notes: ""
  });

  const [plateFormData, setPlateFormData] = useState<PlateFormData>({
    user_id: 0,
    plate: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_color: "",
    vehicle_year: "",
    is_primary: true
  });

  const API_BASE = "/api";

  // Utility functions
  const showMessage = (message: string, type: "success" | "error") => {
    if (type === "success") {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };

  const resetUserForm = () => {
    setUserFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      emergency_contact: "",
      notes: ""
    });
    setEditingUser(null);
    setShowUserForm(false);
  };

  const resetPlateForm = () => {
    setPlateFormData({
      user_id: 0,
      plate: "",
      vehicle_make: "",
      vehicle_model: "",
      vehicle_color: "",
      vehicle_year: "",
      is_primary: true
    });
    setEditingPlate(null);
    setShowPlateForm(false);
  };

  // API calls
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users?active_only=${!showInactive}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/plates?active_only=${!showInactive}`);
      if (!response.ok) throw new Error("Failed to fetch plates");
      const data = await response.json();
      setPlates(data);
    } catch (err: any) {
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create user");
      }

      showMessage("User created successfully!", "success");
      resetUserForm();
      fetchUsers();
    } catch (err: any) {
      showMessage(err.message, "error");
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update user");
      }

      showMessage("User updated successfully!", "success");
      resetUserForm();
      fetchUsers();
    } catch (err: any) {
      showMessage(err.message, "error");
    }
  };

  const deleteUser = async (userId: number, hardDelete = false) => {
    if (!confirm(`Are you sure you want to ${hardDelete ? 'permanently delete' : 'deactivate'} this user?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/users/${userId}?hard_delete=${hardDelete}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete user");

      showMessage(`User ${hardDelete ? 'deleted' : 'deactivated'} successfully!`, "success");
      fetchUsers();
    } catch (err: any) {
      showMessage(err.message, "error");
    }
  };

  const createPlate = async () => {
    try {
      const plateData = {
        ...plateFormData,
        vehicle_year: plateFormData.vehicle_year ? parseInt(plateFormData.vehicle_year) : null
      };

      const response = await fetch(`${API_BASE}/plates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create plate");
      }

      showMessage("License plate created successfully!", "success");
      resetPlateForm();
      fetchPlates();
    } catch (err: any) {
      showMessage(err.message, "error");
    }
  };

  const updatePlate = async () => {
    if (!editingPlate) return;

    try {
      const plateData = {
        ...plateFormData,
        vehicle_year: plateFormData.vehicle_year ? parseInt(plateFormData.vehicle_year) : null
      };

      const response = await fetch(`${API_BASE}/plates/${editingPlate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update plate");
      }

      showMessage("License plate updated successfully!", "success");
      resetPlateForm();
      fetchPlates();
    } catch (err: any) {
      showMessage(err.message, "error");
    }
  };

  const deletePlate = async (plateId: number, hardDelete = false) => {
    if (!confirm(`Are you sure you want to ${hardDelete ? 'permanently delete' : 'deactivate'} this plate?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/plates/${plateId}?hard_delete=${hardDelete}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete plate");

      showMessage(`License plate ${hardDelete ? 'deleted' : 'deactivated'} successfully!`, "success");
      fetchPlates();
    } catch (err: any) {
      showMessage(err.message, "error");
    }
  };

  // Event handlers
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      phone: user.phone,
      email: user.email || "",
      address: user.address || "",
      emergency_contact: user.emergency_contact || "",
      notes: user.notes || ""
    });
    setShowUserForm(true);
  };

  const handleEditPlate = (plate: Plate) => {
    setEditingPlate(plate);
    setPlateFormData({
      user_id: plate.user_id,
      plate: plate.plate,
      vehicle_make: plate.vehicle_make || "",
      vehicle_model: plate.vehicle_model || "",
      vehicle_color: plate.vehicle_color || "",
      vehicle_year: plate.vehicle_year?.toString() || "",
      is_primary: plate.is_primary
    });
    setShowPlateForm(true);
  };

  const handleUserFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser();
    } else {
      createUser();
    }
  };

  const handlePlateFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlate) {
      updatePlate();
    } else {
      createPlate();
    }
  };

  // Filter functions
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPlates = plates.filter(plate =>
    plate.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plate.owner_name && plate.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (plate.vehicle_make && plate.vehicle_make.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Effects
  useEffect(() => {
    fetchUsers();
    fetchPlates();
  }, [showInactive]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          System Management
        </h1>
        <p className="text-gray-600">
          Manage users, license plates, and system data with comprehensive CRUD operations
        </p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="alert alert-success mb-4">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-4">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tabs tabs-boxed mb-6">
        <button
          className={`tab ${activeTab === "users" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <User className="w-4 h-4 mr-2" />
          Users ({users.length})
        </button>
        <button
          className={`tab ${activeTab === "plates" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("plates")}
        >
          <Car className="w-4 h-4 mr-2" />
          License Plates ({plates.length})
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="input input-bordered w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Show Inactive Toggle */}
        <label className="label cursor-pointer">
          <span className="label-text mr-2">Show Inactive</span>
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
        </label>

        {/* Add Button */}
        <button
          className="btn btn-primary"
          onClick={() => {
            if (activeTab === "users") {
              setShowUserForm(true);
            } else {
              setShowPlateForm(true);
            }
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === "users" ? "User" : "Plate"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <div key={user.id} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="card-title text-lg">{user.name}</h3>
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-error" />
                        )}
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
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {user.notes}
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost text-error"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Plates Tab */}
          {activeTab === "plates" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlates.map((plate) => (
                <div key={plate.id} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="card-title text-lg font-mono">
                          {plate.plate}
                        </h3>
                        {plate.is_primary && (
                          <span className="badge badge-primary badge-sm">Primary</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {plate.is_active ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-error" />
                        )}
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
                            {plate.vehicle_year} {plate.vehicle_make} {plate.vehicle_model}
                          </span>
                        </div>
                      )}
                      {plate.vehicle_color && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: plate.vehicle_color.toLowerCase() }}
                          />
                          <span>{plate.vehicle_color}</span>
                        </div>
                      )}
                    </div>

                    <div className="card-actions justify-end mt-4">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleEditPlate(plate)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="btn btn-sm btn-ghost text-error"
                        onClick={() => deletePlate(plate.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingUser ? "Edit User" : "Add New User"}
            </h3>
            
            <form onSubmit={handleUserFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Full Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered"
                    placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Emergency Contact</span>
                  </label>
                  <input
                    type="tel"
                    className="input input-bordered"
                    value={userFormData.emergency_contact}
                    onChange={(e) => setUserFormData({...userFormData, emergency_contact: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Address</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={userFormData.address}
                  onChange={(e) => setUserFormData({...userFormData, address: e.target.value})}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={3}
                  value={userFormData.notes}
                  onChange={(e) => setUserFormData({...userFormData, notes: e.target.value})}
                />
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={resetUserForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plate Form Modal */}
      {showPlateForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingPlate ? "Edit License Plate" : "Add New License Plate"}
            </h3>
            
            <form onSubmit={handlePlateFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Owner *</span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={plateFormData.user_id}
                    onChange={(e) => setPlateFormData({...plateFormData, user_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value={0}>Select Owner</option>
                    {users.filter(u => u.is_active).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">License Plate *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered font-mono"
                    placeholder="GR-1234-21"
                    value={plateFormData.plate}
                    onChange={(e) => setPlateFormData({...plateFormData, plate: e.target.value.toUpperCase()})}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Vehicle Make</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Toyota"
                    value={plateFormData.vehicle_make}
                    onChange={(e) => setPlateFormData({...plateFormData, vehicle_make: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Vehicle Model</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Corolla"
                    value={plateFormData.vehicle_model}
                    onChange={(e) => setPlateFormData({...plateFormData, vehicle_model: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Vehicle Color</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Silver"
                    value={plateFormData.vehicle_color}
                    onChange={(e) => setPlateFormData({...plateFormData, vehicle_color: e.target.value})}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Vehicle Year</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={plateFormData.vehicle_year}
                    onChange={(e) => setPlateFormData({...plateFormData, vehicle_year: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Primary Vehicle</span>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={plateFormData.is_primary}
                    onChange={(e) => setPlateFormData({...plateFormData, is_primary: e.target.checked})}
                  />
                </label>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={resetPlateForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlate ? "Update Plate" : "Create Plate"}
                </button>
              </div>
            </form>
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
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-lg">{selectedUser.phone}</p>
                </div>
                {selectedUser.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg">{selectedUser.email}</p>
                  </div>
                )}
                {selectedUser.emergency_contact && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-lg">{selectedUser.emergency_contact}</p>
                  </div>
                )}
              </div>

              {selectedUser.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-lg">{selectedUser.address}</p>
                </div>
              )}

              {selectedUser.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-lg">{selectedUser.notes}</p>
                </div>
              )}

              {selectedUser.plates && selectedUser.plates.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Registered Vehicles</label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.plates.map((plate) => (
                      <div key={plate.id} className="p-3 bg-base-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold">{plate.plate}</span>
                          {plate.is_primary && (
                            <span className="badge badge-primary badge-sm">Primary</span>
                          )}
                        </div>
                        {(plate.vehicle_make || plate.vehicle_model) && (
                          <p className="text-sm text-gray-600">
                            {plate.vehicle_year} {plate.vehicle_make} {plate.vehicle_model}
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
                  <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="font-medium">Status</label>
                  <p className={selectedUser.is_active ? "text-success" : "text-error"}>
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