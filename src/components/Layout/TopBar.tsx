import React from 'react';
import { Heart, Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from '../common/ThemeToggle';

interface TopBarProps {
    unreadCount: number;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ unreadCount, showNotifications, setShowNotifications }) => {
    return (
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-700 z-40 h-16 px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center shadow-md">
                    <Heart className="w-5 h-5 text-white fill-current" />
                </div>
                <span className="text-lg font-heading font-bold text-slate-900 dark:text-white">Fellowship</span>
            </div>

            <div className="flex items-center space-x-2">
                <ThemeToggle />
                <div className="relative">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:text-primary-600 transition-colors relative"
                >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                />
            </div>
            </div>
        </div>
    );
};

export default TopBar;
