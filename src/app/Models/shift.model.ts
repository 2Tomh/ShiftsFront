import { ShfitAssingment } from "./shiftAssignment.model";

// תוקן - type הופך ממחרוזת-Enum (ShiftType) למחרוזת חופשית, כדי
// לתמוך בכל מספר משמרות עם כל שם, לא רק ב-3 קבועות.
export interface Shift {
    id: string;
    date: Date;
    day: string;
    type: string;
    assignments: ShfitAssingment[];
    isPublished?: boolean;
}