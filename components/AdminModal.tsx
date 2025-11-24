import React, { useState } from 'react';
import { Admin } from '../types';
import { supabase } from '../services/supabaseClient';
import { X, User, Lock, Save, AlertCircle } from 'lucide-react';

interface Props {
  admin: Admin;
  onClose: () => void;
}

export const AdminModal: React.FC<Props> = ({ admin, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(admin.username);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleUpdate = async () => {
    if (!newUsername.trim() && !newPassword.trim()) return;
    
    setLoading(true);
    setMsg(null);

    const updates: any = {};
    if (newUsername.trim()) updates.username = newUsername.trim();
    if (newPassword.trim()) updates.Password = newPassword.trim();

    try {
      const { error } = await supabase
        .from("Admin")
        .update(updates)
        .eq("admin_id", admin.id);

      if (error) throw error;

      // Update Local Storage
      const updatedAdmin = { ...admin, ...updates };
      // Note: In a real app we'd update parent state, but here we update storage 
      // so a refresh/re-login works. Ideally pass a setAdmin callback.
      localStorage.setItem("loggedInAdmin", JSON.stringify(updatedAdmin));
      sessionStorage.setItem("loggedInAdmin", JSON.stringify(updatedAdmin));

      setMsg({ type: 'success', text: 'Details updated! Please re-login to see all changes.' });
      setTimeout(onClose, 2000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || "Failed to update" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95 duration-200">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800">
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-600">
            <User size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{admin.name}</h3>
          <p className="text-slate-500 text-sm">Admin ID: {admin.id}</p>
        </div>

        {!isEditing ? (
           <div className="space-y-4">
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Username</label>
               <div className="text-slate-800 font-medium">{admin.username}</div>
             </div>
             
             <button 
               onClick={() => setIsEditing(true)}
               className="w-full bg-brand-500 text-white font-bold py-3 rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200"
             >
               Edit Details
             </button>
           </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 ml-1">New Username</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 text-slate-400 h-5 w-5" />
                <input 
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 outline-none" 
                  placeholder="Username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 ml-1">New Password</label>
               <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 text-slate-400 h-5 w-5" />
                <input 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 outline-none" 
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>

            {msg && (
              <div className={`text-sm p-2 rounded-lg flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <AlertCircle size={14} /> {msg.text}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 bg-brand-500 text-white font-bold py-2.5 rounded-lg hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};