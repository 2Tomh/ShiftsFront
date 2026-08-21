export interface LoginResponse {
    token: string;
    role: 'Admin' | 'Employee';
    username: string;
    employeeId?: string;
    employeeName?: string;
}

export interface AppUser {
    id: string;
    username: string;
    role: 'Admin' | 'Employee';
    employeeName?: string;
    createdAt: string;
}