import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default settings
const DEFAULT_SETTINGS = {
  schoolName: 'SMP / MTs Al-Ikhlas Boarding School',
  prayerName: 'Sholat Dzuhur Berjamaah',
  startTime: '11:45',    // Absensi mulai dibuka
  adzanTime: '12:00',    // Waktu Adzan Dzuhur
  iqamahTime: '12:15',   // Sholat Berjamaah
  endTime: '12:50',      // Batas Akhir Scan Absensi
  toleranceMinutes: 15,  // Batas toleransi terlambat setelah iqamah
  academicYear: '2024/2025 Semester Genap',
  location: 'Masjid Utama Al-Ikhlas - Lantai 1',
  kioskVoiceAnnounce: true,
  minimumMatchConfidence: 85,
};

// Seed initial students
const DEFAULT_STUDENTS = [
  {
    id: 'std-001',
    nisn: '0081234001',
    name: 'Muhammad Farhan',
    gender: 'L',
    classId: '7A',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T08:00:00Z',
    active: true,
  },
  {
    id: 'std-002',
    nisn: '0081234002',
    name: 'Ahmad Fauzi Rahman',
    gender: 'L',
    classId: '7A',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T08:10:00Z',
    active: true,
  },
  {
    id: 'std-003',
    nisn: '0081234003',
    name: 'Aisyah Putri Azzahra',
    gender: 'P',
    classId: '7A',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T08:20:00Z',
    active: true,
  },
  {
    id: 'std-004',
    nisn: '0081234004',
    name: 'Bilal Habibi',
    gender: 'L',
    classId: '7B',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T08:30:00Z',
    active: true,
  },
  {
    id: 'std-005',
    nisn: '0081234005',
    name: 'Fatimah Zahra',
    gender: 'P',
    classId: '7B',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T08:40:00Z',
    active: true,
  },
  {
    id: 'std-006',
    nisn: '0081234006',
    name: 'Rayhan Al-Ghifari',
    gender: 'L',
    classId: '8A',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T08:50:00Z',
    active: true,
  },
  {
    id: 'std-007',
    nisn: '0081234007',
    name: 'Syifa Nurul Hidayah',
    gender: 'P',
    classId: '8A',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T09:00:00Z',
    active: true,
  },
  {
    id: 'std-008',
    nisn: '0081234008',
    name: 'Ibrahim Malik',
    gender: 'L',
    classId: '8B',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T09:10:00Z',
    active: true,
  },
  {
    id: 'std-009',
    nisn: '0081234009',
    name: 'Zahra Amelia Santoso',
    gender: 'P',
    classId: '8B',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T09:20:00Z',
    active: true,
  },
  {
    id: 'std-010',
    nisn: '0081234010',
    name: 'Dzaky Rahmatullah',
    gender: 'L',
    classId: '9A',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T09:30:00Z',
    active: true,
  },
  {
    id: 'std-011',
    nisn: '0081234011',
    name: 'Nabila Khairunnisa',
    gender: 'P',
    classId: '9A',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T09:40:00Z',
    active: true,
  },
  {
    id: 'std-012',
    nisn: '0081234012',
    name: 'Yusuf Maulana',
    gender: 'L',
    classId: '9B',
    photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    registeredAt: '2025-01-10T09:50:00Z',
    active: true,
  },
];

