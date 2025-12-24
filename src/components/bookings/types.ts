export interface Booking {
  id: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  booking_type: 'lesson' | 'assessment' | 'floating'
  notes?: string
  created_at: string
  updated_at?: string
  canceled_at?: string
  cancel_reason?: string
  cancel_source?: 'parent' | 'admin' | 'instructor'
  canceled_by?: string

  session?: {
    id: string
    start_time: string
    end_time: string
    location: string
    instructor_id?: string
    session_type: 'lesson' | 'assessment'
    session_type_detail?: string
    instructor?: {
      id: string
      full_name: string
      email?: string
      phone?: string
    }
  }

  swimmer?: {
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string
    gender?: string
    funding_source_id?: string
    flexible_swimmer: boolean
    current_level_id?: string
    funding_source?: {
      id: string
      name: string
      short_name?: string
      type: 'regional_center' | 'private_pay' | 'scholarship'
    }
    level?: {
      id: string
      name: string
      display_name: string
      color: string
    }
  }

  parent?: {
    id: string
    full_name: string
    email: string
    phone?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    zip_code?: string
  }

  progress_notes?: Array<{
    id: string
    lesson_summary?: string
    instructor_notes?: string
    parent_notes?: string
    created_at: string
    instructor?: {
      full_name: string
    }
  }>
}

export interface BookingFilters {
  startDate?: string
  endDate?: string
  instructorId?: string
  status?: string[] // comma-separated or array
  paymentType?: 'all' | 'private_pay' | 'regional_center'
  search?: string
  bookingType?: string
  location?: string
  timeRange?: 'morning' | 'afternoon' | 'evening' | 'all'
}

export interface BookingStats {
  open_sessions: number
  booked: number
  confirmed: number
  completed: number
  cancelled: number
  no_shows: number
}

export interface Instructor {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
}

export interface AvailableSession {
  id: string
  start_time: string
  end_time: string
  location: string
  instructor_id?: string
  max_capacity: number
  booking_count: number
  is_full: boolean
  session_type: 'lesson' | 'assessment'
  session_type_detail?: string
  price_cents: number
  instructor?: {
    id: string
    full_name: string
    email?: string
  }
  bookings?: Array<{
    id: string
    status: string
    swimmer?: {
      id: string
      first_name: string
      last_name: string
    }
  }>
}