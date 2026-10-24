// ==========================================================================
// Smart Scheduler Booking System - Main Application Controller
// ==========================================================================

// State variables
let currentTab = 'book';
let selectedCategory = 'all';
let selectedService = null;
let selectedDateKey = calendarEngine.formatDateKey(new Date());
let selectedSlot = null;
let bookingToReschedule = null;

// Sound synthesizer using Web Audio API (Zero external assets needed)
class SoundManager {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }
  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }
  playAlert() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.setValueAtTime(250, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }
}
const sound = new SoundManager();

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-indigo-600 text-white',
    warning: 'bg-amber-600 text-white'
  };

  const icons = {
    success: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
    error: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`,
    info: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    warning: `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
  };

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-4 opacity-0 text-sm font-medium ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span>${message}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// TABS SWITCHING
// ==========================================================================
function switchTab(tabId) {
  sound.playClick();
  currentTab = tabId;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
      btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
    } else {
      btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
      btn.classList.add('text-slate-600', 'hover:bg-slate-100');
    }
  });

  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('hidden', section.id !== `tab-${tabId}`);
  });

  if (tabId === 'book') renderBookingTab();
  if (tabId === 'my-bookings') renderMyBookingsTab();
  if (tabId === 'admin') renderAdminTab();
  if (tabId === 'services') renderServicesTab();
  if (tabId === 'docs') renderDocsTab();
}

// ==========================================================================
// TAB 1: BOOK APPOINTMENT
// ==========================================================================
function renderBookingTab() {
  renderCategoryFilter();
  renderServicesList();
  renderUpcomingDaysPicker();
  renderSlotPicker();
}

function renderCategoryFilter() {
  const container = document.getElementById('category-filter-bar');
  if (!container) return;

  container.innerHTML = DEFAULT_CATEGORIES.map(cat => `
    <button
      onclick="setCategory('${cat.id}')"
      class="px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
        selectedCategory === cat.id
          ? 'bg-slate-900 text-white shadow'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
      }">
      ${cat.name}
    </button>
  `).join('');
}

function setCategory(catId) {
  sound.playClick();
  selectedCategory = catId;
  renderCategoryFilter();
  renderServicesList();
}

function renderServicesList() {
  const container = document.getElementById('services-list-container');
  if (!container) return;

  const services = storage.getServices();
  const filtered = selectedCategory === 'all'
    ? services
    : services.filter(s => s.categoryId === selectedCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <p class="text-base">No services found in this category.</p>
      </div>
    `;
    return;
  }

  // Ensure a default selected service if none or invalid
  if (!selectedService || !filtered.some(s => s.id === selectedService.id)) {
    selectedService = filtered[0];
  }

  container.innerHTML = filtered.map(srv => {
    const isSelected = selectedService && selectedService.id === srv.id;
    return `
      <div
        onclick="selectService('${srv.id}')"
        class="group relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
          isSelected
            ? 'border-indigo-600 bg-indigo-50/40 shadow-lg ring-2 ring-indigo-500/20'
            : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-md'
        }">
        ${srv.badge ? `<span class="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">${srv.badge}</span>` : ''}

        <div class="flex items-center gap-4">
          <img src="${srv.avatar}" alt="${srv.name}" class="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm" />
          <div>
            <h4 class="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">${srv.name}</h4>
            <p class="text-xs font-medium text-slate-500 mt-0.5">${srv.provider}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="flex items-center text-amber-500 text-xs font-semibold">
                ★ ${srv.rating}
              </span>
              <span class="text-slate-300 text-xs">•</span>
              <span class="text-xs text-slate-500">${srv.reviewsCount} reviews</span>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-600 mt-3 line-clamp-2">${srv.description}</p>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div class="flex items-center gap-3 text-slate-500 font-medium">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ${srv.duration} mins
            </span>
            <span>+ ${srv.bufferTime}m buffer</span>
          </div>
          <span class="text-base font-extrabold text-slate-900">₹${srv.price}</span>
        </div>

        <div class="mt-3">
          <button class="w-full py-2 text-xs font-semibold rounded-xl transition-all ${
            isSelected
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
          }">
            ${isSelected ? 'Selected' : 'Select Service'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  renderSlotPicker();
}

