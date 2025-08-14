import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Heart, 
  Calendar, 
  Clock, 
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import toast from 'react-hot-toast';

interface PrayerEntry {
  _id: string;
  user: string;
  type: 'personal' | 'intercession' | 'thanksgiving' | 'request';
  title: string;
  description: string;
  duration: number; // in minutes
  isAnswered: boolean;
  answeredDate?: string;
  answeredDescription?: string;
  tags: string[];
  createdAt: string;
}

interface PrayerStats {
  totalPrayers: number;
  totalDuration: number;
  answeredPrayers: number;
  weeklyGoal: number;
  currentStreak: number;
  longestStreak: number;
  thisWeekPrayers: number;
}

const PrayerTracker: React.FC = () => {
  const { state } = useAuth();
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [stats, setStats] = useState<PrayerStats>({
    totalPrayers: 0,
    totalDuration: 0,
    answeredPrayers: 0,
    weeklyGoal: 7,
    currentStreak: 0,
    longestStreak: 0,
    thisWeekPrayers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<PrayerEntry | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    fetchPrayerData();
  }, [selectedWeek]);

  const fetchPrayerData = async () => {
    try {
      setIsLoading(true);
      const weekStart = startOfWeek(selectedWeek);
      const weekEnd = endOfWeek(selectedWeek);
      
      const [prayersResponse, statsResponse] = await Promise.all([
        axios.get(`/api/prayers?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`),
        axios.get('/api/prayers/stats')
      ]);
      
      setPrayers(prayersResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch prayer data');
    } finally {
      setIsLoading(false);
    }
  };

  const addPrayerEntry = async (prayerData: Partial<PrayerEntry>) => {
    try {
      const response = await axios.post('/api/prayers', prayerData);
      setPrayers([response.data, ...prayers]);
      toast.success('Prayer entry added!');
      fetchPrayerData(); // Refresh stats
    } catch (error) {
      toast.error('Failed to add prayer entry');
    }
  };

  const updatePrayerEntry = async (prayerId: string, updates: Partial<PrayerEntry>) => {
    try {
      const response = await axios.put(`/api/prayers/${prayerId}`, updates);
      setPrayers(prayers.map(p => p._id === prayerId ? response.data : p));
      toast.success('Prayer entry updated!');
      fetchPrayerData(); // Refresh stats
    } catch (error) {
      toast.error('Failed to update prayer entry');
    }
  };

  const deletePrayerEntry = async (prayerId: string) => {
    if (!window.confirm('Are you sure you want to delete this prayer entry?')) return;
    
    try {
      await axios.delete(`/api/prayers/${prayerId}`);
      setPrayers(prayers.filter(p => p._id !== prayerId));
      toast.success('Prayer entry deleted');
      fetchPrayerData(); // Refresh stats
    } catch (error) {
      toast.error('Failed to delete prayer entry');
    }
  };

  const markAsAnswered = async (prayerId: string, answeredDescription: string) => {
    try {
      await updatePrayerEntry(prayerId, {
        isAnswered: true,
        answeredDate: new Date().toISOString(),
        answeredDescription
      });
    } catch (error) {
      toast.error('Failed to mark prayer as answered');
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedWeek);
    const end = endOfWeek(selectedWeek);
    return eachDayOfInterval({ start, end });
  };

  const getPrayersForDay = (date: Date) => {
    return prayers.filter(prayer => {
      const prayerDate = new Date(prayer.createdAt);
      return prayerDate.toDateString() === date.toDateString();
    });
  };

  const getPrayerTypeColor = (type: string) => {
    switch (type) {
      case 'personal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'intercession':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'thanksgiving':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'request':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const weekProgress = (stats.thisWeekPrayers / stats.weeklyGoal) * 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prayer Tracker</h1>
          <p className="text-gray-600 mt-2">Track your prayer life and see God's faithfulness</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Add Prayer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Prayers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPrayers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Answered Prayers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.answeredPrayers}</p>
              <p className="text-xs text-gray-500">
                {stats.totalPrayers > 0 ? Math.round((stats.answeredPrayers / stats.totalPrayers) * 100) : 0}% answered
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.currentStreak}</p>
              <p className="text-xs text-gray-500">days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.totalDuration / 60)}</p>
              <p className="text-xs text-gray-500">hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Goal Progress</h3>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600">{stats.thisWeekPrayers} / {stats.weeklyGoal}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(weekProgress, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">
          {weekProgress >= 100 ? '🎉 Goal achieved!' : `${Math.round(weekProgress)}% complete`}
        </p>
      </div>

      {/* Weekly Calendar View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Previous
            </button>
            <span className="text-sm font-medium text-gray-700">
              {format(startOfWeek(selectedWeek), 'MMM d')} - {format(endOfWeek(selectedWeek), 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
              className="text-gray-500 hover:text-gray-700"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {getWeekDays().map((day) => {
            const dayPrayers = getPrayersForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={day.toISOString()}
                className={`p-4 border rounded-lg ${
                  isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="text-center mb-3">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {dayPrayers.map((prayer) => (
                    <div
                      key={prayer._id}
                      className={`p-2 rounded text-xs ${getPrayerTypeColor(prayer.type)}`}
                    >
                      <p className="font-medium truncate">{prayer.title}</p>
                      <p className="text-xs opacity-75">{prayer.duration}min</p>
                      {prayer.isAnswered && (
                        <div className="flex items-center mt-1">
                          <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                          <span className="text-green-600">Answered</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {dayPrayers.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No prayers</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Prayers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Prayers</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : prayers.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No prayers recorded yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Add your first prayer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {prayers.slice(0, 10).map((prayer) => (
              <div
                key={prayer._id}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPrayerTypeColor(prayer.type)}`}>
                      {prayer.type.charAt(0).toUpperCase() + prayer.type.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(prayer.createdAt), 'MMM d, h:mm a')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {prayer.duration} min
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-1">{prayer.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{prayer.description}</p>
                  
                  {prayer.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {prayer.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {prayer.isAnswered && (
                    <div className="flex items-center space-x-2 mt-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Prayer Answered!</p>
                        <p className="text-xs text-green-600">
                          {format(new Date(prayer.answeredDate!), 'MMM d, yyyy')}
                        </p>
                        {prayer.answeredDescription && (
                          <p className="text-sm text-green-700 mt-1">{prayer.answeredDescription}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!prayer.isAnswered && (
                    <button
                      onClick={() => {
                        const description = prompt('How was this prayer answered?');
                        if (description) {
                          markAsAnswered(prayer._id, description);
                        }
                      }}
                      className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                      title="Mark as answered"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingPrayer(prayer)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Edit prayer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePrayerEntry(prayer._id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Delete prayer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Prayer Modal would go here */}
      {/* Implementation details omitted for brevity */}
    </div>
  );
};

export default PrayerTracker;