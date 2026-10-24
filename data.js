// ==========================================================================
// Smart Scheduler Booking System - Default Seed Data
// ==========================================================================

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Services', icon: 'sparkles' },
  { id: 'healthcare', name: 'Healthcare & Doctors', icon: 'heart-pulse' },
  { id: 'salon', name: 'Salon & Wellness', icon: 'scissors' },
  { id: 'education', name: 'Coaching & Mentoring', icon: 'graduation-cap' },
  { id: 'consulting', name: 'Business & Legal', icon: 'briefcase' }
];

const DEFAULT_SERVICES = [
  {
    id: 'srv-1',
    categoryId: 'healthcare',
    name: 'General Physician Consultation',
    provider: 'Dr. Rajesh Sharma, MD',
    description: 'Comprehensive physical health checkup, diagnosis, prescription, and medical consultation.',
    duration: 30, // in minutes
    bufferTime: 10,
    price: 500,
    rating: 4.9,
    reviewsCount: 128,
    badge: 'Popular',
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
    badge: 'Specialist',
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
    badge: 'Trending',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-4',
    categoryId: 'salon',
    name: 'Deep Cleansing Facial & Glow Spa',
    provider: 'Pooja Kapoor (Skin Aesthetician)',
    description: 'Herbal exfoliation, steam extraction, skin hydration mask, and relaxing facial massage.',
    duration: 60,
    bufferTime: 15,
    price: 1200,
    rating: 4.7,
    reviewsCount: 86,
    badge: 'Luxury',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-5',
    categoryId: 'education',
    name: '1-on-1 Coding & Career Mentorship',
    provider: 'Vikram Mehta (Senior Software Engg)',
    description: 'Resume review, DSA/System design roadmap, mock tech interview, and career guidance.',
    duration: 45,
    bufferTime: 15,
    price: 999,
    rating: 5.0,
    reviewsCount: 142,
    badge: 'Top Rated',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'srv-6',
    categoryId: 'consulting',
    name: 'Tax & GST Advisory Session',
    provider: 'CA Neha Agarwal',
    description: 'Income tax planning, business GST filing strategy, and audit guidance for individuals/SMEs.',
    duration: 30,
    bufferTime: 10,
    price: 1500,
    rating: 4.9,
    reviewsCount: 73,
    badge: 'Expert',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80'
  }
];

// Helper to get formatted date string: YYYY-MM-DD
function getOffsetDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

const DEFAULT_BOOKINGS = [
  {
    id: 'SCH-7821',
    serviceId: 'srv-1',
    serviceName: 'General Physician Consultation',
    provider: 'Dr. Rajesh Sharma, MD',
    customerName: 'Rahul Sen',
    customerEmail: 'rahul.sen@example.com',
    customerPhone: '+91 98765 43210',
    date: getOffsetDate(0), // Today
    timeSlot: '10:00 AM',
    duration: 30,
    amount: 500,
    notes: 'Mild fever and sore throat for 2 days.',
    status: 'Confirmed', // Confirmed, Completed, Cancelled, Rescheduled
    createdAt: new Date().toISOString()
  },
  {
    id: 'SCH-8942',
    serviceId: 'srv-3',
    serviceName: 'Executive Haircut & Styling',
    provider: 'Alex Rivera (Master Barber)',
    customerName: 'Aman Gupta',
    customerEmail: 'aman.gupta@example.com',
    customerPhone: '+91 98111 22334',
    date: getOffsetDate(0), // Today
    timeSlot: '02:00 PM',
    duration: 30,
    amount: 400,
    notes: 'Fade haircut with beard trim.',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'SCH-6310',
    serviceId: 'srv-5',
    serviceName: '1-on-1 Coding & Career Mentorship',
    provider: 'Vikram Mehta (Senior Software Engg)',
    customerName: 'Sneha Patel',
    customerEmail: 'sneha.patel@example.com',
    customerPhone: '+91 97234 56789',
    date: getOffsetDate(1), // Tomorrow
    timeSlot: '11:00 AM',
    duration: 45,
    amount: 999,
    notes: 'Transitioning from Non-IT to Frontend Developer guidance.',
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'SCH-5129',
    serviceId: 'srv-2',
    serviceName: 'Dental Checkup & Cleaning',
    provider: 'Dr. Ananya Verma, BDS',
    customerName: 'Mohit Saxena',
    customerEmail: 'mohit.s@example.com',
    customerPhone: '+91 99887 66554',
    date: getOffsetDate(-1), // Yesterday
    timeSlot: '04:00 PM',
    duration: 45,
    amount: 800,
    notes: 'Routine cleaning completed.',
    status: 'Completed',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const DEFAULT_SETTINGS = {
  businessName: 'Smart Scheduler Pro',
  businessEmail: 'contact@smartscheduler.local',
  businessPhone: '+91 1800 123 4567',
  workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0 is Sunday)
  workStartTime: '09:00', // 24-hr format
  workEndTime: '18:00',
  slotInterval: 30, // 30 minutes default
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
  allowSameDayBooking: true,
  maxAdvanceDays: 30
};
