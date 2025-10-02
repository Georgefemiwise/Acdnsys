import React from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: "error" | "warning" | "info";
}

/**
 * Reusable error alert component with retry and dismiss functionality
 * Provides consistent error messaging across the application
 */
export default function ErrorAlert({
  title = "Error",
  message,
  onRetry,
  onDismiss,
  className = "",
  variant = "error"
}: ErrorAlertProps) {
  const variantClasses = {
    error: "alert-error",
    warning: "alert-warning", 
    info: "alert-info"
  };

  const icons = {
    error: AlertTriangle,
    warning: AlertTriangle,
    info: AlertTriangle
  };

  const Icon = icons[variant];

  return (
    <div className={`alert ${variantClasses[variant]} ${className}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      
      <div className="flex-1">
        {title && <div className="font-semibold">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>

      <div className="flex gap-2">
        {onRetry && (
          <button 
            className="btn btn-sm btn-ghost"
            onClick={onRetry}
            title="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        
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
    </div>
  );
}