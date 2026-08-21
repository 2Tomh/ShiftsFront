import { Employee } from "./emplyee.model";
import { ShiftType } from "./shiftType.enum";

export interface Availability {
    id: string,
    employeeId: string,
    employee: Employee,
    date: Date,
    preffredType: ShiftType
}