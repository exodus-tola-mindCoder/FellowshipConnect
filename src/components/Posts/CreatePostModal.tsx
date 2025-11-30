import React, { useState } from 'react';
import { X, Heart, Star, Megaphone, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import MentionTextarea from './MentionTextarea';

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: () => void;
  defaultType?: 'prayer' | 'testimony' | 'announcement';
}

interface User {
  _id: string;
  name: string;
  profilePhoto: string;
  fellowshipRole: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onPostCreated, defaultType }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: defaultType || 'prayer' as 'prayer' | 'testimony' | 'announcement',
    isAnonymous: false,
    mediaUrl: '',
    testimonyCategory: '' as '' | 'Healing' | 'Provision' | 'Breakthrough' | 'Spiritual Growth' | 'Deliverance' | 'Other'
  });
  const [mentions, setMentions] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleContentChange = (content: string, newMentions: User[]) => {
    setFormData(prev => ({ ...prev, content }));
    setMentions(newMentions);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({ ...prev, mediaUrl: response.data.url }));
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const postData = {
        ...formData,
        testimonyCategory: formData.type === 'testimony' ? formData.testimonyCategory : undefined,
        mentions: mentions.map(m => m._id)
      };
      
      await axios.post('/api/posts', postData);
      toast.success('Post created successfully!');
      onPostCreated();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    'Healing',
    'Provision',
    'Breakthrough',
    'Spiritual Growth',
    'Deliverance',
    'Other'
  ];

  const postTypes = [
    {
      value: 'prayer',
      label: 'Prayer Request',
      icon: Heart,
      description: 'Share a prayer request with the fellowship',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      value: 'testimony',
      label: 'Testimony',
      icon: Star,
      description: 'Share how God has worked in your life',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    {
      value: 'announcement',
      label: 'Announcement',
      icon: Megaphone,
      description: 'Share news or updates with the community',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Create New Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Post Type Selection */}
          {!defaultType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Post Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {postTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.type === type.value
                          ? `${type.color} border-current`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <Icon className={`w-8 h-8 mb-2 ${
                        formData.type === type.value ? 'text-current' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium text-sm mb-1 ${
                        formData.type === type.value ? 'text-current' : 'text-gray-700'
                      }`}>
                        {type.label}
                      </span>
                      <span className="text-xs text-gray-500 text-center">
                        {type.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Testimony Category */}
          {formData.type === 'testimony' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="testimonyCategory"
                value={formData.testimonyCategory}
                onChange={handleChange}
                required={formData.type === 'testimony'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
              >
                <option value="" disabled>Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a descriptive title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Content with Mentions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content * <span className="text-xs text-gray-500">(Type @ to mention someone)</span>
            </label>
            <MentionTextarea
              value={formData.content}
              onChange={handleContentChange}
              placeholder="Share your heart with the fellowship... Use @ to mention someone!"
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Image (optional)
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
              {formData.mediaUrl && (
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Image uploaded</span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, mediaUrl: '' }))}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {formData.mediaUrl && (
              <div className="mt-3">
                <img
                  src={formData.mediaUrl}
                  alt="Preview"
                  className="max-w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              checked={formData.isAnonymous}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isAnonymous" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              {formData.isAnonymous ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>Post anonymously</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading || !formData.title.trim() || !formData.content.trim()}
              className="px-8 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;