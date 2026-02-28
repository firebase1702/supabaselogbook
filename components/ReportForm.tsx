
import React, { useState, useEffect } from 'react';
import { LogEntry, UnitMetrics, ShiftChecklist } from '../types';
import { Save, Zap, Box, Gauge, Activity, CheckSquare, Power, PauseCircle, Wrench, Filter, RotateCw, FlaskConical, Sun, ArrowDownToLine, Trash2, Flame, Droplets, UserCircle, Calendar, ClipboardList, AlertTriangle, X } from 'lucide-react';

interface ReportFormProps {
  onSubmit: (log: LogEntry) => void;
}

// Initialize with empty strings so inputs start blank
const emptyUnitMetrics: any = {
  loadMW: '',
  frequencyHz: '',
  voltageKV: '',
  steamInletBar: '',
  status: 'Normal'
};

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit }) => {
  const [groupName, setGroupName] = useState('');
  const [shift, setShift] = useState<'Pagi' | 'Sore' | 'Malam'>('Pagi');
  const [targetPair, setTargetPair] = useState<'Unit 1-2' | 'Unit 3-4'>('Unit 1-2');
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Dynamic unit data state
  const [unitData, setUnitData] = useState<{ [key: string]: any }>({});
  const [checklist, setChecklist] = useState<ShiftChecklist>({});
  
  // Initialize unit data when pair changes
  useEffect(() => {
    const u1 = targetPair === 'Unit 1-2' ? 'Unit 1' : 'Unit 3';
    const u2 = targetPair === 'Unit 1-2' ? 'Unit 2' : 'Unit 4';
    
    setUnitData(prev => ({
      [u1]: prev[u1] || { ...emptyUnitMetrics },
      [u2]: prev[u2] || { ...emptyUnitMetrics }
    }));
    
    setChecklist({});
  }, [targetPair]);

  const handleUnitChange = (unitName: string, field: keyof UnitMetrics, value: any) => {
    setUnitData(prev => ({
      ...prev,
      [unitName]: {
        ...prev[unitName],
        [field]: value
      }
    }));
  };

  const handleLoadBlur = (unitName: string) => {
    const rawVal = unitData[unitName]?.loadMW;
    if (rawVal === '' || rawVal === undefined) return;
    
    let val = parseFloat(String(rawVal));
    if (isNaN(val)) return;

    // Logika Konversi Otomatis
    // 1. Jika nilai > 10000, asumsi input adalah Watt -> convert ke MW
    if (val > 10000) {
       val = val / 1000000;
    } 
    // 2. Jika nilai > 10, asumsi input adalah kW -> convert ke MW
    // Threshold 10 dipilih aman karena kapasitas per unit PLTP Ulumbu ~2.5 MW.
    // Jadi input seperti "800" (kW) akan menjadi "0.800" (MW).
    else if (val > 10) {
       val = val / 1000;
    }

    // Format ke 3 desimal string agar trailing zeros terlihat (misal: 1.500)
    handleUnitChange(unitName, 'loadMW', val.toFixed(3));
  };

  const handleChecklistChange = (field: keyof ShiftChecklist) => {
    setChecklist(prev => {
      const isActive = !prev[field];
      const newState = { ...prev, [field]: isActive };

      // Logika Saling Eksklusif (Mutual Exclusivity)
      // Jika satu unit dipilih, unit pasangannya otomatis mati
      if (isActive) {
        // Logika Purifier
        if (field === 'purifierUnit1') newState.purifierUnit2 = false;
        if (field === 'purifierUnit2') newState.purifierUnit1 = false;

        // Logika Engkol Manual
        if (field === 'engkolManualUnit1') newState.engkolManualUnit2 = false;
        if (field === 'engkolManualUnit2') newState.engkolManualUnit1 = false;
      }

      return newState;
    });
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const processSubmit = () => {
    const currentUnits = targetPair === 'Unit 1-2' ? ['Unit 1', 'Unit 2'] : ['Unit 3', 'Unit 4'];
    const finalUnitData: { [key: string]: UnitMetrics } = {};
    
    currentUnits.forEach(u => {
      const rawData = unitData[u] || emptyUnitMetrics;
      finalUnitData[u] = {
        ...rawData,
        loadMW: rawData.loadMW === '' ? 0 : Number(rawData.loadMW),
        frequencyHz: rawData.frequencyHz === '' ? 0 : Number(rawData.frequencyHz),
        voltageKV: rawData.voltageKV === '' ? 0 : Number(rawData.voltageKV),
        steamInletBar: rawData.steamInletBar === '' ? 0 : Number(rawData.steamInletBar),
        status: rawData.status
      };
    });

    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      groupName,
      shift,
      targetPair,
      units: finalUnitData,
      checklist: Object.keys(checklist).length > 0 ? checklist : undefined,
      notes,
    };

    onSubmit(newLog);
    
    // Reset form states
    setNotes('');
    setChecklist({});
    setShowConfirmation(false);
  };

  // Reusable Components
  const ChecklistButton = ({ label, active, onClick, icon: Icon }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 active:scale-95 h-full
        ${active 
          ? 'bg-blue-50/50 border-blue-500/50 shadow-sm' 
          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
    >
      <div className={`p-1.5 rounded-full ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`text-[10px] font-semibold leading-tight ${active ? 'text-blue-700' : 'text-slate-500'}`}>{label}</span>
      {active && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />}
    </button>
  );

  const renderUnitInputs = (unitName: string) => {
    const metrics = unitData[unitName] || emptyUnitMetrics;
    const isOnline = ['Normal', 'Issue'].includes(metrics.status);

    const setCategory = (online: boolean) => {
       if (online) handleUnitChange(unitName, 'status', 'Normal');
       else if (!['Standby', 'Maintenance'].includes(metrics.status)) handleUnitChange(unitName, 'status', 'Standby');
    };

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
        {/* Unit Header & Status Toggle */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${unitName.includes('1') || unitName.includes('3') ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <Box className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800">{unitName}</h3>
          </div>
          
          <div className="flex bg-slate-200/50 p-1 rounded-lg">
             <button
               type="button"
               onClick={() => setCategory(true)}
               className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${isOnline ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Zap className="w-3 h-3" /> ON
             </button>
             <button
               type="button"
               onClick={() => setCategory(false)}
               className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${!isOnline ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Power className="w-3 h-3" /> OFF
             </button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Offline Sub-status */}
          {!isOnline && (
            <div className="flex gap-3 p-1">
              {['Standby', 'Maintenance'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleUnitChange(unitName, 'status', s)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-all
                    ${metrics.status === s 
                      ? (s === 'Maintenance' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-100 border-slate-500 text-slate-700') 
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                >
                  {s === 'Maintenance' ? <Wrench className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Metrics Grid */}
          <div className={`grid grid-cols-2 gap-4 ${!isOnline ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
             {[
               { label: 'Beban', unit: 'MW', key: 'loadMW', icon: Zap, step: '0.001' },
               { label: 'Freq', unit: 'Hz', key: 'frequencyHz', icon: Activity, step: '0.01' },
               { label: 'Voltage', unit: 'kV', key: 'voltageKV', icon: Zap, step: '0.1' },
               { label: 'Steam Inlet Turbin', unit: 'Bar', key: 'steamInletBar', icon: Gauge, step: '1' }
             ].map((item) => (
               <div key={item.key} className="relative group">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                    <item.icon className="w-3 h-3" /> {item.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={item.step}
                      disabled={!isOnline}
                      value={metrics[item.key]}
                      onChange={(e) => handleUnitChange(unitName, item.key as any, e.target.value)}
                      onBlur={() => item.key === 'loadMW' && handleLoadBlur(unitName)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:text-slate-300"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none">
                      {item.unit}
                    </span>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  };

  const currentUnitA = targetPair === 'Unit 1-2' ? 'Unit 1' : 'Unit 3';
  const currentUnitB = targetPair === 'Unit 1-2' ? 'Unit 2' : 'Unit 4';

  return (
    <div className="max-w-5xl mx-auto pb-10 relative">
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-800 mb-2">Konfirmasi Simpan</h3>
              <p className="text-center text-slate-600 mb-6">
                Apakah Anda yakin data laporan <strong>{targetPair}</strong> untuk shift <strong>{shift}</strong> sudah benar?
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm border border-slate-100">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Grup / Operator</span>
                  <span className="font-semibold text-slate-700">{groupName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Checklist</span>
                  <span className="font-semibold text-slate-700">{Object.keys(checklist).length} item dicek</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={processSubmit}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Ya, Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation / Unit Selector */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
          {['Unit 1-2', 'Unit 3-4'].map((pair) => (
            <button
              key={pair}
              onClick={() => setTargetPair(pair as any)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                targetPair === pair 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              Laporan {pair}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleInitialSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Metadata Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <UserCircle className="w-4 h-4" /> Operator / Grup
              </label>
              <input
                required
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Nama Operator atau Grup Shift"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Pilihan Shift
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Pagi', 'Sore', 'Malam'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(s as any)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      shift === s 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Checklist Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-500" />
            <h3 className="font-bold text-slate-800">Checklist & Tugas</h3>
          </div>
          
          <div className="p-6 grid gap-8">
            {/* Rutinitas Pagi */}
            {shift === 'Pagi' && (
              <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-amber-400 rounded-r-full"></div>
                <h4 className="text-xs font-bold text-amber-600 uppercase mb-3 flex items-center gap-2">
                  <Sun className="w-4 h-4" /> Rutinitas Pagi
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <div className="flex flex-col gap-2 h-full">
                    <ChecklistButton label="Pemanasan EDG" active={checklist.pemanasanEDG} onClick={() => handleChecklistChange('pemanasanEDG')} icon={Zap} />
                    {checklist.pemanasanEDG && (
                      <input 
                        type="number" 
                        placeholder="Level Solar (L)" 
                        value={checklist.levelSolarEDG || ''}
                        onChange={(e) => setChecklist(prev => ({...prev, levelSolarEDG: e.target.value}))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    <ChecklistButton label="Housekeeping" active={checklist.housekeeping} onClick={() => handleChecklistChange('housekeeping')} icon={Trash2} />
                  </div>
                  <div className="flex flex-col gap-2 h-full">
                    <ChecklistButton label="Pemanasan Firefighting" active={checklist.pemanasanFirefighting} onClick={() => handleChecklistChange('pemanasanFirefighting')} icon={Flame} />
                    {checklist.pemanasanFirefighting && (
                      <input 
                        type="number" 
                        placeholder="Level Solar (L)" 
                        value={checklist.levelSolarFirefighting || ''}
                        onChange={(e) => setChecklist(prev => ({...prev, levelSolarFirefighting: e.target.value}))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    )}
                  </div>
                  
                  {targetPair === 'Unit 1-2' && (
                    <div className="flex flex-col gap-2 h-full">
                      <ChecklistButton label="Drain Kompresor" active={checklist.drainKompresor} onClick={() => handleChecklistChange('drainKompresor')} icon={ArrowDownToLine} />
                    </div>
                  )}
                  {targetPair === 'Unit 3-4' && (
                    <>
                      <div className="flex flex-col gap-2 h-full">
                        <ChecklistButton label="Drain Separator" active={checklist.drainSeparator} onClick={() => handleChecklistChange('drainSeparator')} icon={ArrowDownToLine} />
                      </div>
                      <div className="flex flex-col gap-2 h-full">
                        <ChecklistButton label="Pemanasan Oil Pump" active={checklist.pemanasanPompaOil} onClick={() => handleChecklistChange('pemanasanPompaOil')} icon={Droplets} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Operasional Unit */}
            <div>
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Tugas Operasional
                 </h4>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {targetPair === 'Unit 1-2' ? (
                    <>
                      <ChecklistButton label="Purifier Oil U1" active={checklist.purifierUnit1} onClick={() => handleChecklistChange('purifierUnit1')} icon={Filter} />
                      <ChecklistButton label="Purifier Oil U2" active={checklist.purifierUnit2} onClick={() => handleChecklistChange('purifierUnit2')} icon={Filter} />
                      <ChecklistButton label="Engkol Manual U1" active={checklist.engkolManualUnit1} onClick={() => handleChecklistChange('engkolManualUnit1')} icon={RotateCw} />
                      <ChecklistButton label="Engkol Manual U2" active={checklist.engkolManualUnit2} onClick={() => handleChecklistChange('engkolManualUnit2')} icon={RotateCw} />
                    </>
                  ) : (
                    <>
                      <ChecklistButton label="Add NaOH U3" active={checklist.penambahanNaOHUnit3} onClick={() => handleChecklistChange('penambahanNaOHUnit3')} icon={FlaskConical} />
                      <ChecklistButton label="Add NaOH U4" active={checklist.penambahanNaOHUnit4} onClick={() => handleChecklistChange('penambahanNaOHUnit4')} icon={FlaskConical} />
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Unit Data Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderUnitInputs(targetPair === 'Unit 1-2' ? 'Unit 1' : 'Unit 3')}
          {renderUnitInputs(targetPair === 'Unit 1-2' ? 'Unit 2' : 'Unit 4')}
        </div>

        {/* Notes & Submit */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Catatan Tambahan</label>
           <textarea
             required
             rows={3}
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
             placeholder={`Tuliskan kondisi abnormal, temuan inspeksi, atau catatan penting lainnya untuk ${targetPair}...`}
           />
           <div className="mt-6 flex justify-end">
             <button
               type="submit"
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 hover:-translate-y-0.5"
             >
               <Save className="w-5 h-5" />
               Simpan Laporan
             </button>
           </div>
        </div>

      </form>
    </div>
  );
};

export default ReportForm;
