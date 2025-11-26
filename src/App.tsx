import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import PostList from './components/Posts/PostList';
import TestimonyArchive from './components/Posts/TestimonyArchive';
import EventList from './components/Events/EventList';
import CelebrationsPage from './components/Celebrations/CelebrationsPage';
import MembersList from './components/Members/MembersList';
import ProfilePage from './components/Profile/ProfilePage';
import AdminDashboard from './components/Admin/AdminDashboard';
import NotificationsPage from './components/Notifications/NotificationsPage';
import MentorshipRequestPage from './components/Mentorship/RequestPage';
import MentorshipLeaderDashboard from './components/Mentorship/LeaderDashboard';
import PrayerTracker from './components/Prayer/PrayerTracker';
import SpiritualTrackerPage from './components/SpiritualTracker/SpiritualTrackerPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Fellowship Connect...</p>
        </div>
      </div>
    );
  }
  
  return state.isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Fellowship Connect...</p>
        </div>
      </div>
    );
  }
  
  return !state.isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="posts" element={<PostList />} />
              <Route path="testimonies" element={<TestimonyArchive />} />
              <Route path="prayer-wall" element={<PostList />} />
              <Route path="celebrations" element={<CelebrationsPage />} />
              <Route path="prayer-tracker" element={<PrayerTracker />} />
              <Route path="events" element={<EventList />} />
              <Route path="members" element={<MembersList />} />
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="spiritual-tracker" element={<SpiritualTrackerPage />} />
              <Route path="mentorship" element={<MentorshipRequestPage />} />
              <Route path="mentorship-admin" element={<MentorshipLeaderDashboard />} />
            </Route>
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                style: {
                  background: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;