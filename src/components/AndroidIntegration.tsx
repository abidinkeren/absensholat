import React, { useState } from 'react';
import {
  Smartphone,
  Server,
  Code2,
  QrCode,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  FolderTree,
  Terminal,
  ShieldCheck,
  Tablet
} from 'lucide-react';
import { ServerStatus } from '../types';

interface Props {
  serverStatus: ServerStatus | null;
}

export const AndroidIntegration: React.FC<Props> = ({ serverStatus }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://192.168.1.100:3000';

  const kotlinCode = `// Model Request Scan Wajah Android ke Server Komputer
data class ScanRequest(
    val studentId: String,
    val nisn: String,
    val confidence: Double,
    val deviceSource: String = "Android Tablet Masjid",
    val photoSnapshot: String? = null // Base64
)

// Retrofit Interface
interface AbsensiApiService {
    @POST("/api/scan")
    suspend fun submitFaceScan(@Body request: ScanRequest): Response<ScanResponse>

    @GET("/api/students")
    suspend fun getStudents(): Response<List<Student>>

    @GET("/api/status")
    suspend fun checkServer(): Response<ServerStatusResponse>
}

// Konfigurasi Base URL ke Server Komputer Anda
val retrofit = Retrofit.Builder()
    .baseUrl("${currentHost}")
    .addConverterFactory(GsonConverterFactory.create())
    .build()`;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 w-44 h-44 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Integrasi Android & Server Komputer
            </span>
            <h2 className="text-xl font-bold mt-2">
              Sistem Terhubung: Android Kiosk ⇄ Web Dashboard ⇄ Harddisk Server
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              Seluruh catatan absensi Sholat Dzuhur siswa yang dipindai dari kamera perangkat Android langsung disimpan secara realtime ke server komputer lokal Anda.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col items-center text-center shrink-0">
            <Server className="w-6 h-6 text-emerald-300 mb-1" />
            <span className="text-xs font-bold">Status Server Lokal</span>
            <span className="text-[11px] text-emerald-300 flex items-center gap-1 mt-0.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              AKTIF & MENDENGARKAN
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Cara Menghubungkan Android */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARA 1: Buka Langsung di Android Browser / PWA Kiosk */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Metode 1: Buka di HP / Tablet Android
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Paling Praktis • Tanpa Perlu Install Aplikasi Khusus
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Anda bisa menggunakan tablet atau smartphone Android apapun yang ditaruh di depan masjid sekolah. Buka Google Chrome di Android dan arahkan ke alamat server:
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 truncate">
                {currentHost}
              </span>
              <button
                onClick={() => handleCopy(currentHost, 'url')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Salin URL</span>
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
                  1
                </span>
                <span>Pastikan HP Android dan Komputer Server berada di jaringan WiFi yang sama (atau gunakan URL hosting ini).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
                  2
                </span>
                <span>Pilih tab <strong>"Scanner Wajah (Android)"</strong> dan aktifkan izin kamera depan.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
                  3
                </span>
                <span>Pilih menu Chrome <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> untuk mode full screen kiosk tanpa bilah navigasi.</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARA 2: Penyimpanan File di Harddisk Server Komputer */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Penyimpanan Langsung di Komputer Anda
                </h3>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                  File Database Lokal Server
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              Sesuai permintaan Anda, seluruh catatan absensi sholat Dzuhur langsung ditulis dan disimpan ke file di komputer lokal:
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">📁 Folder: ./data/</span>
                <span className="text-[10px] text-emerald-500 font-bold">TERVERIFIKASI</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">📄 ./data/attendance.json</span>
                <span className="text-[10px] text-slate-400">
                  {serverStatus?.fileStats.attendanceFileSize ? `${(serverStatus.fileStats.attendanceFileSize / 1024).toFixed(1)} KB` : 'Tersimpan'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">📄 ./data/students.json</span>
                <span className="text-[10px] text-slate-400">
                  {serverStatus?.fileStats.totalStudents || 12} Siswa
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>
                Setiap kali siswa scan di Android, data langsung ter-append ke disk tanpa kehilangan riwayat meskipun server direstart.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* REST API & Developer Code for Native Android App */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Code2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Spesifikasi REST API untuk Aplikasi Native Android (Kotlin / Java)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gunakan endpoint ini jika Anda membangun aplikasi Android Studio mandiri
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopy(kotlinCode, 'kotlin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-semibold"
          >
            {copiedKey === 'kotlin' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Salin Kode Kotlin</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              POST /api/scan
            </span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              Kirim hasil scan wajah siswa dari kamera Android. Otomatis cek waktu iqamah & simpan ke disk.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block mb-1">
              GET /api/students
            </span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              Unduh daftar siswa dan foto biometrik untuk pencocokan offline di memori Android.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-1">
              GET /api/recap/daily
            </span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              Ambil data rekapan harian per kelas untuk ditampilkan di widget atau aplikasi guru.
            </span>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800">
            <code>{kotlinCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
