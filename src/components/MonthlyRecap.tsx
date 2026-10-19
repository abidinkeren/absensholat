import React, { useState } from 'react';
import { Calendar as CalendarIcon, Filter, CheckCircle2, Clock, XCircle, UserCheck } from 'lucide-react';
import { Student, AttendanceRecord } from '../types';

interface Props {
  students: Student[];
  records: AttendanceRecord[];
}

export const MonthlyRecap: React.FC<Props> = ({ students, records }) => {
  const [selectedClass, setSelectedClass] = useState<string>('all');

  const classes = Array.from(new Set(students.map((s) => s.classId))).sort();

  // Generate last 7 days list for matrix header
  const days: { dateStr: string; label: string; dayName: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    days.push({ dateStr, label, dayName });
  }

  const filteredStudents = selectedClass === 'all'
    ? students
    : students.filter((s) => s.classId === selectedClass);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-500" />
            Matriks Kehadiran Sholat Dzuhur 7 Hari Terakhir
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rekap riwayat konsistensi sholat berjamaah harian per siswa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="all">Semua Kelas ({students.length} Siswa)</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                Kelas {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400 py-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          Tepat Waktu (Hadir)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          Terlambat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-sky-500"></span>
          Izin / Sakit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-400"></span>
          Alpa (Tidak Hadir)
        </span>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-[11px]">
              <th className="py-2.5 px-3 font-semibold text-slate-500">Siswa</th>
              <th className="py-2.5 px-3 font-semibold text-slate-500">Kelas</th>
              {days.map((d) => (
                <th key={d.dateStr} className="py-2.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                  <div>{d.dayName}</div>
                  <div className="text-[10px] text-slate-400">{d.label}</div>
                </th>
              ))}
              <th className="py-2.5 px-3 text-right font-semibold text-slate-500">Total Hadir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredStudents.map((student) => {
              let hadirCount = 0;
              return (
                <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-500">
                    {student.classId}
                  </td>
                  {days.map((d) => {
                    const record = records.find(
                      (r) => r.studentId === student.id && r.date === d.dateStr
                    );

                    let badge = null;
                    if (record) {
                      if (record.status === 'hadir_tepat_waktu') {
                        hadirCount++;
                        badge = (
                          <span
                            title={`Hadir tepat waktu: ${record.time}`}
                            className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-[10px]"
                          >
                            ✓
                          </span>
                        );
                      } else if (record.status === 'terlambat') {
                        hadirCount++;
                        badge = (
                          <span
                            title={`Terlambat: ${record.time}`}
                            className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[10px]"
                          >
                            T
                          </span>
                        );
                      } else if (record.status === 'izin' || record.status === 'sakit') {
                        badge = (
                          <span
                            title={record.status === 'izin' ? 'Izin' : 'Sakit'}
                            className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-[10px]"
                          >
                            I
                          </span>
                        );
                      }
                    } else {
                      badge = (
                        <span
                          title="Alpa / Belum Absen"
                          className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]"
                        >
                          -
                        </span>
                      );
                    }

                    return (
                      <td key={d.dateStr} className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center">{badge}</div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {hadirCount} / {days.length} hari
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
