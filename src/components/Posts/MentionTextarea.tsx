import React, { useState, useRef, useCallback } from 'react';
import UserMentions from './UserMentions';

interface User {
  _id: string;
  name: string;
  profilePhoto: string;
  fellowshipRole: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string, mentions: User[]) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  placeholder = "Write your message...",
  className = "",
  rows = 4
}) => {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionTrigger, setMentionTrigger] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentions, setMentions] = useState<User[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const trigger = mentionMatch[1];
      setMentionTrigger(trigger);
      setShowMentions(true);
      
      // Calculate position for mentions dropdown
      if (textareaRef.current) {
        const textarea = textareaRef.current;
        const rect = textarea.getBoundingClientRect();
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const lines = textBeforeCursor.split('\n').length;
        
        setMentionPosition({
          top: rect.top + (lines * lineHeight) + 20,
          left: rect.left + 10
        });
      }
    } else {
      setShowMentions(false);
      setMentionTrigger('');
    }
    
    onChange(newValue, mentions);
  }, [onChange, mentions]);

  const handleMention = useCallback((user: User) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Find the @ symbol position
    const mentionStartIndex = textBeforeCursor.lastIndexOf('@');
    
    if (mentionStartIndex !== -1) {
      const beforeMention = value.substring(0, mentionStartIndex);
      const newValue = beforeMention + `@${user.name} ` + textAfterCursor;
      
      // Update mentions list
      const newMentions = [...mentions];
      if (!newMentions.find(m => m._id === user._id)) {
        newMentions.push(user);
      }
      setMentions(newMentions);
      
      onChange(newValue, newMentions);
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newCursorPosition = mentionStartIndex + user.name.length + 2;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
      }, 0);
    }
    
    setShowMentions(false);
    setMentionTrigger('');
  }, [value, mentions, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      e.preventDefault();
      // Let UserMentions component handle these keys
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${className}`}
      />
      
      {/* Mentioned users display */}
      {mentions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {mentions.map((user) => (
            <span
              key={user._id}
              className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
            >
              <span>@{user.name}</span>
              <button
                onClick={() => {
                  const newMentions = mentions.filter(m => m._id !== user._id);
                  setMentions(newMentions);
                  // Remove mention from text
                  const newValue = value.replace(new RegExp(`@${user.name}\\s?`, 'g'), '');
                  onChange(newValue, newMentions);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <UserMentions
        onMention={handleMention}
        trigger={mentionTrigger}
        isVisible={showMentions}
        position={mentionPosition}
      />
    </div>
  );
};

export default MentionTextarea;