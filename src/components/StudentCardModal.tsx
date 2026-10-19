import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Sparkles, QrCode as QrIcon, ShieldCheck } from 'lucide-react';
import { Student, SystemSettings } from '../types';

interface Props {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings | null;
  onSimulateQrScan?: (qrData: string) => void;
}

export const StudentCardModal: React.FC<Props> = ({
  student,
  isOpen,
  onClose,
  settings,
  onSimulateQrScan,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!student) return;

    // Generate QR Code data: DZUHUR:<NISN>
    const qrPayload = `DZUHUR:${student.nisn}`;
    QRCode.toDataURL(
      qrPayload,
      {
        width: 300,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [student]);

  if (!isOpen || !student) return null;

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Kartu QR Code Absensi Siswa
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alternatif scan saat kamera sulit mengenali wajah
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PRINTABLE STUDENT CARD PREVIEW */}
        <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 p-5 rounded-3xl text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-emerald-500/40 pb-3 mb-3">
            <div>
              <div className="text-[9px] uppercase font-bold tracking-wider text-emerald-300">
                KARTU ABSENSI SHOLAT DZUHUR
              </div>
              <div className="text-xs font-extrabold truncate max-w-[220px]">
                {settings?.schoolName || 'SMP / MTs Al-Ikhlas'}
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-bold text-emerald-200">
              Kelas {student.classId}
            </div>
          </div>

          {/* Card Body */}
          <div className="flex items-center gap-4">
            {/* Student Photo */}
            <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-white/40 shadow-md shrink-0 bg-slate-800">
              <img
                src={student.photoUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Student Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-extrabold text-white truncate">
                {student.name}
              </div>
              <div className="text-xs text-emerald-200 font-mono mt-0.5">
                NISN: {student.nisn}
              </div>
              <div className="text-[10px] text-emerald-100/70 mt-1">
                {student.gender === 'L' ? 'Santri Ikhwan' : 'Santriwati Akhwat'}
              </div>

              <div className="mt-2 flex items-center gap-1 text-[9px] bg-black/40 px-2 py-1 rounded-lg text-emerald-300 w-fit">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Terverifikasi Sekolah</span>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="mt-4 pt-3 border-t border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-white">QR Code Presensi</div>
              <div className="text-[9px] text-emerald-200 font-mono">
                DZUHUR:{student.nisn}
              </div>
              <div className="text-[9px] text-emerald-100/60 mt-0.5">
                Sorotkan ke kamera scanner
              </div>
            </div>

            <div className="w-20 h-20 bg-white p-1.5 rounded-2xl shadow-lg shrink-0 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${student.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 animate-pulse rounded-lg"></div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="mt-5 space-y-2 print:hidden">
          {onSimulateQrScan && (
            <button
              onClick={() => {
                onSimulateQrScan(`DZUHUR:${student.nisn}`);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Uji Scan Kartu QR Ini Sekarang</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintCard}
              className="flex-1 py-2 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Kartu</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs hover:bg-slate-200 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
