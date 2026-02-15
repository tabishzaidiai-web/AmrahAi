import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { MaisonFolder, MaisonFile, MaisonNote, MaisonTeamMember } from '../types';
import MaisonModal from './MaisonModal';

const MaisonDashboard: React.FC = () => {
  const { user, isCloudRestricted } = useAuth();
  const [activeTab, setActiveTab] = useState<'assets' | 'notes' | 'team'>('assets');
  
  // Data States
  const [folders, setFolders] = useState<MaisonFolder[]>([]);
  const [files, setFiles] = useState<MaisonFile[]>([]);
  const [notes, setNotes] = useState<MaisonNote[]>([]);
  const [team, setTeam] = useState<MaisonTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [modalType, setModalType] = useState<'folder' | 'file' | 'note' | 'member' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Local Storage Keys
  const LOCAL_STORAGE_KEY = `amrah_local_hub_${user?.id || 'guest'}`;

  const loadLocalData = () => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setFolders(data.folders || []);
      setFiles(data.files || []);
      setNotes(data.notes || []);
      setTeam(data.team || []);
    }
    setLoading(false);
  };

  const saveToLocal = (type: string, newData: any) => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : { folders: [], files: [], notes: [], team: [] };
    
    const item = { id: Math.random().toString(36).substr(2, 9), ...newData, createdAt: Date.now() };
    
    if (type === 'folder') data.folders = [item, ...data.folders];
    if (type === 'file') data.files = [item, ...data.files];
    if (type === 'note') data.notes = [item, ...data.notes];
    if (type === 'member') data.team = [item, ...data.team];

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    loadLocalData();
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (isCloudRestricted) {
      loadLocalData();
      return;
    }

    const basePath = `users/${user.id}`;
    const handleError = (err: any) => {
      if (err.code === 'permission-denied' || err.message?.includes('auth')) {
        console.warn("Cloud Restricted. Switching to Local Persistence.");
        loadLocalData();
      } else {
        console.error("Maison Sync Error:", err);
      }
    };

    let unsubscribes: (() => void)[] = [];

    try {
      unsubscribes.push(onSnapshot(
        query(collection(db, `${basePath}/folders`), orderBy('createdAt', 'desc')), 
        (snap) => setFolders(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaisonFolder))),
        handleError
      ));

      unsubscribes.push(onSnapshot(
        query(collection(db, `${basePath}/files`), orderBy('createdAt', 'desc')), 
        (snap) => setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaisonFile))),
        handleError
      ));

      unsubscribes.push(onSnapshot(
        query(collection(db, `${basePath}/notes`), orderBy('createdAt', 'desc')), 
        (snap) => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaisonNote))),
        handleError
      ));

      unsubscribes.push(onSnapshot(
        query(collection(db, `${basePath}/teamMembers`), orderBy('createdAt', 'desc')), 
        (snap) => {
          setTeam(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaisonTeamMember)));
          setLoading(false);
        },
        handleError
      ));
    } catch (e) {
      handleError(e);
      setLoading(false);
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user?.id, isCloudRestricted]);

  const handleCreate = async () => {
    if (!user?.id || !modalType) return;
    setIsSubmitting(true);
    
    if (isCloudRestricted) {
      saveToLocal(modalType, formData);
      setModalType(null);
      setFormData({});
      setIsSubmitting(false);
      return;
    }

    const collectionMap = {
      folder: 'folders',
      file: 'files',
      note: 'notes',
      member: 'teamMembers'
    };

    try {
      await addDoc(collection(db, `users/${user.id}/${collectionMap[modalType]}`), {
        ...formData,
        createdAt: Date.now(),
      });
      setModalType(null);
      setFormData({});
    } catch (e) {
      console.error(e);
      // If cloud fails during an active session, fallback to local and notify
      saveToLocal(modalType, formData);
      setModalType(null);
      setFormData({});
      alert("Note: Cloud sync failed. Prompt secured to local memory instead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEmpty = (msg: string) => (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-gold/20">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 8-8-8" /></svg>
      </div>
      <p className="text-sm text-emerald-950/20 font-serif italic max-w-xs">{msg}</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-lux-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-50 pb-8 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-serif text-emerald-950 italic">Maison Hub</h2>
            {isCloudRestricted && (
              <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[8px] font-bold uppercase tracking-widest border border-amber-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Local Mode Active
              </span>
            )}
          </div>
          <div className="flex gap-8">
            {['assets', 'notes', 'team'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-all relative pb-2 ${activeTab === tab ? 'text-gold' : 'text-emerald-950/20'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gold" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {activeTab === 'assets' && (
            <>
              <button onClick={() => setModalType('folder')} className="px-6 py-2.5 bg-emerald-50 text-emerald-950 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all">New Folder</button>
              <button onClick={() => setModalType('file')} className="px-6 py-2.5 bg-emerald-950 text-emerald-950 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all">Add Asset</button>
            </>
          )}
          {activeTab === 'notes' && (
            <button onClick={() => setModalType('note')} className="px-6 py-2.5 bg-emerald-50 text-emerald-950 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all">New Prompt / Note</button>
          )}
          {activeTab === 'team' && (
            <button onClick={() => setModalType('member')} className="px-6 py-2.5 bg-emerald-50 text-emerald-950 rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all">Add Member</button>
          )}
        </div>
      </div>

      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'assets' && (
              <div className="space-y-12">
                {folders.length === 0 && files.length === 0 ? renderEmpty("No assets yet. Upload your first product image to begin.") : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {folders.map(f => (
                      <div key={f.id} className="bg-white p-8 rounded-[2rem] border border-gray-50 soft-shadow flex items-center gap-6 group hover:border-gold transition-all">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-white transition-all">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        </div>
                        <span className="text-xs font-serif italic text-emerald-950">{f.name}</span>
                      </div>
                    ))}
                    {files.map(f => (
                      <div key={f.id} className="bg-white p-6 rounded-[2rem] border border-gray-50 soft-shadow space-y-4 group hover:border-gold transition-all">
                         <div className="aspect-square bg-emerald-50/30 rounded-2xl flex items-center justify-center text-emerald-950/10">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                         </div>
                         <div className="px-2">
                           <p className="text-[11px] font-bold text-emerald-950 uppercase truncate tracking-widest">{f.name}</p>
                           <p className="text-[8px] text-emerald-950/30 font-bold uppercase tracking-widest mt-1">{f.type} • {f.size}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {notes.length === 0 ? renderEmpty("Capture styling rules, brand guidelines, and shoot ideas here.") : notes.map(n => (
                  <div key={n.id} className="bg-white p-10 rounded-[2.5rem] border border-gray-50 soft-shadow space-y-6 flex flex-col hover:border-gold transition-all">
                    <h4 className="text-xl font-serif text-emerald-950 italic">{n.title}</h4>
                    <p className="text-xs text-emerald-950/40 font-serif italic line-clamp-3 leading-relaxed">{n.content}</p>
                    <span className="mt-auto pt-6 text-[8px] font-bold text-gold uppercase tracking-[0.2em]">Secured {new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-8 max-w-2xl">
                {team.length === 0 ? renderEmpty("Invite your creative team and stakeholders.") : team.map(m => (
                  <div key={m.id} className="bg-white px-10 py-8 rounded-[2rem] border border-gray-50 soft-shadow flex items-center justify-between group hover:border-gold transition-all">
                    <div className="flex items-center gap-8">
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-950 text-[10px] font-bold uppercase">
                        {m.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-serif italic text-emerald-950">{m.name}</p>
                        <p className="text-[9px] text-gold font-bold uppercase tracking-[0.2em]">{m.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <MaisonModal 
        isOpen={!!modalType} 
        onClose={() => setModalType(null)} 
        title={modalType === 'folder' ? 'Create New Folder' : modalType === 'file' ? 'Deposit Product Asset' : modalType === 'note' ? 'New Creative Note' : 'Add Team Member'}
        primaryAction={{
          label: `Save ${modalType === 'note' ? 'Prompt' : modalType}`,
          onClick: handleCreate,
          disabled: !formData.name && !formData.title,
          loading: isSubmitting
        }}
      >
        {modalType === 'folder' && (
          <input 
            autoFocus
            type="text" 
            placeholder="Folder Name (e.g. FW24 Campaign)" 
            className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-sm font-serif italic outline-none focus:ring-1 focus:ring-gold"
            onChange={e => setFormData({ name: e.target.value })}
          />
        )}
        {modalType === 'file' && (
          <>
            <input type="text" placeholder="Asset Name" className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-sm font-serif italic outline-none" onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <select className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none" onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="image">Image Asset</option>
              <option value="video">Video Sequence</option>
              <option value="reference">Style Reference</option>
            </select>
            <input type="text" placeholder="Size (e.g. 4.2 MB)" className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-sm font-serif italic outline-none" onChange={e => setFormData({ ...formData, size: e.target.value })} />
          </>
        )}
        {modalType === 'note' && (
          <>
            <input type="text" placeholder="Note / Prompt Title" className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-sm font-serif italic outline-none" onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <textarea placeholder="Creative notes, AI prompts, and ideas..." className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-sm font-serif italic outline-none min-h-[150px]" onChange={e => setFormData({ ...formData, content: e.target.value })} />
          </>
        )}
        {modalType === 'member' && (
          <>
            <input type="text" placeholder="Full Name" className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-sm font-serif italic outline-none" onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input type="text" placeholder="Role (e.g. Creative Lead)" className="w-full bg-emerald-50/20 px-8 py-5 rounded-2xl text-sm font-serif italic outline-none" onChange={e => setFormData({ ...formData, role: e.target.value })} />
          </>
        )}
      </MaisonModal>
    </div>
  );
};

export default MaisonDashboard;