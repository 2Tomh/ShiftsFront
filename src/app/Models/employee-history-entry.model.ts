export interface EmployeeHistoryEntry {
  date: string;
  dayOfWeek: string;
  entryType: 'Submitted' | 'ActualShift' | 'Vacation' | 'SickLeave';
  details: string;
}