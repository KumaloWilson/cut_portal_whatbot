export interface HomeDataResponse {
  success: boolean
  data?: StudentHomeData
  error?: string
  requiresReauth?: boolean
}

export interface WiFiStatusResponse {
  success: boolean
  data?: WiFiStatus
  error?: string
  requiresReauth?: boolean
}

export interface WiFiActivationResponse {
  success: boolean
  data?: WiFiActivationResult
  error?: string
  requiresReauth?: boolean
}

export interface ResultPeriodsResponse {
  success: boolean
  data?: ResultPeriod[]
  error?: string
  requiresReauth?: boolean
}

export interface StudentResultsResponse {
  success: boolean
  data?: StudentResults
  error?: string
  requiresReauth?: boolean
  balanceError?: BalanceError
}

export interface BalanceError {
  valid: boolean
  message: string
  error: boolean
  currentBalance: number
}

export interface ResultPeriod {
  period_id: string
  period_name: string
}

export interface StudentResults {
  modules: ModuleResult[]
  periodname: string
}

export interface ModuleResult {
  module_code: string
  module_name: string
  grade: string
  score: number
  credits: number
  status: string
  comment?: string
}

export interface WiFiStatus {
  isActive: boolean
  message?: string
}

export interface WiFiActivationResult {
  error: boolean
  message: string
}

export interface StudentHomeData {
  registration: {
    period: {
      period_id: string
      current_session: string
      start_date: string
      end_date: string
      period_name: string
      period: string
      active: string
    }
    program: {
      attendance_type_name: string
      programme_name: string
      programme_code: string
      faculty_id: string
      programme_id: string
      faculty_name: string
      faculty_code: string
      level: string
      completed: boolean
    }
    modules: Module[]
    is_registered: boolean
    exemption: any[]
  }
  vle: {
    status: boolean
    classes_ready: number
  }
  accounts: {
    wifi: boolean
    student_id_card: boolean
    canteen: boolean
    accomodation: any
  }
  bursary: {
    pastel_account: string
    statements: BursaryStatement[]
  }
  bankRate: {
    rate: string
  }
  notice: Notice[]
  profile: StudentProfile
}

export interface Module {
  module_name: string
  module_id: string
  module_code: string
  module_unit_code: string
  period_id: string
  is_evaluable: string
  posts: any[]
  past_exam_papers: PastExamPaper[]
  reading_materials: any[]
  assignments: any[]
  course_work: any[]
  vle_status: boolean
}

export interface PastExamPaper {
  past_exam_paper_id: string
  year: string
  description: string
  document_size: string
  period_id: string
  document_path: string
}

export interface BursaryStatement {
  debit: string
  credit: string
  transaction_date: string
  transaction_description: string
  reference_number: string
}

export interface Notice {
  title: string
  body: string
  date: string
  link: string
  certification_id: number
}

export interface StudentProfile {
  first_name: string
  surname: string
  nationality: string
  national_id: string
  place_of_birth: string
  citizenship: string
  permanant_address: string
  passport_number: string
  permanant_zimbabwe_resident: string
  email_address: string
  phone_numbers: string
  contact_address: string
  permanent_home_address: string
  date_of_birth: string
  marital_status: string
  religion: string
  title: string
  sex: string
  student_id: string
  radio_frequency_id: string
}