// Helper functions for file persistence
function loadJsonFile<T>(filePath: string, defaultData: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function saveJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// Generate realistic seed attendance for today and yesterday if empty
function generateSeedAttendance(): any[] {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'att-seed-1',
      studentId: 'std-001',
      nisn: '0081234001',
      studentName: 'Muhammad Farhan',
      classId: '7A',
      gender: 'L',
      date: today,
      time: '12:04:12',
      timestamp: `${today}T12:04:12.000Z`,
      status: 'hadir_tepat_waktu', // hadir_tepat_waktu | terlambat | izin | sakit | alpa
      confidence: 97.4,
      deviceSource: 'Android Kiosk Tablet #1',
      notes: 'Sholat Dzuhur Shaf Pertama',
    },
    {
      id: 'att-seed-2',
      studentId: 'std-002',
      nisn: '0081234002',
      studentName: 'Ahmad Fauzi Rahman',
      classId: '7A',
      gender: 'L',
      date: today,
      time: '12:07:35',
      timestamp: `${today}T12:07:35.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 98.8,
      deviceSource: 'Android Kiosk Tablet #1',
      notes: 'Hadir sebelum Iqamah',
    },
    {
      id: 'att-seed-3',
      studentId: 'std-004',
      nisn: '0081234004',
      studentName: 'Bilal Habibi',
      classId: '7B',
      gender: 'L',
      date: today,
      time: '12:12:00',
      timestamp: `${today}T12:12:00.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 95.2,
      deviceSource: 'Android Phone - Kamera Depan',
      notes: 'Muadzin Dzuhur',
    },
    {
      id: 'att-seed-4',
      studentId: 'std-006',
      nisn: '0081234006',
      studentName: 'Rayhan Al-Ghifari',
      classId: '8A',
      gender: 'L',
      date: today,
      time: '12:28:44',
      timestamp: `${today}T12:28:44.000Z`,
      status: 'terlambat',
      confidence: 96.1,
      deviceSource: 'Android Kiosk Tablet #1',
      notes: 'Terlambat 13 menit setelah Iqomah',
    },
    {
      id: 'att-seed-5',
      studentId: 'std-007',
      nisn: '0081234007',
      studentName: 'Syifa Nurul Hidayah',
      classId: '8A',
      gender: 'P',
      date: today,
      time: '12:09:15',
      timestamp: `${today}T12:09:15.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 99.1,
      deviceSource: 'Android Tablet #2 (Siswa Putri)',
      notes: 'Musholla Akhwat Lantai 2',
    },
    {
      id: 'att-seed-6',
      studentId: 'std-010',
      nisn: '0081234010',
      studentName: 'Dzaky Rahmatullah',
      classId: '9A',
      gender: 'L',
      date: today,
      time: '12:05:40',
      timestamp: `${today}T12:05:40.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 98.2,
      deviceSource: 'Android Kiosk Tablet #1',
      notes: 'Imam Sholat Dzuhur',
    },
    // Yesterday records for trend
    {
      id: 'att-seed-7',
      studentId: 'std-001',
      nisn: '0081234001',
      studentName: 'Muhammad Farhan',
      classId: '7A',
      gender: 'L',
      date: yesterday,
      time: '12:06:10',
      timestamp: `${yesterday}T12:06:10.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 98.1,
      deviceSource: 'Android Kiosk Tablet #1',
    },
    {
      id: 'att-seed-8',
      studentId: 'std-002',
      nisn: '0081234002',
      studentName: 'Ahmad Fauzi Rahman',
      classId: '7A',
      gender: 'L',
      date: yesterday,
      time: '12:08:22',
      timestamp: `${yesterday}T12:08:22.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 97.9,
      deviceSource: 'Android Kiosk Tablet #1',
    },
    {
      id: 'att-seed-9',
      studentId: 'std-003',
      nisn: '0081234003',
      studentName: 'Aisyah Putri Azzahra',
      classId: '7A',
      gender: 'P',
      date: yesterday,
      time: '12:10:00',
      timestamp: `${yesterday}T12:10:00.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 99.0,
      deviceSource: 'Android Tablet #2 (Siswa Putri)',
    },
    {
      id: 'att-seed-10',
      studentId: 'std-004',
      nisn: '0081234004',
      studentName: 'Bilal Habibi',
      classId: '7B',
      gender: 'L',
      date: yesterday,
      time: '12:05:11',
      timestamp: `${yesterday}T12:05:11.000Z`,
      status: 'hadir_tepat_waktu',
      confidence: 96.5,
      deviceSource: 'Android Kiosk Tablet #1',
    },
  ];
}

// Initialize files if not existing
const initialSettings = loadJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
const initialStudents = loadJsonFile(STUDENTS_FILE, DEFAULT_STUDENTS);
let currentAttendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);
if (currentAttendance.length === 0) {
  currentAttendance = generateSeedAttendance();
  saveJsonFile(ATTENDANCE_FILE, currentAttendance);
}

// ----------------- API ROUTES -----------------

// 1. System status & storage info
app.get('/api/status', (req: Request, res: Response) => {
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);
  const settings = loadJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => a.date === todayStr);

  const fileStats = {
    storageDir: DATA_DIR,
    attendanceFileSize: fs.existsSync(ATTENDANCE_FILE) ? fs.statSync(ATTENDANCE_FILE).size : 0,
    totalRecords: attendance.length,
    todayRecords: todayAttendance.length,
    totalStudents: students.length,
    serverTime: new Date().toLocaleTimeString('id-ID', { hour12: false }),
    serverDate: todayStr,
  };

  res.json({
    status: 'online',
    appName: 'SiHadir Dzuhur - Face Attendance System',
    settings,
    fileStats,
  });
});

// 2. Settings endpoints
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = loadJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  res.json(settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  const updated = { ...DEFAULT_SETTINGS, ...req.body };
  saveJsonFile(SETTINGS_FILE, updated);
  res.json({ success: true, settings: updated });
});

// 3. Students endpoints
app.get('/api/students', (req: Request, res: Response) => {
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const { classId, search } = req.query;

  let filtered = [...students];
  if (classId && classId !== 'all') {
    filtered = filtered.filter((s) => s.classId === classId);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(q) || s.nisn.includes(q));
  }

  res.json(filtered);
});

app.post('/api/students', (req: Request, res: Response) => {
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const { name, nisn, classId, gender, photoUrl, photoBase64 } = req.body;

  if (!name || !nisn || !classId) {
    res.status(400).json({ error: 'Nama, NISN, dan Kelas wajib diisi' });
    return;
  }

  // Check unique NISN
  const existing = students.find((s) => s.nisn === nisn);
  if (existing) {
    res.status(400).json({ error: `Siswa dengan NISN ${nisn} sudah terdaftar (${existing.name})` });
    return;
  }

  const newStudent = {
    id: `std-${Date.now().toString(36)}`,
    nisn,
    name,
    classId,
    gender: gender || 'L',
    photoUrl: photoBase64 || photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    registeredAt: new Date().toISOString(),
    active: true,
  };

  students.push(newStudent);
  saveJsonFile(STUDENTS_FILE, students);

  res.status(201).json({ success: true, student: newStudent });
});

app.delete('/api/students/:id', (req: Request, res: Response) => {
  let students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const { id } = req.params;

  const prevLen = students.length;
  students = students.filter((s) => s.id !== id);

  if (students.length === prevLen) {
    res.status(404).json({ error: 'Siswa tidak ditemukan' });
    return;
  }

  saveJsonFile(STUDENTS_FILE, students);
  res.json({ success: true, message: 'Data siswa berhasil dihapus' });
});

app.put('/api/students/:id', (req: Request, res: Response) => {
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const { id } = req.params;
  const { name, nisn, classId, gender, photoUrl } = req.body;

  const index = students.findIndex((s) => s.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Siswa tidak ditemukan' });
    return;
  }

  students[index] = {
    ...students[index],
    ...(name ? { name } : {}),
    ...(nisn ? { nisn } : {}),
    ...(classId ? { classId } : {}),
    ...(gender ? { gender } : {}),
    ...(photoUrl ? { photoUrl } : {}),
    updatedAt: new Date().toISOString(),
  };

  saveJsonFile(STUDENTS_FILE, students);
  res.json({ success: true, student: students[index] });
});

// 4. Attendance query
app.get('/api/attendance', (req: Request, res: Response) => {
  const attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);
  const { date, classId, status } = req.query;

  let filtered = [...attendance];

  if (date) {
    filtered = filtered.filter((a) => a.date === date);
  }

  if (classId && classId !== 'all') {
    filtered = filtered.filter((a) => a.classId === classId);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((a) => a.status === status);
  }

  // Sort by latest timestamp
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(filtered);
});

// 5. Attendance scan check-in (Face scan or QR Code fallback)
app.post('/api/scan', (req: Request, res: Response) => {
  const { studentId, nisn, qrData, scanMethod, confidence, photoSnapshot, deviceSource } = req.body;
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);
  const settings = loadJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);

  // Find student by ID, NISN, or QR code data
  let student = null;
  let cleanNisn = nisn;
  let cleanStudentId = studentId;

  if (qrData) {
    let parsedQr = qrData.trim();
    if (parsedQr.startsWith('DZUHUR:')) {
      cleanNisn = parsedQr.replace('DZUHUR:', '').trim();
    } else {
      try {
        const obj = JSON.parse(parsedQr);
        if (obj.nisn) cleanNisn = obj.nisn;
        if (obj.id || obj.studentId) cleanStudentId = obj.id || obj.studentId;
      } catch (e) {
        cleanNisn = parsedQr;
      }
    }
  }

  if (cleanStudentId) {
    student = students.find((s) => s.id === cleanStudentId);
  }
  if (!student && cleanNisn) {
    student = students.find((s) => s.nisn === cleanNisn);
  }

  const isQr = scanMethod === 'qr_code' || Boolean(qrData);

  if (!student) {
    res.status(404).json({
      success: false,
      message: isQr
        ? 'QR Code kartu pelajar tidak valid atau siswa belum terdaftar.'
        : 'Wajah siswa belum dikenali atau belum terdaftar dalam sistem.',
    });
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });

  // Check if student already checked in for today
  const existingToday = attendance.find(
    (a) => a.studentId === student.id && a.date === dateStr && (a.status === 'hadir_tepat_waktu' || a.status === 'terlambat')
  );

  if (existingToday) {
    res.json({
      success: true,
      alreadyRecorded: true,
      message: `Siswa ${student.name} sudah tercatat hadir Sholat Dzuhur pada pukul ${existingToday.time}.`,
      record: existingToday,
      student,
    });
    return;
  }

  // Determine status (Tepat Waktu vs Terlambat) based on iqamah and tolerance settings
  // Example settings.iqamahTime = "12:15"
  let status = 'hadir_tepat_waktu';
  let notes = isQr
    ? 'Hadir Sholat Dzuhur via QR Code Kartu Siswa'
    : 'Hadir Sholat Dzuhur Berjamaah Tepat Waktu';

  try {
    const [iqHour, iqMin] = settings.iqamahTime.split(':').map(Number);
    const [curHour, curMin] = timeStr.split(':').map(Number);
    const iqTotalMin = iqHour * 60 + iqMin;
    const curTotalMin = curHour * 60 + curMin;

    if (curTotalMin > iqTotalMin) {
      status = 'terlambat';
      const lateDiff = curTotalMin - iqTotalMin;
      notes = `Terlambat ${lateDiff} menit (${isQr ? 'Scan QR Code' : 'Scan Wajah'})`;
    }
  } catch (e) {
    // default to hadir_tepat_waktu
  }

  const matchConfidence = confidence ? Number(confidence) : 100;

  const newRecord = {
    id: `att-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
    studentId: student.id,
    nisn: student.nisn,
    studentName: student.name,
    classId: student.classId,
    gender: student.gender,
    date: dateStr,
    time: timeStr,
    timestamp: now.toISOString(),
    status,
    confidence: isQr ? 100 : matchConfidence,
    deviceSource: deviceSource || (isQr ? 'Android Scanner (QR Code Kartu Siswa)' : 'Android Device (Kamera Depan Kiosk)'),
    photoSnapshot: photoSnapshot || student.photoUrl,
    notes,
  };

  // Append & persist directly to server disk
  attendance.push(newRecord);
  saveJsonFile(ATTENDANCE_FILE, attendance);

  res.status(201).json({
    success: true,
    alreadyRecorded: false,
    message: `Alhamdulillah, absensi Sholat Dzuhur ananda ${student.name} berhasil!`,
    record: newRecord,
    student,
  });
});

