
import React, { useState, useEffect } from 'react';
import { ViewState, LogEntry, SOP, ChangeOverTask, UserRole } from './types';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import History from './components/History';
import SOPList from './components/SOPList';
import AIChat from './components/AIChat';
import ChangeOverSchedule from './components/ChangeOverSchedule';
import Auth from './components/Auth';
import { supabase, uploadSOPFile } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { LayoutDashboard, FileText, History as HistoryIcon, BookOpen, Bot, Zap, Menu, X, LogOut, CheckCircle, Trash2, CalendarClock, UserCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  // Baris 16: Ubah dari 'user' menjadi null
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Data States
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [schedules, setSchedules] = useState<ChangeOverTask[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Notification State
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'delete' | 'error'}>({
    show: false, 
    message: '',
    type: 'success'
  });

  // Auto-dismiss notification
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Auth & Initial Data Fetch
  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id).then(() => fetchData());
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id).then(() => fetchData());
      } else {
        // Clear data on logout
        setLogs([]);
        setSops([]);
        setSchedules([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    // ...

  const fetchUserRole = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (data && !error) {
      setUserRole(data.role as UserRole);
    } else {
      // Jika tidak ada di profil, arahkan ke logout atau default terbatas
      setUserRole('user'); 
    }
  } catch (error) {
    console.error('Error fetching role:', error);
    setUserRole('user');
  }
};

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      // 1. Fetch Logs
      const { data: logsData, error: logsError } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (logsError) throw logsError;

      const mappedLogs: LogEntry[] = (logsData || []).map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        groupName: l.group_name,
        shift: l.shift,
        targetPair: l.target_pair,
        units: l.units,
        checklist: l.checklist,
        notes: l.notes
      }));
      // Remove MOCK_HISTORY fallback
      setLogs(mappedLogs); 

      // 2. Fetch SOPs
      const { data: sopsData, error: sopsError } = await supabase
        .from('sops')
        .select('*');
      
      if (sopsError) throw sopsError;

      const mappedSops: SOP[] = (sopsData || []).map(s => ({
        id: s.id,
        title: s.title,
        category: s.category,
        targetUnit: s.target_unit,
        type: s.type,
        content: s.content,
        fileUrl: s.file_url,
        fileName: s.file_name,
        linkUrl: s.link_url
      }));
      // Remove MOCK_SOPS fallback
      setSops(mappedSops);

      // 3. Fetch Schedules
      const { data: schedData, error: schedError } = await supabase
        .from('schedules')
        .select('*');

      if (schedError) throw schedError;

      const mappedSchedules: ChangeOverTask[] = (schedData || []).map(s => ({
        id: s.id,
        equipmentName: s.equipment_name,
        targetUnit: s.target_unit,
        frequency: s.frequency,
        scheduleDay: s.schedule_day,
        lastPerformed: s.last_performed,
        currentRunning: s.current_running,
        status: s.status,
        labelA: s.label_a,
        labelB: s.label_b,
        label_c: s.label_c,
        procedures: s.procedures,
        precautions: s.precautions
      }));
      setSchedules(mappedSchedules);

    } catch (error) {
      console.error("Error fetching data:", error);
      // Remove all mock fallbacks in catch block
      if (!isBackground) {
        setLogs([]);
        setSops([]);
        setSchedules([]);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Auto Logout on Idle (30 Minutes)
  useEffect(() => {
    if (!session) return;

    const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
    let timeoutId: NodeJS.Timeout;

    const handleIdle = () => {
      handleLogout();
      setNotification({ 
        show: true, 
        message: 'Sesi berakhir karena tidak aktif selama 30 menit.', 
        type: 'error' 
      });
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleIdle, TIMEOUT_DURATION);
    };

    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 
      'scroll', 'touchstart', 'click'
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [session]);

  const handleAddLog = async (newLog: LogEntry) => {
    try {
      const dbLog = {
        timestamp: newLog.timestamp,
        group_name: newLog.groupName,
        shift: newLog.shift,
        target_pair: newLog.targetPair,
        units: newLog.units,
        checklist: newLog.checklist,
        notes: newLog.notes
      };
      const { data, error } = await supabase.from('logs').insert(dbLog).select().single();
      if (error) throw error;
      const createdLog: LogEntry = { ...newLog, id: data.id };
      setLogs([createdLog, ...logs]);
      if (view === 'report') setView('history');
      setNotification({ show: true, message: `Laporan berhasil dicatat.`, type: 'success' });
    } catch (error) {
      setNotification({ show: true, message: 'Gagal menyimpan laporan.', type: 'error' });
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const { error } = await supabase.from('logs').delete().eq('id', id);
      if (error) throw error;
      setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
      setNotification({ show: true, message: 'Laporan dihapus.', type: 'delete' });
    } catch (error) {
      setNotification({ show: true, message: 'Gagal menghapus laporan.', type: 'error' });
    }
  };

  const handleAddSOP = async (newSOP: SOP) => {
    try {
      let finalFileUrl = newSOP.fileUrl;
      let finalFileName = newSOP.fileName;

      // Logic Upload File ke Storage jika ada rawFile
      if (newSOP.type === 'pdf' && newSOP.rawFile) {
        setNotification({ show: true, message: 'Mengupload file...', type: 'success' }); // Show progress toast
        try {
          const uploadResult = await uploadSOPFile(newSOP.rawFile);
          finalFileUrl = uploadResult.url;
          finalFileName = newSOP.rawFile.name; // Simpan nama asli atau bisa juga unique name
        } catch (uploadError) {
          console.error("Upload error:", uploadError);
          setNotification({ show: true, message: 'Gagal upload file PDF.', type: 'error' });
          return; // Stop execution if upload fails
        }
      }

      const dbSOP = {
        title: newSOP.title,
        category: newSOP.category,
        target_unit: newSOP.targetUnit,
        type: newSOP.type,
        content: newSOP.content,
        file_url: finalFileUrl,
        file_name: finalFileName,
        link_url: newSOP.linkUrl
      };

      const { data, error } = await supabase.from('sops').insert(dbSOP).select().single();
      if (error) throw error;
      
      const createdSOP = { ...newSOP, id: data.id, fileUrl: finalFileUrl, fileName: finalFileName };
      setSops([createdSOP, ...sops]);
      setNotification({ show: true, message: `SOP berhasil disimpan.`, type: 'success' });
    } catch (error) {
       console.error(error);
       setNotification({ show: true, message: 'Gagal menyimpan database SOP.', type: 'error' });
    }
  };

  const handleDeleteSOP = async (id: string) => {
    try {
        const { error } = await supabase.from('sops').delete().eq('id', id);
        if (error) throw error;
        setSops(prev => prev.filter(s => s.id !== id));
        setNotification({ show: true, message: `SOP dihapus.`, type: 'delete' });
    } catch (error) {
        setNotification({ show: true, message: 'Gagal menghapus SOP.', type: 'error' });
    }
  };

  const handleUpdateSchedule = async (updatedTask: ChangeOverTask) => {
      try {
          const dbTask = {
              last_performed: updatedTask.lastPerformed,
              current_running: updatedTask.currentRunning,
              status: updatedTask.status,
              schedule_day: updatedTask.scheduleDay,
              equipment_name: updatedTask.equipmentName,
              target_unit: updatedTask.targetUnit,
              frequency: updatedTask.frequency,
              label_a: updatedTask.labelA,
              label_b: updatedTask.labelB,
              label_c: updatedTask.labelC,
              procedures: updatedTask.procedures,
              precautions: updatedTask.precautions
          };
          
          if (!updatedTask.id.includes('-')) {
             await supabase.from('schedules').update(dbTask).eq('id', updatedTask.id);
          }
          setSchedules(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      } catch (error) {
          setNotification({ show: true, message: 'Gagal mengupdate jadwal.', type: 'error' });
      }
  };
  
  const handleAddSchedule = async (newTask: ChangeOverTask) => {
      try {
          const dbTask = {
              equipment_name: newTask.equipmentName,
              target_unit: newTask.targetUnit,
              frequency: newTask.frequency,
              schedule_day: newTask.scheduleDay,
              last_performed: newTask.lastPerformed,
              current_running: newTask.currentRunning,
              status: newTask.status,
              label_a: newTask.labelA,
              label_b: newTask.labelB,
              label_c: newTask.labelC,
              procedures: newTask.procedures,
              precautions: newTask.precautions
          };
          const { data, error } = await supabase.from('schedules').insert(dbTask).select().single();
          if(error) throw error;
          const createdTask = { ...newTask, id: data.id };
          setSchedules([...schedules, createdTask]);
          setNotification({ show: true, message: 'Jadwal baru tersimpan.', type: 'success' });
      } catch (error) {
          setNotification({ show: true, message: 'Gagal menyimpan jadwal.', type: 'error' });
      }
  }

  const handleDeleteSchedule = async (id: string) => {
      try {
        if(!id.startsWith('co-')) {
            await supabase.from('schedules').delete().eq('id', id);
        }
        setSchedules(prev => prev.filter(t => t.id !== id));
        setNotification({ show: true, message: 'Jadwal dihapus.', type: 'delete' });
      } catch(error) {
          setNotification({ show: true, message: 'Gagal menghapus jadwal.', type: 'error' });
      }
  }

  // Filter menu items based on Role
  let menuItems = [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'user'] },
    { id: 'report', label: 'Laporan Baru', mobileLabel: 'Laporan', icon: <FileText className="w-5 h-5" />, roles: ['user'] },
    { id: 'history', label: 'Riwayat Shift', mobileLabel: 'Riwayat', icon: <HistoryIcon className="w-5 h-5" />, roles: ['admin', 'user'] },
    { id: 'schedule', label: 'Jadwal C.O', mobileLabel: 'Jadwal', icon: <CalendarClock className="w-5 h-5" />, roles: ['admin', 'user'] },
    { id: 'sop', label: 'Daftar SOP', mobileLabel: 'SOP', icon: <BookOpen className="w-5 h-5" />, roles: ['admin', 'user'] },
    { id: 'ai-assist', label: 'AI Asisten', mobileLabel: 'AI', icon: <Bot className="w-5 h-5" />, roles: ['admin', 'user'] },
  ];

  // 1. Amankan filter menu agar tidak error saat userRole bernilai null (Baris 271)
  const visibleMenuItems = userRole 
    ? menuItems.filter(item => item.roles.includes(userRole)) 
    : [];

  // 2. MODIFIKASI "THE GATEKEEPER" (Baris 273 - 281)
  // Menambahkan kondisi: Tetap loading jika session ada tapi role belum terkonfirmasi
  if (loading || (session && userRole === null)) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-slate-400 font-medium">Memverifikasi Hak Akses...</p>
              </div>
          </div>
      )
  }

  if (!session) {
    return (
      <>
        {notification.show && (
          <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
            <div className={`bg-white px-5 py-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-4 max-w-sm ${notification.type === 'delete' ? 'border-red-500' : notification.type === 'error' ? 'border-amber-500' : 'border-emerald-500'}`}>
               <div className={`p-2 rounded-full flex-shrink-0 ${notification.type === 'delete' ? 'bg-red-100 text-red-600' : notification.type === 'error' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                 {notification.type === 'delete' ? <Trash2 className="w-5 h-5" /> : notification.type === 'error' ? <X className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
               </div>
               <div className="flex-1">
                 <h4 className="font-bold text-slate-800 text-sm">
                   {notification.type === 'delete' ? 'Dihapus' : notification.type === 'error' ? 'Error' : 'Berhasil'}
                 </h4>
                 <p className="text-sm text-slate-500 leading-snug mt-1">{notification.message}</p>
               </div>
               <button onClick={() => setNotification(prev => ({...prev, show: false}))} className="text-slate-400 hover:text-slate-600">
                 <X className="w-4 h-4" />
               </button>
            </div>
          </div>
        )}
        <Auth />
      </>
    );
  }
  
  return (
    <div className="relative h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right-10 fade-in duration-300">
          <div className={`bg-white px-5 py-4 rounded-xl shadow-2xl border-l-4 flex items-start gap-4 max-w-sm ${notification.type === 'delete' ? 'border-red-500' : notification.type === 'error' ? 'border-amber-500' : 'border-emerald-500'}`}>
             <div className={`p-2 rounded-full flex-shrink-0 ${notification.type === 'delete' ? 'bg-red-100 text-red-600' : notification.type === 'error' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
               {notification.type === 'delete' ? <Trash2 className="w-5 h-5" /> : notification.type === 'error' ? <X className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-slate-800 text-sm">
                 {notification.type === 'delete' ? 'Dihapus' : notification.type === 'error' ? 'Error' : 'Berhasil'}
               </h4>
               <p className="text-sm text-slate-500 leading-snug mt-1">{notification.message}</p>
             </div>
             <button onClick={() => setNotification(prev => ({...prev, show: false}))} className="text-slate-400 hover:text-slate-600">
               <X className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 text-slate-300 hidden lg:flex flex-col shadow-2xl`}>
        <div className="h-20 flex-shrink-0 flex items-center gap-4 px-6 border-b border-slate-800/60 bg-slate-950">
          <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-600/30 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-500" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">Digital Logbook</span>
            <span className="text-[10px] font-bold text-blue-500 tracking-widest mt-1">PLTP Ulumbu</span>
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
          {visibleMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`
                group w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                ${view === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-x-1' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 hover:translate-x-1'}
              `}
            >
              <span className={`${view === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
                {item.icon}
              </span>
              {item.label}
              {view === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/60 bg-slate-900/50 flex-shrink-0">
           <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-800 transition-colors group text-left">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md ring-2 ring-slate-900 group-hover:ring-slate-700 transition-all">
                  {session.user.email?.slice(0, 2).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div className="flex flex-col overflow-hidden">
                 <span className="text-sm font-semibold text-slate-200 group-hover:text-white truncate transition-colors">
                   {session.user.email}
                 </span>
                 <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white ${userRole === 'admin' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                      {userRole}
                    </span>
                 </div>
              </div>
              <LogOut className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-300 transition-colors" />
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="h-full w-full flex flex-col bg-slate-50 relative lg:pl-72 transition-[padding] duration-300">
        <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30 transition-all flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="lg:hidden p-1.5 bg-blue-600/10 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight line-clamp-1">
                {visibleMenuItems.find(i => i.id === view)?.label || 'Dashboard'}
              </h1>
              <p className="hidden sm:block text-sm text-slate-500">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="flex flex-col items-end">
               <span className="hidden lg:block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status Unit</span>
               <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 <span className="text-xs font-bold text-emerald-700">MONITORING</span>
               </div>
            </div>
            <button onClick={handleLogout} className="lg:hidden w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white shadow-sm" title="Logout">
                {session.user.email?.slice(0, 2).toUpperCase()}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 scroll-smooth pb-24 lg:pb-12">
          <div className="max-w-7xl mx-auto pb-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {view === 'dashboard' && <Dashboard logs={logs} schedules={schedules} onRefresh={() => fetchData(true)} />}
            {view === 'report' && userRole === 'user' && <ReportForm onSubmit={handleAddLog} />}
            {view === 'history' && <History logs={logs} onDelete={handleDeleteLog} canDelete={userRole === 'user'} />}
            {view === 'schedule' && 
              <ChangeOverSchedule 
                  role={userRole}
                  initialTasks={schedules} 
                  onRecordLog={handleAddLog}
                  onUpdateTask={handleUpdateSchedule}
                  onAddTask={handleAddSchedule}
                  onDeleteTask={handleDeleteSchedule}
              />
            }
            {view === 'sop' && <SOPList role={userRole} sops={sops} onAddSOP={handleAddSOP} onDeleteSOP={handleDeleteSOP} />}
            {view === 'ai-assist' && <AIChat sops={sops} logs={logs} />}
          </div>
        </div>
        
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-around px-1 py-1">
                {visibleMenuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as ViewState)}
                        className={`flex flex-col items-center justify-center py-2 px-1 w-full gap-1 rounded-lg transition-colors active:bg-slate-50
                            ${view === item.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}
                        `}
                    >
                        <div className={`p-1 rounded-full transition-all duration-200 ${view === item.id ? 'bg-blue-50 -translate-y-1' : ''}`}>
                            {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                        </div>
                        <span className={`text-[10px] font-bold leading-none transition-opacity duration-200 ${view === item.id ? 'opacity-100' : 'opacity-70'}`}>
                            {item.mobileLabel}
                        </span>
                    </button>
                ))}
            </div>
        </nav>
      </main>
    </div>
  );
};

export default App;
