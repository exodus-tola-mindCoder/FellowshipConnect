import React, { useState, useEffect, useRef } from 'react';
import { User, Search } from 'lucide-react';
import axios from 'axios';

interface User {
  _id: string;
  name: string;
  profilePhoto: string;
  fellowshipRole: string;
}

interface UserMentionsProps {
  onMention: (user: User) => void;
  trigger: string;
  isVisible: boolean;
  position: { top: number; left: number };
}

const UserMentions: React.FC<UserMentionsProps> = ({ 
  onMention, 
  trigger, 
  isVisible, 
  position 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible) {
      fetchUsers();
    }
  }, [isVisible]);

  useEffect(() => {
    if (trigger) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(trigger.toLowerCase())
      );
      setFilteredUsers(filtered);
      setSelectedIndex(0);
    } else {
      setFilteredUsers(users);
      setSelectedIndex(0);
    }
  }, [trigger, users]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || filteredUsers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onMention(filteredUsers[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // Close mentions dropdown
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, filteredUsers, selectedIndex, onMention]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users for mentions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-64"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {isLoading ? (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <Search className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm">No users found</p>
        </div>
      ) : (
        <div className="py-2">
          {filteredUsers.map((user, index) => (
            <button
              key={user._id}
              onClick={() => onMention(user)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-100 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.fellowshipRole}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserMentions;