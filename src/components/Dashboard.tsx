import React, { useState } from 'react';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Printer,
  Search,
  Filter,
  CheckCheck,
  Building,
  UserCheck,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { Student, AttendanceRecord, DailySummary, ClassRecap, SystemSettings } from '../types';

interface Props {
  students: Student[];
  records: AttendanceRecord[];
  dailySummary: DailySummary | null;
  classRecaps: ClassRecap[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedClass: string;
  onClassChange: (classId: string) => void;
  settings: SystemSettings | null;
  onRefresh: () => void;
  onManualMark: (studentId: string, status: 'hadir_tepat_waktu' | 'terlambat' | 'izin' | 'sakit' | 'alpa', notes: string) => void;
  onDeleteRecord: (id: string) => void;
}

export const Dashboard: React.FC<Props> = ({
  students,
  records,
  dailySummary,
  classRecaps,
  selectedDate,
  onDateChange,
  selectedClass,
  onClassChange,
  settings,
  onRefresh,
  onManualMark,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualStatus, setManualStatus] = useState<'hadir_tepat_waktu' | 'terlambat' | 'izin' | 'sakit' | 'alpa'>('hadir_tepat_waktu');
  const [manualNotes, setManualNotes] = useState('');

  // Extract unique classes
  const classesList = Array.from(new Set(students.map((s) => s.classId))).sort();

  // Filter students based on class selection
  const filteredStudents = students.filter((s) => {
    if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.nisn.includes(q);
    }
    return true;
  });

