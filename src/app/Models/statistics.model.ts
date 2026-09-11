export interface ArmedStatusGroup {
  count: number;
  names: string[];
}

export interface ArmedStats {
  notArmed: ArmedStatusGroup;
  inProgress: ArmedStatusGroup;
  armed: ArmedStatusGroup;
}

export interface ShiftTypeTotal {
  type: string;
  count: number;
}

export interface EmployeeShiftBreakdown {
  employeeName: string;
  total: number;
  byType: { [type: string]: number };
}

export interface ScheduleEntry {
  date: string;
  dayName: string;
  shiftType: string;
  role: string;
  employeeName: string;
}

export interface StatisticsResult {
  rangeStart: string;
  rangeEnd: string;
  armedStats: ArmedStats;
  shiftTypeTotals: ShiftTypeTotal[];
  perEmployee: EmployeeShiftBreakdown[];
  scheduleTable: ScheduleEntry[];
}