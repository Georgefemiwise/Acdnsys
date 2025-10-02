import React, { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface SuccessAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

/**
 * Reusable success alert component with auto-hide functionality
 * Provides consistent success messaging across the application
 */
export default function SuccessAlert({
  title = "Success",
  message,
  onDismiss,
  autoHide = true,
  autoHideDelay = 5000,
  className = ""
}: SuccessAlertProps) {
  
  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  return (
    <div className={`alert alert-success ${className}`}>
      <CheckCircle className="w-5 h-5 flex-shrink-0" />
      
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>

      {onDismiss && (
        <button 
          className="btn btn-sm btn-ghost"
          onClick={onDismiss}
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}