import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar, Check, X, Clock, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface RequestDoc {
  _id: string;
  topic: string;
  details: string;
  preferredTimes: string[];
  status: 'pending'|'accepted'|'declined'|'scheduled'|'completed';
  isAnonymous: boolean;
  createdAt: string;
  requester?: { _id: string; name: string; profilePhoto?: string };
  assignedLeader?: { _id: string; name: string };
  scheduledAt?: string;
}

const LeaderDashboard: React.FC = () => {
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [scheduleModal, setScheduleModal] = useState<{ id: string | null, datetime: string }>({ id: null, datetime: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/mentorship/manage?status=${status}`);
      setRequests(res.data.requests);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, [status]);

  const accept = async (id: string) => { try { await axios.put(`/api/mentorship/${id}/accept`); toast.success('Accepted'); load(); } catch { toast.error('Failed'); } };
  const decline = async (id: string) => { try { await axios.put(`/api/mentorship/${id}/decline`); toast.success('Declined'); load(); } catch { toast.error('Failed'); } };
  const complete = async (id: string) => { try { await axios.put(`/api/mentorship/${id}/complete`); toast.success('Completed'); load(); } catch { toast.error('Failed'); } };
  const schedule = async () => {
    if (!scheduleModal.id || !scheduleModal.datetime) return;
    try { await axios.put(`/api/mentorship/${scheduleModal.id}/schedule`, { scheduledAt: scheduleModal.datetime }); toast.success('Scheduled'); setScheduleModal({ id: null, datetime: '' }); load(); } catch { toast.error('Failed to schedule'); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Mentorship Dashboard</h1>
        <select value={status} onChange={(e)=> setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="declined">Declined</option>
          <option value="">All</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">{format(new Date(r.createdAt), 'MMM d, yyyy')}</div>
                <div className="text-xs px-2 py-1 rounded-full border border-blue-200 text-blue-700 bg-blue-50 capitalize">{r.status}</div>
              </div>
              <div className="mt-2 font-medium text-gray-900">{r.topic}</div>
              <div className="text-gray-700 mt-1">{r.details}</div>
              {r.preferredTimes.length>0 && <div className="mt-2 text-sm text-gray-600">Preferred: {r.preferredTimes.join(', ')}</div>}
              <div className="mt-3 flex items-center gap-2">
                {r.status === 'pending' && (
                  <>
                    <button onClick={()=>accept(r._id)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-1"><Check className="w-4 h-4"/> Accept</button>
                    <button onClick={()=>decline(r._id)} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-1"><X className="w-4 h-4"/> Decline</button>
                  </>
                )}
                {(r.status === 'accepted' || r.status === 'pending') && (
                  <button onClick={()=> setScheduleModal({ id: r._id, datetime: '' })} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1"><Calendar className="w-4 h-4"/> Schedule</button>
                )}
                {r.status === 'scheduled' && (
                  <div className="text-sm text-gray-700">Scheduled: {r.scheduledAt ? format(new Date(r.scheduledAt), 'PPpp') : 'TBD'}</div>
                )}
                {(r.status === 'accepted' || r.status === 'scheduled') && (
                  <button onClick={()=>complete(r._id)} className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg">Mark Completed</button>
                )}
              </div>
            </div>
          ))}
          {requests.length === 0 && <div className="text-gray-600 text-sm">No requests in this state.</div>}
        </div>
      )}

      {scheduleModal.id && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="font-medium text-gray-900 mb-3">Schedule Session</div>
            <input type="datetime-local" value={scheduleModal.datetime} onChange={(e)=> setScheduleModal({ ...scheduleModal, datetime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=> setScheduleModal({ id: null, datetime: '' })} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={schedule} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderDashboard;
