"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Loader2 } from "lucide-react";

interface AnalyticsData {
    total_tasks: number;
    tasks_by_status: { status: string; count: number }[];
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await api.get<AnalyticsData>("/api/v1/analytics/dashboard");
            setData(response.data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ["#3b82f6", "#f97316", "#22c55e"]; // Blue, Orange, Green

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!data) return null;

    const chartData = data.tasks_by_status.map(item => ({
        name: item.status === "todo" ? "To Do" : item.status === "in_progress" ? "In Progress" : "Completed",
        value: item.count,
        color: item.status === "todo" ? COLORS[0] : item.status === "in_progress" ? COLORS[1] : COLORS[2]
    }));

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700">
                        <h3 className="text-gray-400 text-sm font-medium mb-2">Total Tasks</h3>
                        <p className="text-3xl font-bold text-white">{data.total_tasks}</p>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700">
                        <h3 className="text-blue-400 text-sm font-medium mb-2">To Do</h3>
                        <p className="text-3xl font-bold text-white">{data.tasks_by_status.find(s => s.status === "todo")?.count || 0}</p>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700">
                        <h3 className="text-orange-400 text-sm font-medium mb-2">In Progress</h3>
                        <p className="text-3xl font-bold text-white">{data.tasks_by_status.find(s => s.status === "in_progress")?.count || 0}</p>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700">
                        <h3 className="text-green-400 text-sm font-medium mb-2">Completed</h3>
                        <p className="text-3xl font-bold text-white">{data.tasks_by_status.find(s => s.status === "done")?.count || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 h-[400px]">
                        <h2 className="text-xl font-semibold mb-6">Task Distribution</h2>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 h-[400px]">
                        <h2 className="text-xl font-semibold mb-6">Status Breakdown</h2>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
}
