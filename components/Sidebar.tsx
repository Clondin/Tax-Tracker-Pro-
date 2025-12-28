import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    DashboardIcon,
    FileTextIcon,
    PieChartIcon,
    GearIcon,
    RocketIcon
} from '@radix-ui/react-icons';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const Sidebar = () => {
    const navItems = [
        { path: '/summary', label: 'Dashboard', icon: DashboardIcon },
        { path: '/income', label: 'Income', icon: RocketIcon },
        { path: '/deductions', label: 'Deductions', icon: PieChartIcon },
        { path: '/documents', label: 'Documents', icon: FileTextIcon },
        { path: '/', label: 'Setup', icon: GearIcon },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-full flex-col px-3 py-4">
                <div className="mb-10 flex h-14 items-center px-4">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                            T
                        </div>
                        <span className="tracking-tight">TaxPro</span>
                    </div>
                </div>

                <div className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                    isActive ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            {item.path === '/income' && (
                                <span className="ml-auto text-xs font-semibold bg-primary-foreground/20 px-1.5 py-0.5 rounded text-current">
                                    NEW
                                </span>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div className="mt-auto border-t pt-4 px-4">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                            JD
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">John Doe</span>
                            <span className="text-xs text-muted-foreground">Premium Plan</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
