"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Task } from "@/types";
import TaskColumn from "./TaskColumn";
import TaskCard from "./TaskCard";
import { Loader2 } from "lucide-react";

export default function Board() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await api.get<Task[]>("/api/v1/tasks/");
            setTasks(response.data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const todoTasks = tasks.filter((t) => t.status === "todo");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const doneTasks = tasks.filter((t) => t.status === "done");

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-x-auto gap-6 pb-4">
            <TaskColumn
                title="To Do"
                count={todoTasks.length}
                color="bg-blue-500"
            >
                {todoTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </TaskColumn>

            <TaskColumn
                title="In Progress"
                count={inProgressTasks.length}
                color="bg-orange-500"
            >
                {inProgressTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </TaskColumn>

            <TaskColumn
                title="Completed"
                count={doneTasks.length}
                color="bg-green-500"
            >
                {doneTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                ))}
            </TaskColumn>
        </div>
    );
}
