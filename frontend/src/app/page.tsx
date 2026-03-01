"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import Board from "@/components/Board";
import CreateTaskModal from "@/components/CreateTaskModal";
import { Task } from "@/types";
import { api } from "@/lib/api";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params: any = {};

      // Since our API separates logic for search/filters, we might need adjustments.
      // My backend supports search, status, priority, tag_id.
      // But wait, the BOARD assumes "To Do", "In Progress", "Completed" columns.
      // If I filter by status=done, then TODO and IN_PROGRESS columns will be empty.
      // This is expected behavior for a filter.

      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get<Task[]>("/api/v1/tasks/", { params });
      setTasks(response.data);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search? Or just fetch on effect
    const timeoutId = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <Navbar
        onSearch={setSearchQuery}
        onNewTask={() => setIsCreateModalOpen(true)}
      />
      <main className="flex-1 flex flex-col px-6 overflow-hidden">
        <FilterBar
          onPriorityChange={setPriorityFilter}
          currentPriority={priorityFilter}
        />
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <Board
            tasks={tasks}
            loading={loading}
            onTaskUpdate={fetchTasks}
          />
        </div>
      </main>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        closeModal={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => {
          fetchTasks();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
