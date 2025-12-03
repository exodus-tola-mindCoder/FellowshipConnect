import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen,
  Calendar,
  Heart,
  Users,
  TrendingUp,
  MessageCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import Card from '../common/Card';
import Button from '../common/Button';

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

      const eventsData = eventsResponse.data;
      const eventsArray = Array.isArray(eventsData)
        ? eventsData
        : (eventsData as { events?: UpcomingEvent[] })?.events || [];
      setUpcomingEvents(eventsArray.slice(0, 3) || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
        return 'bg-purple-100 text-purple-700';
      case 'testimony':
        return 'bg-secondary-100 text-secondary-700';
      case 'announcement':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in-up">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900">
            {getGreeting()}, <span className="text-primary-600">{state.user?.name}</span>!
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Here's what's happening in your fellowship today.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.href = '/posts?create=true'}
            leftIcon={<BookOpen className="w-4 h-4" />}
            className="w-full sm:w-auto text-sm"
          >
            Create Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Daily Scripture */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-xl shadow-primary-500/20">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

            <div className="relative p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <BookOpen className="w-5 h-5 text-secondary-300" />
                  </div>
                  <h2 className="text-lg font-semibold text-white/90">Daily Scripture</h2>
                </div>
                <button
                  onClick={fetchNewVerse}
                  disabled={isLoadingVerse}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 backdrop-blur-sm"
                  title="New Verse"
                >
                  <RefreshCw className={`w-5 h-5 ${isLoadingVerse ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {dailyVerse ? (
                <div className="space-y-4">
                  <blockquote className="text-xl md:text-2xl font-medium leading-relaxed font-heading">
                    "{dailyVerse.text}"
                  </blockquote>
                  <div className="flex items-center space-x-2 text-primary-100">
                    <div className="h-px w-8 bg-primary-400/50"></div>
                    <cite className="font-medium not-italic">
                      {dailyVerse.reference} <span className="text-primary-300 text-sm">({dailyVerse.translation_name})</span>
                    </cite>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-2/3"></div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900">Recent Activity</h2>
              <a href="/posts" className="text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center group">
                View all <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Card key={post._id} hover className="p-5 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {post.author?.profilePhoto ? (
                        <img
                          src={post.author.profilePhoto}
                          alt={post.author.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="text-primary-600 font-bold text-lg">{post.author?.name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getPostTypeColor(post.type)}`}>
                          {post.type}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(post.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 truncate mb-1">{post.title}</h3>
                      <p className="text-sm text-slate-500 mb-3">by <span className="font-medium text-slate-700">{post.author?.name || 'Unknown'}</span></p>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-slate-400 text-xs">
                          <Heart className="w-3.5 h-3.5 mr-1.5" />
                          {post.likes.length}
                        </div>
                        <div className="flex items-center text-slate-400 text-xs">
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                          {post.comments.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="p-6">
            <h3 className="text-lg font-heading font-bold text-slate-900 mb-5">Community Pulse</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Prayer Requests</span>
                </div>
                <span className="text-lg font-bold text-purple-700">
                  {recentPosts.filter(p => p.type === 'prayer').length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary-100 rounded-lg text-secondary-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Testimonies</span>
                </div>
                <span className="text-lg font-bold text-secondary-700">
                  {recentPosts.filter(p => p.type === 'testimony').length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">Events</span>
                </div>
                <span className="text-lg font-bold text-blue-700">{upcomingEvents.length}</span>
              </div>
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-bold text-slate-900">Upcoming</h3>
              <a href="/events" className="text-xs font-medium text-primary-600 hover:text-primary-700">View all</a>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="group flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex-shrink-0 w-12 text-center bg-primary-50 rounded-lg p-1">
                    <span className="block text-xs font-bold text-primary-600 uppercase">{format(new Date(event.date), 'MMM')}</span>
                    <span className="block text-lg font-bold text-slate-900">{format(new Date(event.date), 'd')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{event.title}</h4>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <Users className="w-3 h-3 mr-1" />
                      {event.attendees.length} attending
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{event.location}</p>
                  </div>
                </div>
              ))}

              {upcomingEvents.length === 0 && (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No upcoming events</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;