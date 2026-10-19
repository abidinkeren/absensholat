import React, { useState, useEffect, useCallback } from 'react';
import {
  Camera,
  LayoutDashboard,
  CalendarDays,
  Users,
  Smartphone,
  Settings,
  HardDrive,
  Clock,
  Sparkles,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';
import { Student, AttendanceRecord, DailySummary, ClassRecap, SystemSettings, ServerStatus } from './types';
import { AndroidScanner } from './components/AndroidScanner';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { MonthlyRecap } from './components/MonthlyRecap';
import { AndroidIntegration } from './components/AndroidIntegration';
import { SettingsModal } from './components/SettingsModal';
import { getHijriDate } from './utils/sound';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'dashboard' | 'monthly' | 'students' | 'integration'>('dashboard');

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [classRecaps, setClassRecaps] = useState<ClassRecap[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [statusRes, settingsRes, studentsRes, attRes, recapRes] = await Promise.all([
        fetch('/api/status').then((r) => r.json()).catch(() => null),
        fetch('/api/settings').then((r) => r.json()).catch(() => null),
        fetch('/api/students').then((r) => r.json()).catch(() => []),
        fetch(`/api/attendance?date=${selectedDate}&classId=${selectedClass}`).then((r) => r.json()).catch(() => []),
        fetch(`/api/recap/daily?date=${selectedDate}`).then((r) => r.json()).catch(() => null),
      ]);

      if (statusRes) setServerStatus(statusRes);
      if (settingsRes) setSettings(settingsRes);
      if (Array.isArray(studentsRes)) setStudents(studentsRes);
      if (Array.isArray(attRes)) setRecords(attRes);
      if (recapRes) {
        setDailySummary(recapRes.summary);
        setClassRecaps(recapRes.classRecaps || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedClass]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle new scan recorded
  const handleAttendanceRecorded = (newRecord: AttendanceRecord) => {
    setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);
    fetchData();
  };

  // Handle manual mark
  const handleManualMark = async (
    studentId: string,
    status: 'hadir_tepat_waktu' | 'terlambat' | 'izin' | 'sakit' | 'alpa',
    notes: string
  ) => {
    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          status,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Manual mark failed:', e);
    }
  };

  // Handle delete record
  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        fetchData();
      }
    } catch (e) {
      console.error('Delete attendance failed:', e);
    }
  };

  // Handle add student
  const handleAddStudent = async (studentData: {
    name: string;
    nisn: string;
    classId: string;
    gender: 'L' | 'P';
    photoUrl?: string;
    photoBase64?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents((prev) => [...prev, data.student]);
        fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Add student failed:', e);
      return false;
    }
  };

  // Handle delete student
  const handleDeleteStudent = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Delete student failed:', e);
      return false;
    }
  };

  // Handle update student
  const handleUpdateStudent = async (id: string, updatedData: Partial<Student>): Promise<boolean> => {
    try {
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
      );
      fetchData();
      return true;
    } catch (e) {
      console.error('Update student failed:', e);
      return false;
    }
  };

  // Handle save settings
  const handleSaveSettings = async (updated: SystemSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        fetchData();
      }
    } catch (e) {
      console.error('Save settings failed:', e);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* TOP ISLAMIC HEADER & NAVBAR */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 border-b border-emerald-100 dark:border-slate-800 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  SiHadir Dzuhur
                </h1>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  v1.2 Scan Wajah
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {settings?.schoolName || 'SMP / MTs Al-Ikhlas Boarding School'}
              </p>
            </div>
          </div>

          {/* Realtime Islamic Prayer Clock & Server Disk status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Clock & Hijri Widget */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{formattedTime} WIB</span>
              </div>
              <div className="hidden sm:block text-[11px] text-emerald-700/80 dark:text-emerald-400/80 border-l border-emerald-200 dark:border-emerald-800 pl-3">
                {getHijriDate()} • {formattedDate}
              </div>
            </div>

            {/* Disk Storage Status */}
            <div
              className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"
              title="Database tersimpan di disk server: ./data/attendance.json"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-semibold text-[11px] hidden sm:inline">Server Komputer:</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {serverStatus?.fileStats.totalRecords || records.length} Absen
              </span>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Pengaturan Jadwal Sholat"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center overflow-x-auto gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-1 pb-1.5 text-xs">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'scanner'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-500'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scanner Wajah (Android / Kiosk)</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-500'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Rekap Harian</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'monthly'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-500'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Matriks 7 Hari</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'students'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-500'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Database Siswa & Wajah ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('integration')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'integration'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-1 ring-emerald-500'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Integrasi Android & Server Komputer</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'scanner' && (
          <AndroidScanner
            students={students}
            settings={settings}
            onAttendanceRecorded={handleAttendanceRecorded}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            students={students}
            records={records}
            dailySummary={dailySummary}
            classRecaps={classRecaps}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedClass={selectedClass}
            onClassChange={setSelectedClass}
            settings={settings}
            onRefresh={fetchData}
            onManualMark={handleManualMark}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyRecap students={students} records={records} />
        )}

        {activeTab === 'students' && (
          <StudentManagement
            students={students}
            settings={settings}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStudent={handleUpdateStudent}
          />
        )}

        {activeTab === 'integration' && (
          <AndroidIntegration serverStatus={serverStatus} />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © {new Date().getFullYear()} {settings?.schoolName || 'SMP / MTs Al-Ikhlas'} • Sistem Absensi Sholat Dzuhur Berjamaah
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Penyimpanan Harddisk: ./data/attendance.json
            </span>
          </div>
        </div>
      </footer>

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
