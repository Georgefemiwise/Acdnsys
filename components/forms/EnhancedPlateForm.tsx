/**
 * Enhanced License Plate Form Component
 * 
 * Features:
 * - Real-time plate number validation and formatting
 * - Vehicle information management with auto-suggestions
 * - Beautiful, responsive design with proper error states
 * - Primary vehicle designation with smart defaults
 * - Integration with user management system
 * - Comprehensive validation with visual feedback
 */

"use client";

import React, { useState, useEffect } from "react";
import { 
  Car, 
  Hash, 
  Calendar, 
  Palette, 
  Star,
  AlertCircle, 
  CheckCircle, 
  Save, 
  X,
  Loader2,
  Plus,
  Edit3,
  User
} from "lucide-react";

// Types for form data and validation
interface PlateFormData {
  user_id: number;
  plate: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_year: string;
  is_primary: boolean;
  notes: string;
}

interface ValidationErrors {
  user_id?: string;
  plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_year?: string;
  notes?: string;
}

interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface PlateFormProps {
  /** Existing plate data for editing (optional) */
  initialData?: Partial<PlateFormData>;
  /** Whether form is in edit mode */
  isEditing?: boolean;
  /** Available users for selection */
  users: User[];
  /** Callback when form is submitted successfully */
  onSubmit: (data: PlateFormData) => Promise<void>;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether form is currently submitting */
  isSubmitting?: boolean;
  /** Custom title for the form */
  title?: string;
  /** Pre-selected user ID */
  preselectedUserId?: number;
}

/**
 * Enhanced License Plate Form with comprehensive validation and beautiful UI
 * Provides complete vehicle registration experience with real-time validation
 */
