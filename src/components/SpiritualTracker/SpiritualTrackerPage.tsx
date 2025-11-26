import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, BookOpen, HeartHandshake, Notebook } from 'lucide-react';
import toast from 'react-hot-toast';

interface DayLog {
  _id?: string;
  date: string; // ISO
  activities: {
    prayerMinutes: number;
    bibleReadingMinutes: number;
    devotionMinutes: number;
    notes?: string;
  }
}

const Cell: React.FC<{ d: Date; log?: DayLog; selected: boolean; onSelect: ()=>void }>=({ d, log, selected, onSelect })=>{
  const total = (log?.activities?.prayerMinutes||0) + (log?.activities?.bibleReadingMinutes||0) + (log?.activities?.devotionMinutes||0);
  const tone = total === 0 ? 'bg-gray-50 border-gray-200' : total < 20 ? 'bg-green-50 border-green-200' : total < 60 ? 'bg-teal-50 border-teal-200' : 'bg-emerald-50 border-emerald-200';
  return (
    <button onClick={onSelect} className={`h-20 w-full rounded-lg border ${tone} p-2 text-left hover:shadow-sm transition`}> 
      <div className="text-xs text-gray-500">{format(d, 'd')}</div>
      {total > 0 && (
        <div className="mt-1 text-[11px] text-gray-700">
          {log?.activities?.prayerMinutes? <span className="mr-2">🙏 {log?.activities?.prayerMinutes}m</span>: null}
          {log?.activities?.bibleReadingMinutes? <span className="mr-2">📖 {log?.activities?.bibleReadingMinutes}m</span>: null}
          {log?.activities?.devotionMinutes? <span>🕊️ {log?.activities?.devotionMinutes}m</span>: null}
        </div>
      )}
    </button>
  );
};

const SpiritualTrackerPage: React.FC = () => {
  const [current, setCurrent] = useState(new Date());
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [selected, setSelected] = useState<Date | null>(null);
  const [form, setForm] = useState({ prayerMinutes: 0, bibleReadingMinutes: 0, devotionMinutes: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  const days = useMemo(()=> eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) }), [current]);

  const load = async () => {
    try {
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const res = await axios.get(`/api/spiritual-tracker/month?year=${year}&month=${month}`);
      setLogs(res.data.logs.map((l:any)=>({ ...l, date: l.date })));
    } catch { toast.error('Failed to load logs'); }
  };

  useEffect(()=>{ load(); }, [current]);

  useEffect(()=>{
    if (!selected) return;
    const found = logs.find(l => isSameDay(new Date(l.date), selected));
    setForm({
      prayerMinutes: found?.activities?.prayerMinutes || 0,
      bibleReadingMinutes: found?.activities?.bibleReadingMinutes || 0,
      devotionMinutes: found?.activities?.devotionMinutes || 0,
      notes: found?.activities?.notes || ''
    });
  }, [selected, logs]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const iso = new Date(Date.UTC(selected.getFullYear(), selected.getMonth(), selected.getDate())).toISOString();
      await axios.post('/api/spiritual-tracker/day', { date: iso, activities: form });
      toast.success('Saved');
      load();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  // serene minimal theme
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-2"><CalendarIcon className="w-7 h-7 text-emerald-600"/> Personal Spiritual Tracker</h1>
        <p className="text-gray-600">A quiet place to reflect on prayer, Scripture, and devotion.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={()=> setCurrent(new Date(current.getFullYear(), current.getMonth()-1, 1))} className="px-3 py-1 rounded bg-gray-50 border border-gray-200">← Prev</button>
        <div className="text-gray-800 font-medium">{format(current, 'MMMM yyyy')}</div>
        <button onClick={()=> setCurrent(new Date(current.getFullYear(), current.getMonth()+1, 1))} className="px-3 py-1 rounded bg-gray-50 border border-gray-200">Next →</button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="text-xs text-gray-500 text-center py-1">{d}</div>
        ))}
        {days.map(d => {
          const log = logs.find(l => isSameDay(new Date(l.date), d));
          const sel = selected && isSameDay(selected, d);
          return (
            <div key={d.toISOString()} className={`${sel ? 'ring-2 ring-emerald-400 rounded-lg' : ''}`}>
              <Cell d={d} log={log} selected={!!sel} onSelect={()=> setSelected(d)} />
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{selected ? `Reflecting on ${format(selected, 'MMMM d, yyyy')}` : 'Select a day to log your activities'}</h2>
        {selected && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Prayer (minutes)</label>
              <input type="number" min={0} value={form.prayerMinutes} onChange={(e)=> setForm({...form, prayerMinutes: Math.max(0, Number(e.target.value||0))})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bible Reading (minutes)</label>
              <input type="number" min={0} value={form.bibleReadingMinutes} onChange={(e)=> setForm({...form, bibleReadingMinutes: Math.max(0, Number(e.target.value||0))})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Devotion (minutes)</label>
              <input type="number" min={0} value={form.devotionMinutes} onChange={(e)=> setForm({...form, devotionMinutes: Math.max(0, Number(e.target.value||0))})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-1" />
            <div className="md:col-span-3">
              <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
              <textarea value={form.notes} onChange={(e)=> setForm({...form, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Brief reflections or Scripture references..." />
            </div>
            <div className="md:col-span-4 flex justify-end mt-2">
              <button onClick={save} disabled={saving} className="px-5 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">{saving? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-md font-medium text-gray-900 mb-3">Monthly Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">🙏 Prayer: {logs.reduce((s,l)=> s + (l.activities?.prayerMinutes||0), 0)} min</div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">📖 Bible Reading: {logs.reduce((s,l)=> s + (l.activities?.bibleReadingMinutes||0), 0)} min</div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">🕊️ Devotion: {logs.reduce((s,l)=> s + (l.activities?.devotionMinutes||0), 0)} min</div>
        </div>
      </div>
    </div>
  );
};

export default SpiritualTrackerPage;
