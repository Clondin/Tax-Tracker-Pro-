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
        <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark text-primary dark:text-white transition-colors duration-200">
            {/* Top Header */}
            <header className="sticky top-0 z-50 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="size-8 bg-primary dark:bg-white text-white dark:text-primary rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                            </div>
                            <h1 className="text-lg font-bold tracking-tight hidden sm:block">TaxTracker Pro</h1>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(item.path)
                                            ? 'bg-primary text-white dark:bg-white dark:text-primary'
                                            : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                            <div className="flex items-center gap-2 cursor-pointer">
                                <div 
                                    className="size-9 rounded-full bg-cover bg-center border border-border-light dark:border-border-dark"
                                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCrFlkh7EUauKzBvVMZyK1diXm2-i56jjDVklLkZ43n7P1IH8j-g8fQZY7qnOJ53h4YwGJEw2nKN0yEJnbNWh2HiAp2wLwfTG3v34FJDaMORB-okFV6HUCB7j1ZT926pSOrnHCNyfglwIC0WLdTadTOi3qvNhUJymzpnxjHeDqdvMHUSupuFpVeWWv-vlW4dc8uDK707cpbIZJQd1yWRazGgdtsE14Qsp6TCJhVrmp5CWo30Sk6t5nU4FiyaaZhKXdpc8TB2NnMbk7Y")' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Nav (Simple horizontal scroll) */}
                <div className="md:hidden overflow-x-auto border-t border-border-light dark:border-border-dark bg-background-light dark:bg-neutral-900 scrollbar-hide">
                    <div className="flex p-2 gap-2 min-w-max">
                         {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                        isActive(item.path)
                                            ? 'bg-primary text-white dark:bg-white dark:text-primary'
                                            : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
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