function selectService(srvId) {
  sound.playClick();
  selectedService = storage.getServiceById(srvId);
  renderServicesList();
  renderSlotPicker();
}

function renderUpcomingDaysPicker() {
  const container = document.getElementById('days-picker-container');
  if (!container) return;

  const days = calendarEngine.getUpcomingDays(14);

  container.innerHTML = days.map(d => {
    const isSelected = selectedDateKey === d.dateKey;
    if (d.isClosed) {
      return `
        <div class="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed">
          <span class="text-[11px] font-medium">${d.dayName}</span>
          <span class="text-base font-bold">${d.dayNumber}</span>
          <span class="text-[9px] uppercase tracking-wider text-rose-400 font-semibold mt-0.5">Closed</span>
        </div>
      `;
    }
    return `
      <button
        onclick="setSelectedDate('${d.dateKey}')"
        class="flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-200 ${
          isSelected
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105'
            : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:shadow-sm'
        }">
        <span class="text-[11px] font-medium opacity-90">${d.dayName}</span>
        <span class="text-lg font-bold">${d.dayNumber}</span>
        <span class="text-[10px] font-medium opacity-80">${d.monthName}</span>
        ${d.isToday ? `<span class="w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-indigo-600'} mt-0.5"></span>` : ''}
      </button>
    `;
  }).join('');
}

function setSelectedDate(dateKey) {
  sound.playClick();
  selectedDateKey = dateKey;
  renderUpcomingDaysPicker();
  renderSlotPicker();
}

