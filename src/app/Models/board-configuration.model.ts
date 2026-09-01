export interface ShiftDefinition {
  name: string;
  roles: string[];
}

export interface BoardConfiguration {
  id?: string;
  workDays: string[];
  shiftDefinitions: ShiftDefinition[];
  extraRowNames: string[];
}

export interface ExtraRowEntry {
  id?: string;
  rowName: string;
  day: string;
  text: string;
}