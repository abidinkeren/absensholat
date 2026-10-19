import React, { useState, useRef, useEffect } from 'react';
import {
  UserPlus,
  Trash2,
  Camera,
  Search,
  CheckCircle,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ScanFace,
  RotateCcw,
  Check,
  Info,
  SlidersHorizontal,
  Lightbulb,
  QrCode as QrIcon
} from 'lucide-react';
import { Student, SystemSettings } from '../types';
import { StudentCardModal } from './StudentCardModal';

interface Props {
  students: Student[];
  settings?: SystemSettings | null;
  onAddStudent: (studentData: {
    name: string;
    nisn: string;
    classId: string;
    gender: 'L' | 'P';
    photoUrl?: string;
    photoBase64?: string;
  }) => Promise<boolean>;
  onDeleteStudent: (id: string) => Promise<boolean>;
  onUpdateStudent?: (id: string, updatedData: Partial<Student>) => Promise<boolean>;
}

export const StudentManagement: React.FC<Props> = ({
  students,
  settings,
  onAddStudent,
  onDeleteStudent,
  onUpdateStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [cardModalStudent, setCardModalStudent] = useState<Student | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [classId, setClassId] = useState('7A');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Camera & Face Recording Studio states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [faceQuality, setFaceQuality] = useState<'bagus' | 'sesuaikan'>('bagus');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classes = Array.from(new Set(students.map((s) => s.classId))).sort();
  if (!classes.includes('7A')) classes.unshift('7A', '7B', '8A', '8B', '9A', '9B');
  const uniqueClasses = Array.from(new Set(classes));

  // Filter students
  const filtered = students.filter((s) => {
    if (selectedClass !== 'all' && s.classId !== selectedClass) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.nisn.includes(q);
    }
    return true;
  });

  // Start webcam for face recording
  const startCamera = async () => {
    setIsCameraActive(true);
    setErrorMessage('');
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setErrorMessage('Kamera tidak dapat diakses atau diblokir peramban. Anda dapat mengunggah file foto wajah.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  };

  const handleToggleFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    }
  }, [facingMode]);

  // Capture face snapshot
  const triggerCapture = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 450, 450);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoPreview(dataUrl);
    }
    stopCamera();
  };

  // Start 3-second countdown capture
  const startCountdownCapture = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      triggerCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setNisn('');
    setClassId('7A');
    setGender('L');
    setPhotoPreview('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openReRecordModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setNisn(student.nisn);
    setClassId(student.classId);
    setGender(student.gender);
    setPhotoPreview(student.photoUrl);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name || !nisn || !classId) {
      setErrorMessage('Nama, NISN, dan Kelas wajib diisi');
      return;
    }

    if (!photoPreview) {
      setErrorMessage('Silakan ambil foto wajah dari kamera atau upload file foto terlebih dahulu');
      return;
    }

    setIsSubmitting(true);

    if (editingStudent) {
      // Update existing student photo
      try {
        const res = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nisn,
            classId,
            gender,
            photoUrl: photoPreview,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (onUpdateStudent) {
            await onUpdateStudent(editingStudent.id, { photoUrl: photoPreview });
          }
          setIsModalOpen(false);
          stopCamera();
        } else {
          setErrorMessage(data.error || 'Gagal memperbarui data wajah siswa.');
        }
      } catch (err) {
        setErrorMessage('Terjadi kesalahan saat menyimpan ke server.');
      }
    } else {
      // Create new student
      const success = await onAddStudent({
        name,
        nisn,
        classId,
        gender,
        photoUrl: photoPreview,
      });

      if (success) {
        setIsModalOpen(false);
        stopCamera();
      } else {
        setErrorMessage('Gagal menambahkan siswa. Pastikan NISN belum pernah terdaftar.');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* STEP-BY-STEP GUIDE BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ScanFace className="w-3.5 h-3.5" />
                Panduan Perekaman Wajah (Face Enrollment)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold">
              Cara Merekam Wajah Siswa untuk Absensi Sholat Dzuhur
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Foto wajah yang direkam akan otomatis disimpan di harddisk server komputer (<code className="font-mono bg-black/30 px-1 py-0.5 rounded text-emerald-300">./data/students.json</code>) dan dijadikan patokan biometrik kamera Android.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Rekam Wajah Siswa Baru</span>
          </button>
        </div>

        {/* 3 Step Visual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-700/40 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="font-bold text-white text-xs">Posisikan Siswa di Depan Kamera</div>
              <p className="text-[11px] text-emerald-100/70 mt-0.5">
                Buka perekam wajah, posisikan wajah tampak depan di dalam lingkaran oval pemindai.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="font-bold text-white text-xs">Jepret Foto Biometrik</div>
              <p className="text-[11px] text-emerald-100/70 mt-0.5">
                Klik "Ambil Foto" atau gunakan hitung mundur 3 detik untuk hasil foto wajah yang jernih.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="font-bold text-white text-xs">Tersimpan di Server Komputer</div>
              <p className="text-[11px] text-emerald-100/70 mt-0.5">
                Klik "Simpan". Siswa siap melakukan absensi scan wajah di kamera Android masjid!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter Kelas:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedClass('all')}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  selectedClass === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Semua ({students.length})
              </button>
              {uniqueClasses.map((c) => {
                const count = students.filter((s) => s.classId === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                      selectedClass === c
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {c} ({count})
                  </button>
                );
              })}
            </div>
          </div>

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

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((student) => (
            <div
              key={student.id}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="relative">
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-xs"
                    />
                    <div
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]"
                      title="Wajah Biometrik Aktif"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Kelas {student.classId}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                  {student.name}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  NISN: <span className="font-mono">{student.nisn}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {student.gender === 'L' ? 'Ikhwan (L)' : 'Akhwat (P)'}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1.5 text-xs">
                <button
                  onClick={() => openReRecordModal(student)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold hover:bg-emerald-100 transition text-[11px]"
                  title="Ambil foto wajah baru untuk siswa ini"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>Rekam Wajah</span>
                </button>

                <button
                  onClick={() => setCardModalStudent(student)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-semibold hover:bg-emerald-50 dark:hover:bg-slate-700 transition text-[11px]"
                  title="Lihat & Cetak Kartu Pelajar QR Code"
                >
                  <QrIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Kartu QR</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Yakin ingin menghapus data siswa ${student.name}?`)) {
                      onDeleteStudent(student.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg transition"
                  title="Hapus Siswa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STUDENT QR CODE CARD MODAL */}
      <StudentCardModal
        student={cardModalStudent}
        isOpen={Boolean(cardModalStudent)}
        onClose={() => setCardModalStudent(null)}
        settings={settings || null}
      />

      {/* MODAL STUDIO PEREKAMAN WAJAH BIOMETRIK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ScanFace className="w-5 h-5 text-emerald-500" />
                  {editingStudent ? `Rekam Ulang Wajah: ${editingStudent.name}` : 'Perekaman Wajah & Pendaftaran Siswa Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Foto akan digunakan untuk pengenalan biometrik saat Sholat Dzuhur
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsModalOpen(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* FACE RECORDING CAMERA VIEWPORT */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>STUDIO REKAM BIOMETRIK</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCameraActive && (
                      <button
                        type="button"
                        onClick={handleToggleFacing}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Balik Kamera</span>
                      </button>
                    )}
                  </div>
                </div>

                {isCameraActive ? (
                  /* LIVE CAMERA VIEW WITH OVAL MESH OVERLAY */
                  <div className="relative w-64 h-64 rounded-3xl overflow-hidden bg-black border-2 border-emerald-500 shadow-xl flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Biometric Oval Guide */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-44 h-56 rounded-[50%] border-2 border-dashed border-emerald-400 shadow-inner flex flex-col items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400/80 mb-6"></div>
                        <div className="text-[10px] text-emerald-300 font-bold tracking-wider bg-black/60 px-2 py-0.5 rounded-full">
                          PAS DI SINI
                        </div>
                      </div>
                    </div>

                    {/* Countdown Overlay */}
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
                        <span className="text-6xl font-black text-emerald-400 animate-ping font-mono">
                          {countdown === 0 ? '✓' : countdown}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* PREVIEW PHOTO OR PROMPT */
                  <div className="relative w-64 h-64 rounded-3xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center p-4 text-center">
                    {photoPreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={photoPreview}
                          alt="Wajah Terdaftar"
                          className="w-full h-full object-cover rounded-2xl"
                        />
                        <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md px-2 py-1 rounded-xl text-center text-[10px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" />
                          Foto Wajah Siap Digunakan
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                          <Camera className="w-8 h-8" />
                        </div>
                        <p className="text-xs text-slate-300 font-semibold">
                          Belum ada foto wajah
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Aktifkan kamera untuk merekam wajah siswa sekarang
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Camera Control Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 w-full">
                  {isCameraActive ? (
                    <>
                      <button
                        type="button"
                        onClick={startCountdownCapture}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                      >
                        <span>Hitung Mundur 3s</span>
                      </button>

                      <button
                        type="button"
                        onClick={triggerCapture}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-emerald-500/25"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Jepret Sekarang</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Batal Kamera
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-600/20"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Buka Kamera & Rekam Wajah</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Foto dari File</span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Tips: Pastikan wajah siswa tersinari cahaya terang dan tidak tertutup peci/kacamata hitam.</span>
                </div>
              </div>

              {/* Student details form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Farhan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    NISN Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0081234001"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Kelas Siswa *
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="7A">Kelas 7A</option>
                    <option value="7B">Kelas 7B</option>
                    <option value="8A">Kelas 8A</option>
                    <option value="8B">Kelas 8B</option>
                    <option value="9A">Kelas 9A</option>
                    <option value="9B">Kelas 9B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                    Jenis Kelamin *
                  </label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === 'L'}
                        onChange={() => setGender('L')}
                        className="text-emerald-600"
                      />
                      <span>Laki-laki (Ikhwan)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === 'P'}
                        onChange={() => setGender('P')}
                        className="text-emerald-600"
                      />
                      <span>Perempuan (Akhwat)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Server...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingStudent ? 'Simpan Wajah Baru' : 'Daftarkan & Simpan Wajah'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
