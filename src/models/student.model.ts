export interface StudentModel {
    registration: {
      period: {
        period_id: string;
        current_session: string;
        start_date: string;
        end_date: string;
        period_name: string;
        period: string;
        active: string;
      };
      program: {
        attendance_type_name: string;
        programme_name: string;
        programme_code: string;
        faculty_id: string;
        programme_id: string;
        faculty_name: string;
        faculty_code: string;
        level: string;
        completed: boolean;
      };
      modules: Array<any>;
      is_registered: boolean;
      exemption: Array<any>;
    };
    vle: {
      status: boolean;
      classes_ready: number;
    };
    accounts: {
      wifi: boolean;
      student_id_card: boolean;
      canteen: boolean;
      accomodation: any;
    };
    bursary: {
      pastel_account: string;
      statements: Array<any>;
    };
    bankRate: {
      rate: string;
    };
    notice: Array<any>;
    profile: {
      first_name: string;
      surname: string;
      nationality: string;
      national_id: string;
      place_of_birth: string;
      citizenship: string;
      permanant_address: string;
      passport_number: string;
      permanant_zimbabwe_resident: string;
      email_address: string;
      phone_numbers: string;
      contact_address: string;
      permanent_home_address: string;
      date_of_birth: string;
      marital_status: string;
      religion: string;
      title: string;
      sex: string;
      student_id: string;
      radio_frequency_id: string;
    };
  }