  // Combine student list with attendance record for the selected date
  const studentRows = filteredStudents.map((student) => {
    const record = records.find((r) => r.studentId === student.id && r.date === selectedDate);
    const status = record ? record.status : 'alpa';
    return {
      student,
      record,
      status,
    };
  }).filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  const handleDownloadCsv = () => {
    const url = `/api/export/csv?date=${selectedDate}&classId=${selectedClass}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const submitManualAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) return;
    onManualMark(manualStudentId, manualStatus, manualNotes);
    setManualModalOpen(false);
    setManualNotes('');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Filter & Date Selector Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date Picker & Quick Days */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => onDateChange(todayStr)}
              className={`px-3 py-2 text-xs font-semibold rounded-2xl transition ${
                selectedDate === todayStr
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>

            <button
              onClick={() => onDateChange(yesterdayStr)}
              className={`px-3 py-2 text-xs font-semibold rounded-2xl transition ${
                selectedDate === yesterdayStr
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Kemarin
            </button>
          </div>

          {/* Action buttons: Add Manual, Export CSV, Print */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setManualStudentId(students[0]?.id || '');
                setManualModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Absen Manual Guru
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Ekspor ke Excel format CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Download Excel (CSV)
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              Cetak Laporan
            </button>
          </div>
        </div>
      </div>

      {/* PRINT HEADER ONLY VISIBLE ON PRINT */}
      <div className="hidden print:block text-center mb-6 pb-4 border-b-2 border-slate-900">
        <h1 className="text-xl font-bold uppercase tracking-wider">{settings?.schoolName || 'SMP / MTs Al-Ikhlas'}</h1>
        <p className="text-sm font-semibold">REKAPITULASI KEHADIRAN SHOLAT DZUHUR BERJAMAAH</p>
        <p className="text-xs text-slate-600">
          Tanggal: {selectedDate} • Kelas: {selectedClass === 'all' ? 'Semua Kelas' : `Kelas ${selectedClass}`} • Jadwal Iqamah: {settings?.iqamahTime || '12:15'} WIB
        </p>
      </div>

      {/* SUMMARY STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Siswa */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Siswa</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {dailySummary?.totalStudents || students.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">Siswa</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Terdaftar di sistem</div>
        </div>

        {/* Hadir Tepat Waktu */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-3xl p-4 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <span>Tepat Waktu</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {dailySummary?.hadirTepatWaktu || 0}
            </span>
            <span className="text-xs text-emerald-600/80 font-medium">Siswa</span>
          </div>
          <div className="text-[10px] text-emerald-600/70 mt-1">Sebelum batas iqamah</div>
        </div>

        {/* Terlambat */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded-3xl p-4 border border-amber-200/60 dark:border-amber-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <span>Terlambat</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
              {dailySummary?.terlambat || 0}
            </span>
            <span className="text-xs text-amber-600/80 font-medium">Siswa</span>
          </div>
          <div className="text-[10px] text-amber-600/70 mt-1">Setelah sholat dimulai</div>
        </div>

        {/* Izin & Sakit */}
        <div className="bg-sky-50/60 dark:bg-sky-950/20 rounded-3xl p-4 border border-sky-200/60 dark:border-sky-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-300 text-xs font-semibold">
            <span>Izin & Sakit</span>
            <UserCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-700 dark:text-sky-400">
              {(dailySummary?.izin || 0) + (dailySummary?.sakit || 0)}
            </span>
            <span className="text-xs text-sky-600/80 font-medium">Siswa</span>
          </div>
          <div className="text-[10px] text-sky-600/70 mt-1">
            Izin: {dailySummary?.izin || 0} • Sakit: {dailySummary?.sakit || 0}
          </div>
        </div>

        {/* Belum Hadir / Alpa */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 rounded-3xl p-4 border border-rose-200/60 dark:border-rose-800/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <span>Belum Hadir</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-400">
              {dailySummary?.alpa || 0}
            </span>
            <span className="text-xs text-rose-600/80 font-medium">Siswa</span>
          </div>
          <div className="text-[10px] text-rose-600/70 mt-1">Belum melakukan scan</div>
        </div>

        {/* Tingkat Kehadiran % */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-4 text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold">
            <span>Persentase</span>
            <CheckCheck className="w-4 h-4 text-emerald-200" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black">{dailySummary?.percentage || 0}%</span>
          </div>
          <div className="text-[10px] text-emerald-100/80 mt-1">Tingkat kehadiran Dzuhur</div>
        </div>
      </div>

      {/* REKAPAN PER KELAS CARDS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Rekapitulasi Kehadiran Sholat Dzuhur Per Kelas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tinjauan perbandingan kehadiran antar kelas untuk tanggal {selectedDate}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {classRecaps.map((cr) => {
            const isCurrentClass = selectedClass === cr.classId;
            return (
              <div
                key={cr.classId}
                onClick={() => onClassChange(isCurrentClass ? 'all' : cr.classId)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  isCurrentClass
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    Kelas {cr.classId}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      cr.percentage >= 90
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : cr.percentage >= 70
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {cr.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden my-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${cr.percentage}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Hadir: <strong className="text-slate-700 dark:text-slate-200">{cr.totalHadir}/{cr.totalStudents}</strong></span>
                  <span>Belum: <strong className="text-rose-600 dark:text-rose-400">{cr.alpa}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABULAR RECAP & ATTENDANCE LOG */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Table Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {/* Class filter dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => onClassChange(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="hadir_tepat_waktu">Hadir Tepat Waktu</option>
                <option value="terlambat">Terlambat</option>
                <option value="izin">Izin</option>
                <option value="sakit">Sakit</option>
                <option value="alpa">Belum Hadir / Alpa</option>
              </select>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Siswa</th>
                <th className="py-3 px-3">NISN</th>
                <th className="py-3 px-3">Kelas</th>
                <th className="py-3 px-3">Jam Scan Dzuhur</th>
                <th className="py-3 px-3">Status Kehadiran</th>
                <th className="py-3 px-3">Verifikasi Wajah</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 text-right print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {studentRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                studentRows.map(({ student, record, status }, idx) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={record?.photoSnapshot || student.photoUrl}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">
                            {student.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {student.gender === 'L' ? 'Ikhwan (L)' : 'Akhwat (P)'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {student.nisn}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {student.classId}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {record ? `${record.time} WIB` : '-'}
                    </td>
                    <td className="py-3 px-3">
                      {status === 'hadir_tepat_waktu' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Tepat Waktu
                        </span>
                      )}
                      {status === 'terlambat' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40">
                          <Clock className="w-3 h-3 text-amber-500" />
                          Terlambat
                        </span>
                      )}
                      {status === 'izin' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300/40">
                          <UserCheck className="w-3 h-3 text-sky-500" />
                          Izin
                        </span>
                      )}
                      {status === 'sakit' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300/40">
                          Sakit
                        </span>
                      )}
                      {status === 'alpa' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/40">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          Belum Hadir
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {record && record.confidence ? (
                        <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {record.confidence}% Cocok
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {record ? record.notes || 'Scan wajah terverifikasi' : 'Belum absen'}
                    </td>
                    <td className="py-3 px-3 text-right print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setManualStudentId(student.id);
                            setManualStatus(record ? record.status : 'hadir_tepat_waktu');
                            setManualNotes(record?.notes || '');
                            setManualModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
                          title="Ubah Status Absensi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {record && (
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                            title="Hapus Record Absensi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MANUAL ATTENDANCE / EDIT */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Pencatatan Absensi Sholat Dzuhur
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pilih siswa dan status kehadiran untuk tanggal {selectedDate}
            </p>

            <form onSubmit={submitManualAttendance} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Pilih Siswa
                </label>
                <select
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  required
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Kelas {s.classId} (NISN: {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Status Kehadiran Sholat Dzuhur
                </label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="hadir_tepat_waktu">Hadir Tepat Waktu</option>
                  <option value="terlambat">Terlambat</option>
                  <option value="izin">Izin (Urusan Resmi / Dispensasi)</option>
                  <option value="sakit">Sakit (Istirahat di UKS / Asrama)</option>
                  <option value="alpa">Alpa / Belum Hadir</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                  Catatan / Keterangan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Misal: Sakit maag di ruang UKS"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  Simpan ke Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
