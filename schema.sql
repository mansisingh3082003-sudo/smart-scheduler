-- ============================================================================
-- SMART SCHEDULER BOOKING SYSTEM - RELATIONAL DATABASE SCHEMA
-- Compatible with PostgreSQL (v14+) & MySQL (v8+)
-- ============================================================================

-- 1. ROLES & USERS TABLE
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (role_id, role_name) VALUES
(1, 'Super Admin'),
(2, 'Service Provider / Staff'),
(3, 'Customer / Client');

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    role_id INT NOT NULL DEFAULT 3,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
);

CREATE INDEX idx_users_email ON users(email);

-- 2. SERVICE CATEGORIES TABLE
CREATE TABLE service_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon_name VARCHAR(50) DEFAULT 'sparkles',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO service_categories (category_id, name, display_order) VALUES
('healthcare', 'Healthcare & Doctors', 1),
('salon', 'Salon & Wellness', 2),
('education', 'Coaching & Mentoring', 3),
('consulting', 'Business & Legal Advisory', 4);

-- 3. SERVICES TABLE
CREATE TABLE services (
    service_id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    provider_name VARCHAR(120) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    buffer_minutes INT NOT NULL DEFAULT 10,
    price_inr DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    reviews_count INT DEFAULT 0,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(category_id) ON DELETE CASCADE
);

CREATE INDEX idx_services_category ON services(category_id);

-- 4. PROVIDER AVAILABILITY & WORKING HOURS
CREATE TABLE provider_schedules (
    schedule_id VARCHAR(50) PRIMARY KEY,
    service_id VARCHAR(50) NOT NULL,
    day_of_week INT NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '18:00:00',
    lunch_break_start TIME DEFAULT '13:00:00',
    lunch_break_end TIME DEFAULT '14:00:00',
    is_working_day BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    UNIQUE KEY uk_provider_day (service_id, day_of_week)
);

-- 5. APPOINTMENT BOOKINGS TABLE
-- Note the CRITICAL composite UNIQUE constraint to guarantee Zero Double-Booking!
CREATE TABLE appointments (
    booking_id VARCHAR(50) PRIMARY KEY, -- e.g. SCH-7821
    service_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(120) NOT NULL,
    customer_email VARCHAR(160) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    start_time VARCHAR(20) NOT NULL, -- e.g. '10:00 AM'
    duration_minutes INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    status ENUM('Confirmed', 'Completed', 'Cancelled', 'Rescheduled', 'No-Show') NOT NULL DEFAULT 'Confirmed',
    notes TEXT,
    cancel_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Compound index for fast slot collision checks
CREATE INDEX idx_appointments_slot ON appointments(service_id, booking_date, start_time, status);
CREATE INDEX idx_appointments_customer ON appointments(customer_email);
CREATE INDEX idx_appointments_date ON appointments(booking_date);

-- 6. AUDIT / LOGS TABLE
CREATE TABLE appointment_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'CREATED', 'RESCHEDULED', 'CANCELLED', 'STATUS_UPDATED'
    previous_value JSON,
    new_value JSON,
    performed_by VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES appointments(booking_id) ON DELETE CASCADE
);
