// ==========================================================================
// Smart Scheduler Booking System - Calendar & Slot Availability Engine
// ==========================================================================

class CalendarEngine {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
  }

  // Format date as YYYY-MM-DD
  formatDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Human readable format: e.g., "Tuesday, 14 Oct 2026"
  formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Convert "HH:MM" 24-hr format to "hh:mm AM/PM"
  to12Hour(time24) {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hours = h % 12 === 0 ? 12 : h % 12;
    return `${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  }

  // Convert "hh:mm AM/PM" to total minutes from midnight
  timeToMinutes(timeStr) {
    const [time, period] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  // Check if a given date is today
  isToday(dateObj) {
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  }

  // Check if a date is in the past
  isPastDate(dateObj) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dateObj < today;
  }

  // Generate dynamic slots for a given service and date
  generateSlots(serviceId, dateStr) {
    const settings = storage.getSettings();
    const service = storage.getServiceById(serviceId);
    if (!service) return { morning: [], afternoon: [], evening: [] };

    const parts = dateStr.split('-');
    const targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayOfWeek = targetDate.getDay();

    // Check if business is closed on this day
    if (!settings.workingDays.includes(dayOfWeek)) {
      return { isClosed: true, message: 'Closed on this day', morning: [], afternoon: [], evening: [] };
    }

    // Parse operating hours in minutes
    const [startH, startM] = settings.workStartTime.split(':').map(Number);
    const [endH, endM] = settings.workEndTime.split(':').map(Number);
    const [lunchStartH, lunchStartM] = settings.lunchBreakStart.split(':').map(Number);
    const [lunchEndH, lunchEndM] = settings.lunchBreakEnd.split(':').map(Number);

    const workStart = startH * 60 + startM;
    const workEnd = endH * 60 + endM;
    const lunchStart = lunchStartH * 60 + lunchStartM;
    const lunchEnd = lunchEndH * 60 + lunchEndM;

    const interval = Number(service.duration) || 30;

    const slots = [];
    const now = new Date();
    const isCurrentDay = this.isToday(targetDate);
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    let cursor = workStart;
    while (cursor + interval <= workEnd) {
      // Skip lunch break overlap
      if (cursor >= lunchStart && cursor < lunchEnd) {
        cursor = lunchEnd;
        continue;
      }

      const h = Math.floor(cursor / 60);
      const m = cursor % 60;
      const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const time12 = this.to12Hour(time24);

      // Check double-booking
      const isBooked = storage.isSlotBooked(serviceId, dateStr, time12);

      // Check if slot has already passed today
      const isPast = isCurrentDay && cursor <= currentMinutesNow + 15; // 15 min buffer for immediate booking

      let status = 'available';
      let statusLabel = 'Available';

      if (isPast) {
        status = 'past';
        statusLabel = 'Time Passed';
      } else if (isBooked) {
        status = 'booked';
        statusLabel = 'Booked';
      }

      slots.push({
        time: time12,
        time24: time24,
        minutes: cursor,
        status: status,
        isAvailable: status === 'available',
        statusLabel: statusLabel
      });

      // Advance by service duration + buffer
      cursor += interval + (Number(service.bufferTime) || 0);
    }

    // Group into Morning, Afternoon, Evening
    return {
      isClosed: false,
      morning: slots.filter(s => s.minutes < 12 * 60),
      afternoon: slots.filter(s => s.minutes >= 12 * 60 && s.minutes < 16 * 60),
      evening: slots.filter(s => s.minutes >= 16 * 60)
    };
  }

  // Get next 14 bookable days for horizontal quick picker
  getUpcomingDays(count = 14) {
    const days = [];
    const settings = storage.getSettings();
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay();
      const isClosed = !settings.workingDays.includes(dayOfWeek);

      days.push({
        dateObj: d,
        dateKey: this.formatDateKey(d),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: i === 0,
        isClosed: isClosed
      });
    }
    return days;
  }
}

// Global instance
const calendarEngine = new CalendarEngine();
