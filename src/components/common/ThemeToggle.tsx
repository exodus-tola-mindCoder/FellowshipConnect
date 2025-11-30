import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 hover:bg-gray-100 dark:hover:bg-dark-700"
      aria-label="Toggle Dark Mode"
    >
      <div className="relative w-6 h-6 overflow-hidden">
        <div
          className={`absolute inset-0 transform transition-transform duration-500 ${
            theme === 'dark' ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <Moon className="w-6 h-6 text-primary-400" />
        </div>
        <div
          className={`absolute inset-0 transform transition-transform duration-500 ${
            theme === 'light' ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <Sun className="w-6 h-6 text-secondary-500" />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;