// 6. Manual attendance mark (Guru piket / wali kelas)
app.post('/api/attendance/manual', (req: Request, res: Response) => {
  const { studentId, date, status, notes } = req.body;
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);

  const student = students.find((s) => s.id === studentId);
  if (!student) {
    res.status(404).json({ error: 'Siswa tidak ditemukan' });
    return;
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });

  // Remove previous entry for this student on targetDate if exists
  const cleanAttendance = attendance.filter((a) => !(a.studentId === student.id && a.date === targetDate));

  const manualRecord = {
    id: `att-manual-${Date.now().toString(36)}`,
    studentId: student.id,
    nisn: student.nisn,
    studentName: student.name,
    classId: student.classId,
    gender: student.gender,
    date: targetDate,
    time: timeStr,
    timestamp: now.toISOString(),
    status: status || 'hadir_tepat_waktu',
    confidence: 100,
    deviceSource: 'Manual Guru Piket / Web Admin',
    photoSnapshot: student.photoUrl,
    notes: notes || 'Pencatatan manual oleh Guru Piket',
  };

  cleanAttendance.push(manualRecord);
  saveJsonFile(ATTENDANCE_FILE, cleanAttendance);

  res.json({ success: true, record: manualRecord });
});

// Delete attendance record
app.delete('/api/attendance/:id', (req: Request, res: Response) => {
  let attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);
  const { id } = req.params;

  const prevLen = attendance.length;
  attendance = attendance.filter((a) => a.id !== id);

  if (attendance.length === prevLen) {
    res.status(404).json({ error: 'Record absensi tidak ditemukan' });
    return;
  }

  saveJsonFile(ATTENDANCE_FILE, attendance);
  res.json({ success: true, message: 'Record absensi berhasil dihapus' });
});

