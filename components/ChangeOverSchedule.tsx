
import React, { useState, useEffect, useRef } from 'react';
import { ChangeOverTask, LogEntry, UnitMetrics, UserRole } from '../types';
import { CalendarClock, RefreshCw, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, ArrowRightLeft, Box, X, ListChecks, ArrowRight, ShieldAlert, ClipboardEdit, Settings, Plus, Edit, Trash2, Save, FileText, ChevronRight, CheckSquare, Square, ChevronLeft } from 'lucide-react';

interface ChangeOverScheduleProps {
  initialTasks: ChangeOverTask[]; // Passed from App (Schedules State)
  onRecordLog: (log: LogEntry) => void;
  onUpdateTask: (task: ChangeOverTask) => void; // New prop to sync with Supabase via App
  onAddTask: (task: ChangeOverTask) => void;
  onDeleteTask: (id: string) => void;
  role: UserRole;
}

const ChangeOverSchedule: React.FC<ChangeOverScheduleProps> = ({ 
    initialTasks, 
    onRecordLog, 
    onUpdateTask,
    onAddTask,
    onDeleteTask,
    role
}) => {
  // We sync local tasks state with props to ensure updates from App (e.g. initial fetch) are reflected
  const [tasks, setTasks] = useState<ChangeOverTask[]>(initialTasks);

  useEffect(() => {
      setTasks(initialTasks);
  }, [initialTasks]);

  const [activeTab, setActiveTab] = useState<'Unit 1-2' | 'Unit 3-4'>('Unit 1-2');
  const [viewMode, setViewMode] = useState<'execution' | 'management'>('execution');
  
  // -- Execution State --
  const [selectedTask, setSelectedTask] = useState<ChangeOverTask | null>(null);
  const [executionNote, setExecutionNote] = useState('');
  const [manualTarget, setManualTarget] = useState<'A' | 'B' | 'C' | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  // -- Management Form State --
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ChangeOverTask>>({
    equipmentName: '',
    targetUnit: 'Unit 1-2',
    frequency: 'Mingguan',
    scheduleDay: '',
    currentRunning: 'A',
    labelA: '',
    labelB: '',
    labelC: '',
    procedures: [],
    precautions: []
  });

  // -- Calendar State for Form --
  const [showFormCalendar, setShowFormCalendar] = useState(false);
  const [formCalendarDate, setFormCalendarDate] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Raw text state for array inputs
  const [rawProcedures, setRawProcedures] = useState('');
  const [rawPrecautions, setRawPrecautions] = useState('');

  // --- Helpers ---
  const getNextTarget = (task: ChangeOverTask): 'A' | 'B' | 'C' => {
     if (task.labelC) {
        if (task.currentRunning === 'A') return 'B';
        if (task.currentRunning === 'B') return 'C';
        return 'A';
     }
     return task.currentRunning === 'A' ? 'B' : 'A';
  };

  const getShift = (): 'Pagi' | 'Sore' | 'Malam' => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 15) return 'Pagi';
    if (hour >= 15 && hour < 23) return 'Sore';
    return 'Malam';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Schedule': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Due Soon': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'On Schedule': return <CheckCircle2 className="w-4 h-4" />;
      case 'Due Soon': return <Clock className="w-4 h-4" />;
      case 'Overdue': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowFormCalendar(false);
      }
    };
    if (showFormCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFormCalendar]);

  // Calendar Helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setFormCalendarDate(new Date(formCalendarDate.getFullYear(), formCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setFormCalendarDate(new Date(formCalendarDate.getFullYear(), formCalendarDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(formCalendarDate.getFullYear(), formCalendarDate.getMonth(), day);
    const formattedDate = selectedDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    setFormData({ ...formData, scheduleDay: formattedDate });
    setShowFormCalendar(false);
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(formCalendarDate);
    const startDay = firstDayOfMonth(formCalendarDate);
    const today = new Date();

    // Empty slots
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Days
    for (let day = 1; day <= totalDays; day++) {
      const current = new Date(formCalendarDate.getFullYear(), formCalendarDate.getMonth(), day);
      const isToday = current.getDate() === today.getDate() && current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear();
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          className={`h-8 w-8 text-xs rounded-full flex items-center justify-center transition-all hover:bg-blue-50 hover:text-blue-600
            ${isToday ? 'bg-blue-100 text-blue-700 font-bold border border-blue-200' : 'text-slate-700'}
          `}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  // --- Execution Logic ---
  const handleSwap = (id: string) => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const nextState = (task.labelC && manualTarget) ? manualTarget : getNextTarget(task);
    
    // Create the updated task object
    const updatedTask: ChangeOverTask = {
        ...task,
        currentRunning: nextState,
        lastPerformed: new Date().toISOString(),
        status: 'On Schedule'
    };

    // 1. Trigger Parent Update (Supabase)
    onUpdateTask(updatedTask);

    // 2. Create Log Entry for History
    const emptyMetrics: UnitMetrics = {
        loadMW: 0, frequencyHz: 0, voltageKV: 0, steamInletBar: 0, status: 'Normal'
    };
    
    const unitsMap: { [key: string]: UnitMetrics } = {};
    if (task.targetUnit === 'Unit 1-2') {
        unitsMap['Unit 1'] = emptyMetrics;
        unitsMap['Unit 2'] = emptyMetrics;
    } else {
        unitsMap['Unit 3'] = emptyMetrics;
        unitsMap['Unit 4'] = emptyMetrics;
    }

    const fromLabel = task.currentRunning === 'A' ? task.labelA : task.currentRunning === 'B' ? task.labelB : task.labelC;
    const toLabel = nextState === 'A' ? task.labelA : nextState === 'B' ? task.labelB : task.labelC;
    
    const logNote = `[CHANGE OVER] ${task.equipmentName}. 
    Berpindah dari: ${task.currentRunning} (${fromLabel}) -> Ke: ${nextState} (${toLabel}).
    Catatan Operator: ${executionNote || 'Tidak ada catatan khusus.'}`;

    const newLogEntry: LogEntry = {
        id: `log-co-${Date.now()}`,
        timestamp: new Date().toISOString(),
        groupName: 'Operator (C.O)',
        shift: getShift(),
        targetPair: task.targetUnit,
        units: unitsMap,
        checklist: undefined, 
        notes: logNote
    };

    onRecordLog(newLogEntry);
    
    // Reset Modal
    setSelectedTask(null);
    setExecutionNote('');
    setManualTarget(null);
    setCheckedSteps([]);
  };

  const openExecutionModal = (task: ChangeOverTask) => {
    setSelectedTask(task);
    setExecutionNote('');
    setCheckedSteps([]);
    if (task.labelC) {
        let next: 'A'|'B'|'C' = 'A';
        if (task.currentRunning === 'A') next = 'B';
        if (task.currentRunning === 'B') next = 'C';
        if (task.currentRunning === 'C') next = 'A';
        setManualTarget(next);
    } else {
        setManualTarget(null);
    }
  };

  const toggleStep = (index: number) => {
     setCheckedSteps(prev => 
       prev.includes(index) 
         ? prev.filter(i => i !== index) 
         : [...prev, index]
     );
  };

  // --- Management Logic ---
  const handleEditClick = (task: ChangeOverTask) => {
      setEditingId(task.id);
      setFormData(task);
      setRawProcedures(task.procedures ? task.procedures.join('\n') : '');
      setRawPrecautions(task.precautions ? task.precautions.join('\n') : '');
      setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
      setEditingId(null);
      setFormData({
        equipmentName: '',
        targetUnit: activeTab, // Default to current tab
        frequency: 'Mingguan',
        scheduleDay: 'Senin',
        currentRunning: 'A',
        status: 'On Schedule',
        labelA: 'Unit A',
        labelB: 'Unit B',
        labelC: '', 
      });
      setRawProcedures('');
      setRawPrecautions('');
      setIsFormOpen(true);
  };

  const handleDeleteTaskHandler = (id: string) => {
      if (confirm('Apakah Anda yakin ingin menghapus jadwal peralatan ini?')) {
          onDeleteTask(id);
      }
  };

  const handleSaveForm = (e: React.FormEvent) => {
      e.preventDefault();
      
      const proceduresArray = rawProcedures.split('\n').filter(line => line.trim() !== '');
      const precautionsArray = rawPrecautions.split('\n').filter(line => line.trim() !== '');

      const taskData = {
          ...formData,
          procedures: proceduresArray,
          precautions: precautionsArray,
          lastPerformed: formData.lastPerformed || new Date().toISOString(),
          labelC: formData.labelC && formData.labelC.trim() !== '' ? formData.labelC : undefined 
      } as ChangeOverTask;

      if (editingId) {
          // Update Existing
          const updatedTask = { ...taskData, id: editingId };
          onUpdateTask(updatedTask);
      } else {
          // Create New
          // We pass it to Parent, let parent handle ID generation via DB
          onAddTask(taskData);
      }
      setIsFormOpen(false);
  };

  // --- Render Helpers ---
  const filteredTasks = tasks.filter(task => task.targetUnit === activeTab);

  const getEquipmentOptions = () => {
    if (formData.targetUnit === 'Unit 1-2') {
        return ['Pompa ACWP', 'Kompresor', 'Change Over Unit 1 & Unit 2'];
    } else {
        return ['Pompa CWP Unit 3', 'Pompa CWP Unit 4'];
    }
  };

  const renderPumpIndicator = (position: 'A' | 'B' | 'C', task: ChangeOverTask) => {
      const isRunning = task.currentRunning === position;
      let label = '';
      if (position === 'A') label = task.labelA || 'Unit A';
      else if (position === 'B') label = task.labelB || 'Unit B';
      else label = task.labelC || 'Unit C';

      return (
        <div className="flex flex-col items-center gap-2 w-full z-10">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shadow-sm ${isRunning ? 'bg-emerald-500 border-emerald-600 text-white ring-4 ring-emerald-100' : 'bg-white border-slate-300 text-slate-400'}`}>
            {position}
          </div>
          <div className="text-center">
            <span className={`block text-[10px] font-bold uppercase mb-0.5 ${isRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isRunning ? 'RUNNING' : 'STANDBY'}
            </span>
            <span className="text-xs font-semibold text-slate-700 leading-tight block">
                {label}
            </span>
          </div>
        </div>
      );
  };

  const renderTargetSelection = () => {
    if (!selectedTask) return null;
    if (!selectedTask.labelC) {
        const target = getNextTarget(selectedTask);
        const label = target === 'A' ? selectedTask.labelA : selectedTask.labelB;
        return (
            <div className="font-bold text-blue-700 flex flex-col items-center justify-center gap-1 h-full">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                    {target}
                </span>
                <span className="text-xs text-center">{label}</span>
            </div>
        );
    }
    const options: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    const availableOptions = options.filter(o => o !== selectedTask.currentRunning);

    return (
        <div className="flex flex-col gap-2 w-full">
            {availableOptions.map(opt => {
                let label = '';
                if (opt === 'A') label = selectedTask.labelA || 'Unit A';
                if (opt === 'B') label = selectedTask.labelB || 'Unit B';
                if (opt === 'C') label = selectedTask.labelC || 'Unit C';
                const isSelected = manualTarget === opt;
                return (
                    <button
                        key={opt}
                        onClick={() => setManualTarget(opt)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs text-left transition-all relative overflow-hidden ${
                            isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                    >
                        <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${
                            isSelected ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                            {opt}
                        </span>
                        <span className="font-semibold truncate">{label}</span>
                        {isSelected && <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400"></div>}
                    </button>
                );
            })}
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Management Form Modal */}
      {isFormOpen && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     {editingId ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                     {editingId ? 'Edit Jadwal Peralatan' : 'Tambah Jadwal Peralatan'}
                  </h3>
                  <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="p-6 overflow-y-auto">
                  <form id="scheduleForm" onSubmit={handleSaveForm} className="space-y-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Nama Peralatan</label>
                           <select
                              required
                              value={formData.equipmentName}
                              onChange={e => setFormData({...formData, equipmentName: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           >
                               <option value="" disabled>Pilih Peralatan</option>
                               {getEquipmentOptions().map(opt => (
                                   <option key={opt} value={opt}>{opt}</option>
                               ))}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-bold text-slate-500 uppercase">Frekuensi</label>
                           <select 
                              value={formData.frequency}
                              onChange={e => setFormData({...formData, frequency: e.target.value as any})}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                           >
                              <option value="3 Harian">3 Harian</option>
                              <option value="Mingguan">Mingguan</option>
                              <option value="2 Mingguan">2 Mingguan</option>
                              <option value="Bulanan">Bulanan</option>
                              <option value="Sesuai Jadwal Operasi">Sesuai Jadwal Operasi</option>
                           </select>
                        </div>
                        <div className="space-y-1 relative md:col-span-2" ref={calendarRef}>
                           <label className="text-xs font-bold text-slate-500 uppercase">
                             {formData.frequency === 'Sesuai Jadwal Operasi' ? 'Tanggal Rencana Pelaksanaan' : 'Jadwal Hari'}
                           </label>
                           
                           {/* Conditional Input: Calendar Picker vs Text Input */}
                           {formData.frequency === 'Sesuai Jadwal Operasi' ? (
                             <>
                               <button
                                 type="button"
                                 onClick={() => setShowFormCalendar(!showFormCalendar)}
                                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between hover:bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 transition-all"
                               >
                                 <span className={formData.scheduleDay ? 'text-slate-800' : 'text-slate-400'}>
                                   {formData.scheduleDay || 'Pilih Tanggal...'}
                                 </span>
                                 <CalendarIcon className="w-4 h-4 text-slate-400" />
                               </button>

                               {/* Popup Calendar */}
                               {showFormCalendar && (
                                 <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-64 z-50 animate-in zoom-in-95 duration-200">
                                   <div className="flex items-center justify-between mb-4">
                                     <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                                       <ChevronLeft className="w-4 h-4" />
                                     </button>
                                     <span className="text-sm font-bold text-slate-800">
                                       {formCalendarDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                     </span>
                                     <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                                       <ChevronRight className="w-4 h-4" />
                                     </button>
                                   </div>
                                   <div className="grid grid-cols-7 mb-2">
                                     {['Mn','Sn','Sl','Rb','Km','Jm','Sb'].map(d => (
                                       <div key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</div>
                                     ))}
                                   </div>
                                   <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                                     {renderCalendar()}
                                   </div>
                                 </div>
                               )}
                             </>
                           ) : (
                             <input 
                                required
                                type="text" 
                                value={formData.scheduleDay}
                                onChange={e => setFormData({...formData, scheduleDay: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Contoh: Senin, Tanggal 1"
                             />
                           )}
                        </div>
                     </div>

                     <div className="pt-4 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Konfigurasi Unit</label>
                        <div className="grid grid-cols-3 gap-3">
                           <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Label Unit A</label>
                              <input 
                                 type="text" 
                                 value={formData.labelA} 
                                 onChange={e => setFormData({...formData, labelA: e.target.value})}
                                 className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50"
                                 placeholder="Misal: Pompa A"
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Label Unit B</label>
                              <input 
                                 type="text" 
                                 value={formData.labelB} 
                                 onChange={e => setFormData({...formData, labelB: e.target.value})}
                                 className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50"
                                 placeholder="Misal: Pompa B"
                              />
                           </div>
                           <div className="relative">
                              <label className="block text-[10px] text-slate-400 mb-1">Label Unit C (Opsional)</label>
                              <input 
                                 type="text" 
                                 value={formData.labelC || ''} 
                                 onChange={e => setFormData({...formData, labelC: e.target.value})}
                                 className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50"
                                 placeholder="Kosongkan jika hanya 2"
                              />
                           </div>
                        </div>
                        <div className="mt-3">
                            <label className="text-[10px] text-slate-400 mb-1 block">Posisi Running Saat Ini</label>
                            <div className="flex gap-2">
                                {['A', 'B', 'C'].map(pos => (
                                    <button
                                        key={pos}
                                        type="button"
                                        disabled={pos === 'C' && (!formData.labelC)}
                                        onClick={() => setFormData({...formData, currentRunning: pos as any})}
                                        className={`w-8 h-8 rounded-full text-xs font-bold border ${formData.currentRunning === pos ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'} ${pos === 'C' && !formData.labelC ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Prosedur (Satu baris per langkah)</label>
                            <textarea 
                                value={rawProcedures}
                                onChange={e => setRawProcedures(e.target.value)}
                                className="w-full h-32 p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none"
                                placeholder="1. Buka valve...&#10;2. Start pompa..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-amber-500"/> Precautions (Safety)</label>
                            <textarea 
                                value={rawPrecautions}
                                onChange={e => setRawPrecautions(e.target.value)}
                                className="w-full h-32 p-3 text-xs bg-amber-50 border border-amber-200 rounded-lg outline-none resize-none"
                                placeholder="Gunakan APD lengkap..."
                            />
                        </div>
                     </div>
                  </form>
               </div>

               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                  <button 
                     type="button"
                     onClick={() => setIsFormOpen(false)}
                     className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50"
                  >
                     Batal
                  </button>
                  <button 
                     type="submit"
                     form="scheduleForm"
                     className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md"
                  >
                     Simpan Data
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Execution Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Prosedur Change Over</h3>
                <p className="text-sm text-slate-500">{selectedTask.equipmentName}</p>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-6 overflow-y-auto">
               
               {/* Progress Bar Header */}
               <div className="mb-6">
                 <div className="flex justify-between items-end mb-2">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                     Progres Pelaksanaan
                   </span>
                   <span className="text-xs font-bold text-blue-600">
                     {Math.round((checkedSteps.length / (selectedTask.procedures?.length || 1)) * 100)}%
                   </span>
                 </div>
                 <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                   <div 
                     className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                     style={{ width: `${(checkedSteps.length / (selectedTask.procedures?.length || 1)) * 100}%` }}
                   ></div>
                 </div>
               </div>

               {/* Safety / Precautions Box */}
               {selectedTask.precautions && selectedTask.precautions.length > 0 && (
                 <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-amber-700 uppercase flex items-center gap-2 mb-2">
                       <ShieldAlert className="w-4 h-4" /> Safety Notice
                    </h4>
                    <ul className="space-y-1.5 ml-1">
                      {selectedTask.precautions.map((item, idx) => (
                        <li key={idx} className="text-xs text-amber-800 flex items-start gap-2 leading-relaxed">
                          <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                 </div>
               )}

               {/* Context Box: From -> To Selection */}
               <div className="flex items-stretch gap-3 mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  {/* FROM */}
                  <div className="flex-1 text-center border-r border-blue-200 pr-3 flex flex-col justify-center">
                     <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Dari (Running)</span>
                     <div className="font-bold text-slate-700 flex flex-col items-center justify-center gap-1">
                        <span className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold shadow-inner border border-slate-300">
                            {selectedTask.currentRunning}
                        </span>
                        <span className="text-xs text-slate-500">
                            {selectedTask.currentRunning === 'A' && selectedTask.labelA}
                            {selectedTask.currentRunning === 'B' && selectedTask.labelB}
                            {selectedTask.currentRunning === 'C' && selectedTask.labelC}
                        </span>
                     </div>
                  </div>
                  
                  {/* Arrow */}
                  <div className="self-center">
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                  </div>

                  {/* TO (Dynamic) */}
                  <div className="flex-1 pl-3 flex flex-col justify-center">
                     <span className="text-[10px] uppercase font-bold text-blue-500 block mb-2 text-center">
                        {selectedTask.labelC ? 'Pilih Target' : 'Ke (Standby)'}
                     </span>
                     {renderTargetSelection()}
                  </div>
               </div>

               {/* Steps List (Checklist Mode) */}
               <div className="space-y-4 mb-6">
                 <div className="flex justify-between items-center">
                   <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <ListChecks className="w-4 h-4" /> Checklist Langkah Kerja
                   </h4>
                   <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                     {checkedSteps.length} / {selectedTask.procedures?.length || 0} Selesai
                   </span>
                 </div>

                 {selectedTask.procedures && selectedTask.procedures.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedTask.procedures.map((step, idx) => {
                        const isChecked = checkedSteps.includes(idx);
                        return (
                          <li 
                             key={idx} 
                             onClick={() => toggleStep(idx)}
                             className={`flex gap-3 text-sm p-3 rounded-xl border transition-all cursor-pointer group select-none ${
                               isChecked 
                                ? 'bg-emerald-50 border-emerald-200 text-slate-600' 
                                : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'
                             }`}
                          >
                             <div className={`mt-0.5 flex-shrink-0 transition-colors ${isChecked ? 'text-emerald-500' : 'text-slate-300 group-hover:text-blue-400'}`}>
                                {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                             </div>
                             <span className={`leading-snug transition-all ${isChecked ? 'line-through opacity-60' : ''}`}>{step}</span>
                          </li>
                        );
                      })}
                    </ul>
                 ) : (
                    <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                       <p className="text-sm">Tidak ada prosedur spesifik. Lakukan sesuai SOP umum.</p>
                    </div>
                 )}
               </div>

               {/* Notes Input */}
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <ClipboardEdit className="w-4 h-4" /> Catatan Pelaksanaan / Temuan
                 </label>
                 <textarea
                    value={executionNote}
                    onChange={(e) => setExecutionNote(e.target.value)}
                    placeholder="Contoh: Vibrasi pompa target normal, arus stabil..."
                    className="w-full min-h-[80px] p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none placeholder:text-slate-400"
                 />
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button 
                onClick={() => setSelectedTask(null)}
                className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => handleSwap(selectedTask.id)}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Konfirmasi & Switch
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 shadow-lg text-white mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
            <CalendarClock className="w-8 h-8 text-blue-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Jadwal Change Over (C.O)</h2>
            <p className="text-slate-300 text-sm">
              Monitoring rotasi peralatan untuk menjaga kehandalan dan meratakan jam operasi.
            </p>
          </div>
        </div>
        
        {/* View Switcher (Tabs) */}
        <div className="flex gap-2 mt-6">
            <button
                onClick={() => setViewMode('execution')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'execution' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
            >
                <RefreshCw className="w-4 h-4" />
                Pelaksanaan (Operasional)
            </button>
            
            {/* MANAGEMENT TAB - ONLY ADMIN */}
            {role === 'admin' && (
                <button
                    onClick={() => setViewMode('management')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'management' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                >
                    <Settings className="w-4 h-4" />
                    Manajemen Jadwal
                </button>
            )}
        </div>
      </div>

      {/* Content - Tab Navigation (Unit) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="bg-slate-100 p-1.5 rounded-xl flex items-center justify-start gap-2 overflow-x-auto w-fit">
            {(['Unit 1-2', 'Unit 3-4'] as const).map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap
                ${activeTab === tab 
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                `}
            >
                <Box className="w-4 h-4" />
                {tab}
            </button>
            ))}
        </div>
        
        {viewMode === 'management' && role === 'admin' && (
             <button 
                onClick={handleAddNewClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
             >
                <Plus className="w-4 h-4" /> Tambah Peralatan
             </button>
        )}
      </div>

      {/* MODE: EXECUTION (Original Grid) */}
      {viewMode === 'execution' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
            {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
                const hasThreeUnits = !!task.labelC;

                return (
                <div key={task.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                    <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">{task.equipmentName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {task.frequency}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" /> {task.scheduleDay}
                        </span>
                        </div>
                    </div>
                    </div>
                    
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)} {task.status}
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                    <div className="flex items-center justify-between mb-6 relative">
                    {/* Visual Line */}
                    <div className="absolute top-[20px] left-0 right-0 h-1 bg-slate-100 -z-0 rounded-full mx-6"></div>

                    {/* Dynamic Columns based on Unit Count */}
                    <div className={`grid ${hasThreeUnits ? 'grid-cols-3' : 'grid-cols-2'} w-full gap-2`}>
                        {renderPumpIndicator('A', task)}
                        {renderPumpIndicator('B', task)}
                        {hasThreeUnits && renderPumpIndicator('C', task)}
                    </div>
                    
                    {/* Arrow Overlay for 2 units */}
                    {!hasThreeUnits && (
                        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 p-1.5 bg-slate-50 rounded-full border border-slate-200 text-slate-400 z-20">
                            <ArrowRightLeft className="w-3 h-3" />
                        </div>
                    )}
                    </div>

                    <div className="flex justify-between items-center mb-4">
                       <div className="bg-slate-50 rounded-lg p-2 px-3 text-xs text-slate-500 border border-slate-100">
                          <span className="block text-[10px] text-slate-400">Terakhir:</span>
                          <span className="font-semibold text-slate-700">
                              {new Date(task.lastPerformed).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                          </span>
                       </div>
                       
                       {/* Total Steps Indicator on Card */}
                       {task.procedures && task.procedures.length > 0 && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100" title="Jumlah langkah kerja">
                              <ListChecks className="w-3.5 h-3.5" />
                              <span className="font-bold">{task.procedures.length}</span> Langkah
                          </div>
                       )}
                    </div>

                    {role === 'admin' ? (
                       <button
                          disabled
                          className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                       >
                          <ShieldAlert className="w-4 h-4" />
                          Mode Admin (Monitoring)
                       </button>
                    ) : (
                       <button
                          onClick={() => openExecutionModal(task)}
                          className="w-full py-2.5 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-700 font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
                       >
                          <RefreshCw className="w-4 h-4" />
                          Lakukan Change Over
                       </button>
                    )}
                </div>
                </div>
            )})
            ) : (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Tidak ada jadwal Change Over.</p>
                <p className="text-sm opacity-70">Tidak ada peralatan yang perlu dirotasi pada grup {activeTab}.</p>
            </div>
            )}
        </div>
      )}

      {/* MODE: MANAGEMENT (Table List) */}
      {viewMode === 'management' && (
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
            <table className="w-full text-left">
               <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4">Nama Peralatan</th>
                     <th className="px-6 py-4">Frekuensi & Jadwal</th>
                     <th className="px-6 py-4">Konfigurasi</th>
                     <th className="px-6 py-4">Running</th>
                     <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {filteredTasks.length > 0 ? (
                     filteredTasks.map(task => (
                        <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <span className="font-bold text-slate-800 block text-sm">{task.equipmentName}</span>
                              <span className="text-xs text-slate-400">{task.targetUnit}</span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex flex-col text-sm">
                                 <span className="font-medium text-blue-600">{task.frequency}</span>
                                 <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {task.scheduleDay}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                                 <Box className="w-3 h-3" />
                                 {task.labelC ? '3 Unit (A/B/C)' : '2 Unit (A/B)'}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                 <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold border border-emerald-200">
                                    {task.currentRunning}
                                 </span>
                                 <span className="text-xs text-slate-500">
                                     {task.currentRunning === 'A' && task.labelA}
                                     {task.currentRunning === 'B' && task.labelB}
                                     {task.currentRunning === 'C' && task.labelC}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                    onClick={() => handleEditClick(task)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"
                                 >
                                    <Edit className="w-4 h-4" />
                                 </button>
                                 <button 
                                    onClick={() => handleDeleteTaskHandler(task.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                           <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                           <p>Belum ada data jadwal.</p>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      )}

    </div>
  );
};

export default ChangeOverSchedule;
