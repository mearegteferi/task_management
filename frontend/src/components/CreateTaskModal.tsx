"use client";

import React, { useState, Fragment } from "react";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import { api } from "@/lib/api";
import { X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  closeModal: () => void;
  onTaskCreated: () => void;
}

const PRIORITIES = [
    { value: 1, label: "Low", color: "text-blue-400" },
    { value: 2, label: "Medium", color: "text-orange-400" },
    { value: 3, label: "High", color: "text-red-400" },
];

export default function CreateTaskModal({ isOpen, closeModal, onTaskCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(PRIORITIES[0]);
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState(""); // Comma separated for now
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
        const tagList = tags.split(",").map(t => t.trim()).filter(Boolean).map(t => ({ name: t }));
        
        await api.post("/api/v1/tasks/", {
            title,
            description,
            priority: priority.value,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            tags: tagList,
            status: "todo"
        });
        
        setTitle("");
        setDescription("");
        setPriority(PRIORITIES[0]);
        setDueDate("");
        setTags("");
        onTaskCreated();
        closeModal();
    } catch (error) {
        console.error("Failed to create task", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#1e293b] p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-semibold leading-6 text-white"
                  >
                    Create New Task
                  </Dialog.Title>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                        <input 
                            type="text" 
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Task title"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                             <Listbox value={priority} onChange={setPriority}>
                                <div className="relative mt-1">
                                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-[#0f172a] py-2 pl-3 pr-10 text-left border border-gray-700 focus:outline-none sm:text-sm text-white">
                                        <span className={cn("block truncate", priority.color)}>{priority.label}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </Listbox.Button>
                                    <Transition
                                        as={Fragment}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#0f172a] py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10 border border-gray-700">
                                            {PRIORITIES.map((p, personIdx) => (
                                                <Listbox.Option
                                                    key={personIdx}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                            active ? 'bg-blue-600/20 text-blue-300' : 'text-gray-300'
                                                        }`
                                                    }
                                                    value={p}
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <span className={cn("block truncate", selected ? 'font-medium' : 'font-normal', p.color)}>
                                                                {p.label}
                                                            </span>
                                                            {selected ? (
                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>
                                    </Transition>
                                </div>
                            </Listbox>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                            <input 
                                type="date" 
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                        <input 
                            type="text" 
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Design, Bug, Feature..."
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                            onClick={closeModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
