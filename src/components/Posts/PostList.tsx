import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Send,
  Filter,
  Plus,
  User,
  Eye,
  EyeOff,
  Edit,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CreatePostModal from './CreatePostModal';

interface Post {
  _id: string;
  title: string;
  content: string;
  type: 'prayer' | 'testimony' | 'announcement';
  testimonyCategory?: 'Healing' | 'Provision' | 'Breakthrough' | 'Spiritual Growth' | 'Deliverance' | 'Other';
  amenReactions?: string[];
  author: {
    _id: string;
    name: string;
    profilePhoto: string;
    fellowshipRole: string;
  };
  isAnonymous: boolean;
  likes: string[];
  prayedFor: string[];
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      profilePhoto: string;
    };
    content: string;
    createdAt: string;
  }>;
  mediaUrl: string;
  createdAt: string;
}

const PostList: React.FC = () => {
  const { state } = useAuth();
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredType, setFilteredType] = useState('all');
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'category'>('newest');
  const [q, setQ] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});

  // Determine if this is the prayer wall
  const isPrayerWall = location.pathname === '/prayer-wall';

  useEffect(() => {
    fetchPosts();
  }, [filteredType, category, sort, q, isPrayerWall]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const typeParam = isPrayerWall ? 'prayer' : filteredType;
      const params = new URLSearchParams();
      params.set('type', typeParam);
      if (category) params.set('category', category);
      if (sort) params.set('sort', sort);
      if (q) params.set('q', q);
      const response = await axios.get(`/api/posts?${params.toString()}`);
      setPosts(response.data.posts);
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await axios.post(`/api/posts/${postId}/like`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.includes(state.user!._id);
          return {
            ...post,
            likes: isLiked
              ? post.likes.filter(id => id !== state.user!._id)
              : [...post.likes, state.user!._id]
          };
        }
        return post;
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handlePray = async (postId: string) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/pray`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const hasPrayed = post.prayedFor.includes(state.user!._id);
          if (!hasPrayed) {
            return {
              ...post,
              prayedFor: [...post.prayedFor, state.user!._id]
            };
          }
        }
        return post;
      }));
      toast.success('Prayer recorded 🙏');
    } catch (error) {
      toast.error('Failed to record prayer');
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      const response = await axios.post(`/api/posts/${postId}/comment`, { content });
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: response.data.comments
          };
        }
        return post;
      }));
      setCommentInputs({ ...commentInputs, [postId]: '' });
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(post => post?._id !== postId));
      toast.success('Post deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete post');
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments({
      ...showComments,
      [postId]: !showComments[postId]
    });
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'prayer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'testimony':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'announcement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canManagePost = (post: Post) => {
    return state.user?.role === 'admin' || post.author?._id === state.user?._id;
  };

  const filterOptions = isPrayerWall
    ? [{ value: 'prayer', label: 'Prayer Requests' }]
    : [
      { value: 'all', label: 'All Posts' },
      { value: 'prayer', label: 'Prayer Requests' },
      { value: 'testimony', label: 'Testimonies' },
      { value: 'announcement', label: 'Announcements' }
    ];

  const pageTitle = isPrayerWall ? 'Prayer Wall' : 'Fellowship Posts';
  const pageDescription = isPrayerWall
    ? 'Share your prayer requests and pray for others'
    : 'Share your heart with the community';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-2">{pageDescription}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>{isPrayerWall ? 'Share Prayer Request' : 'Create Post'}</span>
        </button>
      </div>

      {/* Filter */}
      {!isPrayerWall && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex space-x-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilteredType(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filteredType === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search, Category, Sort Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search testimonies and posts..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="Healing">Healing</option>
              <option value="Provision">Provision</option>
              <option value="Breakthrough">Breakthrough</option>
              <option value="Spiritual Growth">Spiritual Growth</option>
              <option value="Deliverance">Deliverance</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="category">Category (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {/* Add null checks for `post.author` and `post.author.name` */}
                      {!post.isAnonymous && post.author ? (
                        post.author.profilePhoto ? (
                          <img
                            src={post.author?.profilePhoto}
                            alt={post.author?.name ?? 'Unknown Author'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                        )
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {post.isAnonymous ? 'Anonymous' : post.author?.name ?? 'unknown Author'}
                          {/* console.log('autor name', post.isAnonymous ? 'Anonymous' : post.author.name) */}
                        </h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPostTypeColor(post.type)}`}>
                          {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                        </span>
                        {post.type === 'testimony' && post.testimonyCategory && (
                          <span className="px-3 py-1 text-xs font-medium rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">
                            {post.testimonyCategory}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {!post.isAnonymous && post.author?.fellowshipRole} • {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {canManagePost(post) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">{post?.title}</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post?.content}</p>

                  {post.mediaUrl && (
                    <div className="mt-4">
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="rounded-lg max-w-full h-auto"
                      />
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-2 transition-colors ${post.likes.includes(state.user!._id)
                      ? 'text-red-600'
                      : 'text-gray-500 hover:text-red-600'
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${post.likes.includes(state.user!._id) ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likes.length}</span>
                  </button>

                  {post.type === 'testimony' && (
                    <button
                      onClick={async () => {
                        try {
                          const res = await axios.post(`/api/posts/${post._id}/amen`);
                          setPosts(posts.map(p => p._id === post._id ? {
                            ...p,
                            amenReactions: p.amenReactions?.includes(state.user!._id)
                              ? p.amenReactions!.filter(id => id !== state.user!._id)
                              : [...(p.amenReactions || []), state.user!._id]
                          } : p));
                        } catch {
                          toast.error('Failed to react');
                        }
                      }}
                      className={`flex items-center space-x-2 transition-colors ${post.amenReactions?.includes(state.user!._id)
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-green-600'
                        }`}
                    >
                      <span className="text-sm">Amen</span>
                      <span className="text-sm font-medium">{post.amenReactions?.length || 0}</span>
                    </button>
                  )}

                  {(post.type === 'prayer' || isPrayerWall) && (
                    <button
                      onClick={() => handlePray(post._id)}
                      className={`flex items-center space-x-2 transition-colors ${post.prayedFor.includes(state.user!._id)
                        ? 'text-purple-600'
                        : 'text-gray-500 hover:text-purple-600'
                        }`}
                    >
                      <span className="text-sm">🙏</span>
                      <span className="text-sm font-medium">{post.prayedFor.length} prayed</span>
                    </button>
                  )}

                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments.length}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments[post._id] && (
                <div className="border-t border-gray-100 bg-gray-50 p-6">
                  {/* Add Comment */}
                  <div className="flex space-x-3 mb-6">
                    <div className="flex-shrink-0">
                      {state.user?.profilePhoto ? (
                        <img
                          src={state.user.profilePhoto}
                          alt={state.user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => setCommentInputs({
                          ...commentInputs,
                          [post._id]: e.target.value
                        })}
                        onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        disabled={!commentInputs[post._id]?.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {comment.user && comment.user.profilePhoto ? (
                            <img
                              src={comment.user.profilePhoto}
                              alt={comment.user.name || 'Unknown User'}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">{comment.user?.name || 'Unknown User'}</span>
                              <span className="text-xs text-gray-500">
                                {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, h:mm a') : 'Unknown Date'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content || 'No content available'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isPrayerWall ? 'No prayer requests yet' : 'No posts yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {isPrayerWall
                  ? 'Be the first to share a prayer request!'
                  : 'Be the first to share with the fellowship!'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {isPrayerWall ? 'Share Prayer Request' : 'Create First Post'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            setShowCreateModal(false);
            fetchPosts();
          }}
          defaultType={isPrayerWall ? 'prayer' : undefined}
        />
      )}
    </div>
  );
};

export default PostList;