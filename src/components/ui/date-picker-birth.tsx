"use client";

import { memo, useState } from "react";
import { format, addYears, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Cake, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerBirthProps {
  value?: string;
  onChange: (date: string) => void;
  className?: string;
}

export const DatePickerBirth = memo(function DatePickerBirth({
  value,
  onChange,
  className,
}: DatePickerBirthProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(
    value ? new Date(value + "T12:00:00") : new Date(1990, 0, 1)
  );
  const [view, setView] = useState<"day" | "month" | "year">("day");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    { value: 0, label: "Janeiro" },
    { value: 1, label: "Fevereiro" },
    { value: 2, label: "Março" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Maio" },
    { value: 5, label: "Junho" },
    { value: 6, label: "Julho" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Setembro" },
    { value: 9, label: "Outubro" },
    { value: 10, label: "Novembro" },
    { value: 11, label: "Dezembro" },
  ];

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handleDaySelect = (day: number) => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
    onChange(format(newDate, "yyyy-MM-dd"));
    setView("day");
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(selectedDate.getFullYear(), month, 1);
    setSelectedDate(newDate);
    setView("day");
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(year, selectedDate.getMonth(), 1);
    setSelectedDate(newDate);
    setView("month");
  };

  const navigatePrev = () => {
    if (view === "day") {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
      setSelectedDate(newDate);
    } else if (view === "month") {
      const newDate = new Date(selectedDate.getFullYear() - 1, 0, 1);
      setSelectedDate(newDate);
    } else {
      setSelectedDate(subYears(selectedDate, 12));
    }
  };

  const navigateNext = () => {
    if (view === "day") {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
      setSelectedDate(newDate);
    } else if (view === "month") {
      const newDate = new Date(selectedDate.getFullYear() + 1, 0, 1);
      setSelectedDate(newDate);
    } else {
      setSelectedDate(addYears(selectedDate, 12));
    }
  };

  return (
    <div className={cn("bg-card border rounded-lg shadow-sm", className)}>
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <Button variant="ghost" size="icon" onClick={navigatePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("day")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              view === "day" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {format(selectedDate, "dd")}
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {format(selectedDate, "MMM", { locale: ptBR })}
          </button>
          <button
            type="button"
            onClick={() => setView("year")}
            className={cn(
              "px-3 py-1 rounded-md text-sm font-medium transition-colors",
              view === "year" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {format(selectedDate, "yyyy")}
          </button>
        </div>
        
        <Button variant="ghost" size="icon" onClick={navigateNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {view === "day" && (
        <>
          <div className="grid grid-cols-7 gap-1 p-3">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
            {paddingDays.map((i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const isSelected =
                day === selectedDate.getDate() &&
                selectedDate.getMonth() === new Date().getMonth();
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={cn(
                    "w-8 h-8 rounded-full text-sm transition-colors hover:bg-muted",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="p-3 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Cake className="h-4 w-4" />
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </>
      )}

      {view === "month" && (
        <div className="grid grid-cols-3 gap-2 p-3">
          {months.map((month) => (
            <button
              key={month.value}
              type="button"
              onClick={() => handleMonthSelect(month.value)}
              className={cn(
                "p-2 rounded-md text-sm transition-colors hover:bg-muted",
                month.value === selectedDate.getMonth() && "bg-primary text-primary-foreground"
              )}
            >
              {month.label}
            </button>
          ))}
        </div>
      )}

      {view === "year" && (
        <div className="grid grid-cols-4 gap-2 p-3 max-h-[200px] overflow-y-auto">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleYearSelect(year)}
              className={cn(
                "p-2 rounded-md text-sm transition-colors hover:bg-muted",
                year === selectedDate.getFullYear() && "bg-primary text-primary-foreground"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
