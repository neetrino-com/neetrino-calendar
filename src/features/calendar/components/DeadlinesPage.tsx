"use client";

import { useState, useCallback } from "react";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarView } from "./CalendarView";
import { EventModal } from "./EventModal";
import { EventForm } from "./EventForm";
import { useCalendarItems } from "../hooks/useCalendarItems";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { CalendarItemWithRelations, ItemStatus } from "../types";
import { CALENDAR_VIEWS, STATUS_LABELS } from "../types";

export function DeadlinesPage() {
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<"dayGridMonth" | "timeGridWeek" | "timeGridDay">(
    "dayGridMonth"
  );

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<CalendarItemWithRelations | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarItemWithRelations | null>(null);

  // Calculate date range for query
  const queryStart = startOfMonth(addMonths(currentDate, -1));
  const queryEnd = endOfMonth(addMonths(currentDate, 1));

  // Fetch only DEADLINES
  const { data: items = [], isLoading } = useCalendarItems({
    from: queryStart.toISOString(),
    to: queryEnd.toISOString(),
    type: "DEADLINE",
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  // Get current user to check role
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";

  // Handlers
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleEventClick = useCallback((event: CalendarItemWithRelations) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  }, []);

  const handleViewChange = useCallback(
    (view: "dayGridMonth" | "timeGridWeek" | "timeGridDay") => {
      setViewType(view);
    },
    []
  );

  const handleDatesSet = useCallback((start: Date) => {
    setCurrentDate(start);
  }, []);

  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setIsFormOpen(true);
  }, []);

  const handleEditEvent = useCallback((event: CalendarItemWithRelations) => {
    setEditingEvent(event);
    setIsEventModalOpen(false);
    setIsFormOpen(true);
  }, []);

  const handleCloseEventModal = useCallback(() => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  }, []);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEvent(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <div className="p-6">
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

          {/* Right side - Filters and actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-40"
              />
            </div>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ItemStatus | "ALL")}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Create button - only for admin */}
            {isAdmin && (
              <Button onClick={handleCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Create deadline
              </Button>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <CalendarView
            items={items}
            viewType={viewType}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventClick={handleEventClick}
            onDatesSet={handleDatesSet}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Event detail modal */}
      <EventModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={handleCloseEventModal}
        onEdit={isAdmin ? handleEditEvent : undefined}
      />

      {/* Event create/edit form */}
      <EventForm
        event={editingEvent}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        defaultDate={selectedDate}
        defaultType="DEADLINE"
      />
    </div>
  );
}
