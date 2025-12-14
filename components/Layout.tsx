import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Ensure dark mode class is applied to html element
    useEffect(() => {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            import React, { useEffect } from 'react';
            import { useLocation, useNavigate } from 'react-router-dom';

            interface LayoutProps {
                children: React.ReactNode;
                theme: 'light' | 'dark';
                toggleTheme: () => void;
            }

            const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme }) => {
                const navigate = useNavigate();
                const location = useLocation();

                // Ensure dark mode class is applied to html element
                useEffect(() => {
                    const html = document.documentElement;
                    if (theme === 'dark') {
                        html.classList.add('dark');
                    } else {
                        html.classList.remove('dark');
                    }
                }, [theme]);

                const isActive = (path: string) => location.pathname === path;

                const navItems = [
                    { path: '/', label: 'Setup', icon: 'settings_account_box' },
                    { path: '/income', label: 'Income', icon: 'attach_money' },
                    { path: '/deductions', label: 'Deductions', icon: 'receipt_long' },
                    { path: '/summary', label: 'Summary', icon: 'assessment' },
                    { path: '/documents', label: 'Documents', icon: 'folder_open' },
                ];

                return (
                    <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark text-text-main dark:text-white transition-colors duration-200">
                        {/* Top Header */}
                        <header className="sticky top-0 z-50 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark shadow-sm">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                                    <div className="bg-gradient-to-br from-primary to-primary-dark p-2 rounded-lg shadow-lg shadow-primary/20">
                                        <span className="material-symbols-outlined text-white text-xl">bar_chart</span>
                                    </div>
                                    <span className="font-bold text-xl tracking-tight">TaxTracker <span className="text-primary">Pro</span></span>
                                </div>

                                {/* Desktop Nav */}
                                <nav className="hidden md:flex items-center gap-1">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                                                : 'text-text-muted hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </nav>

                                <div className="flex items-center gap-4">
                                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-background-light dark:hover:bg-neutral-800 transition-colors text-text-muted hover:text-primary">
                                        <span className="material-symbols-outlined">
                                            {theme === 'light' ? 'dark_mode' : 'light_mode'}
                                        </span>
                                    </button>
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-secondary/20">
                                        JD
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Nav */}
                            <div className="md:hidden overflow-x-auto border-t border-border-light dark:border-border-dark bg-background-light dark:bg-neutral-900 scrollbar-hide">
                                <div className="flex p-2 gap-2 min-w-max">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive(item.path)
                                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                                                : 'text-text-muted hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </header>

                        {/* Main Content */}
                        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                            {children}
                        </main>
                    </div>
                );
            };

            export default Layout;