"use client";

import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleDateInputProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleDateInput({
  date,
  setDate,
  placeholder = "Select date",
  className,
}: SimpleDateInputProps) {
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setDate(new Date(value + "T00:00:00"));
    } else {
      setDate(undefined);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        type="date"
        value={formatDateForInput(date)}
        onChange={handleDateChange}
        className="date-input w-full"
        placeholder={placeholder}
      />
    </div>
  );
}