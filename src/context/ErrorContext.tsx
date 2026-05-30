/**
 * ErrorContext — Obsidian Plugin
 * Direct copy of apps/word-addin/src/context/ErrorContext.tsx.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface AppError {
  id: string;
  message: string;
  type: string;
  timestamp: number;
  dismissible: boolean;
}

interface ErrorContextValue {
  errors: AppError[];
  addError: (message: string, type: string, dismissible?: boolean) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) throw new Error("useError must be used within ErrorProvider");
  return context;
}

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback(
    (message: string, type: string, dismissible = true) => {
      setErrors((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          message,
          type,
          timestamp: Date.now(),
          dismissible,
        },
      ]);
    },
    []
  );

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  return (
    <ErrorContext.Provider value={{ errors, addError, dismissError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
}