function renderSlotPicker() {
  const container = document.getElementById('slots-container');
  const dateHeading = document.getElementById('selected-date-heading');
  const serviceSummary = document.getElementById('selected-service-summary');

  if (!selectedService) {
    if (container) container.innerHTML = `<p class="text-slate-400 text-sm">Please select a service first.</p>`;
    return;
  }

  if (dateHeading) {
    dateHeading.textContent = calendarEngine.formatDisplayDate(selectedDateKey);
  }

  if (serviceSummary) {
    serviceSummary.innerHTML = `
      <div class="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4">
        <div>
          <h5 class="text-xs text-slate-500 font-medium">Selected Service</h5>
          <h4 class="text-sm font-bold text-slate-800">${selectedService.name}</h4>
          <p class="text-xs text-indigo-600 font-semibold">${selectedService.provider}</p>
        </div>
        <div class="text-right">
          <span class="text-base font-extrabold text-slate-900">₹${selectedService.price}</span>
          <span class="block text-[11px] text-slate-500">${selectedService.duration} mins</span>
        </div>
      </div>
    `;
  }

  const slotData = calendarEngine.generateSlots(selectedService.id, selectedDateKey);

  if (slotData.isClosed) {
    container.innerHTML = `
      <div class="p-8 text-center bg-rose-50 border border-rose-100 rounded-2xl">
        <svg class="w-10 h-10 mx-auto text-rose-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h4 class="font-bold text-rose-900 text-base">Service Provider is Closed</h4>
        <p class="text-xs text-rose-600 mt-1">Please select another date on the calendar.</p>
      </div>
    `;
    return;
  }

  const totalSlotsCount = slotData.morning.length + slotData.afternoon.length + slotData.evening.length;
  if (totalSlotsCount === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
        <p class="text-sm">No slots available for this date. Please pick another date.</p>
      </div>
    `;
    return;
  }

  function renderGroup(groupTitle, slotsList) {
    if (slotsList.length === 0) return '';
    return `
      <div class="mb-5">
        <h5 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
          <span>${groupTitle}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">${slotsList.filter(s => s.isAvailable).length} available</span>
        </h5>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          ${slotsList.map(slot => {
            if (slot.isAvailable) {
              return `
                <button
                  onclick="openBookingModal('${slot.time}')"
                  class="group flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-600 font-semibold text-xs transition-all shadow-sm">
                  <span>${slot.time}</span>
                  <span class="text-[10px] font-normal text-emerald-600 group-hover:text-indigo-600 mt-0.5">Available</span>
                </button>
              `;
            } else if (slot.status === 'booked') {
              return `
                <div class="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-400 font-medium text-xs cursor-not-allowed">
                  <span>${slot.time}</span>
                  <span class="text-[10px] font-semibold text-rose-500 mt-0.5">Booked</span>
                </div>
              `;
            } else {
              return `
                <div class="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 font-medium text-xs cursor-not-allowed">
                  <span>${slot.time}</span>
                  <span class="text-[10px] mt-0.5">Passed</span>
                </div>
              `;
            }
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    ${renderGroup('Morning', slotData.morning)}
    ${renderGroup('Afternoon', slotData.afternoon)}
    ${renderGroup('Evening', slotData.evening)}
  `;
}

// ==========================================================================
// BOOKING MODAL & CHECKOUT
// ==========================================================================
function openBookingModal(timeSlot) {
  sound.playClick();
  selectedSlot = timeSlot;

  const modal = document.getElementById('booking-modal');
  const user = storage.getCurrentUser() || {};

  document.getElementById('modal-service-name').textContent = selectedService.name;
  document.getElementById('modal-provider-name').textContent = selectedService.provider;
  document.getElementById('modal-date').textContent = calendarEngine.formatDisplayDate(selectedDateKey);
  document.getElementById('modal-time').textContent = selectedSlot;
  document.getElementById('modal-duration').textContent = `${selectedService.duration} mins`;
  document.getElementById('modal-price').textContent = `₹${selectedService.price}`;

  document.getElementById('input-cust-name').value = user.name || '';
  document.getElementById('input-cust-email').value = user.email || '';
  document.getElementById('input-cust-phone').value = user.phone || '';
  document.getElementById('input-cust-notes').value = '';

  modal.classList.remove('hidden');
}

function closeBookingModal() {
  sound.playClick();
  document.getElementById('booking-modal').classList.add('hidden');
}

function handleConfirmBooking(e) {
  e.preventDefault();

  const name = document.getElementById('input-cust-name').value.trim();
  const email = document.getElementById('input-cust-email').value.trim();
  const phone = document.getElementById('input-cust-phone').value.trim();
  const notes = document.getElementById('input-cust-notes').value.trim();

  if (!name || !email || !phone) {
    showToast('Please fill all required personal details', 'warning');
    sound.playAlert();
    return;
  }

  // Update current user
  storage.saveCurrentUser({ name, email, phone, role: 'customer' });

  try {
    const booking = storage.createBooking({
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      provider: selectedService.provider,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      date: selectedDateKey,
      timeSlot: selectedSlot,
      duration: selectedService.duration,
      amount: selectedService.price,
      notes: notes
    });

    closeBookingModal();
    sound.playSuccess();
    showToast(`Appointment confirmed! Booking ID: ${booking.id}`, 'success');

    // Show confirmation receipt
    openReceiptModal(booking);

    // Refresh UI
    renderSlotPicker();
  } catch (err) {
    sound.playAlert();
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// RECEIPT / CONFIRMATION MODAL
// ==========================================================================
function openReceiptModal(booking) {
  const modal = document.getElementById('receipt-modal');
  const details = document.getElementById('receipt-details');

  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.serviceName + ' with ' + booking.provider)}&dates=${booking.date.replace(/-/g, '')}T090000Z/${booking.date.replace(/-/g, '')}T100000Z&details=${encodeURIComponent('Booking Reference: ' + booking.id + '\nProvider: ' + booking.provider)}&location=Online/Clinic`;

  details.innerHTML = `
    <div class="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Confirmed</span>
          <h3 class="text-lg font-black text-slate-900 mt-1">${booking.id}</h3>
        </div>
        <div class="text-right">
          <span class="text-xs text-slate-400">Total Paid/Payable</span>
          <p class="text-xl font-black text-slate-900">₹${booking.amount}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
        <div>
          <span class="text-slate-400 block">Service</span>
          <strong class="text-slate-800 text-sm">${booking.serviceName}</strong>
          <span class="text-indigo-600 block font-medium">${booking.provider}</span>
        </div>
        <div>
          <span class="text-slate-400 block">Appointment Schedule</span>
          <strong class="text-slate-800 text-sm">${calendarEngine.formatDisplayDate(booking.date)}</strong>
          <span class="text-emerald-700 block font-bold">${booking.timeSlot} (${booking.duration} mins)</span>
        </div>
        <div>
          <span class="text-slate-400 block">Client</span>
          <strong class="text-slate-800">${booking.customerName}</strong>
          <span class="text-slate-500 block">${booking.customerPhone}</span>
        </div>
        <div>
          <span class="text-slate-400 block">Status & Policy</span>
          <strong class="text-emerald-600">Active / Guaranteed Slot</strong>
          <span class="text-slate-400 block">Free cancel up to 2h before</span>
        </div>
      </div>

      ${booking.notes ? `
        <div class="pt-3 text-xs text-slate-500">
          <span class="font-semibold text-slate-700">Client Note:</span> ${booking.notes}
        </div>
      ` : ''}

      <div class="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
        <span>Generated on: ${new Date().toLocaleDateString()}</span>
        <span>Smart Scheduler Pro</span>
      </div>
    </div>

    <div class="mt-5 flex flex-wrap gap-2.5">
      <a href="${gCalUrl}" target="_blank" class="flex-1 min-w-[140px] text-center py-2.5 px-3 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5">
        <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        Add to Google Calendar
      </a>
      <button onclick="window.print()" class="py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2z"></path></svg>
        Print / PDF
      </button>
      <button onclick="downloadICS('${booking.id}')" class="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all">
        Download .ICS
      </button>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeReceiptModal() {
  sound.playClick();
  document.getElementById('receipt-modal').classList.add('hidden');
}

// Generate downloadable .ics calendar file
function downloadICS(bookingId) {
  const booking = storage.getBookingById(bookingId);
  if (!booking) return;

  const d = booking.date.replace(/-/g, '');
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart Scheduler//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@smartscheduler.local`,
    `DTSTAMP:${d}T090000Z`,
    `DTSTART:${d}T100000Z`,
    `DTEND:${d}T110000Z`,
    `SUMMARY:${booking.serviceName} with ${booking.provider}`,
    `DESCRIPTION:Appointment Reference: ${booking.id}\\nStatus: ${booking.status}`,
    `STATUS:CONFIRMED`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `appointment-${booking.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Calendar invite (.ics) downloaded!', 'success');
}

// ==========================================================================
// TAB 2: MY BOOKINGS
// ==========================================================================
function renderMyBookingsTab() {
  const container = document.getElementById('my-bookings-list');
  const searchInput = document.getElementById('my-bookings-search');
  const filterStatus = document.getElementById('my-bookings-status-filter');

  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const statusFilter = filterStatus ? filterStatus.value : 'all';

  let bookings = storage.getBookings();

  // Search filter
  if (query) {
    bookings = bookings.filter(b =>
      b.id.toLowerCase().includes(query) ||
      b.customerName.toLowerCase().includes(query) ||
      b.serviceName.toLowerCase().includes(query) ||
      b.provider.toLowerCase().includes(query)
    );
  }

  // Status filter
  if (statusFilter !== 'all') {
    bookings = bookings.filter(b => b.status.toLowerCase() === statusFilter.toLowerCase());
  }

  if (bookings.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center bg-white rounded-3xl border border-slate-200">
        <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        <h4 class="text-base font-bold text-slate-700">No appointments found</h4>
        <p class="text-xs text-slate-400 mt-1">Book an appointment or adjust your search filter.</p>
        <button onclick="switchTab('book')" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all">
          Book Your First Appointment
        </button>
      </div>
    `;
    return;
  }

  const statusBadges = {
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-blue-50 text-blue-700 border-blue-200',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    Rescheduled: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  container.innerHTML = bookings.map(b => {
    const isPast = calendarEngine.isPastDate(new Date(b.date));
    const canModify = b.status === 'Confirmed' || b.status === 'Rescheduled';

    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-all">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              ${b.serviceName.substring(0, 2).toUpperCase()}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-900 text-sm md:text-base">${b.serviceName}</h4>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadges[b.status] || 'bg-slate-100 text-slate-600'}">
                  ${b.status}
                </span>
                ${b.isRescheduled ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-semibold">Rescheduled</span>' : ''}
              </div>
              <p class="text-xs text-slate-500 mt-0.5">With <strong class="text-indigo-600">${b.provider}</strong></p>
            </div>
          </div>
          <div class="text-left md:text-right">
            <span class="text-xs font-mono font-semibold text-slate-400">ID: ${b.id}</span>
            <span class="block text-base font-extrabold text-slate-900">₹${b.amount}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3.5 text-xs text-slate-600">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span><strong>Date:</strong> ${calendarEngine.formatDisplayDate(b.date)}</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span><strong>Time:</strong> ${b.timeSlot} (${b.duration}m)</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            <span><strong>Client:</strong> ${b.customerName}</span>
          </div>
        </div>

        ${b.cancelReason ? `
          <div class="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl mb-3">
            <strong>Cancellation Note:</strong> ${b.cancelReason}
          </div>
        ` : ''}

        <div class="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button onclick="openReceiptModal(storage.getBookingById('${b.id}'))" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">
              View Receipt
            </button>
            <button onclick="downloadICS('${b.id}')" class="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all">
              .ICS Invite
            </button>
          </div>

          ${canModify ? `
            <div class="flex items-center gap-2">
              <button onclick="openRescheduleModal('${b.id}')" class="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all">
                Reschedule
              </button>
              <button onclick="promptCancelBooking('${b.id}')" class="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all">
                Cancel
              </button>
            </div>
          ` : `
            <span class="text-xs text-slate-400 italic">No further actions available</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// Reschedule modal logic
function openRescheduleModal(bookingId) {
  sound.playClick();
  bookingToReschedule = storage.getBookingById(bookingId);
  if (!bookingToReschedule) return;

  const modal = document.getElementById('reschedule-modal');
  document.getElementById('reschedule-booking-info').innerHTML = `
    <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4">
      <p>Rescheduling: <strong>${bookingToReschedule.serviceName}</strong> (ID: ${bookingToReschedule.id})</p>
      <p class="mt-0.5 text-amber-700">Current Slot: ${calendarEngine.formatDisplayDate(bookingToReschedule.date)} at ${bookingToReschedule.timeSlot}</p>
    </div>
  `;

  // Render date picker & slots for reschedule
  const days = calendarEngine.getUpcomingDays(7);
  const container = document.getElementById('reschedule-days-container');
  container.innerHTML = days.filter(d => !d.isClosed).map((d, idx) => `
    <button
      onclick="loadRescheduleSlots('${d.dateKey}')"
      class="reschedule-day-pill px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
        idx === 0 ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
      }" data-date="${d.dateKey}">
      ${d.dayName}, ${d.dayNumber} ${d.monthName}
    </button>
  `).join('');

  loadRescheduleSlots(days.find(d => !d.isClosed).dateKey);
  modal.classList.remove('hidden');
}

let rescheduleSelectedDate = '';
let rescheduleSelectedSlot = '';

function loadRescheduleSlots(dateKey) {
  sound.playClick();
  rescheduleSelectedDate = dateKey;

  document.querySelectorAll('.reschedule-day-pill').forEach(btn => {
    btn.classList.toggle('bg-amber-500', btn.dataset.date === dateKey);
    btn.classList.toggle('text-white', btn.dataset.date === dateKey);
  });

  const slotData = calendarEngine.generateSlots(bookingToReschedule.serviceId, dateKey);
  const container = document.getElementById('reschedule-slots-container');
  const allSlots = [...slotData.morning, ...slotData.afternoon, ...slotData.evening];

  const availableSlots = allSlots.filter(s => s.isAvailable);
  if (availableSlots.length === 0) {
    container.innerHTML = `<p class="col-span-full text-xs text-slate-400 py-4 text-center">No open slots on this date.</p>`;
    return;
  }

  container.innerHTML = availableSlots.map(s => `
    <button
      onclick="selectRescheduleSlot('${s.time}')"
      class="reschedule-slot-pill py-2 px-3 border border-slate-200 rounded-xl text-xs font-semibold hover:border-amber-500 hover:bg-amber-50 text-slate-700 transition-all" data-slot="${s.time}">
      ${s.time}
    </button>
  `).join('');
}

function selectRescheduleSlot(time) {
  sound.playClick();
  rescheduleSelectedSlot = time;
  document.querySelectorAll('.reschedule-slot-pill').forEach(btn => {
    const isMatch = btn.dataset.slot === time;
    btn.classList.toggle('bg-amber-500', isMatch);
    btn.classList.toggle('text-white', isMatch);
    btn.classList.toggle('border-amber-500', isMatch);
  });
}

function confirmReschedule() {
  if (!rescheduleSelectedDate || !rescheduleSelectedSlot) {
    showToast('Please select a new date and time slot', 'warning');
    return;
  }

  try {
    storage.rescheduleBooking(bookingToReschedule.id, rescheduleSelectedDate, rescheduleSelectedSlot);
    sound.playSuccess();
    showToast('Appointment rescheduled successfully!', 'success');
    closeRescheduleModal();
    renderMyBookingsTab();
  } catch (err) {
    sound.playAlert();
    showToast(err.message, 'error');
  }
}

function closeRescheduleModal() {
  sound.playClick();
  document.getElementById('reschedule-modal').classList.add('hidden');
}

function promptCancelBooking(bookingId) {
  sound.playAlert();
  const reason = prompt('Please enter the reason for cancellation (Optional):', 'Change of plans / Schedule conflict');
  if (reason !== null) {
    storage.updateBookingStatus(bookingId, 'Cancelled', reason || 'Client requested cancellation');
    sound.playSuccess();
    showToast('Booking cancelled. Slot has been freed for others.', 'info');
    renderMyBookingsTab();
    renderSlotPicker();
  }
}

// ==========================================================================
// TAB 3: ADMIN & ANALYTICS DASHBOARD
// ==========================================================================
function renderAdminTab() {
  const stats = storage.getStats();

  document.getElementById('admin-stat-total').textContent = stats.totalBookings;
  document.getElementById('admin-stat-today').textContent = stats.todayCount;
  document.getElementById('admin-stat-confirmed').textContent = stats.confirmedCount;
  document.getElementById('admin-stat-revenue').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
  document.getElementById('admin-stat-cancellation').textContent = `${stats.cancelRate}%`;

  renderAdminAppointmentsTable();
  renderAdminServicesList();
  loadAdminSettingsForm();
}

function renderAdminAppointmentsTable() {
  const container = document.getElementById('admin-appointments-tbody');
  const filter = document.getElementById('admin-table-status-filter').value;
  let bookings = storage.getBookings();

  if (filter !== 'all') {
    bookings = bookings.filter(b => b.status.toLowerCase() === filter.toLowerCase());
  }

  if (bookings.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-xs text-slate-400">No records found matching criteria.</td></tr>`;
    return;
  }

  container.innerHTML = bookings.map(b => `
    <tr class="border-b border-slate-100 hover:bg-slate-50/70 text-xs">
      <td class="py-3 px-4 font-mono font-bold text-slate-800">${b.id}</td>
      <td class="py-3 px-4">
        <strong class="text-slate-900 block">${b.customerName}</strong>
        <span class="text-slate-400">${b.customerPhone}</span>
      </td>
      <td class="py-3 px-4">
        <span class="font-medium text-slate-800 block">${b.serviceName}</span>
        <span class="text-indigo-600 text-[11px]">${b.provider}</span>
      </td>
      <td class="py-3 px-4">
        <span class="font-semibold text-slate-800 block">${calendarEngine.formatDisplayDate(b.date)}</span>
        <span class="text-slate-500">${b.timeSlot}</span>
      </td>
      <td class="py-3 px-4 font-bold text-slate-900">₹${b.amount}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${
          b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
          b.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
          b.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
        }">${b.status}</span>
      </td>
      <td class="py-3 px-4 text-right">
        <div class="flex items-center justify-end gap-1.5">
          ${b.status === 'Confirmed' ? `
            <button onclick="adminChangeStatus('${b.id}', 'Completed')" title="Mark as Completed" class="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </button>
            <button onclick="adminChangeStatus('${b.id}', 'Cancelled')" title="Cancel" class="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          ` : `
            <span class="text-slate-300 text-[11px]">—</span>
          `}
        </div>
      </td>
    </tr>
  `).join('');
}

function adminChangeStatus(id, newStatus) {
  sound.playClick();
  storage.updateBookingStatus(id, newStatus, `Updated via Admin Dashboard to ${newStatus}`);
  showToast(`Booking ${id} marked as ${newStatus}`, 'info');
  renderAdminTab();
  renderSlotPicker();
}

function renderAdminServicesList() {
  const container = document.getElementById('admin-services-list');
  const services = storage.getServices();

  container.innerHTML = services.map(s => `
    <div class="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl">
      <div class="flex items-center gap-3">
        <img src="${s.avatar}" class="w-10 h-10 rounded-lg object-cover" />
        <div>
          <h5 class="text-xs font-bold text-slate-900">${s.name}</h5>
          <span class="text-[11px] text-slate-500">${s.provider} • ₹${s.price} (${s.duration}m)</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="deleteService('${s.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Service">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function deleteService(id) {
  if (confirm('Are you sure you want to delete this service?')) {
    storage.deleteService(id);
    showToast('Service deleted successfully', 'info');
    renderAdminServicesList();
    renderBookingTab();
  }
}

function openAddServiceModal() {
  sound.playClick();
  document.getElementById('service-modal').classList.remove('hidden');
}

function closeAddServiceModal() {
  sound.playClick();
  document.getElementById('service-modal').classList.add('hidden');
}

function handleSaveService(e) {
  e.preventDefault();
  const name = document.getElementById('new-srv-name').value.trim();
  const provider = document.getElementById('new-srv-provider').value.trim();
  const categoryId = document.getElementById('new-srv-category').value;
  const duration = Number(document.getElementById('new-srv-duration').value) || 30;
  const bufferTime = Number(document.getElementById('new-srv-buffer').value) || 10;
  const price = Number(document.getElementById('new-srv-price').value) || 0;
  const description = document.getElementById('new-srv-desc').value.trim();

  if (!name || !provider) {
    showToast('Service name and provider are required', 'warning');
    return;
  }

  storage.saveService({
    name,
    provider,
    categoryId,
    duration,
    bufferTime,
    price,
    description: description || 'Professional scheduling session.'
  });

  sound.playSuccess();
  showToast('New service added successfully!', 'success');
  closeAddServiceModal();
  renderAdminServicesList();
  renderBookingTab();
}

function loadAdminSettingsForm() {
  const settings = storage.getSettings();
  document.getElementById('setting-start-time').value = settings.workStartTime;
  document.getElementById('setting-end-time').value = settings.workEndTime;
  document.getElementById('setting-lunch-start').value = settings.lunchBreakStart;
  document.getElementById('setting-lunch-end').value = settings.lunchBreakEnd;
  document.getElementById('setting-interval').value = settings.slotInterval;
}

function handleSaveSettings(e) {
  e.preventDefault();
  const workStartTime = document.getElementById('setting-start-time').value;
  const workEndTime = document.getElementById('setting-end-time').value;
  const lunchBreakStart = document.getElementById('setting-lunch-start').value;
  const lunchBreakEnd = document.getElementById('setting-lunch-end').value;
  const slotInterval = Number(document.getElementById('setting-interval').value) || 30;

  storage.saveSettings({
    workStartTime,
    workEndTime,
    lunchBreakStart,
    lunchBreakEnd,
    slotInterval
  });

  sound.playSuccess();
  showToast('Operating schedule settings updated!', 'success');
  renderSlotPicker();
}

// Export appointments as CSV
function exportAppointmentsCSV() {
  sound.playClick();
  const bookings = storage.getBookings();
  if (bookings.length === 0) {
    showToast('No booking data to export', 'warning');
    return;
  }

  const headers = ['Booking_ID', 'Customer_Name', 'Email', 'Phone', 'Service', 'Provider', 'Date', 'Time_Slot', 'Duration_Mins', 'Amount_INR', 'Status', 'Created_At'];
  const rows = bookings.map(b => [
    b.id,
    `"${b.customerName}"`,
    b.customerEmail,
    b.customerPhone,
    `"${b.serviceName}"`,
    `"${b.provider}"`,
    b.date,
    b.timeSlot,
    b.duration,
    b.amount,
    b.status,
    b.createdAt
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Appointments exported to CSV file!', 'success');
}

// Reset system to demo defaults
function handleResetDemoData() {
  if (confirm('Reset all bookings and services back to initial college presentation demo data?')) {
    storage.resetToDefaults();
    sound.playSuccess();
    showToast('System data reset to default seed records!', 'info');
    renderAdminTab();
    renderBookingTab();
  }
}

// ==========================================================================
// TAB 4: SERVICES CATALOG
// ==========================================================================
function renderServicesTab() {
  const container = document.getElementById('services-catalog-grid');
  const services = storage.getServices();

  container.innerHTML = services.map(s => `
    <div class="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
      <div>
        <div class="flex items-center gap-4 mb-4">
          <img src="${s.avatar}" class="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm" />
          <div>
            <h4 class="font-extrabold text-slate-900 text-lg">${s.name}</h4>
            <p class="text-xs font-semibold text-indigo-600">${s.provider}</p>
            <div class="flex items-center gap-1.5 mt-1 text-xs text-amber-500 font-bold">
              ★ ${s.rating} <span class="text-slate-400 font-normal">(${s.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed mb-4">${s.description}</p>
      </div>

      <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span class="text-[11px] text-slate-400 block">${s.duration} mins session</span>
          <span class="text-xl font-black text-slate-900">₹${s.price}</span>
        </div>
        <button
          onclick="selectService('${s.id}'); switchTab('book');"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all">
          Book This Now
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// TAB 5: PROJECT DOCS & VIVA HIGHLIGHTS
// ==========================================================================
function renderDocsTab() {
  // Static content already embedded in HTML
}

// ==========================================================================
// INITIALIZATION ON PAGE LOAD
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  switchTab('book');

  // Search input listeners
  const myBookingsSearch = document.getElementById('my-bookings-search');
  if (myBookingsSearch) {
    myBookingsSearch.addEventListener('input', () => renderMyBookingsTab());
  }

  const myBookingsStatusFilter = document.getElementById('my-bookings-status-filter');
  if (myBookingsStatusFilter) {
    myBookingsStatusFilter.addEventListener('change', () => renderMyBookingsTab());
  }

  const adminTableFilter = document.getElementById('admin-table-status-filter');
  if (adminTableFilter) {
    adminTableFilter.addEventListener('change', () => renderAdminAppointmentsTable());
  }
});
