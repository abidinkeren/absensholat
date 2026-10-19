export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  photoUrl: string;
  registeredAt: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  nisn: string;
  studentName: string;
  classId: string;
  gender: 'L' | 'P';
  date: string;
  time: string;
  timestamp: string;
  status: 'hadir_tepat_waktu' | 'terlambat' | 'izin' | 'sakit' | 'alpa';
  confidence?: number;
  deviceSource?: string;
  photoSnapshot?: string;
  notes?: string;
}

export interface ClassRecap {
  classId: string;
  totalStudents: number;
  hadirTepatWaktu: number;
  terlambat: number;
  totalHadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  percentage: number;
}

export interface DailySummary {
  totalStudents: number;
  hadirTepatWaktu: number;
  terlambat: number;
  totalHadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  percentage: number;
}

export interface SystemSettings {
  schoolName: string;
  prayerName: string;
  startTime: string;
  adzanTime: string;
  iqamahTime: string;
  endTime: string;
  toleranceMinutes: number;
  academicYear: string;
  location: string;
  kioskVoiceAnnounce: boolean;
  minimumMatchConfidence: number;
}

export interface ServerStatus {
  status: string;
  appName: string;
  settings: SystemSettings;
  fileStats: {
    storageDir: string;
    attendanceFileSize: number;
    totalRecords: number;
    todayRecords: number;
    totalStudents: number;
    serverTime: string;
    serverDate: string;
  };
}
