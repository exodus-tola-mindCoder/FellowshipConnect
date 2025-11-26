import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { HeartHandshake, MessageCircle, Calendar, User as UserIcon, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import MentionTextarea from '../Posts/MentionTextarea';

interface RequestDoc {
  _id: string;
  topic: 'Spiritual Growth' | 'Academic Guidance' | 'Career' | 'Relationships' | 'Mental Health' | 'Other';
  details: string;
  preferredTimes: string[];
  status: 'pending'|'accepted'|'declined'|'scheduled'|'completed';
  isAnonymous: boolean;
  createdAt: string;
}

const RequestPage: React.FC = () => {
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    topic: '' as RequestDoc['topic'] | '',
    details: '',
    timesInput: '',
    isAnonymous: false
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/mentorship/me');
      setRequests(res.data.requests);
    } catch { toast.error('Failed to load requests'); } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.details.trim()) {
      toast.error('Please choose a topic and provide a brief detail');
      return;
    }
    try {
      await axios.post('/api/mentorship', {
        topic: form.topic,
        details: form.details,
        preferredTimes: form.timesInput.split(',').map(s=>s.trim()).filter(Boolean),
        isAnonymous: form.isAnonymous
      });
      toast.success('Request submitted');
      setForm({ topic: '', details: '', timesInput: '', isAnonymous: false });
      load();
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed to submit'); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><HeartHandshake className="w-6 h-6 text-emerald-600"/> Mentorship & Counseling</h1>
        <p className="text-gray-600">Your request is private and only visible to leaders assigned to help.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Submit a Request</h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Topic *</label>
            <select value={form.topic} onChange={(e)=> setForm({...form, topic: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option value="" disabled>Select a topic</option>
              {['Spiritual Growth','Academic Guidance','Career','Relationships','Mental Health','Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Brief Details *</label>
            <textarea value={form.details} onChange={(e)=> setForm({...form, details: e.target.value})} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Share as much as you feel comfortable. This is private." />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Preferred Times (comma separated)</label>
            <input value={form.timesInput} onChange={(e)=> setForm({...form, timesInput: e.target.value})} placeholder="e.g., Weekdays evenings, Saturdays afternoon" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <input id="anon" type="checkbox" checked={form.isAnonymous} onChange={(e)=> setForm({...form, isAnonymous: e.target.checked})} />
            <label htmlFor="anon" className="text-sm text-gray-700 flex items-center gap-1"><EyeOff className="w-4 h-4"/> Submit anonymously</label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg">Submit</button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-md font-medium text-gray-900 mb-3">My Requests</h3>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white border border-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(r => (
              <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">{format(new Date(r.createdAt), 'MMM d, yyyy')}</div>
                  <div className="text-xs px-2 py-1 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 capitalize">{r.status}</div>
                </div>
                <div className="mt-2 font-medium text-gray-900">{r.topic}</div>
                <div className="text-gray-700 mt-1">{r.details}</div>
                {r.preferredTimes.length>0 && <div className="mt-2 text-sm text-gray-600">Preferred: {r.preferredTimes.join(', ')}</div>}
              </div>
            ))}
            {requests.length === 0 && <div className="text-gray-600 text-sm">You have no requests yet.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestPage;
