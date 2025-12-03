import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Plus,
  Filter,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import CreateEventModal from './CreateEventModal';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: {
    _id: string;
    name: string;
    profilePhoto: string;
  };
  attendees: Array<{
    user: {
      _id: string;
      name: string;
      profilePhoto: string;
    };
    rsvpDate: string;
  }>;
  maxAttendees: number | null;
  eventType: string;
  imageUrl: string;
}

const EventList: React.FC = () => {
  const { state } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredType, setFilteredType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = async (eventId: string) => {
    try {
      const event = events.find(e => e._id === eventId);
      const hasRSVPed = event?.attendees.some(a => a.user._id === state.user!._id);

      if (hasRSVPed) {
        await axios.delete(`/api/events/${eventId}/rsvp`);
        toast.success('RSVP cancelled');
      } else {
        await axios.post(`/api/events/${eventId}/rsvp`);
        toast.success('RSVP confirmed!');
      }

      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update RSVP');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await axios.delete(`/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'bible-study':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'worship':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'outreach':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fellowship':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'prayer':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'bible-study', label: 'Bible Study' },
    { value: 'worship', label: 'Worship' },
    { value: 'outreach', label: 'Outreach' },
    { value: 'fellowship', label: 'Fellowship' },
    { value: 'prayer', label: 'Prayer' },
    { value: 'other', label: 'Other' }
  ];

  const filteredEvents = filteredType === 'all'
    ? events
    : events.filter(event => event.eventType === filteredType);

  const canCreateEvent = state.user?.role === 'leader' || state.user?.role === 'admin';
  const canManageEvent = (event: Event) => {
    return state.user?.role === 'admin' || event.organizer._id === state.user?._id;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Fellowship Events</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Stay connected with upcoming fellowship activities</p>
        </div>
        {canCreateEvent && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilteredType(option.value)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${filteredType === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const hasRSVPed = event.attendees.some(a => a.user._id === state.user!._id);
            const isEventFull = event.maxAttendees && event.attendees.length >= event.maxAttendees;
            const eventDate = new Date(event.date);
            const isPastEvent = eventDate < new Date();

            return (
              <div key={event._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Event Image */}
                {event.imageUrl && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4 sm:p-6">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${getEventTypeColor(event.eventType)}`}>
                          {event.eventType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        {isPastEvent && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            Past Event
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                    </div>

                    {canManageEvent(event) && (
                      <div className="flex space-x-2 ml-2 sm:ml-4 flex-shrink-0">
                        <button
                          onClick={() => handleDeleteEvent(event._id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">
                        {format(eventDate, 'EEE, MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{event.time}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">
                        {event.attendees.length} attending
                        {event.maxAttendees && ` (${event.maxAttendees} max)`}
                      </span>
                    </div>
                  </div>

                  {/* Event Description */}
                  <p className="text-gray-700 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2 sm:line-clamp-3">
                    {event.description}
                  </p>

                  {/* Organizer */}
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-100">
                    {event.organizer.profilePhoto ? (
                      <img
                        src={event.organizer.profilePhoto}
                        alt={event.organizer.name}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900">Organized by</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{event.organizer.name}</p>
                    </div>
                  </div>

                  {/* RSVP Button */}
                  {!isPastEvent && (
                    <button
                      onClick={() => handleRSVP(event._id)}
                      disabled={!hasRSVPed && isEventFull}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${hasRSVPed
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : isEventFull
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600 transform hover:scale-105'
                        }`}
                    >
                      {hasRSVPed
                        ? '✓ You\'re attending'
                        : isEventFull
                          ? 'Event Full'
                          : 'RSVP to Attend'
                      }
                    </button>
                  )}

                  {/* Attendees Preview */}
                  {event.attendees.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 mb-2">Attending:</p>
                      <div className="flex -space-x-2">
                        {event.attendees.slice(0, 5).map((attendee) => (
                          <div key={attendee.user._id} className="relative">
                            {attendee.user.profilePhoto ? (
                              <img
                                src={attendee.user.profilePhoto}
                                alt={attendee.user.name}
                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                title={attendee.user.name}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 bg-blue-100 rounded-full border-2 border-white flex items-center justify-center"
                                title={attendee.user.name}
                              >
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
                          </div>
                        ))}
                        {event.attendees.length > 5 && (
                          <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{event.attendees.length - 5}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredEvents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 mb-6">
            {filteredType === 'all'
              ? 'No events have been scheduled yet.'
              : `No ${filteredType.replace('-', ' ')} events found.`
            }
          </p>
          {canCreateEvent && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create First Event
            </button>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onEventCreated={() => {
            setShowCreateModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
};

export default EventList;