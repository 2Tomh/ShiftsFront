import { ShfitAssingment } from "./shiftAssignment.model";
import { ShiftType } from "./shiftType.enum";

export interface Shift {
    id: string;
    date: Date;
    day: string;
    type: ShiftType;
    assignments: ShfitAssingment[];
    isPublished?: boolean; // חדש - רק ה-endpoint של המנהל (GetShifts) שולח את זה
}