// 7. Daily Recap endpoint
app.get('/api/recap/daily', (req: Request, res: Response) => {
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);

  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const dateRecords = attendance.filter((a) => a.date === date);

  // Group classes
  const classesList = Array.from(new Set(students.map((s) => s.classId))).sort();

  const classRecaps = classesList.map((cId) => {
    const classStudents = students.filter((s) => s.classId === cId && s.active);
    const classTotal = classStudents.length;

    const classAtt = dateRecords.filter((a) => a.classId === cId);
    const tepatWaktu = classAtt.filter((a) => a.status === 'hadir_tepat_waktu').length;
    const terlambat = classAtt.filter((a) => a.status === 'terlambat').length;
    const izin = classAtt.filter((a) => a.status === 'izin').length;
    const sakit = classAtt.filter((a) => a.status === 'sakit').length;
    const hadir = tepatWaktu + terlambat;
    const alpa = Math.max(0, classTotal - (hadir + izin + sakit));
    const percentage = classTotal > 0 ? +((hadir / classTotal) * 100).toFixed(1) : 0;

    return {
      classId: cId,
      totalStudents: classTotal,
      hadirTepatWaktu: tepatWaktu,
      terlambat,
      totalHadir: hadir,
      izin,
      sakit,
      alpa,
      percentage,
    };
  });

  const totalRegistered = students.filter((s) => s.active).length;
  const hadirTepatWaktu = dateRecords.filter((a) => a.status === 'hadir_tepat_waktu').length;
  const terlambat = dateRecords.filter((a) => a.status === 'terlambat').length;
  const izin = dateRecords.filter((a) => a.status === 'izin').length;
  const sakit = dateRecords.filter((a) => a.status === 'sakit').length;
  const totalHadir = hadirTepatWaktu + terlambat;
  const totalAlpa = Math.max(0, totalRegistered - (totalHadir + izin + sakit));
  const overallPercentage = totalRegistered > 0 ? +((totalHadir / totalRegistered) * 100).toFixed(1) : 0;

  res.json({
    date,
    summary: {
      totalStudents: totalRegistered,
      hadirTepatWaktu,
      terlambat,
      totalHadir,
      izin,
      sakit,
      alpa: totalAlpa,
      percentage: overallPercentage,
    },
    classRecaps,
  });
});

