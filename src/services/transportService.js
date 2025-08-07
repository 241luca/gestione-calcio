import api from './api';

const transportService = {
  // ZONE TRASPORTO
  getZones: async () => {
    const response = await api.get('/transport/zones');
    return response.data;
  },

  getZoneById: async (id) => {
    const response = await api.get(`/transport/zones/${id}`);
    return response.data;
  },

  createZone: async (data) => {
    const response = await api.post('/transport/zones', data);
    return response.data;
  },

  updateZone: async (id, data) => {
    const response = await api.put(`/transport/zones/${id}`, data);
    return response.data;
  },

  deleteZone: async (id) => {
    const response = await api.delete(`/transport/zones/${id}`);
    return response.data;
  },

  // PERCORSI
  getRoutes: async (filters = {}) => {
    const response = await api.get('/transport/routes', { params: filters });
    return response.data;
  },

  getRouteById: async (id) => {
    const response = await api.get(`/transport/routes/${id}`);
    return response.data;
  },

  createRoute: async (data) => {
    const response = await api.post('/transport/routes', data);
    return response.data;
  },

  updateRoute: async (id, data) => {
    const response = await api.put(`/transport/routes/${id}`, data);
    return response.data;
  },

  assignDriver: async (routeId, driverName, driverPhone) => {
    const response = await api.put(`/transport/routes/${routeId}/driver`, {
      driverName,
      driverPhone
    });
    return response.data;
  },

  deleteRoute: async (id) => {
    const response = await api.delete(`/transport/routes/${id}`);
    return response.data;
  },

  // PROGRAMMAZIONI
  getSchedules: async (filters = {}) => {
    const response = await api.get('/transport/schedules', { params: filters });
    return response.data;
  },

  getUpcomingSchedules: async (days = 7) => {
    const response = await api.get('/transport/schedules/upcoming', { 
      params: { days } 
    });
    return response.data;
  },

  createSchedule: async (data) => {
    const response = await api.post('/transport/schedules', data);
    return response.data;
  },

  updateSchedule: async (id, data) => {
    const response = await api.put(`/transport/schedules/${id}`, data);
    return response.data;
  },

  updateScheduleStatus: async (id, status) => {
    const response = await api.put(`/transport/schedules/${id}/status`, { status });
    return response.data;
  },

  deleteSchedule: async (id) => {
    const response = await api.delete(`/transport/schedules/${id}`);
    return response.data;
  },

  // PRENOTAZIONI
  createBooking: async (athleteId, scheduleId, data = {}) => {
    const response = await api.post('/transport/bookings', {
      athleteId,
      scheduleId,
      ...data
    });
    return response.data;
  },

  cancelBooking: async (id, reason) => {
    const response = await api.delete(`/transport/bookings/${id}`, {
      data: { reason }
    });
    return response.data;
  },

  getAthleteBookings: async (athleteId, includeHistory = false) => {
    const response = await api.get(`/transport/bookings/athlete/${athleteId}`, {
      params: { includeHistory }
    });
    return response.data;
  },

  getScheduleBookings: async (scheduleId) => {
    const response = await api.get(`/transport/bookings/schedule/${scheduleId}`);
    return response.data;
  },

  // UTILITY
  sendReminders: async (hours = 24) => {
    const response = await api.post('/transport/reminders', { hours });
    return response.data;
  },

  getStats: async (dateRange) => {
    const response = await api.get('/transport/stats', { 
      params: dateRange 
    });
    return response.data;
  }
};

export default transportService;
