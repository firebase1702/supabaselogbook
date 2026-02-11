
import React, { useState, useMemo } from 'react';
import { Metric, LogEntry, UnitMetrics, ChangeOverTask } from '../types';
import { Zap, Activity, ArrowUp, ArrowDown, Minus, CheckCircle, AlertTriangle, XCircle, Power, PauseCircle, Clock, RefreshCw, ArrowRight, BellRing, Calendar } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  logs: LogEntry[];
  schedules: ChangeOverTask[];
  onRefresh?: () => Promise<void>;
}

const MetricCard: React.FC<{ metric: Metric; icon: React.ReactNode }> = ({ metric, icon }) => {
  const getTrendIcon = () => {
    if (metric.trend === 'up') return <ArrowUp className="w-4 h-4 text-emerald-500" />;
    if (metric.trend === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className={`p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <div className="flex items-center gap-1 text-sm font-medium bg-slate-50 px-2 py-1 rounded-full">
          {getTrendIcon()}
          <span className="text-slate-500">{metric.trend === 'stable' ? 'Stabil' : metric.trend === 'up' ? 'Naik' : 'Turun'}</span>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">{metric.label}</p>
        <h3 className="text-3xl font-bold mt-1 tracking-tight">
          {metric.value} <span className="text-lg text-slate-400 font-normal">{metric.unit}</span>
        </h3>
      </div>
    </div>
  );
};

const UnitStatusCard: React.FC<{ unitName: string; data: UnitMetrics | null }> = ({ unitName, data }) => {
  const status = data?.status || 'Offline';
  const load = data?.loadMW || 0;
  const capacity = 2.5; // Fixed capacity as per requirement
  const loadPercentage = Math.min((load / capacity) * 100, 100);

  let colorClass = 'bg-slate-50 border-slate-200';
  let statusColor = 'text-slate-500 bg-slate-100';
  let icon = <Minus className="w-4 h-4" />;
  let label = 'N/A';
  let barColor = 'bg-slate-300';

  switch (status) {
    case 'Normal':
      colorClass = 'bg-white border-emerald-200 shadow-sm';
      statusColor = 'text-emerald-700 bg-emerald-50 border border-emerald-100';
      icon = <CheckCircle className="w-3.5 h-3.5 animate-pulse" />;
      label = 'RUNNING';
      barColor = 'bg-emerald-500';
      break;
    case 'Issue':
      colorClass = 'bg-white border-amber-200 shadow-sm';
      statusColor = 'text-amber-700 bg-amber-50 border border-amber-100';
      icon = <AlertTriangle className="w-3.5 h-3.5" />;
      label = 'WARNING';
      barColor = 'bg-amber-500';
      break;
    case 'Maintenance':
      colorClass = 'bg-blue-50/50 border-blue-200 border-dashed';
      statusColor = 'text-blue-700 bg-blue-100 border border-blue-200';
      icon = <Power className="w-3.5 h-3.5" />;
      label = 'MAINTENANCE';
      barColor = 'bg-blue-400';
      break;
    case 'Standby':
      colorClass = 'bg-slate-50 border-slate-300';
      statusColor = 'text-slate-700 bg-slate-200 border border-slate-300';
      icon = <PauseCircle className="w-3.5 h-3.5" />;
      label = 'STANDBY';
      barColor = 'bg-slate-400';
      break;
    case 'Offline':
      colorClass = 'bg-gray-50 border-gray-200 opacity-75';
      statusColor = 'text-gray-500 bg-gray-100 border border-gray-200';
      icon = <XCircle className="w-3.5 h-3.5" />;
      label = 'OFFLINE';
      barColor = 'bg-gray-300';
      break;
  }

  return (
    <div className={`flex flex-col p-5 rounded-xl border ${colorClass} transition-all relative overflow-hidden group`}>
      {/* Header: Unit Name & Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <div className={`w-2 h-8 rounded-full ${barColor}`}></div>
          {unitName}
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
          {icon} {label}
        </div>
      </div>

      {/* Metrics: Load & Capacity */}
      <div className="space-y-1">
        <div className="flex justify-between items-end">
          <span className="text-xs font-semibold text-slate-400 uppercase">Beban Saat Ini</span>
          <span className="text-xs font-bold text-slate-500">{loadPercentage.toFixed(0)}%</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">{load.toFixed(2)}</span>
          <span className="text-sm font-medium text-slate-400">/ {capacity} MW</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
            style={{ width: `${loadPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Decorative background element */}
      <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-900/[0.03] group-hover:text-slate-900/[0.05] transition-colors pointer-events-none" />
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ logs, schedules, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      // Add a small delay for visual feedback if the fetch is too fast
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Optimization: Memoize latest unit data calculation
  const latestUnitsData = useMemo(() => {
    const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'];
    const results: { [key: string]: UnitMetrics | null } = {};
  
    // Sort logs once
    const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    units.forEach(unit => {
      const log = sortedLogs.find(l => l.units && l.units[unit]);
      results[unit] = log ? log.units[unit] : null;
    });

    return results;
  }, [logs]);

  // Logic to find latest data for each unit using the memoized data
  const getLatestUnitData = (unitName: string): UnitMetrics | null => {
    return latestUnitsData[unitName] || null;
  };

  // Calculate System Totals based on latest data
  const calculateSystemMetrics = () => {
    const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4'];
    let totalLoad = 0;
    let totalFreq = 0;
    let freqCount = 0;

    units.forEach(unit => {
      const data = getLatestUnitData(unit);
      if (data) {
        // Add Load
        totalLoad += Number(data.loadMW) || 0;
        
        // Add Frequency (only if running/value exists)
        if (Number(data.frequencyHz) > 0) {
          totalFreq += Number(data.frequencyHz);
          freqCount++;
        }
      }
    });

    const avgFreq = freqCount > 0 ? (totalFreq / freqCount).toFixed(2) : '0.00';

    return {
      totalLoad: totalLoad.toFixed(2),
      avgFreq: avgFreq
    };
  };

// --- Pengolahan Data Grafik dengan Pengisian Tanggal Kosong ---
  const chartData = useMemo(() => {
    const dailyData: { [key: string]: { totalMW: number; count: number; rawDate: Date } } = {};
    const now = new Date();
    
    // 1. Tentukan rentang waktu (misal: 14 hari terakhir agar grafik lebih lebar)
    const startDate = new Date();
    startDate.setDate(now.getDate() - 14); 

    // 2. Inisialisasi SETIAP HARI dalam rentang tersebut dengan nilai 0
    // Ini mencegah grafik meloncat/jumping jika ada hari tanpa log
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toLocaleDateString('id-ID');
      dailyData[dateKey] = { totalMW: 0, count: 0, rawDate: new Date(d) };
    }

    // 3. Masukkan data dari logs ke dalam kerangka tanggal yang sudah dibuat
    logs.forEach(log => {
      const dateObj = new Date(log.timestamp);
      
      // Filter hanya data dalam rentang dan bukan data masa depan (Ghost Data)
      if (dateObj > now || dateObj < startDate) return;

      const dateKey = dateObj.toLocaleDateString('id-ID');

      let entryTotalLoad = 0;
      if (log.units) {
        Object.values(log.units).forEach((u: any) => {
          entryTotalLoad += Number(u.loadMW) || 0;
        });
      }

      // Tambahkan ke akumulator jika tanggalnya ada dalam rentang dashboard
      if (dailyData[dateKey]) {
        dailyData[dateKey].totalMW += entryTotalLoad;
        dailyData[dateKey].count += 1;
      }
    });

    // 4. Ubah objek menjadi Array dan hitung rata-rata per hari
    return Object.values(dailyData).map(item => ({
      date: item.rawDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      // Jika tidak ada data (count === 0), nilai mw akan tetap 0 (garis akan turun)
      mw: item.count > 0 ? Number((item.totalMW / item.count).toFixed(2)) : 0,
      timestamp: item.rawDate.getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs]);

  // --- Filter Completed Change Overs (Today Only) ---
  // Defined BEFORE activeNotifications so it can be used there
  const completedCOs = useMemo(() => {
    const todayStr = new Date().toDateString(); // e.g. "Fri Feb 07 2025"
    return logs.filter(log => {
      const logDate = new Date(log.timestamp).toDateString();
      // Check if it's today AND it's a C.O log (based on note content)
      return logDate === todayStr && log.notes.includes('[CHANGE OVER]');
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  // --- Smart Notification Logic ---
  const activeNotifications = useMemo(() => {
    const currentDayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' }); // e.g., "Jumat"
    
    return schedules.filter(task => {
        // Condition 1: Explicitly Overdue or Due Soon from DB
        const isUrgentStatus = task.status === 'Due Soon' || task.status === 'Overdue';
        
        // Condition 2: Schedule string matches today's day name (case insensitive)
        // This catches "Jumat" tasks even if status isn't updated yet
        const isDayMatch = task.scheduleDay.toLowerCase().includes(currentDayName.toLowerCase());

        // Condition 3: Check if already completed TODAY
        // We check if any completed C.O log note contains this equipment's name
        const isAlreadyDone = completedCOs.some(log => log.notes.includes(task.equipmentName));

        // Display ONLY IF (Scheduled OR Urgent) AND (Not Done Yet)
        return (isUrgentStatus || isDayMatch) && !isAlreadyDone;
    });
  }, [schedules, completedCOs]); // Added completedCOs dependency

  const getShiftInfo = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Pagi: 08-15, Sore: 15-23, Malam: 23-08
    if (hour >= 8 && hour < 15) {
      return { current: 'Pagi', next: 'Sore', nextStart: '15:00' };
    } else if (hour >= 15 && hour < 23) {
      return { current: 'Sore', next: 'Malam', nextStart: '23:00' };
    } else {
      return { current: 'Malam', next: 'Pagi', nextStart: '08:00' };
    }
  };

  const systemMetrics = calculateSystemMetrics();
  const shiftInfo = getShiftInfo();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header / Actions Row */}
      <div className="flex justify-between items-center mb-2">
         <div className="text-xs text-slate-400 font-medium italic flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            Update Terakhir: {new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
         </div>
         <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95 disabled:opacity-70 cursor-pointer"
         >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            {isRefreshing ? 'Memuat Data...' : 'Refresh'}
         </button>
      </div>

      {/* Notifications Area - Change Over Schedule */}
      {activeNotifications.length > 0 && (
        <div className="bg-white border border-indigo-100 rounded-xl p-5 relative overflow-hidden shadow-sm animate-in slide-in-from-top-4 ring-1 ring-indigo-50">
           {/* Decorative Stripe */}
           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <BellRing className="w-5 h-5 text-indigo-600 animate-pulse" />
                  Pemberitahuan: Jadwal Change Over
                </h3>
                <p className="text-sm text-slate-600">
                  Terdapat <span className="font-bold text-indigo-700">{activeNotifications.length} peralatan</span> yang memiliki jadwal rotasi hari ini.
                </p>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                 {activeNotifications.map(task => {
                   const isOverdue = task.status === 'Overdue';
                   return (
                     <div key={task.id} className="flex-shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                             <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {isOverdue ? 'TERLAMBAT' : 'HARI INI'}
                             </span>
                             <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                                <Calendar className="w-3 h-3" /> {task.scheduleDay}
                             </span>
                          </div>
                          <div className="text-xs font-bold text-slate-700">{task.equipmentName}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                     </div>
                   );
                 })}
              </div>
           </div>
           
           {/* Background Decoration */}
           <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Unit Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UnitStatusCard unitName="Unit 1" data={getLatestUnitData('Unit 1')} />
        <UnitStatusCard unitName="Unit 2" data={getLatestUnitData('Unit 2')} />
        <UnitStatusCard unitName="Unit 3" data={getLatestUnitData('Unit 3')} />
        <UnitStatusCard unitName="Unit 4" data={getLatestUnitData('Unit 4')} />
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          metric={{
            id: 'total-load',
            label: 'Total Beban Pembangkit',
            value: systemMetrics.totalLoad,
            unit: 'MW',
            status: 'normal',
            trend: 'stable'
          }} 
          icon={<Zap className="w-6 h-6 text-blue-600" />} 
        />
        <MetricCard 
          metric={{
            id: 'avg-freq',
            label: 'Frekuensi Rata-rata',
            value: systemMetrics.avgFreq,
            unit: 'Hz',
            status: 'normal',
            trend: 'stable'
          }} 
          icon={<Activity className="w-6 h-6 text-purple-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
             <div>
               <h3 className="text-lg font-bold text-slate-800">Trend Beban Total (MW)</h3>
               <p className="text-sm text-slate-500">Estimasi akumulasi output berdasarkan data log aktual</p>
             </div>
          </div>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="mw" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMw)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Activity className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Belum ada data history untuk ditampilkan</p>
              </div>
            )}
          </div>
        </div>

        {/* System Notices */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Informasi Operasional</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px]">
             
             {/* Shift Info Card */}
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Jadwal Shift Berikutnya</span>
               <div className="font-medium text-slate-800">Shift {shiftInfo.next}</div>
               <div className="text-sm text-slate-500">Mulai {shiftInfo.nextStart} WIB</div>
             </div>

             {/* Completed Change Overs Card (New) */}
             <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
               <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 block flex items-center gap-1">
                 <RefreshCw className="w-3 h-3" /> C.O Terlaksana Hari Ini
               </span>
               {completedCOs.length > 0 ? (
                 <div className="space-y-3">
                    {completedCOs.map(log => {
                      // Simple parser for "[CHANGE OVER] Name. Details..."
                      const cleanNote = log.notes.replace('[CHANGE OVER]', '').trim();
                      const [equipName, ...details] = cleanNote.split('.');
                      
                      return (
                        <div key={log.id} className="relative pl-3 border-l-2 border-emerald-300">
                          <div className="text-[10px] text-emerald-600 font-mono mb-0.5">
                             {new Date(log.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB
                          </div>
                          <div className="text-xs font-bold text-slate-700 leading-tight">
                             {equipName}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                             {details.join('.')}
                          </div>
                        </div>
                      )
                    })}
                 </div>
               ) : (
                 <p className="text-xs text-slate-500 italic">Belum ada rotasi peralatan.</p>
               )}
             </div>
             
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
