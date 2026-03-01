"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { Task } from "@/types";
import TaskColumn from "./TaskColumn";
import TaskModal from "./TaskModal";
import { Loader2 } from "lucide-react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import TaskCard from "./TaskCard";

interface BoardProps {
    tasks: Task[];
    loading: boolean;
    onTaskUpdate: () => void;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export default function Board({ tasks, loading, onTaskUpdate }: BoardProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null); // For DnD overlay
    const [selectedTask, setSelectedTask] = useState<Task | null>(null); // For Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Prevent accidental drags
            },
        })
    );

    const todoTasks = tasks.filter((t) => t.status === "todo");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const doneTasks = tasks.filter((t) => t.status === "done");

    const onTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    const onDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
        }
    };

    const onDragOver = (event: DragOverEvent) => {
        // Optional: Implement robust drag over logic for reordering within columns or moving items if needed
        // Simple Kanban usually relies on DragEnd for column changes if using SortableContext
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        let newStatus: "todo" | "in_progress" | "done" | null = null;

        if (overId === "todo" || overId === "in_progress" || overId === "done") {
            newStatus = overId as "todo" | "in_progress" | "done";
        } else {
            // Dropped over another task
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus && newStatus !== activeTask.status) {
            // Optimistic Update can be handled by parent if we pass setOptimisticState, but simpler to just API call then refresh.
            // But here props are read-only. We can't immediately setTasks locally unless we lift that too or ignore optimistic UI for a second.
            // Let's call API then onTaskUpdate().

            try {
                await api.patch(`/api/v1/tasks/${activeId}`, { status: newStatus });
                onTaskUpdate(); // Refresh parent
            } catch (error) {
                console.error("Failed to update task status", error);
            }
        }

        setActiveTask(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex h-full overflow-x-auto gap-6 pb-4">
                <TaskColumn
                    id="todo"
                    title="To Do"
                    count={todoTasks.length}
                    color="bg-blue-500"
                    tasks={todoTasks}
                    onTaskClick={onTaskClick}
                />

                <TaskColumn
                    id="in_progress"
                    title="In Progress"
                    count={inProgressTasks.length}
                    color="bg-orange-500"
                    tasks={inProgressTasks}
                    onTaskClick={onTaskClick}
                />

                <TaskColumn
                    id="done"
                    title="Completed"
                    count={doneTasks.length}
                    color="bg-green-500"
                    tasks={doneTasks}
                    onTaskClick={onTaskClick}
                />
            </div>

            {typeof document !== "undefined" && createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeTask && (
                        <TaskCard task={activeTask} onClick={() => { }} />
                    )}
                </DragOverlay>,
                document.body
            )}

            <TaskModal
                isOpen={isModalOpen}
                closeModal={closeModal}
                task={selectedTask}
                onUpdate={onTaskUpdate}
            />
        </DndContext>
    );
}
