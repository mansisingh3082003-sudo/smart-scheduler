// ============================================================================
// Smart Scheduler Booking System - Express.js REST API Backend
// ============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// In-Memory Data Store (Can be easily swapped with SQLite, PostgreSQL, or MongoDB)
let services = [
  {
    id: 'srv-1',
    categoryId: 'healthcare',
    name: 'General Physician Consultation',
    provider: 'Dr. Rajesh Sharma, MD',
    description: 'Comprehensive physical health checkup, diagnosis, prescription, and medical consultation.',
    duration: 30,
    bufferTime: 10,
    price: 500,
    rating: 4.9,
    reviewsCount: 128,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-2',
    categoryId: 'healthcare',
    name: 'Dental Checkup & Cleaning',
    provider: 'Dr. Ananya Verma, BDS',
    description: 'Routine oral examination, plaque removal, teeth cleaning, and cavity assessment.',
    duration: 45,
    bufferTime: 15,
    price: 800,
    rating: 4.8,
    reviewsCount: 94,
    avatar: 'https://images.unsplash.com/photo-1594824813576-97b71329c298?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-3',
    categoryId: 'salon',
    name: 'Executive Haircut & Styling',
    provider: 'Alex Rivera (Master Barber)',
    description: 'Precision haircut, hair wash, scalp massage, and modern blow-dry styling.',
    duration: 30,
    bufferTime: 10,
    price: 400,
    rating: 4.9,
    reviewsCount: 215,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  }
];

let bookings = [
  {
    id: 'SCH-7821',
    serviceId: 'srv-1',
    serviceName: 'General Physician Consultation',
    provider: 'Dr. Rajesh Sharma, MD',
    customerName: 'Rahul Sen',
    customerEmail: 'rahul.sen@example.com',
    customerPhone: '+91 98765 43210',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM',
    duration: 30,
    amount: 500,
    status: 'Confirmed',
    notes: 'Mild fever and cough.',
    createdAt: new Date().toISOString()
  }
];

let settings = {
  workStartTime: '09:00',
  workEndTime: '18:00',
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
  slotInterval: 30,
  workingDays: [1, 2, 3, 4, 5, 6] // Mon-Sat
};

// Helper: Check if slot is already occupied
function isSlotBooked(serviceId, dateStr, timeSlot, excludeId = null) {
  return bookings.some(b => {
    if (excludeId && b.id === excludeId) return false;
    return (
      b.serviceId === serviceId &&
      b.date === dateStr &&
      b.timeSlot === timeSlot &&
      (b.status === 'Confirmed' || b.status === 'Rescheduled')
    );
  });
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Scheduler API is operational', timestamp: new Date() });
});

// 1. Get all services
app.get('/api/services', (req, res) => {
  res.json({ success: true, count: services.length, data: services });
});

// 2. Add new service
app.post('/api/services', (req, res) => {
  const { name, provider, categoryId, duration, bufferTime, price, description } = req.body;
  if (!name || !provider) {
    return res.status(400).json({ success: false, message: 'Name and provider are required' });
  }

  const newService = {
    id: 'srv-' + Date.now(),
    name,
    provider,
    categoryId: categoryId || 'healthcare',
    duration: Number(duration) || 30,
    bufferTime: Number(bufferTime) || 10,
    price: Number(price) || 500,
    description: description || '',
    rating: 5.0,
    reviewsCount: 0,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  services.unshift(newService);
  res.status(201).json({ success: true, data: newService });
});

// 3. Delete service
app.delete('/api/services/:id', (req, res) => {
  const { id } = req.params;
  services = services.filter(s => s.id !== id);
  res.json({ success: true, message: 'Service deleted successfully' });
});

// 4. Get all bookings
app.get('/api/bookings', (req, res) => {
  const { status, email } = req.query;
  let results = [...bookings];

  if (status && status !== 'all') {
    results = results.filter(b => b.status.toLowerCase() === status.toLowerCase());
  }
  if (email) {
    results = results.filter(b => b.customerEmail.toLowerCase() === email.toLowerCase());
  }

  res.json({ success: true, count: results.length, data: results });
});

// 5. Create new booking (WITH CONCURRENCY & DOUBLE-BOOKING PREVENTION)
app.post('/api/bookings', (req, res) => {
  const { serviceId, serviceName, provider, customerName, customerEmail, customerPhone, date, timeSlot, duration, amount, notes } = req.body;

  if (!serviceId || !customerName || !customerEmail || !date || !timeSlot) {
    return res.status(400).json({ success: false, message: 'Missing mandatory booking parameters' });
  }

  // Atomic conflict verification
  if (isSlotBooked(serviceId, date, timeSlot)) {
    return res.status(409).json({
      success: false,
      message: `Conflict Error: Slot ${timeSlot} on ${date} is already booked!`
    });
  }

  const newBooking = {
    id: 'SCH-' + Math.floor(1000 + Math.random() * 9000),
    serviceId,
    serviceName,
    provider,
    customerName,
    customerEmail,
    customerPhone,
    date,
    timeSlot,
    duration: Number(duration) || 30,
    amount: Number(amount) || 0,
    notes: notes || '',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };

  bookings.unshift(newBooking);
  res.status(201).json({ success: true, message: 'Appointment booked successfully', data: newBooking });
});

// 6. Reschedule booking
app.post('/api/bookings/:id/reschedule', (req, res) => {
  const { id } = req.params;
  const { newDate, newTimeSlot } = req.body;

  const booking = bookings.find(b => b.id === id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  if (isSlotBooked(booking.serviceId, newDate, newTimeSlot, id)) {
    return res.status(409).json({ success: false, message: 'The requested new slot is already occupied.' });
  }

  booking.previousDate = booking.date;
  booking.previousTimeSlot = booking.timeSlot;
  booking.date = newDate;
  booking.timeSlot = newTimeSlot;
  booking.status = 'Confirmed';
  booking.isRescheduled = true;
  booking.updatedAt = new Date().toISOString();

  res.json({ success: true, message: 'Booking rescheduled successfully', data: booking });
});

// 7. Update booking status (Cancel / Complete)
app.patch('/api/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const booking = bookings.find(b => b.id === id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  booking.status = status;
  if (reason) booking.cancelReason = reason;
  booking.updatedAt = new Date().toISOString();

  res.json({ success: true, message: `Booking status updated to ${status}`, data: booking });
});

// 8. Admin statistics
app.get('/api/admin/stats', (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'Completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;
  const todayCount = bookings.filter(b => b.date === todayStr).length;

  const totalRevenue = bookings
    .filter(b => b.status === 'Confirmed' || b.status === 'Completed')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const cancelRate = totalBookings > 0
    ? ((cancelledCount / totalBookings) * 100).toFixed(1)
    : 0;

  res.json({
    success: true,
    data: {
      totalBookings,
      confirmedCount,
      completedCount,
      cancelledCount,
      todayCount,
      totalRevenue,
      cancelRate
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Smart Scheduler Backend Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api/health`);
  console.log(`Frontend URL: http://localhost:${PORT}/index.html`);
  console.log(`=======================================================`);
});
