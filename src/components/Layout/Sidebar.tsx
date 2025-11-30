import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Heart,
    Calendar,
    BookOpen,
    Users,
    Shield,
    Settings,
    LogOut,
    PartyPopper,
    Bell
} from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

interface SidebarProps {
    unreadCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ unreadCount }) => {
    const { state, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', icon: BookOpen, label: 'Dashboard', roles: ['member', 'leader', 'admin'] },
        { path: '/posts', icon: Heart, label: 'Posts', roles: ['member', 'leader', 'admin'] },
        { path: '/testimonies', icon: BookOpen, label: 'Testimonies', roles: ['member', 'leader', 'admin'] },
        { path: '/celebrations', icon: PartyPopper, label: 'Celebrations', roles: ['member', 'leader', 'admin'] },
        { path: '/spiritual-tracker', icon: BookOpen, label: 'Spiritual Tracker', roles: ['member', 'leader', 'admin'] },
        { path: '/mentorship', icon: Heart, label: 'Mentorship', roles: ['member', 'leader', 'admin'] },
        { path: '/mentorship-admin', icon: Shield, label: 'Mentorship Dashboard', roles: ['leader', 'admin'] },
        { path: '/prayer-wall', icon: Heart, label: 'Prayer Wall', roles: ['member', 'leader', 'admin'] },
        { path: '/events', icon: Calendar, label: 'Events', roles: ['member', 'leader', 'admin'] },
        { path: '/members', icon: Users, label: 'Members', roles: ['leader', 'admin'] },
        { path: '/admin', icon: Shield, label: 'Admin', roles: ['admin'] }
    ];

    const filteredNavItems = navItems.filter(item =>
        state.user && item.roles.includes(state.user.role)
    );

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-700 fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Heart className="w-6 h-6 text-white fill-current" />
                </div>
                <span className="text-xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Fellowship</span>
            </div>
            
            <div className="px-6 pt-2">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-dark-800 p-2 rounded-lg">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
                    <ThemeToggle />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    {state.user?.profilePhoto ? (
                        <img
                            src={state.user.profilePhoto}
                            alt={state.user.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-primary-700 font-bold text-lg">{state.user?.name?.charAt(0)}</span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{state.user?.name}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{state.user?.role}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Link
                        to="/profile"
                        className="flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-white hover:shadow-sm hover:text-primary-600 transition-all"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