// 8. Class detailed recap
app.get('/api/recap/classes', (req: Request, res: Response) => {
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const classId = req.query.classId as string;

  const targetStudents = classId && classId !== 'all' ? students.filter((s) => s.classId === classId) : students;

  const detailedList = targetStudents.map((s) => {
    const record = attendance.find((a) => a.studentId === s.id && a.date === date);
    return {
      student: s,
      attendance: record || null,
      status: record ? record.status : 'alpa',
      time: record ? record.time : '-',
      notes: record ? record.notes : 'Belum melakukan absensi Sholat Dzuhur',
    };
  });

  res.json({
    date,
    classId: classId || 'all',
    studentsCount: targetStudents.length,
    records: detailedList,
  });
});

// 9. CSV Export for Excel
app.get('/api/export/csv', (req: Request, res: Response) => {
  const students = loadJsonFile<any[]>(STUDENTS_FILE, DEFAULT_STUDENTS);
  const attendance = loadJsonFile<any[]>(ATTENDANCE_FILE, []);
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const classFilter = req.query.classId as string;

  let filteredStudents = students;
  if (classFilter && classFilter !== 'all') {
    filteredStudents = students.filter((s) => s.classId === classFilter);
  }

  // Build CSV
  const headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'Tanggal', 'Jam Absen', 'Status Sholat Dzuhur', 'Akurasi Wajah (%)', 'Keterangan'];
  const rows = filteredStudents.map((s, idx) => {
    const record = attendance.find((a) => a.studentId === s.id && a.date === date);
    const statusText = !record
      ? 'Belum Hadir / Alpa'
      : record.status === 'hadir_tepat_waktu'
      ? 'Hadir Tepat Waktu'
      : record.status === 'terlambat'
      ? 'Terlambat'
      : record.status === 'izin'
      ? 'Izin'
      : record.status === 'sakit'
      ? 'Sakit'
      : 'Alpa';

    return [
      idx + 1,
      `"${s.nisn}"`,
      `"${s.name}"`,
      `"${s.classId}"`,
      s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      date,
      record ? record.time : '-',
      `"${statusText}"`,
      record && record.confidence ? record.confidence : '-',
      `"${record ? record.notes || '' : '-'}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="Rekap_Sholat_Dzuhur_${date}.csv"`);
  res.send(csvContent);
});

// 10. Android integration endpoint (config & instructions)
app.get('/api/android-config', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}`;

  res.json({
    appName: 'SiHadir Dzuhur - Client Scanner Android',
    version: '1.2.0',
    serverUrl: baseUrl,
    endpoints: {
      scanFace: `${baseUrl}/api/scan`,
      getStudents: `${baseUrl}/api/students`,
      getStatus: `${baseUrl}/api/status`,
      getRecap: `${baseUrl}/api/recap/daily`,
    },
    samplePayload: {
      studentId: 'std-001',
      nisn: '0081234001',
      confidence: 98.4,
      deviceSource: 'Android Samsung Tab A9+ (Masjid)',
    },
    localFilePath: ATTENDANCE_FILE,
  });
});

// Initialize Vite in dev or serve dist in production
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SiHadir Dzuhur Server] Running on http://localhost:${PORT}`);
    console.log(`[Storage] Data saved at: ${DATA_DIR}`);
  });
}

startServer();
