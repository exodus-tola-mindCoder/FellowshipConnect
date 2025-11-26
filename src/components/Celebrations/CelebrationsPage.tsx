import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Sparkles, PartyPopper, Diamond, Heart, MessageCircle, Filter, Plus, Image as ImageIcon, Gift, GraduationCap, Briefcase, Trophy, LucideRockingChair } from 'lucide-react';
// import { Ring } from 'lucide-react';

// import { Ring } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import MentionTextarea from '../Posts/MentionTextarea';

interface User { _id: string; name: string; profilePhoto?: string; }

interface CelebrationPost {
  _id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  createdAt: string;
  isAnonymous: boolean;
  celebrationCategory?: 'Birthday' | 'Graduation' | 'New Job' | 'Achievement' | 'Engagement' | 'Other';
  author?: { _id: string; name: string; profilePhoto?: string };
  comments: Array<{ _id: string; user: { _id: string; name: string; profilePhoto?: string }, content: string, createdAt: string }>;
  blessingReactions?: string[];
  congratsReactions?: string[];
  heartReactions?: string[];
}

const categoryIconMap: Record<string, React.FC<any>> = {
  Birthday: Gift,
  Graduation: GraduationCap,
  'New Job': Briefcase,
  Achievement: Trophy,
  Engagement: Diamond,
  Other: PartyPopper,
};

const categories = ['Birthday','Graduation','New Job','Achievement','Engagement','Other'] as const;

