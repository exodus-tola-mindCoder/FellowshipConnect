import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    X
} from 'lucide-react';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
    const { state, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose();
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                    <span className="font-heading font-bold text-lg text-slate-900">Menu</span>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <Link
                        to="/profile"
                        onClick={onClose}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-white hover:text-primary-600 transition-colors mb-2"
                    >
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;
