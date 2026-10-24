// ==========================================================================
// Smart Scheduler Booking System - Local Storage & State Management
// ==========================================================================

const STORAGE_KEYS = {
  SERVICES: 'smart_scheduler_services_v1',
  BOOKINGS: 'smart_scheduler_bookings_v1',
  SETTINGS: 'smart_scheduler_settings_v1',
  CURRENT_USER: 'smart_scheduler_user_v1'
};

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    // Initialize default services if missing
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    }
    // Initialize default bookings if missing
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
    }
    // Initialize default settings if missing
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    // Default logged in user (Client demo)
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      const demoUser = {
        name: 'Rahul Sen',
        email: 'rahul.sen@example.com',
        phone: '+91 98765 43210',
        role: 'customer' // 'customer' or 'admin'
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoUser));
    }
  }

  // --- SERVICES ---
  getServices() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || DEFAULT_SERVICES;
    } catch (e) {
      return DEFAULT_SERVICES;
    }
  }

  getServiceById(id) {
    const services = this.getServices();
    return services.find(s => s.id === id) || null;
  }

  saveService(serviceData) {
    const services = this.getServices();
    if (serviceData.id) {
      // Edit
      const index = services.findIndex(s => s.id === serviceData.id);
      if (index !== -1) {
        services[index] = { ...services[index], ...serviceData };
      }
    } else {
      // New
      const newService = {
        ...serviceData,
        id: 'srv-' + Date.now(),
        rating: 5.0,
        reviewsCount: 1,
        avatar: serviceData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
      services.unshift(newService);
    }
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return services;
  }

  deleteService(id) {
    let services = this.getServices();
    services = services.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    return services;
  }

  // --- BOOKINGS & CONCURRENCY / DOUBLE-BOOKING CONTROL ---
  getBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || DEFAULT_BOOKINGS;
    } catch (e) {
      return DEFAULT_BOOKINGS;
    }
  }

  getBookingById(id) {
    const bookings = this.getBookings();
    return bookings.find(b => b.id === id) || null;
  }

  // Check if a slot is already occupied by an active booking for this service & date
  isSlotBooked(serviceId, dateStr, timeSlot, excludeBookingId = null) {
    const bookings = this.getBookings();
    return bookings.some(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      return (
        b.serviceId === serviceId &&
        b.date === dateStr &&
        b.timeSlot === timeSlot &&
        (b.status === 'Confirmed' || b.status === 'Rescheduled')
      );
    });
  }

  // Atomically create a booking with double-booking prevention check
  createBooking(bookingPayload) {
    const bookings = this.getBookings();

    // Critical Double-Booking Verification
    const alreadyBooked = this.isSlotBooked(
      bookingPayload.serviceId,
      bookingPayload.date,
      bookingPayload.timeSlot
    );

    if (alreadyBooked) {
      throw new Error(`Double-booking conflict prevented! Slot ${bookingPayload.timeSlot} on ${bookingPayload.date} is already reserved.`);
    }

    const newBooking = {
      id: 'SCH-' + Math.floor(1000 + Math.random() * 9000),
      ...bookingPayload,
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    bookings.unshift(newBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return newBooking;
  }

  // Update existing booking status
  updateBookingStatus(id, newStatus, reason = '') {
    const bookings = this.getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) throw new Error('Booking not found');

    booking.status = newStatus;
    if (reason) booking.cancelReason = reason;
    booking.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return booking;
  }

  // Reschedule booking with conflict check
  rescheduleBooking(id, newDate, newTimeSlot) {
    const bookings = this.getBookings();
    const booking = bookings.find(b => b.id === id);
    if (!booking) throw new Error('Booking not found');

    // Conflict check on new date and time
    const conflict = this.isSlotBooked(booking.serviceId, newDate, newTimeSlot, id);
    if (conflict) {
      throw new Error(`The requested new slot (${newTimeSlot} on ${newDate}) is already booked. Please pick another slot.`);
    }

    booking.previousDate = booking.date;
    booking.previousTimeSlot = booking.timeSlot;
    booking.date = newDate;
    booking.timeSlot = newTimeSlot;
    booking.status = 'Confirmed';
    booking.isRescheduled = true;
    booking.updatedAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    return booking;
  }

  // --- SETTINGS ---
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    const updated = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // --- USER PROFILE ---
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    } catch (e) {
      return null;
    }
  }

  saveCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }

  // --- STATS & ANALYTICS ---
  getStats() {
    const bookings = this.getBookings();
    const todayStr = new Date().toISOString().split('T')[0];

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled');
    const todayBookings = bookings.filter(b => b.date === todayStr);

    const totalRevenue = bookings
      .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    const cancelRate = totalBookings > 0
      ? ((cancelledBookings.length / totalBookings) * 100).toFixed(1)
      : 0;

    return {
      totalBookings,
      confirmedCount: confirmedBookings.length,
      completedCount: completedBookings.length,
      cancelledCount: cancelledBookings.length,
      todayCount: todayBookings.length,
      totalRevenue,
      cancelRate
    };
  }

  // Reset demo data to defaults
  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

// Global instance
const storage = new StorageManager();
