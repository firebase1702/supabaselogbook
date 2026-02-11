
import { SOP, LogEntry, Metric, ChangeOverTask } from './types';

export const INITIAL_METRICS: Metric[] = [
  { id: '1', label: 'Total Beban', value: 0, unit: 'MW', status: 'normal', trend: 'stable' },
  { id: '2', label: 'Frekuensi Rata2', value: 0, unit: 'Hz', status: 'normal', trend: 'stable' },
  { id: '3', label: 'Voltage Rata2', value: 0, unit: 'kV', status: 'normal', trend: 'stable' },
  { id: '4', label: 'Steam Inlet Avg', value: 0, unit: 'Bar', status: 'normal', trend: 'stable' },
];

export const MOCK_SOPS: SOP[] = [];

export const MOCK_HISTORY: LogEntry[] = [];

export const MOCK_SCHEDULE: ChangeOverTask[] = [];
