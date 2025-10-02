import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "accent" | "neutral" | "info" | "success" | "warning" | "error";
  text?: string;
  className?: string;
}

/**
 * Reusable loading spinner component with customizable size, color, and text
 * Uses DaisyUI loading classes for consistent styling
 */
export default function LoadingSpinner({ 
  size = "md", 
  color = "primary", 
  text, 
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "loading-sm",
    md: "loading-md", 
    lg: "loading-lg",
    xl: "loading-xl"
  };

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent", 
    neutral: "text-neutral",
    info: "text-info",
    success: "text-success",
    warning: "text-warning",
    error: "text-error"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <span className={`loading loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}></span>
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  );
}