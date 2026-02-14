
import React, { InputHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LucideIcon } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Button ---
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: LucideIcon;
}
export const Button: React.FC<ButtonProps> = ({ 
  className, variant = 'primary', size = 'md', isLoading, icon: Icon, children, ...props 
}) => {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary-700 text-white hover:bg-primary-800 shadow-sm", // #1D4ED8
    accent: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm", // #F59E0B
    secondary: "bg-slate-800 text-white hover:bg-slate-900 shadow-sm",
    outline: "border border-slate-300 bg-transparent hover:bg-slate-100 text-slate-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-slate-100 text-slate-600"
  };
  
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-8 text-lg"
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={isLoading} {...props}>
      {isLoading ? (
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      ) : Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}
export const Input: React.FC<InputProps> = ({ label, error, icon: Icon, className, ...props }) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
      )}
      <input 
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50", 
          Icon ? "pl-9" : "",
          error && "border-red-500", 
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// --- Card ---
export const Card: React.FC<{ children: ReactNode; className?: string; title?: string; action?: ReactNode }> = ({ children, className, title, action }) => (
  <div className={cn("rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm", className)}>
    {(title || action) && (
      <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
        {title && <h3 className="tracking-tight text-lg font-semibold">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6 pt-2">{children}</div>
  </div>
);

// --- Badge ---
export const Badge: React.FC<{ children: ReactNode; variant?: 'success' | 'warning' | 'error' | 'neutral' | 'primary' | 'accent' }> = ({ children, variant = 'neutral' }) => {
  const styles = {
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800", // Using Amber for warning to match orange-ish tone
    error: "bg-red-100 text-red-800",
    neutral: "bg-slate-100 text-slate-800",
    primary: "bg-primary-100 text-primary-800",
    accent: "bg-accent-100 text-accent-800"
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none", styles[variant])}>
      {children}
    </span>
  );
};

// --- Modal ---
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg animate-zoom-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// --- Stat Card ---
interface StatCardProps {
    label: string; 
    value: string | number; 
    icon: LucideIcon; 
    trend?: string; 
    trendUp?: boolean;
    color?: 'blue' | 'green' | 'orange' | 'tomato';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, trendUp, color = 'blue' }) => {
  const colors = {
      blue: "bg-primary-50 text-primary-700",
      green: "bg-green-50 text-green-700",
      orange: "bg-orange-50 text-orange-700",
      tomato: "bg-tomato-50 text-tomato-600",
  };

  return (
    <Card className="p-6">
        <div className="flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
            {trend && (
            <p className={cn("mt-1 text-xs", trendUp ? "text-green-600" : "text-red-600")}>
                {trend}
            </p>
            )}
        </div>
        <div className={cn("rounded-full p-3", colors[color])}>
            <Icon className="h-6 w-6" />
        </div>
        </div>
    </Card>
  );
};
