import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Heart,
    Calendar,
    BookOpen,
    User,
    Menu
} from 'lucide-react';

interface MobileNavProps {
    onMenuClick: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ onMenuClick }) => {
    const { state } = useAuth();
    const location = useLocation();

    // Simplified items for mobile bottom bar
    const mainItems = [
        { path: '/dashboard', icon: BookOpen, label: 'Home' },
        { path: '/posts', icon: Heart, label: 'Connect' },
        { path: '/events', icon: Calendar, label: 'Events' },
        { path: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
            <div className="flex justify-around items-center h-16 px-2">
                {mainItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600"
                >
                    <Menu className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>
        </div>
    );
};

export default MobileNav;
