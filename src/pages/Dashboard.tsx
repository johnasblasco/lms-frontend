import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BookOpen, ArrowLeftRight, LogOut, Menu, X } from 'lucide-react';
import DashboardHome from './DashboardHome';
import Books from './Books';
import Transactions from './Transactions';
import api from '@/utils/axios';

type NavItem = 'dashboard' | 'books' | 'transactions';

export default function Dashboard() {
    const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
    }, []);

    const handleLogout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    const navItems = [
        { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'books' as NavItem, label: 'Books', icon: BookOpen },
        { id: 'transactions' as NavItem, label: 'Transactions', icon: ArrowLeftRight },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Hamburger */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2"
                >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-56 md:w-62 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm md:text-base">Library System</span>
                    </div>
                    {user && (
                        <div className="mt-2 text-xs md:text-sm text-gray-600">
                            Welcome, {user.username}
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-2 md:p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base ${activeNav === item.id
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-2 md:p-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        className="w-full justify-start text-sm md:text-base"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-25 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-auto md:ml-60">
                {activeNav === 'dashboard' && <DashboardHome />}
                {activeNav === 'books' && <Books />}
                {activeNav === 'transactions' && <Transactions />}
            </main>
        </div>
    );
}
