"use client";

import { memo, useState, useMemo } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  cliente: string;
  barbeiroNome: string;
  servicoNome: string;
  data: string;
  hora: string;
  valor: number;
  status: "agendado" | "finalizado" | "cancelado";
}

interface DaySchedule {
  time: string;
  appointments: Appointment[];
}

interface VisualAgendaProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  view?: "day" | "week";
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];

const statusColors: Record<string, string> = {
  agendado: "bg-blue-100 border-blue-300 text-blue-800",
  finalizado: "bg-green-100 border-green-300 text-green-800",
  cancelado: "bg-red-100 border-red-300 text-red-800",
};

export const VisualAgenda = memo(function VisualAgenda({
  appointments,
  onAppointmentClick,
  selectedDate = new Date(),
  onDateChange,
  view = "day",
}: VisualAgendaProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const navigatePrev = () => {
    const newDate = view === "day" ? subDays(currentDate, 1) : subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const navigateNext = () => {
    const newDate = view === "day" ? addDays(currentDate, 1) : addWeeks(currentDate, 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateChange?.(today);
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { locale: ptBR });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const groupedAppointments = useMemo(() => {
    const schedule: Record<string, DaySchedule> = {};
    
    TIME_SLOTS.forEach((time) => {
      schedule[time] = { time, appointments: [] };
    });

    appointments.forEach((apt) => {
      if (schedule[apt.hora]) {
        schedule[apt.hora].appointments.push(apt);
      }
    });

    return Object.values(schedule).filter(
      (slot) => slot.appointments.length > 0
    );
  }, [appointments]);

  const weekAppointments = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    weekDays.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      map[dateStr] = appointments.filter((apt) => apt.data === dateStr);
    });
    return map;
  }, [appointments, weekDays]);

  if (view === "week") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-5 w-5" />
              Agenda da Semana
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={navigatePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={navigateNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(weekDays[0], "dd MMM", { locale: ptBR })} - {format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayAppts = weekAppointments[dateStr] || [];
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "min-h-[200px] border rounded-lg p-2",
                    isToday ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <div className={cn(
                    "text-center pb-2 border-b mb-2",
                    isToday ? "border-primary" : "border-muted"
                  )}>
                    <p className="text-xs text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: ptBR })}
                    </p>
                    <p className={cn(
                      "text-lg font-bold",
                      isToday && "text-primary"
                    )}>
                      {format(day, "d")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {dayAppts.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => onAppointmentClick?.(apt)}
                        className={cn(
                          "text-xs p-1 rounded border cursor-pointer truncate",
                          statusColors[apt.status] || statusColors.agendado
                        )}
                      >
                        <p className="font-medium truncate">{apt.cliente}</p>
                        <p className="opacity-75">{apt.hora}</p>
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <p className="text-xs text-center text-muted-foreground">
                        +{dayAppts.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-5 w-5" />
            {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {groupedAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum agendamento para hoje</p>
              <p className="text-sm">Clique em "Novo" para adicionar</p>
            </div>
          ) : (
            <div className="divide-y">
              {groupedAppointments.map((slot) => (
                <div key={slot.time} className="flex min-h-[80px]">
                  <div className="w-20 py-4 px-2 text-center text-sm font-medium text-muted-foreground border-r bg-muted/30">
                    {slot.time}
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                    {slot.appointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => onAppointmentClick?.(apt)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                          statusColors[apt.status] || statusColors.agendado
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{apt.cliente}</p>
                            <p className="text-sm opacity-80">{apt.servicoNome}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              R$ {apt.valor.toFixed(2)}
                            </p>
                            <p className="text-xs opacity-75">
                              {apt.barbeiroNome}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
