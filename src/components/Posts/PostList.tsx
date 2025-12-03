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
  Trash2,
  Search
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CreatePostModal from './CreatePostModal';
import Card from '../common/Card';
import Button from '../common/Button';

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
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'testimony':
        return 'bg-secondary-100 text-secondary-700 border-secondary-200';
      case 'announcement':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">{pageTitle}</h1>
          <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">{pageDescription}</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
          className="shadow-lg shadow-primary-500/30 w-full sm:w-auto text-sm sm:text-base"
        >
          {isPrayerWall ? 'Share Prayer Request' : 'Create Post'}
        </Button>
      </div>

      {/* Filter */}
      {!isPrayerWall && (
        <Card className="mb-6 sm:mb-8 p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">Filter:</span>
              </div>
              <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilteredType(option.value)}
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${filteredType === option.value
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search, Category, Sort Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
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
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:col-span-2 lg:col-span-1"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="category">Category (A-Z)</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post._id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {!post.isAnonymous && post.author ? (
                        post.author.profilePhoto ? (
                          <img
                            src={post.author?.profilePhoto}
                            alt={post.author?.name ?? 'Unknown Author'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-primary-600 font-bold text-lg">{post.author?.name?.charAt(0)}</span>
                          </div>
                        )
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {post.isAnonymous ? 'Anonymous' : post.author?.name ?? 'Unknown Author'}
                        </h3>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getPostTypeColor(post.type)}`}>
                          {post.type}
                        </span>
                        {post.type === 'testimony' && post.testimonyCategory && (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">
                            {post.testimonyCategory}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {!post.isAnonymous && post.author?.fellowshipRole && (
                          <span className="font-medium text-slate-600">{post.author.fellowshipRole} • </span>
                        )}
                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {canManagePost(post) && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className="mb-4 pl-16">
                  <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">{post?.title}</h2>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{post?.content}</p>

                  {post.mediaUrl && (
                    <div className="mt-4">
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="rounded-xl max-w-full h-auto shadow-sm border border-slate-100"
                      />
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 pl-12 sm:pl-16">
                  <div className="flex items-center space-x-2 sm:space-x-4 sm:space-x-6">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center space-x-1 sm:space-x-2 transition-colors group ${post.likes.includes(state.user!._id)
                        ? 'text-red-500'
                        : 'text-slate-500 hover:text-red-500'
                        }`}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-full group-hover:bg-red-50 transition-colors ${post.likes.includes(state.user!._id) ? 'bg-red-50' : ''}`}>
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${post.likes.includes(state.user!._id) ? 'fill-current' : ''}`} />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{post.likes.length}</span>
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
                        className={`flex items-center space-x-1 sm:space-x-2 transition-colors group ${post.amenReactions?.includes(state.user!._id)
                          ? 'text-green-600'
                          : 'text-slate-500 hover:text-green-600'
                          }`}
                      >
                        <div className={`px-2 sm:px-3 py-1 rounded-full border group-hover:bg-green-50 transition-colors ${post.amenReactions?.includes(state.user!._id) ? 'bg-green-50 border-green-200' : 'border-slate-200'}`}>
                          <span className="text-xs sm:text-sm font-medium">Amen</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{post.amenReactions?.length || 0}</span>
                      </button>
                    )}

                    {(post.type === 'prayer' || isPrayerWall) && (
                      <button
                        onClick={() => handlePray(post._id)}
                        className={`flex items-center space-x-1 sm:space-x-2 transition-colors group ${post.prayedFor.includes(state.user!._id)
                          ? 'text-purple-600'
                          : 'text-slate-500 hover:text-purple-600'
                          }`}
                      >
                        <div className={`p-1.5 sm:p-2 rounded-full group-hover:bg-purple-50 transition-colors ${post.prayedFor.includes(state.user!._id) ? 'bg-purple-50' : ''}`}>
                          <span className="text-base sm:text-lg leading-none">🙏</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{post.prayedFor.length} prayed</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => toggleComments(post._id)}
                    className={`flex items-center space-x-1 sm:space-x-2 transition-colors group ${showComments[post._id] ? 'text-primary-600' : 'text-slate-500 hover:text-primary-600'}`}
                  >
                    <div className={`p-1.5 sm:p-2 rounded-full group-hover:bg-primary-50 transition-colors ${showComments[post._id] ? 'bg-primary-50' : ''}`}>
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">{post.comments.length}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments[post._id] && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                  {/* Add Comment */}
                  <div className="flex space-x-3 mb-6">
                    <div className="flex-shrink-0">
                      {state.user?.profilePhoto ? (
                        <img
                          src={state.user.profilePhoto}
                          alt={state.user.name}
                          className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center border border-white shadow-sm">
                          <span className="text-primary-700 font-bold text-xs">{state.user?.name?.charAt(0)}</span>
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
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleComment(post._id)}
                        disabled={!commentInputs[post._id]?.trim()}
                        className="!px-3"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
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
                              className="w-8 h-8 rounded-full object-cover border border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center border border-white shadow-sm">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-slate-900">{comment.user?.name || 'Unknown User'}</span>
                              <span className="text-xs text-slate-400">
                                {comment.createdAt ? format(new Date(comment.createdAt), 'MMM d, h:mm a') : 'Unknown Date'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{comment.content || 'No content available'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {isPrayerWall ? 'No prayer requests yet' : 'No posts yet'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {isPrayerWall
                  ? 'Be the first to share a prayer request with the community!'
                  : 'Be the first to share a testimony, announcement, or thought with the fellowship!'
                }
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                {isPrayerWall ? 'Share Prayer Request' : 'Create First Post'}
              </Button>
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