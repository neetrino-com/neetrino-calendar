"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import { Plus, Calendar } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, DateSelectArg } from "@fullcalendar/core";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleList } from "./ScheduleList";
import { ScheduleForm } from "./ScheduleForm";
import { useSchedule } from "../hooks/useSchedule";
import { useCurrentUser } from "@/features/calendar/hooks/useCurrentUser";
import { formatDateToISO } from "@/lib/utils";
import type { ScheduleEntryWithRelations } from "../types";
import { CALENDAR_VIEWS } from "@/features/calendar/types";

export function SchedulePage() {
  const calendarRef = useRef<FullCalendar>(null);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">(
    "dayGridMonth"
  );

  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntryWithRelations | null>(null);

  // Fetch schedule for selected date
  const dateStr = formatDateToISO(selectedDate);
  const { data: entries = [], isLoading } = useSchedule(dateStr);

  // Get current user to check role
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  // Update calendar view when viewType changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(viewType);
    }
  }, [viewType]);

  // Handlers
  const handleViewChange = useCallback(
    (view: "dayGridMonth" | "timeGridWeek" | "timeGridDay") => {
      setViewType(view);
    },
    []
  );

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
  }, []);

  const handleDateClick = useCallback((arg: { date: Date }) => {
    setSelectedDate(arg.date);
  }, []);

  const handleDatesSet = useCallback((datesInfo: DatesSetArg) => {
    setCurrentDate(datesInfo.start);
  }, []);

  const handleAddClick = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const handleEditEntry = (entry: ScheduleEntryWithRelations) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="flex flex-col lg:flex-row">
        {/* Calendar section */}
        <div className="flex-1 p-6">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            {/* Left side - View switcher */}
            <Tabs value={viewType} onValueChange={(v) => handleViewChange(v as typeof viewType)}>
              <TabsList>
                {CALENDAR_VIEWS.map((view) => (
                  <TabsTrigger key={view.type} value={view.type}>
                    {view.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              select={handleDateSelect}
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
            />
          </div>
        </div>

        {/* Schedule panel */}
        <div className="lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Daily schedule</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4" />
                    {format(selectedDate, "d MMMM yyyy", { locale: enUS })}
                  </div>
                </div>
                {isAdmin && (
                  <Button size="sm" onClick={handleAddClick}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No entries for this day</p>
                  {isAdmin && (
                    <Button variant="link" onClick={handleAddClick} className="mt-2">
                      Add entry
                    </Button>
                  )}
                </div>
              ) : (
                <ScheduleList entries={entries} onEdit={isAdmin ? handleEditEntry : undefined} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form modal */}
      <ScheduleForm
        entry={editingEntry}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        date={dateStr}
      />
    </div>
  );
}