const CelebrationsPage: React.FC = () => {
  const { state } = useAuth();
  const [items, setItems] = useState<CelebrationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<'newest'|'oldest'|'category'>('newest');
  const [month, setMonth] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string,string>>({});
  const [mentions, setMentions] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    celebrationCategory: '' as '' | CelebrationPost['celebrationCategory'],
    isAnonymous: false,
    mediaUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'celebration' });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    try {
      const res = await axios.get(`/api/posts?${params.toString()}`);
      setItems(res.data.posts);
    } catch {
      toast.error('Failed to load celebrations');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [q, category, sort]);

  const filteredByMonth = useMemo(() => {
    if (!month) return items;
    const m = parseInt(month, 10); // 1-12
    return items.filter(p => new Date(p.createdAt).getMonth() + 1 === m);
  }, [items, month]);

  const handleReact = async (postId: string, kind: 'bless'|'congrats'|'heart') => {
    try {
      await axios.post(`/api/posts/${postId}/${kind}`);
      setItems(items.map(p => {
        if (p._id !== postId) return p;
        const uid = state.user!._id;
        const toggle = (arr?: string[]) => (arr?.includes(uid) ? arr!.filter(i => i !== uid) : [...(arr || []), uid]);
        if (kind === 'bless') return { ...p, blessingReactions: toggle(p.blessingReactions) };
        if (kind === 'congrats') return { ...p, congratsReactions: toggle(p.congratsReactions) };
        return { ...p, heartReactions: toggle(p.heartReactions) };
      }));
    } catch { toast.error('Failed to react'); }
  };

  const handleComment = async (postId: string) => {
    const content = (commentInputs[postId]||'').trim();
    if (!content) return;
    try {
      const res = await axios.post(`/api/posts/${postId}/comment`, { content });
      setItems(items.map(p => p._id === postId ? { ...p, comments: res.data.comments } : p));
      setCommentInputs({ ...commentInputs, [postId]: '' });
    } catch { toast.error('Failed to add comment'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be < 10MB'); return; }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await axios.post('/api/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, mediaUrl: res.data.url }));
      toast.success('Image uploaded');
    } catch { toast.error('Upload failed'); } finally { setIsUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.celebrationCategory) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post('/api/posts', {
        title: formData.title,
        content: formData.content,
        type: 'celebration',
        celebrationCategory: formData.celebrationCategory,
        isAnonymous: formData.isAnonymous,
        mediaUrl: formData.mediaUrl,
        mentions: mentions.map(m => m._id)
      });
      toast.success('Celebration posted!');
      setShowCreate(false);
      setFormData({ title: '', content: '', celebrationCategory: '', isAnonymous: false, mediaUrl: '' });
      setMentions([]);
      fetchItems();
    } catch (e:any) { toast.error(e.response?.data?.message || 'Failed to post'); } finally { setIsSubmitting(false); }
  };

  const monthOptions = [
    { value: '', label: 'All Months' },
    ...Array.from({ length: 12 }).map((_, i) => ({ value: String(i+1), label: format(new Date(2020, i, 1), 'MMMM') }))
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-pink-500" />
            Celebrations
          </h1>
          <p className="text-gray-600">Share joyful life moments with the community.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white px-5 py-3 rounded-lg shadow hover:from-pink-600 hover:to-orange-600 transition">
          <Plus className="w-5 h-5" /> New Celebration
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          placeholder="Search celebrations..."
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <select value={category} onChange={(e)=>setCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={month} onChange={(e)=>setMonth(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
          {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="category">Category (A-Z)</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_,i)=>(<div key={i} className="h-44 bg-white border border-gray-200 rounded-xl animate-pulse"/>))}
        </div>
      ) : filteredByMonth.length === 0 ? (
        <div className="text-center text-gray-600 py-16">No celebrations found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredByMonth.map((p)=>{
            const Icon = categoryIconMap[p.celebrationCategory || 'Other'] || PartyPopper;
            const you = state.user?._id;
            const blessOn = p.blessingReactions?.includes(you || '');
            const congratsOn = p.congratsReactions?.includes(you || '');
            const heartOn = p.heartReactions?.includes(you || '');
            return (
              <article key={p._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                {p.mediaUrl && <img src={p.mediaUrl} alt="celebration" className="w-full h-48 object-cover" />}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-pink-600" />
                      <span className="text-xs px-2 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200">{p.celebrationCategory || 'Celebration'}</span>
                    </div>
                    <span className="text-xs text-gray-500">{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{p.title}</h3>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{p.content}</p>
                  <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
                    <button onClick={()=>handleReact(p._id,'bless')} className={`text-sm flex items-center gap-1 ${blessOn? 'text-amber-600':'text-gray-500 hover:text-amber-600'}`}>
                      <Sparkles className="w-4 h-4"/> Blessings <span>{p.blessingReactions?.length||0}</span>
                    </button>
                    <button onClick={()=>handleReact(p._id,'congrats')} className={`text-sm flex items-center gap-1 ${congratsOn? 'text-green-600':'text-gray-500 hover:text-green-600'}`}>
                      <PartyPopper className="w-4 h-4"/> Congrats <span>{p.congratsReactions?.length||0}</span>
                    </button>
                    <button onClick={()=>handleReact(p._id,'heart')} className={`text-sm flex items-center gap-1 ${heartOn? 'text-rose-600':'text-gray-500 hover:text-rose-600'}`}>
                      <Heart className={`w-4 h-4 ${heartOn? 'fill-current':''}`}/> Hearts <span>{p.heartReactions?.length||0}</span>
                    </button>
                    <div className="ml-auto text-xs text-gray-500">By {p.isAnonymous ? 'Anonymous' : (p.author?.name || 'Member')}</div>
                  </div>
                </div>

                {/* Comments */}
                <div className="border-t border-gray-100 p-4 bg-pink-50/30">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={commentInputs[p._id]||''}
                      onChange={(e)=>setCommentInputs({...commentInputs,[p._id]: e.target.value})}
                      onKeyDown={(e)=>{ if (e.key==='Enter') handleComment(p._id); }}
                      placeholder="Write a joyful comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button onClick={()=>handleComment(p._id)} disabled={!commentInputs[p._id]?.trim()} className="px-3 py-2 bg-pink-500 text-white rounded-lg disabled:opacity-50">Send</button>
                  </div>
                  {p.comments.length>0 && (
                    <div className="space-y-3">
                      {p.comments.map(c => (
                        <div key={c._id} className="flex items-start gap-2">
                          {c.user?.profilePhoto ? (
                            <img src={c.user.profilePhoto} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-pink-100" />
                          )}
                          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 flex-1">
                            <div className="text-xs text-gray-500 mb-1">{c.user?.name || 'Member'} • {format(new Date(c.createdAt), 'MMM d, h:mm a')}</div>
                            <div className="text-sm text-gray-800">{c.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-pink-50 to-orange-50">
              <div className="font-bold text-gray-900 flex items-center gap-2"><PartyPopper className="w-5 h-5 text-pink-600"/> New Celebration</div>
              <button onClick={()=>setShowCreate(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input value={formData.title} onChange={(e)=>setFormData({...formData,title:e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500" placeholder="e.g., Happy Birthday to John!" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={formData.celebrationCategory||''} onChange={(e)=>setFormData({...formData,celebrationCategory: e.target.value as any})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500">
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption * (Type @ to tag a member)</label>
                <MentionTextarea value={formData.content} onChange={(v, m)=>{ setFormData({...formData,content:v}); setMentions(m as any); }} rows={5} placeholder="Share the joy with a heartfelt caption..."/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-pink-50 text-pink-700 border border-pink-200 rounded-lg hover:bg-pink-100 cursor-pointer inline-flex items-center gap-2">
                    <ImageIcon className="w-4 h-4"/> {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  {formData.mediaUrl && <span className="text-xs text-green-600">Image attached</span>}
                </div>
                {formData.mediaUrl && <img src={formData.mediaUrl} className="mt-3 w-full h-40 object-cover rounded-lg" />}
              </div>
              <div className="flex items-center gap-2">
                <input id="anon" type="checkbox" checked={formData.isAnonymous} onChange={(e)=>setFormData({...formData,isAnonymous:e.target.checked})} className="w-4 h-4"/>
                <label htmlFor="anon" className="text-sm text-gray-700">Post anonymously</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={()=>setShowCreate(false)} className="px-5 py-2 bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isUploading || isSubmitting || !formData.title.trim() || !formData.content.trim() || !formData.celebrationCategory} className="px-6 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg disabled:opacity-50">{isSubmitting? 'Posting...' : 'Post Celebration'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelebrationsPage;
