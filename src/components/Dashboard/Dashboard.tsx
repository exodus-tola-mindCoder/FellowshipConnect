import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Calendar,
  Heart,
  Users,
  TrendingUp,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

interface DailyVerse {
  reference: string;
  text: string;
  translation_name: string;
}

interface RecentPost {
  _id: string;
  title: string;
  type: string;
  author: {
    name: string;
    profilePhoto: string;
  };
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

interface Comment {
  _id: string;
  content: string;
  author: {
    name: string;
    profilePhoto: string;
  };
  createdAt: string;
}

interface UpcomingEvent {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: any[];
}

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoadingVerse, setIsLoadingVerse] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [verseResponse, postsResponse, eventsResponse] = await Promise.all([
        axios.get('/api/scripture/daily'),
        axios.get('/api/posts?limit=5'),
        axios.get('/api/events')
      ]);

      setDailyVerse(verseResponse.data || null);
      setRecentPosts(postsResponse.data?.posts || []);
      
      // Ensure upcomingEvents is always an array
      const eventsData = eventsResponse.data;
      const eventsArray = Array.isArray(eventsData) 
        ? eventsData 
        : (eventsData as { events?: UpcomingEvent[] })?.events || [];
      setUpcomingEvents(eventsArray.slice(0, 3) || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty arrays on error to prevent undefined map errors
      setDailyVerse(null);
      setRecentPosts([]);
      setUpcomingEvents([]);
    }
  };

  const fetchNewVerse = async () => {
    setIsLoadingVerse(true);
    try {
      const response = await axios.get('/api/scripture/random');
      setDailyVerse(response.data);
    } catch (error) {
      console.error('Failed to fetch new verse:', error);
    } finally {
      setIsLoadingVerse(false);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'prayer':
        return 'bg-purple-100 text-purple-800';
      case 'testimony':
        return 'bg-yellow-100 text-yellow-800';
      case 'announcement':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {state.user?.name}!
        </h1>
        <p className="text-gray-600">Welcome back to Fellowship Connect</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Daily Scripture */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Daily Scripture</h2>
                <p className="text-blue-100">Let God's word guide your day</p>
              </div>
              <button
                onClick={fetchNewVerse}
                disabled={isLoadingVerse}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingVerse ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {dailyVerse ? (
              <div>
                <blockquote className="text-lg font-medium mb-4 leading-relaxed">
                  "{dailyVerse.text}"
                </blockquote>
                <cite className="text-blue-100 font-semibold">
                  {dailyVerse.reference} ({dailyVerse.translation_name})
                </cite>
              </div>
            ) : (
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </div>
            )}
          </div>

          {/* Recent Posts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
              <a
                href="/posts"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                View all
              </a>
            </div>

            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post._id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    {post.author.profilePhoto ? (
                      <img
                        src={post.author.profilePhoto}
                        alt={post.author.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPostTypeColor(post.type)}`}>
                        {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(post.createdAt), 'MMM d')}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 truncate">{post.title}</h3>
                    <p className="text-sm text-gray-600">by {post.author.name}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {post.likes.length}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {post.comments.length}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fellowship Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Prayer Requests</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {recentPosts.filter(p => p.type === 'prayer').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Testimonies</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {recentPosts.filter(p => p.type === 'testimony').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Upcoming Events</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{upcomingEvents.length}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              <a
                href="/events"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                View all
              </a>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{event.title}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {format(new Date(event.date), 'MMM d, yyyy')} at {event.time}
                    </div>
                    <p className="text-xs">{event.location}</p>
                    <p className="text-xs text-blue-600">{event.attendees.length} attending</p>
                  </div>
                </div>
              ))}

              {upcomingEvents.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming events scheduled
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/posts?create=true"
                className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
                <span className="text-xs font-medium text-blue-700">Create Post</span>
              </a>
              <a
                href="/prayer-wall"
                className="flex flex-col items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Heart className="w-6 h-6 text-purple-600 mb-2" />
                <span className="text-xs font-medium text-purple-700">Prayer Wall</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;