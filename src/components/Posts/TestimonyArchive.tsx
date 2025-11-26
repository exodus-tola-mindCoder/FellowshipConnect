import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, Filter, Calendar, BookOpen } from 'lucide-react';

interface ArchivePost {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  mediaUrl?: string;
  testimonyCategory?: string;
  isAnonymous: boolean;
  author?: { name: string };
}

const TestimonyArchive: React.FC = () => {
  const [items, setItems] = useState<ArchivePost[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'category'>('newest');
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'testimony' });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    params.set('sort', sort);
    const res = await axios.get(`/api/posts?${params.toString()}`);
    setItems(res.data.posts);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [q, category, sort]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><BookOpen className="w-7 h-7 text-yellow-600"/> Testimony Archive</h1>
        <p className="text-gray-600">Browse Gods faithfulness across our community stories.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="flex items-center gap-2 col-span-1 md:col-span-1">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search testimonies..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
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
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-600">No testimonies found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((p) => (
            <article key={p._id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">{p.testimonyCategory || 'Testimony'}</span>
                <span className="text-xs text-gray-500">{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{p.title}</h3>
              <p className="text-sm text-gray-700 line-clamp-3">{p.content}</p>
              {p.mediaUrl && (
                <img src={p.mediaUrl} alt="Testimony" className="mt-3 rounded-lg max-h-48 w-full object-cover" />
              )}
              <div className="mt-3 text-xs text-gray-500">By {p.isAnonymous ? 'Anonymous' : (p.author?.name || 'Member')}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestimonyArchive;
