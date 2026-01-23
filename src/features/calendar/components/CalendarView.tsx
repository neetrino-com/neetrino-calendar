"use client";

import { useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DatesSetArg, DateSelectArg } from "@fullcalendar/core";
import type { CalendarItemWithRelations } from "../types";

interface CalendarViewProps {
  items: CalendarItemWithRelations[];
  viewType: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarItemWithRelations) => void;
  onDatesSet: (start: Date) => void;
  isLoading: boolean;
}

export function CalendarView({
  items,
  viewType,
  selectedDate,
  onDateSelect,
  onEventClick,
  onDatesSet,
  isLoading,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Update calendar view when viewType changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(viewType);
    }
  }, [viewType]);

  // Transform items to FullCalendar events
  const events = items.map((item) => ({
    id: item.id,
    title: item.title,
    start: item.startAt,
    end: item.endAt || undefined,
    allDay: item.allDay,
    extendedProps: {
      item,
    },
    className: item.type === "MEETING" ? "fc-event-meeting" : "fc-event-deadline",
    backgroundColor: item.type === "MEETING" ? "#22C55E" : "#EF4444",
    borderColor: item.type === "MEETING" ? "#16A34A" : "#DC2626",
  }));

  // Handlers
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      onDateSelect(selectInfo.start);
    },
    [onDateSelect]
  );

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const item = clickInfo.event.extendedProps.item as CalendarItemWithRelations;
      onEventClick(item);
    },
    [onEventClick]
  );

  const handleDatesSet = useCallback(
    (datesInfo: DatesSetArg) => {
      onDatesSet(datesInfo.start);
    },
    [onDatesSet]
  );

  const handleDateClick = useCallback(
    (arg: { date: Date }) => {
      onDateSelect(arg.date);
    },
    [onDateSelect]
  );

  return (
    <div className={`relative ${isLoading ? "opacity-50" : ""}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={viewType}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "",
        }}
        locale="en"
        firstDay={1}
        events={events}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        height="auto"
        aspectRatio={1.8}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          day: "Day",
        }}
        allDayText="All day"
        noEventsText="No events"
        moreLinkText={(n) => `+${n} more`}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
      />
    </div>
  );
}
