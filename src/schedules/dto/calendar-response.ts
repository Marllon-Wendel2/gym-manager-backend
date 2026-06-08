export interface DaySchedule {
  date: string;
  isFullyBlocked: boolean;
  hours: HourSchedule[];
}

export interface HourSchedule {
  hour: number;
  scheduleId: string;
  isAvailable: boolean; // true se não está bloqueado e não está reservado
  isBlocked: boolean;
  isBooked: boolean;
  reservationId?: string; // se reservado, qual o ID da reserva
}

export interface CalendarResponse {
  success: boolean;
  startDate: string;
  endDate: string;
  days: DaySchedule[];
}
