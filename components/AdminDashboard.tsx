
import React, { useMemo } from 'react';
import { User, UsageLog } from '../types';

interface AdminDashboardProps {
  logs: UsageLog[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ logs }) => {
  // Simulate a list of all users from a global store
  const allUsers: User[] = JSON.parse(localStorage.getItem('amrah_all_users') || '[]');

  const stats = useMemo(() => {
    const totalRevenue = allUsers.reduce((acc, u) => acc + (u.tier === 'Pro' ? 9.99 : 0), 0);
    const freeUsers = allUsers.filter(u => u.tier === 'Free').length;
    const proUsers = allUsers.filter(u => u.tier !== 'Free').length;
    const totalImages = logs.filter(l => l.type === 'image').length;
    const totalVideos = logs.filter(l => l.type === 'video').length;

    return { totalRevenue, freeUsers, proUsers, totalImages, totalVideos };
  }, [allUsers, logs]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-end justify-between border-b border-black/5 pb-8">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif text-emerald-950">Neural Command Center</h2>
          <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.4em]">Administrative Intelligence & Usage Analytics</p>
        </div>
        <div className="bg-emerald-950 text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
          Maison Admin Active
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Estimated Revenue', val: `$${stats.totalRevenue.toFixed(2)}`, color: 'text-gold' },
          { label: 'Pro Members', val: stats.proUsers, color: 'text-emerald-950' },
          { label: 'Free Tier Renders', val: stats.freeUsers, color: 'text-emerald-950' },
          { label: 'Total Visual Synthesis', val: stats.totalImages + stats.totalVideos, color: 'text-emerald-950' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-3xl p-8 border border-emerald-50 soft-shadow space-y-4">
            <span className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-[0.2em]">{s.label}</span>
            <div className={`text-4xl font-serif font-medium ${s.color}`}>{s.val}</div>
            <div className="h-1 w-full bg-emerald-50 rounded-full overflow-hidden">
               <div className="h-full bg-current opacity-20 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* User Table */}
        <div className="lg:col-span-7 bg-white rounded-4xl p-10 border border-emerald-50 soft-shadow space-y-8">
           <h3 className="text-xl font-serif text-emerald-950">Maison Partner Registry</h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-emerald-50 text-[9px] font-bold uppercase text-emerald-950/30 tracking-widest">
                    <th className="pb-4">Partner</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4">Generations</th>
                    <th className="pb-4">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/30">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="text-[11px]">
                      <td className="py-5 font-bold text-emerald-950">
                        {user.email}
                        <span className="block text-[9px] font-normal text-emerald-950/40">{user.name}</span>
                      </td>
                      <td className="py-5">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-tighter ${user.tier === 'Pro' ? 'bg-gold/10 text-gold' : 'bg-emerald-50 text-emerald-600'}`}>
                           {user.tier}
                         </span>
                      </td>
                      <td className="py-5 font-mono">{user.totalGenerated}</td>
                      <td className="py-5 text-emerald-950/40">{new Date(user.lastLogin).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {allUsers.length === 0 && (
                    <tr><td colSpan={4} className="py-20 text-center text-emerald-950/20 italic">No partners found in the local database.</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Real-time Logs */}
        <div className="lg:col-span-5 bg-emerald-950 rounded-4xl p-10 border border-white/5 soft-shadow flex flex-col h-[600px]">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-serif text-white">Live Synthesis Stream</h3>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
           </div>
           <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2 group hover:bg-white/10 transition-all">
                  <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-widest text-gold">
                    <span>{log.type}</span>
                    <span className="text-white/20">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[10px] text-white/80 line-clamp-1">{log.userEmail}</p>
                  <p className="text-[9px] text-white/30 italic group-hover:text-white/60 transition-colors">"{log.prompt}"</p>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="h-full flex items-center justify-center text-[10px] uppercase font-bold text-white/10 tracking-[0.4em]">Waiting for activity...</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
