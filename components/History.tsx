
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, UnitMetrics } from '../types';
import { Clock, Users, AlertCircle, CheckCircle2, Wrench, ChevronDown, ChevronRight, XCircle, PauseCircle, Calendar as CalendarIcon, Filter, FileText, ChevronLeft, Trash2, AlertTriangle, Box } from 'lucide-react';

interface HistoryProps {
  logs: LogEntry[];
  onDelete: (id: string) => void;
  canDelete: boolean;
}

type FilterMode = 'all' | 'specific-date';
type PairFilter = 'all' | 'Unit 1-2' | 'Unit 3-4';

const History: React.FC<HistoryProps> = ({ logs, onDelete, canDelete }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  
  // Calendar & Filter State
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [filterPair, setFilterPair] = useState<PairFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calendar Helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
    setSelectedDate(newDate);
    setFilterMode('specific-date');
    setShowCalendar(false);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Normal':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> OK</span>;
      case 'Issue':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> WRN</span>;
      case 'Maintenance':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"><Wrench className="w-3 h-3" /> MNT</span>;
      case 'Standby':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full"><PauseCircle className="w-3 h-3" /> STBY</span>;
      case 'Offline':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> OFF</span>;
      default:
        return null;
    }
  };

  const renderChecklistItem = (label: string, checked?: boolean) => {
    if (checked === undefined) return null;
    return (
       <span className={checked ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
          {checked ? '✓' : '○'} {label}
       </span>
    );
  };

  // Filter Logic (Date + Pair)
  const filteredLogs = logs.filter(log => {
    // 1. Check Date
    let dateMatch = true;
    if (filterMode === 'specific-date') {
        const logDate = new Date(log.timestamp);
        dateMatch = isSameDay(logDate, selectedDate);
    }

    // 2. Check Pair
    let pairMatch = true;
    if (filterPair !== 'all') {
        pairMatch = log.targetPair === filterPair;
    }

    return dateMatch && pairMatch;
  });

  const confirmDelete = () => {
    if (logToDelete) {
      onDelete(logToDelete);
      setLogToDelete(null);
    }
  };

  // Calendar Render Logic
  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(calendarViewDate);
    const startDay = firstDayOfMonth(calendarViewDate);
    const today = new Date();

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const currentDayDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), day);
      const isSelected = filterMode === 'specific-date' && isSameDay(currentDayDate, selectedDate);
      const isToday = isSameDay(currentDayDate, today);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-8 w-8 text-sm rounded-full flex items-center justify-center transition-all
            ${isSelected 
              ? 'bg-blue-600 text-white font-bold shadow-md' 
              : 'text-slate-700 hover:bg-slate-100'}
            ${isToday && !isSelected ? 'text-blue-600 font-bold border border-blue-200' : ''}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible animate-in fade-in duration-500 flex flex-col min-h-[500px] relative">
      
      {/* Delete Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Laporan?</h3>
              <p className="text-slate-500 mb-6">
                Tindakan ini tidak dapat dibatalkan. Laporan akan dihapus permanen dari riwayat.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Filter Control */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 relative">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
           <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
             <FileText className="w-4 h-4" />
           </div>
           Riwayat Laporan Shift
        </h3>
        
        <div className="flex flex-wrap items-center gap-2" ref={calendarRef}>
           
           {/* Unit Filter Dropdown */}
           <div className="relative">
              <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                 value={filterPair}
                 onChange={(e) => setFilterPair(e.target.value as PairFilter)}
                 className={`appearance-none pl-9 pr-8 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 ${
                    filterPair !== 'all'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                 }`}
              >
                 <option value="all">Semua Unit</option>
                 <option value="Unit 1-2">Unit 1-2</option>
                 <option value="Unit 3-4">Unit 3-4</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
           </div>

           {/* Date Filter Controls */}
           <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

           <button
             onClick={() => setFilterMode('all')}
             className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
               filterMode === 'all' 
                 ? 'bg-slate-800 text-white border-slate-800' 
                 : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
             }`}
           >
             Semua Tanggal
           </button>

           <div className="relative">
             <button
               onClick={() => setShowCalendar(!showCalendar)}
               className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                 filterMode === 'specific-date' || showCalendar
                   ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-100' 
                   : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
               }`}
             >
               <CalendarIcon className="w-4 h-4" />
               {filterMode === 'specific-date' 
                 ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                 : 'Pilih Tanggal'}
             </button>

             {/* Custom Calendar Popup */}
             {showCalendar && (
               <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 z-50 animate-in zoom-in-95 duration-200">
                 {/* Calendar Header */}
                 <div className="flex items-center justify-between mb-4">
                   <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                     <ChevronLeft className="w-4 h-4" />
                   </button>
                   <span className="text-sm font-bold text-slate-800">
                     {calendarViewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                   </span>
                   <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                     <ChevronRight className="w-4 h-4" />
                   </button>
                 </div>

                 {/* Weekday Labels */}
                 <div className="grid grid-cols-7 mb-2">
                   {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                     <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                       {day}
                     </div>
                   ))}
                 </div>

                 {/* Days Grid */}
                 <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                   {renderCalendarDays()}
                 </div>

                 {/* Today shortcut */}
                 <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <button 
                      onClick={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        setCalendarViewDate(today);
                        setFilterMode('specific-date');
                        setShowCalendar(false);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Hari Ini
                    </button>
                    <button 
                      onClick={() => setShowCalendar(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Tutup
                    </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        {filteredLogs.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Waktu & Shift</th>
                <th className="px-6 py-4">Grup</th>
                <th className="px-6 py-4">Unit Terlapor</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-medium text-sm">
                          {new Date(log.timestamp).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} • {log.shift}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {log.groupName.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-700">{log.groupName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">
                        {log.targetPair}
                      </span>
                    </td>
                    {/* MODIFIED: Increased width and line-clamp instead of truncate */}
                    <td className="px-6 py-4 align-top max-w-[350px]">
                      <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap leading-relaxed" title={log.notes}>
                        {log.notes}
                      </p>
                      {log.checklist && (
                        <span className="text-[10px] text-blue-600 mt-2 block font-medium">
                           ✓ Checklist Terlampir
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        {canDelete && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogToDelete(log.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Hapus Laporan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {expandedId === log.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedId === log.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={5} className="px-6 pb-6 pt-2">
                        <div className="border rounded-lg bg-white overflow-hidden shadow-sm animate-in slide-in-from-top-2 duration-200">
                          
                          {/* NEW: Full Notes Display in Expanded View */}
                          <div className="p-4 bg-blue-50/50 border-b border-blue-100">
                             <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
                                <div>
                                   <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Catatan Lengkap</h4>
                                   <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{log.notes}</p>
                                </div>
                             </div>
                          </div>

                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500 border-b">
                              <tr>
                                <th className="px-4 py-2 text-left">Unit</th>
                                <th className="px-4 py-2 text-center">Status</th>
                                <th className="px-4 py-2 text-right">MW</th>
                                <th className="px-4 py-2 text-right">Freq (Hz)</th>
                                <th className="px-4 py-2 text-right">Volt (kV)</th>
                                <th className="px-4 py-2 text-right">Steam (Bar)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {Object.entries(log.units).map(([unitName, data]) => {
                                const metrics = data as UnitMetrics;
                                return (
                                  <tr key={unitName}>
                                    <td className="px-4 py-3 font-medium text-slate-800">{unitName}</td>
                                    <td className="px-4 py-3 text-center">{getStatusBadge(metrics.status)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{metrics.loadMW}</td>
                                    <td className="px-4 py-3 text-right font-mono">{metrics.frequencyHz}</td>
                                    <td className="px-4 py-3 text-right font-mono">{metrics.voltageKV}</td>
                                    <td className="px-4 py-3 text-right font-mono">{metrics.steamInletBar}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          
                          {log.checklist && (
                            <div className="p-4 border-t bg-amber-50/30">
                              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Checklist Shift</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-700">
                                {/* Common Pagi */}
                                {renderChecklistItem(`Pemanasan EDG ${log.checklist.levelSolarEDG ? `(${log.checklist.levelSolarEDG} L)` : ''}`, log.checklist.pemanasanEDG)}
                                {renderChecklistItem('Housekeeping', log.checklist.housekeeping)}
                                {renderChecklistItem(`Pemanasan FF ${log.checklist.levelSolarFirefighting ? `(${log.checklist.levelSolarFirefighting} L)` : ''}`, log.checklist.pemanasanFirefighting)}
                                
                                {/* Unit 1-2 Specific */}
                                {renderChecklistItem('Drain Kompresor', log.checklist.drainKompresor)}
                                {renderChecklistItem('Purifier Oli Unit 1', log.checklist.purifierUnit1)}
                                {renderChecklistItem('Purifier Oli Unit 2', log.checklist.purifierUnit2)}
                                {renderChecklistItem('Engkol Turbin Unit 1', log.checklist.engkolManualUnit1)}
                                {renderChecklistItem('Engkol Turbin Unit 2', log.checklist.engkolManualUnit2)}

                                {/* Unit 3-4 Specific */}
                                {renderChecklistItem('Drain Separator', log.checklist.drainSeparator)}
                                {renderChecklistItem('Pemanasan Oil Pump', log.checklist.pemanasanPompaOil)}
                                {renderChecklistItem('Add NaOH Unit 3', log.checklist.penambahanNaOHUnit3)}
                                {renderChecklistItem('Add NaOH Unit 4', log.checklist.penambahanNaOHUnit4)}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">Tidak ada laporan ditemukan</p>
            <p className="text-sm opacity-70 mt-1">
              {filterMode === 'specific-date' 
                ? `Tidak ada data pada ${selectedDate.toLocaleDateString('id-ID')}` 
                : 'Belum ada data yang tersimpan'}
            </p>
            {filterMode === 'specific-date' && (
              <button onClick={() => setFilterMode('all')} className="mt-4 text-sm text-blue-600 font-bold hover:underline">
                Tampilkan Semua Data
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