export default function EnhancedPlateForm({
  initialData = {},
  isEditing = false,
  users = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  title,
  preselectedUserId
}: PlateFormProps) {
  // Form state management
  const [formData, setFormData] = useState<PlateFormData>({
    user_id: preselectedUserId || initialData.user_id || 0,
    plate: initialData.plate || "",
    vehicle_make: initialData.vehicle_make || "",
    vehicle_model: initialData.vehicle_model || "",
    vehicle_color: initialData.vehicle_color || "",
    vehicle_year: initialData.vehicle_year || "",
    is_primary: initialData.is_primary ?? true,
    notes: initialData.notes || ""
  });

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValid, setIsValid] = useState(false);

  // UI state
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Vehicle data for auto-suggestions
  const [vehicleMakes] = useState([
    "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Volkswagen", "Ford", 
    "Chevrolet", "BMW", "Mercedes-Benz", "Audi", "Lexus", "Mazda", "Subaru",
    "Mitsubishi", "Peugeot", "Renault", "Suzuki", "Isuzu", "Daewoo"
  ]);

  const [vehicleColors] = useState([
    "White", "Black", "Silver", "Gray", "Blue", "Red", "Green", "Brown",
    "Gold", "Yellow", "Orange", "Purple", "Pink", "Beige", "Maroon"
  ]);

  /**
   * Real-time validation function
   * Validates individual fields and updates error state
   */
  const validateField = (name: keyof PlateFormData, value: string | number | boolean): string | undefined => {
    switch (name) {
      case 'user_id':
        if (!value || value === 0) {
          return "Please select a vehicle owner";
        }
        return undefined;

      case 'plate':
        if (!value || typeof value !== 'string' || !value.trim()) {
          return "License plate number is required";
        }
        
        const plateStr = value.trim().toUpperCase();
        
        // Basic length validation
        if (plateStr.length < 3) {
          return "License plate number is too short";
        }
        if (plateStr.length > 15) {
          return "License plate number is too long";
        }
        
        // Ghana format validation (flexible)
        const ghanaPatterns = [
          /^[A-Z]{2}-\d{4}-\d{2}$/,  // GR-1234-21
          /^[A-Z]{2}\s*\d{4}\s*\d{2}$/,  // GR 1234 21
          /^[A-Z]{1,3}[-\s]*\d{3,4}[-\s]*[A-Z\d]{1,3}$/  // Flexible format
        ];
        
        const isValidFormat = ghanaPatterns.some(pattern => pattern.test(plateStr));
        if (!isValidFormat) {
          return "Invalid license plate format. Expected: GR-1234-21 or similar";
        }
        
        return undefined;

      case 'vehicle_make':
        if (value && typeof value === 'string' && value.trim().length > 50) {
          return "Vehicle make must be less than 50 characters";
        }
        return undefined;

      case 'vehicle_model':
        if (value && typeof value === 'string' && value.trim().length > 50) {
          return "Vehicle model must be less than 50 characters";
        }
        return undefined;

      case 'vehicle_color':
        if (value && typeof value === 'string' && value.trim().length > 30) {
          return "Vehicle color must be less than 30 characters";
        }
        return undefined;

      case 'vehicle_year':
        if (value && typeof value === 'string' && value.trim()) {
          const year = parseInt(value.trim());
          const currentYear = new Date().getFullYear();
          
          if (isNaN(year)) {
            return "Vehicle year must be a valid number";
          }
          if (year < 1900) {
            return "Vehicle year cannot be before 1900";
          }
          if (year > currentYear + 1) {
            return `Vehicle year cannot be after ${currentYear + 1}`;
          }
        }
        return undefined;

      case 'notes':
        if (value && typeof value === 'string' && value.trim().length > 500) {
          return "Notes must be less than 500 characters";
        }
        return undefined;

      default:
        return undefined;
    }
  };

  /**
   * Validate entire form
   * Returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let formIsValid = true;

    // Validate all fields
    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof PlateFormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    return formIsValid;
  };

  /**
   * Handle input change with real-time validation
   */
  const handleInputChange = (name: keyof PlateFormData, value: string | number | boolean) => {
    // Update form data
    setFormData(prev => ({ ...prev, [name]: value }));

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field if it has been touched
    if (touched[name] || (typeof value === 'string' && value.trim() !== '')) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }

    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };

  /**
   * Handle field blur (when user leaves field)
   */
  const handleFieldBlur = (name: keyof PlateFormData) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  /**
   * Format license plate number as user types
   */
  const formatPlateNumber = (value: string): string => {
    // Remove extra spaces and convert to uppercase
    let cleaned = value.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // Try to format as Ghana standard: XX-XXXX-XX
    const match = cleaned.match(/^([A-Z]{1,3})[\s-]*(\d{3,4})[\s-]*([A-Z\d]{1,3})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    
    return cleaned;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouched(allTouched);
      return;
    }

    try {
      setSubmitError(null);
      await onSubmit(formData);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error: any) {
      setSubmitError(error.message || "Failed to save license plate information");
    }
  };

  // Update form validity when errors change
  useEffect(() => {
    const hasErrors = Object.values(errors).some(error => error !== undefined);
    const hasRequiredFields = formData.user_id !== 0 && formData.plate.trim() !== '';
    setIsValid(!hasErrors && hasRequiredFields);
  }, [errors, formData.user_id, formData.plate]);

  // Auto-format plate number
  const handlePlateChange = (value: string) => {
    const formatted = formatPlateNumber(value);
    handleInputChange('plate', formatted);
  };

  // Get selected user information
  const selectedUser = users.find(user => user.id === formData.user_id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Form Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          {isEditing ? (
            <Edit3 className="w-8 h-8 text-primary mr-3" />
          ) : (
            <Plus className="w-8 h-8 text-primary mr-3" />
          )}
          <h2 className="text-3xl font-bold text-gray-900">
            {title ||
              (isEditing ? "Edit License Plate" : "Register New Vehicle")}
          </h2>
        </div>
        <p className="text-gray-600">
          {isEditing
            ? "Update vehicle and license plate information"
            : "Register a new vehicle with license plate for detection system"}
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="alert alert-success mb-6">
          <CheckCircle className="w-5 h-5" />
          <span>License plate information saved successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="w-5 h-5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Owner Selection */}
        <div className="card bg-base-100 ">
          <div className="card-body">
            <h3 className="card-title text-xl mb-6">Vehicle Owner</h3>

            <div className="">
              <fieldset className="fieldset w-full">
                <legend className="fieldset-legend">
                  <User className="w-4 h-4 inline mr-2" />
                  Select Owner *
                </legend>
                <select
                  className={`select select-bordered w-full ${
                    errors.user_id && touched.user_id
                      ? "select-error"
                      : formData.user_id && !errors.user_id
                      ? "select-success"
                      : ""
                  }`}
                  value={formData.user_id}
                  onChange={(e) =>
                    handleInputChange("user_id", parseInt(e.target.value))
                  }
                  onBlur={() => handleFieldBlur("user_id")}
                  disabled={isSubmitting}
                  required
                >
                  <option disabled={true} value={0}>
                    Select vehicle owner...
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.phone})
                    </option>
                  ))}
                </select>
                {/* <span className="label">Optional</span> */}
              </fieldset>
              {errors.user_id && touched.user_id && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.user_id}
                  </span>
                </label>
              )}

              {/* Selected User Info */}
              {selectedUser && (
                <div className="mt-3 p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-primary mr-2" />
                    <div>
                      <div className="font-medium">{selectedUser.name}</div>
                      <div className="text-sm text-gray-600">
                        {selectedUser.phone}
                      </div>
                      {selectedUser.email && (
                        <div className="text-sm text-gray-600">
                          {selectedUser.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* License Plate Information */}
        <div className="card ">
          <div className="card-body">
            <h3 className="card-title text-xl mb-6">
              License Plate Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* License Plate Number */}

              <div className="form-control md:col-span-2">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">
                    <Hash className="w-4 h-4 inline mr-2" />
                    License Plate Number *
                  </legend>
                  <input
                    type="text"
                    className={`input input-bordered font-mono text-lg text-center  w-full ${
                      errors.plate && touched.plate
                        ? "input-error"
                        : formData.plate && !errors.plate
                        ? "input-success"
                        : ""
                    }`}
                    placeholder="GR-1234-21"
                    value={formData.plate}
                    onChange={(e) => handlePlateChange(e.target.value)}
                    onBlur={() => handleFieldBlur("plate")}
                    disabled={isSubmitting}
                    required
                  />
                  <p className="label">
                    Ghana format: GR-1234-21, AS-5678-22, etc.
                  </p>
                </fieldset>
                {errors.plate && touched.plate && (
                  <label className="label">
                    <span className="label-text-alt text-error flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.plate}
                    </span>
                  </label>
                )}
              </div>

              {/* Primary Vehicle Toggle */}
              <div className="fieldset md:col-span-2">
                <label className="label cursor-pointer">
                  <span className="label-text font-medium">
                    <Star className="w-4 h-4 inline mr-2" />
                    Primary Vehicle
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.is_primary}
                    onChange={(e) =>
                      handleInputChange("is_primary", e.target.checked)
                    }
                    disabled={isSubmitting}
                  />
                </label>
                <label className="label">
                  <span className="label-text-alt text-gray-500">
                    Mark as the owner's primary vehicle for notifications
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="card ">
          <div className="card-body">
            <h3 className="card-title text-xl mb-6">
              Vehicle Details (Optional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Make */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <Car className="w-4 h-4 inline mr-2" />
                    Vehicle Make
                  </span>
                </label>
                <input
                  type="text"
                  list="vehicle-makes"
                  className={`input input-bordered ${
                    errors.vehicle_make && touched.vehicle_make
                      ? "input-error"
                      : formData.vehicle_make && !errors.vehicle_make
                      ? "input-success"
                      : ""
                  }`}
                  placeholder="Toyota, Honda, etc."
                  value={formData.vehicle_make}
                  onChange={(e) =>
                    handleInputChange("vehicle_make", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("vehicle_make")}
                  disabled={isSubmitting}
                />
                <datalist id="vehicle-makes">
                  {vehicleMakes.map((make) => (
                    <option key={make} value={make} />
                  ))}
                </datalist>
                {errors.vehicle_make && touched.vehicle_make && (
                  <label className="label">
                    <span className="label-text-alt text-error flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.vehicle_make}
                    </span>
                  </label>
                )}
              </div>

              {/* Vehicle Model */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Vehicle Model</span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered ${
                    errors.vehicle_model && touched.vehicle_model
                      ? "input-error"
                      : formData.vehicle_model && !errors.vehicle_model
                      ? "input-success"
                      : ""
                  }`}
                  placeholder="Corolla, Civic, etc."
                  value={formData.vehicle_model}
                  onChange={(e) =>
                    handleInputChange("vehicle_model", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("vehicle_model")}
                  disabled={isSubmitting}
                />
                {errors.vehicle_model && touched.vehicle_model && (
                  <label className="label">
                    <span className="label-text-alt text-error flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.vehicle_model}
                    </span>
                  </label>
                )}
              </div>

              {/* Vehicle Color */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <Palette className="w-4 h-4 inline mr-2" />
                    Vehicle Color
                  </span>
                </label>
                <input
                  type="text"
                  list="vehicle-colors"
                  className={`input input-bordered ${
                    errors.vehicle_color && touched.vehicle_color
                      ? "input-error"
                      : formData.vehicle_color && !errors.vehicle_color
                      ? "input-success"
                      : ""
                  }`}
                  placeholder="White, Black, Silver, etc."
                  value={formData.vehicle_color}
                  onChange={(e) =>
                    handleInputChange("vehicle_color", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("vehicle_color")}
                  disabled={isSubmitting}
                />
                <datalist id="vehicle-colors">
                  {vehicleColors.map((color) => (
                    <option key={color} value={color} />
                  ))}
                </datalist>
                {errors.vehicle_color && touched.vehicle_color && (
                  <label className="label">
                    <span className="label-text-alt text-error flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.vehicle_color}
                    </span>
                  </label>
                )}
              </div>

              {/* Vehicle Year */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Vehicle Year
                  </span>
                </label>
                <input
                  type="number"
                  className={`input input-bordered ${
                    errors.vehicle_year && touched.vehicle_year
                      ? "input-error"
                      : formData.vehicle_year && !errors.vehicle_year
                      ? "input-success"
                      : ""
                  }`}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.vehicle_year}
                  onChange={(e) =>
                    handleInputChange("vehicle_year", e.target.value)
                  }
                  onBlur={() => handleFieldBlur("vehicle_year")}
                  disabled={isSubmitting}
                />
                {errors.vehicle_year && touched.vehicle_year && (
                  <label className="label">
                    <span className="label-text-alt text-error flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.vehicle_year}
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-control mt-6">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Additional Notes</legend>
                <textarea
                  className={`textarea textarea-bordered  h-24 w-full ${
                    errors.notes && touched.notes
                      ? "textarea-error"
                      : formData.notes && !errors.notes
                      ? "textarea-success"
                      : ""
                  }`}
                  placeholder="Any additional information about the vehicle (optional)"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  onBlur={() => handleFieldBlur("notes")}
                  disabled={isSubmitting}
                ></textarea>
                <div className="label">
                  {" "}
                  {formData.notes.length}/500 characters
                </div>
              </fieldset>

              {errors.notes && touched.notes && (
                <label className="label">
                  <span className="label-text-alt text-error flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.notes}
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>

          <button
            type="submit"
            className={`btn btn-primary ${!isValid ? "btn-disabled" : ""}`}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update License Plate" : "Register Vehicle"}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Form Validation Summary */}
      {Object.keys(touched).length > 0 && (
        <div className="mt-6 p-4 bg-base-200 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center">
            {isValid ? (
              <CheckCircle className="w-4 h-4 text-success mr-2" />
            ) : (
              <AlertCircle className="w-4 h-4 text-warning mr-2" />
            )}
            Form Validation Status
          </h4>
          <div className="text-sm space-y-1">
            <div
              className={`flex items-center ${
                formData.user_id && !errors.user_id
                  ? "text-success"
                  : "text-error"
              }`}
            >
              {formData.user_id && !errors.user_id ? "✓" : "✗"} Vehicle owner is
              selected
            </div>
            <div
              className={`flex items-center ${
                formData.plate && !errors.plate ? "text-success" : "text-error"
              }`}
            >
              {formData.plate && !errors.plate ? "✓" : "✗"} Valid license plate
              number is required
            </div>
            <div
              className={`flex items-center ${
                !formData.vehicle_year || !errors.vehicle_year
                  ? "text-success"
                  : "text-error"
              }`}
            >
              {!formData.vehicle_year || !errors.vehicle_year ? "✓" : "✗"}{" "}
              Vehicle year is valid (if provided)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}