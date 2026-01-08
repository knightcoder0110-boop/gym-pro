import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refreshToken: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
};

// Members API
export const membersApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get("/members", { params }),
  getById: (id: string) => api.get(`/members/${id}`),
  create: (data: any) => api.post("/members", data),
  update: (id: string, data: any) => api.patch(`/members/${id}`, data),
  delete: (id: string) => api.delete(`/members/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get("/dashboard/stats"),
  getRecentActivity: () => api.get("/dashboard/recent-activity"),
};

// Plans API
export const plansApi = {
  getAll: (params?: { includeInactive?: boolean }) => api.get("/plans", { params }),
  getById: (id: string) => api.get(`/plans/${id}`),
  create: (data: any) => api.post("/plans", data),
  update: (id: string, data: any) => api.patch(`/plans/${id}`, data),
  delete: (id: string) => api.delete(`/plans/${id}`),
};

// Memberships API
export const membershipsApi = {
  getAll: (params?: { memberId?: string; status?: string; page?: number; limit?: number }) =>
    api.get("/memberships", { params }),
  getById: (id: string) => api.get(`/memberships/${id}`),
  create: (data: { memberId: string; planId: string; durationId: string; startDate?: string }) =>
    api.post("/memberships", data),
  renew: (id: string, data: { durationId: string; startFromCurrent?: boolean }) =>
    api.post(`/memberships/${id}/renew`, data),
  freeze: (id: string, data: { freezeDays: number; reason?: string }) =>
    api.post(`/memberships/${id}/freeze`, data),
  unfreeze: (id: string) => api.post(`/memberships/${id}/unfreeze`),
  cancel: (id: string) => api.post(`/memberships/${id}/cancel`),
  upgrade: (id: string, data: { newPlanId: string; newDurationId: string }) =>
    api.post(`/memberships/${id}/upgrade`, data),
};

// Payments API
export const paymentsApi = {
  getAll: (params?: { memberId?: string; status?: string; type?: string; page?: number; limit?: number }) =>
    api.get("/payments", { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: {
    memberId: string;
    membershipId?: string;
    amount: number;
    type?: string;
    paymentMethod?: string;
    notes?: string;
    discount?: number;
    tax?: number;
  }) => api.post("/payments", data),
  refund: (id: string, data: { reason?: string; refundAmount?: number }) =>
    api.post(`/payments/${id}/refund`, data),
  getStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get("/payments/stats", { params }),
  getMemberPayments: (memberId: string) =>
    api.get(`/payments/member/${memberId}`),
};

// Classes API
export const classesApi = {
  getAll: (params?: { includeInactive?: boolean }) => 
    api.get("/classes", { params }),
  getById: (id: string) => api.get(`/classes/${id}`),
  create: (data: {
    name: string;
    description?: string;
    category?: string;
    durationMinutes?: number;
    maxCapacity?: number;
    color?: string;
    difficulty?: string;
    dropInPrice?: number;
  }) => api.post("/classes", data),
  update: (id: string, data: any) => api.patch(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
  
  // Schedules
  getSchedules: (params?: { branchId?: string; classId?: string; dayOfWeek?: number }) =>
    api.get("/classes/schedules/all", { params }),
  getWeeklySchedule: (params?: { branchId?: string; weekStart?: string }) =>
    api.get("/classes/schedules/weekly", { params }),
  createSchedule: (data: {
    classId: string;
    branchId: string;
    instructorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  }) => api.post("/classes/schedules", data),
  updateSchedule: (id: string, data: any) => api.patch(`/classes/schedules/${id}`, data),
  deleteSchedule: (id: string) => api.delete(`/classes/schedules/${id}`),
  
  // Bookings
  getBookings: (params?: { scheduleId?: string; memberId?: string; classDate?: string }) =>
    api.get("/classes/bookings/all", { params }),
  book: (data: { scheduleId: string; memberId: string; classDate: string }) =>
    api.post("/classes/bookings", data),
  cancelBooking: (id: string, reason?: string) =>
    api.post(`/classes/bookings/${id}/cancel`, { reason }),
  markAttendance: (id: string, attended: boolean) =>
    api.post(`/classes/bookings/${id}/attendance`, { attended }),
};

// Leads API
export const leadsApi = {
  getAll: (params?: { status?: string; source?: string; page?: number; limit?: number }) =>
    api.get("/leads", { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  getStats: () => api.get("/leads/stats"),
  getBySource: () => api.get("/leads/by-source"),
  create: (data: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone: string;
    source?: string;
    interestedIn?: string;
    notes?: string;
  }) => api.post("/leads", data),
  update: (id: string, data: any) => api.patch(`/leads/${id}`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  addActivity: (id: string, data: { type: string; description?: string; scheduledAt?: string }) =>
    api.post(`/leads/${id}/activity`, data),
  convert: (id: string, data?: { planId?: string; durationId?: string }) =>
    api.post(`/leads/${id}/convert`, data),
};

// Trainers API
export const trainersApi = {
  getAll: (params?: { includeInactive?: boolean }) =>
    api.get("/trainers", { params }),
  getById: (id: string) => api.get(`/trainers/${id}`),
  getStats: () => api.get("/trainers/stats"),
  getSchedule: (id: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/trainers/${id}/schedule`, { params }),
  create: (data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post("/trainers", data),
  update: (id: string, data: any) => api.patch(`/trainers/${id}`, data),
  delete: (id: string) => api.delete(`/trainers/${id}`),
};

// Attendance API
export const attendanceApi = {
  checkIn: (data: { memberId: string; branchId?: string; method?: string }) =>
    api.post("/attendance/check-in", data),
  checkOut: (data: { memberId?: string; attendanceId?: string }) =>
    api.post("/attendance/check-out", data),
  checkInByQR: (data: { qrCode: string; branchId?: string }) =>
    api.post("/attendance/check-in/qr", data),
  checkInByMemberId: (data: { memberIdCode: string; branchId?: string }) =>
    api.post("/attendance/check-in/member-id", data),
  getToday: (branchId?: string) =>
    api.get("/attendance/today", { params: branchId ? { branchId } : {} }),
  getHistory: (params?: { memberId?: string; branchId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get("/attendance", { params }),
  getMemberAttendance: (memberId: string, days?: number) =>
    api.get(`/attendance/member/${memberId}`, { params: days ? { days } : {} }),
};

// Settings API
export const settingsApi = {
  updateProfile: (data: { firstName: string; lastName: string; phone?: string; avatar?: string }) =>
    api.put("/settings/profile", data),
  updateOrganization: (data: any) => api.put("/settings/organization", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/settings/password", data),
};

export default api;
