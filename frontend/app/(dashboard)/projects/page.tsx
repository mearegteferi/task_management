'use client';

import { useEffect, useState } from 'react';
import { projectService } from '@/services/project.service';
import { ProjectResponse } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Calendar,
    Flag,
    Loader2,
    Briefcase,
    Pencil,
    Trash2,
    Sparkles,
    ChevronRight,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { ProjectModal } from '@/components/modals/ProjectModal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function ProjectListPage() {
    const [projects, setProjects] = useState<ProjectResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchProjects = async () => {
        try {
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleOpenCreateModal = () => {
        setSelectedProject(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (e: React.MouseEvent, project: ProjectResponse) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                await projectService.deleteProject(projectId);
                setProjects(projects.filter(p => p.id !== projectId));
            } catch (error) {
                console.error('Failed to delete project:', error);
            }
        }
    };

    const handleSaveProject = async (data: any) => {
        if (selectedProject) {
            const updated = await projectService.updateProject(selectedProject.id, data);
            setProjects(projects.map(p => p.id === selectedProject.id ? updated : p));
        } else {
            const created = await projectService.createProject(data);
            setProjects([...projects, created]);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">
                        Project <span className="text-primary italic">Vault</span>
                    </h1>
                    <p className="text-foreground/50 text-sm font-medium flex items-center gap-2">
                        <Briefcase size={14} className="text-accent" />
                        Manage your creative streams and workflows.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find a project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11 bg-card/50 border-none rounded-2xl shadow-sm focus-visible:ring-1 focus-visible:ring-primary/50"
                        />
                    </div>
                    <Button
                        onClick={handleOpenCreateModal}
                        className="h-11 rounded-2xl px-6 bg-gradient-to-r from-primary to-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20 border-none font-bold italic"
                    >
                        <Plus size={18} className="mr-2" />
                        NEW PROJECT
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {filteredProjects.map((project) => (
                        <motion.div
                            key={project.id}
                            variants={item}
                            layout
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <Link href={`/projects/${project.id}`}>
                                <Card className="group h-full relative overflow-hidden border-none shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-primary/10">
                                    <div className={cn(
                                        "absolute top-0 left-0 w-full h-1 opacity-50 transition-all group-hover:h-2 group-hover:opacity-100",
                                        project.status === 'done' ? 'bg-green-500' : project.status === 'in_progress' ? 'bg-orange-500' : 'bg-slate-400'
                                    )}></div>

                                    <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">
                                                {project.title}
                                            </CardTitle>
                                            <Badge className={cn(
                                                "rounded-full px-2 py-0 text-[10px] uppercase font-black tracking-widest border-none shadow-none",
                                                project.status === 'done' ? 'bg-green-500/10 text-green-600' : project.status === 'in_progress' ? 'bg-orange-500/10 text-orange-600' : 'bg-slate-500/10 text-slate-600'
                                            )}>
                                                {project.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-secondary/50 hover:bg-primary/20"
                                                onClick={(e) => handleOpenEditModal(e, project)}
                                            >
                                                <Pencil size={14} className="text-zinc-600 dark:text-foreground/40 group-hover:text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full bg-secondary/50 hover:bg-red-500/20"
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                            >
                                                <Trash2 size={14} className="text-zinc-600 dark:text-foreground/40 hover:text-red-500 transition-colors" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-foreground/50/80 font-medium line-clamp-2 leading-relaxed h-10">
                                            {project.description || 'No description provided.'}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                            <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-foreground/50">
                                                <Calendar size={12} className="text-primary" />
                                                <span>{project.due_date ? new Date(project.due_date).toLocaleDateString() : 'NO DEADLINE'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-foreground/50">
                                                <Flag size={12} className={cn(
                                                    project.priority === 3 ? 'text-red-500 animate-pulse' : project.priority === 2 ? 'text-orange-500' : 'text-slate-400'
                                                )} />
                                                <span>{project.priority === 3 ? 'URGENT' : project.priority === 2 ? 'STABLE' : 'FLOW'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between group/go text-primary font-black italic text-xs pt-2">
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">EXPLORE PROJECT</span>
                                            <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredProjects.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full flex flex-col items-center justify-center py-20 text-center border-4 border-dashed rounded-[3rem] border-border/50 bg-secondary/10 backdrop-blur-sm"
                    >
                        <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mb-6 shadow-inner ring-1 ring-border">
                            <Sparkles size={40} className="text-primary animate-float" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter text-foreground mb-2">No projects matching your aura</h3>
                        <p className="text-foreground/50 font-medium mb-8 max-w-xs">Start a new stream or adjust your filter to find existing projects.</p>
                        <Button
                            onClick={handleOpenCreateModal}
                            className="rounded-2xl px-8 h-12 bg-primary font-black italic shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            CREATE FIRST PROJECT
                        </Button>
                    </motion.div>
                )}
            </div>

            <ProjectModal
                project={selectedProject}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
            />
        </motion.div>
    );
}
