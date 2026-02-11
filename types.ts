
export interface Metric {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

export interface UnitMetrics {
  loadMW: number;
  frequencyHz: number;
  voltageKV: number;
  steamInletBar: number;
  status: 'Normal' | 'Issue' | 'Maintenance' | 'Standby' | 'Offline';
}

export interface ShiftChecklist {
  // Common Pagi Tasks
  pemanasanEDG?: boolean;
  housekeeping?: boolean;
  pemanasanFirefighting?: boolean;
  
  // Unit 1-2 Specific
  drainKompresor?: boolean; // Pagi only
  purifierUnit1?: boolean;  // All Shifts
  purifierUnit2?: boolean;  // All Shifts
  engkolManualUnit1?: boolean; // All Shifts
  engkolManualUnit2?: boolean; // All Shifts

  // Unit 3-4 Specific
  pemanasanPompaOil?: boolean; // Pagi (Kept for 3-4, removed for 1-2)
  drainSeparator?: boolean; // Pagi (Replaces drainKompresor for 3-4)
  penambahanNaOHUnit3?: boolean; // All Shifts
  penambahanNaOHUnit4?: boolean; // All Shifts
}

export interface LogEntry {
  id: string;
  timestamp: string;
  groupName: string; // Changed from operatorName
  shift: 'Pagi' | 'Sore' | 'Malam';
  targetPair: 'Unit 1-2' | 'Unit 3-4';
  
  // Data for the specific units in the pair
  units: {
    [key: string]: UnitMetrics; // e.g. "Unit 1": {...}, "Unit 2": {...}
  };

  checklist?: ShiftChecklist; // Renamed from MorningChecklist
  notes: string;
}

export interface SOP {
  id: string;
  title: string;
  category: 'Safety' | 'Operation' | 'Emergency' | 'Maintenance';
  targetUnit: 'General' | 'Unit 1-2' | 'Unit 3-4';
  type: 'text' | 'pdf' | 'url'; // Added content type
  content?: string[]; // Optional now, used for 'text'
  fileUrl?: string;   // Used for 'pdf'
  fileName?: string;  // Used for 'pdf' display name
  linkUrl?: string;   // Used for 'url'
  rawFile?: File;     // Transient property for upload handling
}

export interface ChangeOverTask {
  id: string;
  equipmentName: string;
  targetUnit: 'Unit 1-2' | 'Unit 3-4';
  frequency: 'Mingguan' | 'Bulanan' | '2 Mingguan' | '3 Harian' | 'Sesuai Jadwal Operasi'; // Added 'Sesuai Jadwal Operasi'
  scheduleDay: string; // e.g. "Senin", "Jumat"
  lastPerformed: string; // ISO Date
  currentRunning: 'A' | 'B' | 'C'; // Updated to support 3 pumps
  status: 'On Schedule' | 'Due Soon' | 'Overdue';
  labelA?: string; // Custom label for side A
  labelB?: string; // Custom label for side B
  labelC?: string; // Custom label for side C (for 3-pump configuration)
  procedures?: string[]; // Steps to perform the change over
  precautions?: string[]; // Safety notices or things to watch out for
}

export type ViewState = 'dashboard' | 'report' | 'history' | 'sop' | 'ai-assist' | 'schedule';

// types.ts (Baris 104)

// Ubah dari: export type UserRole = 'admin' | 'user';
// Menjadi:
export type UserRole = 'admin' | 'user' | null;
