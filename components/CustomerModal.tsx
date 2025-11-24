import React, { useState, useEffect } from 'react';
import { Customer, Billing, Admin, CustomerNote, ChangeLog } from '../types';
import { AUTH_HEADER, ENDPOINTS } from '../constants';
import { X, ExternalLink, MessageSquare, Save, Calendar, Smartphone, MapPin } from 'lucide-react';

interface Props {
  customer: Customer;
  billing?: Billing;
  admin: Admin;
  onClose: () => void;
}

export const CustomerModal: React.FC<Props> = ({ customer, billing, admin, onClose }) => {
  const [inactiveDate, setInactiveDate] = useState<string | null>(null);
  const [comments, setComments] = useState<CustomerNote[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Actions
  const [mode, setMode] = useState<'none' | 'promise' | 'collect'>('none');
  
  // Promise inputs
  const [promiseAmount, setPromiseAmount] = useState('');
  const [promiseDate, setPromiseDate] = useState('');

  // Collect inputs
  const [collectDate, setCollectDate] = useState('');

  // 1. Fetch Inactive Date
  useEffect(() => {
    const fetchLog = async () => {
      try {
        const res = await fetch(ENDPOINTS.LOGS(customer.id), { headers: { "Authorization": AUTH_HEADER } });
        if (!res.ok) return;
        const data: ChangeLog[] = await res.json();
        
        // Find latest 'disabled' status
        const disabledLogs = data.filter(e => e.new_status?.toLowerCase() === 'disabled');
        if (disabledLogs.length === 0) {
          setInactiveDate("N/A");
          return;
        }

        // Sort by date/time desc
        disabledLogs.sort((a, b) => {
          const da = new Date(`${a.date}T${a.time}`);
          const db = new Date(`${b.date}T${b.time}`);
          return db.getTime() - da.getTime();
        });

        const latest = disabledLogs[0];
        setInactiveDate(new Date(latest.date).toLocaleDateString("en-ZA", { year: "numeric", month: "short" }));
      } catch (e) {
        console.error(e);
      }
    };
    fetchLog();
  }, [customer.id]);

  // 2. Fetch Comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(ENDPOINTS.COMMENTS, { headers: { "Authorization": AUTH_HEADER } });
      const all: CustomerNote[] = await res.json();
      const relevant = all.filter(n => n.customer_id === customer.id);
      setComments(relevant);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [customer.id]);

  // Helper to format date for API
  const getLocalDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 19).replace("T", " ");
  };

  // Submit plain comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await postComment(commentText, "Customer Comment");
      setCommentText('');
      fetchComments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const postComment = async (text: string, title: string) => {
    const body: CustomerNote = {
      customer_id: customer.id,
      datetime: getLocalDateTime(),
      administrator_id: admin.id,
      name: admin.name,
      type: "comment",
      title: title,
      comment: text,
      is_done: "1", is_send: "1", is_pinned: "0"
    };

    const res = await fetch(ENDPOINTS.COMMENTS, {
      method: 'POST',
      headers: { "Authorization": AUTH_HEADER, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
  };

  // Handle Promise to Pay
  const handleSavePromise = async () => {
    if (!promiseAmount || !promiseDate) return alert("Fill all fields");
    const formattedDate = new Date(promiseDate).toLocaleString("en-ZA", { day:"2-digit", month:"short", year:"numeric" });
    const text = `Promised to pay R${promiseAmount} on ${formattedDate}`;
    
    try {
      await postComment(text, "Promise to Pay");
      alert("Promise saved!");
      setMode('none');
      setPromiseAmount('');
      setPromiseDate('');
      fetchComments();
    } catch (e: any) {
      alert("Failed: " + e.message);
    }
  };

  // Handle Collect Device
  const handleSaveCollection = async () => {
    if (!collectDate) return alert("Select a date");
    
    try {
      const scheduledFrom = new Date(collectDate);
      const formattedDate = new Date(scheduledFrom.getTime() - scheduledFrom.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 19).replace("T", " ");

      const taskBody = {
        title: customer.name,
        description: "Collect device from the customer",
        reporter_id: 1,
        address: customer.street_1 || "No address",
        gps: customer.gps || "",
        related_customer_id: customer.id,
        partner_id: 1, project_id: 1, location_id: 1, related_to_id: 1,
        created_at: getLocalDateTime(), updated_at: getLocalDateTime(),
        priority: "priority_medium",
        assigned_to: "assigned_to_team",
        assignee: ([6, 21, 23].includes(admin.id)) ? 1 : 2,
        assigned_at: getLocalDateTime(),
        is_scheduled: true,
        scheduled_from: formattedDate,
        formatted_duration: "1h 25m",
        workflow_status_id: 1, is_archived: 0, travel_time_to: 0, travel_time_from: 0,
        closed: 0, notification_send_interval: 0, notification_enabled: "1", remaining: 0,
        last_status_changed: getLocalDateTime(), watchers: [10, 11],
      };

      const res = await fetch(ENDPOINTS.TASKS, {
        method: 'POST',
        headers: { "Authorization": AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify(taskBody)
      });

      if (!res.ok) throw new Error(await res.text());

      // Auto comment
      await postComment(`Collection Task created for ${collectDate}`, "Task Creation");
      
      alert("Task Created!");
      setMode('none');
      setCollectDate('');
      fetchComments();

    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-start text-white">
          <div>
             <a 
              href={`https://portal.umoja.network/admin/customers/view?id=${customer.id}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-xl font-bold flex items-center gap-2 hover:underline decoration-white/50"
            >
              {customer.name} <ExternalLink size={16} />
            </a>
            <p className="text-brand-100 text-sm mt-1">ID: {customer.id} • {customer.status}</p>
          </div>
          <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-slate-500 block">Billing Type</span>
              <span className="font-medium text-slate-800">{customer.billing_type}</span>
            </div>
             <div className="space-y-1">
              <span className="text-slate-500 block">Amount Due</span>
              <span className="font-medium text-slate-800">{billing ? billing.deposit : "N/A"}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 block">Phone</span>
              <a href={`tel:${customer.phone}`} className="font-medium text-brand-600 hover:underline flex items-center gap-1">
                 <Smartphone size={14} /> {customer.phone}
              </a>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 block">Inactive Since</span>
              <span className="font-medium text-slate-800">{inactiveDate || "Loading..."}</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Action Toggles */}
          <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="font-medium text-slate-700">Promise to Pay</label>
                <div 
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${mode === 'promise' ? 'bg-brand-500' : 'bg-slate-300'}`}
                  onClick={() => setMode(mode === 'promise' ? 'none' : 'promise')}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${mode === 'promise' ? 'translate-x-6' : ''}`} />
                </div>
             </div>

             <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="font-medium text-slate-700">Collect Device</label>
                <div 
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${mode === 'collect' ? 'bg-brand-500' : 'bg-slate-300'}`}
                  onClick={() => setMode(mode === 'collect' ? 'none' : 'collect')}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${mode === 'collect' ? 'translate-x-6' : ''}`} />
                </div>
             </div>
          </div>

          {/* Action Inputs */}
          {mode === 'promise' && (
            <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 animate-in slide-in-from-top-2 space-y-3">
              <h4 className="font-bold text-brand-700 text-sm">Record Promise</h4>
              <input 
                type="number" 
                placeholder="Amount (R)" 
                value={promiseAmount}
                onChange={e => setPromiseAmount(e.target.value)}
                className="w-full p-2 border border-brand-200 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <input 
                type="date" 
                value={promiseDate}
                onChange={e => setPromiseDate(e.target.value)}
                className="w-full p-2 border border-brand-200 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <button 
                onClick={handleSavePromise}
                className="w-full bg-brand-500 text-white font-bold py-2 rounded-lg hover:bg-brand-600 transition-colors flex justify-center items-center gap-2"
              >
                <Save size={16} /> Save Promise
              </button>
            </div>
          )}

          {mode === 'collect' && (
             <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 animate-in slide-in-from-top-2 space-y-3">
              <h4 className="font-bold text-brand-700 text-sm">Schedule Collection</h4>
              <label className="text-xs text-brand-600">Collection Date</label>
              <input 
                type="date" 
                value={collectDate}
                onChange={e => setCollectDate(e.target.value)}
                className="w-full p-2 border border-brand-200 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
              <button 
                onClick={handleSaveCollection}
                className="w-full bg-brand-500 text-white font-bold py-2 rounded-lg hover:bg-brand-600 transition-colors flex justify-center items-center gap-2"
              >
                <Save size={16} /> Create Task
              </button>
            </div>
          )}

          {/* Comments Section */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <MessageSquare size={16} /> History
            </h4>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 h-48 overflow-y-auto p-3 space-y-3 mb-3">
              {loadingComments ? (
                <div className="text-center text-xs text-slate-400 py-4">Loading history...</div>
              ) : comments.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-4">No comments found.</div>
              ) : (
                comments.map((note, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border-l-4 border-brand-500 shadow-sm text-sm">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{new Date(note.datetime).toLocaleDateString()}</span>
                      <span>{note.name}</span>
                    </div>
                    <div className="text-slate-700 break-words">{note.comment}</div>
                  </div>
                ))
              )}
            </div>

            {mode === 'none' && (
              <div className="flex gap-2">
                <textarea 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  rows={1}
                  className="flex-1 p-2 border border-slate-300 rounded-lg bg-white focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                />
                <button 
                  onClick={handleAddComment}
                  className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Post
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};