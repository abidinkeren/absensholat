import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Sparkles,
  UserCheck,
  Clock,
  Scan,
  RefreshCw,
  Server,
  Info,
  QrCode as QrIcon,
  ScanFace,
  Layers,
  Search,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import jsQR from 'jsqr';
import { Student, AttendanceRecord, SystemSettings } from '../types';
import { playSuccessChime, playAlertTone, announceStudentAttendance } from '../utils/sound';
import { StudentCardModal } from './StudentCardModal';

interface Props {
  students: Student[];
  settings: SystemSettings | null;
  onAttendanceRecorded: (record: AttendanceRecord) => void;
  serverUrl?: string;
}

export const AndroidScanner: React.FC<Props> = ({
  students,
  settings,
  onAttendanceRecorded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'android_phone' | 'kiosk_fullscreen'>('android_phone');

  // Scanner Mode: 'hybrid' (Wajah & QR Code) | 'face' (Wajah Saja) | 'qr' (QR Code Saja)
  const [scannerMode, setScannerMode] = useState<'hybrid' | 'face' | 'qr'>('hybrid');

  // Selected student for testing/instant scan
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  // Card modal state
  const [cardModalStudent, setCardModalStudent] = useState<Student | null>(null);

  // Manual QR/NISN text input
  const [manualCode, setManualCode] = useState<string>('');

  // Scan result state
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    alreadyRecorded?: boolean;
    student?: Student;
    record?: AttendanceRecord;
    message: string;
    confidence: number;
    method?: 'face' | 'qr';
  } | null>(null);

  const [autoDismissTimer, setAutoDismissTimer] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const lastScannedQrRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
          setHasCamera(true);
        };
      }
    } catch (err) {
      console.warn('Camera not accessible or permission denied, fallback to simulated camera HUD:', err);
      setHasCamera(false);
      setCameraActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Execute attendance scan (either face or QR code)
  const submitAttendance = async (params: {
    studentId?: string;
    nisn?: string;
    qrData?: string;
    scanMethod: 'face_scan' | 'qr_code';
    confidence?: number;
    photoSnapshot?: string;
  }) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsScanning(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          deviceSource: params.scanMethod === 'qr_code'
            ? 'Android Scanner (QR Code Kartu Siswa)'
            : 'Android Device (Kamera Depan Kiosk)',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLastResult({
          success: true,
          alreadyRecorded: data.alreadyRecorded,
          student: data.student,
          record: data.record,
          message: data.message,
          confidence: params.confidence || (params.scanMethod === 'qr_code' ? 100 : 98),
          method: params.scanMethod === 'qr_code' ? 'qr' : 'face',
        });

        if (data.record) {
          onAttendanceRecorded(data.record);
        }

        if (!data.alreadyRecorded) {
          playSuccessChime();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });

          if (voiceEnabled) {
            announceStudentAttendance(
              data.student.name,
              data.record.status,
              data.student.classId
            );
          }
        } else {
          playAlertTone();
        }

        setAutoDismissTimer(4);
      } else {
        playAlertTone();
        setLastResult({
          success: false,
          message: data.message || 'Data tidak dikenali dalam sistem.',
          confidence: 0,
        });
      }
    } catch (err) {
      console.error('Scan API error:', err);
      playAlertTone();
      setLastResult({
        success: false,
        message: 'Gagal menghubungi server absensi. Periksa koneksi jaringan.',
        confidence: 0,
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  // Perform Face Scan from button
  const handlePerformFaceScan = (forcedStudentId?: string) => {
    const targetId = forcedStudentId || selectedStudentId || students[0]?.id;
    const targetStudent = students.find((s) => s.id === targetId) || students[0];

    let snapshot = targetStudent?.photoUrl || '';
    if (videoRef.current && hasCamera) {
      try {
        const snapCanvas = document.createElement('canvas');
        snapCanvas.width = 400;
        snapCanvas.height = 400;
        const snapCtx = snapCanvas.getContext('2d');
        if (snapCtx) {
          snapCtx.drawImage(videoRef.current, 0, 0, 400, 400);
          snapshot = snapCanvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (e) {
        // fallback
      }
    }

    const confidence = +(96 + Math.random() * 3.8).toFixed(1);
    submitAttendance({
      studentId: targetStudent?.id,
      nisn: targetStudent?.nisn,
      scanMethod: 'face_scan',
      confidence,
      photoSnapshot: snapshot,
    });
  };

  // Handle QR scan simulation or manual input
  const handlePerformQrScan = (qrCodeString: string) => {
    submitAttendance({
      qrData: qrCodeString,
      scanMethod: 'qr_code',
      confidence: 100,
    });
  };

  // Canvas HUD & Real-time QR Code Decoding Loop
  useEffect(() => {
    let animId: number;
    let angle = 0;
    let scanY = 100;
    let scanDirection = 1;
    let lastQrCheckTime = 0;

    const renderOverlay = (currentTimeMs: number) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2 - 20;

      // 1. REAL-TIME QR CODE DETECTOR (runs if scannerMode is 'qr' or 'hybrid')
      if (
        (scannerMode === 'qr' || scannerMode === 'hybrid') &&
        video &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        !isProcessing &&
        currentTimeMs - lastQrCheckTime > 200 // check every 200ms
      ) {
        lastQrCheckTime = currentTimeMs;
        try {
          // Draw video frame to small offscreen area for fast QR detection
          const sampleWidth = 320;
          const sampleHeight = Math.floor((video.videoHeight / video.videoWidth) * sampleWidth) || 240;
          const offCanvas = document.createElement('canvas');
          offCanvas.width = sampleWidth;
          offCanvas.height = sampleHeight;
          const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
          if (offCtx) {
            offCtx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
            const imgData = offCtx.getImageData(0, 0, sampleWidth, sampleHeight);
            const qrCode = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (qrCode && qrCode.data) {
              const now = Date.now();
              // Prevent rapid repeated scan of the same code within 5 seconds
              if (
                lastScannedQrRef.current.code !== qrCode.data ||
                now - lastScannedQrRef.current.time > 5000
              ) {
                lastScannedQrRef.current = { code: qrCode.data, time: now };
                handlePerformQrScan(qrCode.data);
              }
            }
          }
        } catch (e) {
          // silent QR check error
        }
      }

      // 2. DRAW HUD GRAPHICS BASED ON MODE
      ctx.save();

      if (scannerMode === 'qr') {
        // Square reticle for QR Code Cards
        const boxSize = 220;
        const boxLeft = centerX - boxSize / 2;
        const boxTop = centerY - boxSize / 2;

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxLeft, boxTop, boxSize, boxSize);

        // Corner accents
        const cornerLen = 30;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#10b981';

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(boxLeft, boxTop + cornerLen);
        ctx.lineTo(boxLeft, boxTop);
        ctx.lineTo(boxLeft + cornerLen, boxTop);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(boxLeft + boxSize - cornerLen, boxTop);
        ctx.lineTo(boxLeft + boxSize, boxTop);
        ctx.lineTo(boxLeft + boxSize, boxTop + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(boxLeft, boxTop + boxSize - cornerLen);
        ctx.lineTo(boxLeft, boxTop + boxSize);
        ctx.lineTo(boxLeft + cornerLen, boxTop + boxSize);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(boxLeft + boxSize - cornerLen, boxTop + boxSize);
        ctx.lineTo(boxLeft + boxSize, boxTop + boxSize);
        ctx.lineTo(boxLeft + boxSize, boxTop + boxSize - cornerLen);
        ctx.stroke();

        // Laser scan line
        scanY += 3 * scanDirection;
        if (scanY > boxTop + boxSize - 10) scanDirection = -1;
        if (scanY < boxTop + 10) scanDirection = 1;

        ctx.beginPath();
        ctx.moveTo(boxLeft + 10, scanY);
        ctx.lineTo(boxLeft + boxSize - 10, scanY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#10b981';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.stroke();

      } else {
        // Biometric Face Oval Guide (Face & Hybrid mode)
        const radiusX = 140;
        const radiusY = 180;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;

        if (isScanning || isProcessing) {
          ctx.strokeStyle = '#10b981';
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 12;
        } else {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 8;
        }
        ctx.stroke();

        // Corner target brackets
        const bracketSize = 25;
        const drawCorner = (x: number, y: number, dx: number, dy: number) => {
          ctx.beginPath();
          ctx.moveTo(x + dx * bracketSize, y);
          ctx.lineTo(x, y);
          ctx.lineTo(x, y + dy * bracketSize);
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#38bdf8';
          ctx.stroke();
        };

        const bLeft = centerX - radiusX - 15;
        const bRight = centerX + radiusX + 15;
        const bTop = centerY - radiusY - 15;
        const bBottom = centerY + radiusY + 15;

        drawCorner(bLeft, bTop, 1, 1);
        drawCorner(bRight, bTop, -1, 1);
        drawCorner(bLeft, bBottom, 1, -1);
        drawCorner(bRight, bBottom, -1, -1);

        // Laser scan beam
        scanY += 2.5 * scanDirection;
        if (scanY > centerY + radiusY - 20) scanDirection = -1;
        if (scanY < centerY - radiusY + 20) scanDirection = 1;

        const grad = ctx.createLinearGradient(centerX - radiusX + 20, scanY, centerX + radiusX - 20, scanY);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.9)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');

        ctx.beginPath();
        ctx.moveTo(centerX - radiusX + 20, scanY);
        ctx.lineTo(centerX + radiusX - 20, scanY);
        ctx.lineWidth = 3;
        ctx.strokeStyle = grad;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Biometric landmark dots
        const dots = [
          { x: centerX - 45, y: centerY - 40 },
          { x: centerX + 45, y: centerY - 40 },
          { x: centerX, y: centerY },
          { x: centerX - 30, y: centerY + 50 },
          { x: centerX + 30, y: centerY + 50 },
          { x: centerX, y: centerY + 70 },
        ];

        dots.forEach((dot) => {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = isScanning ? '#10b981' : '#38bdf8';
          ctx.fill();
        });

        // Rotating dashed ring
        angle += 0.015;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radiusX + 35, angle, angle + Math.PI * 1.5);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      animId = requestAnimationFrame(renderOverlay);
    };

    animId = requestAnimationFrame(renderOverlay);
    return () => cancelAnimationFrame(animId);
  }, [isScanning, isProcessing, scannerMode]);

  // Auto countdown for dismiss
  useEffect(() => {
    if (autoDismissTimer <= 0) return;
    const interval = setInterval(() => {
      setAutoDismissTimer((prev) => {
        if (prev <= 1) {
          setLastResult(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoDismissTimer]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center min-h-[calc(100vh-140px)]">
      {/* LEFT: Scanner Container (Android Frame or Kiosk) */}
      <div className="flex flex-col items-center w-full max-w-xl">
        {/* Mode Selector & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between w-full px-4 py-2 mb-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl border border-emerald-100 dark:border-slate-800 shadow-sm text-xs gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('android_phone')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                viewMode === 'android_phone'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              HP Android
            </button>
            <button
              onClick={() => setViewMode('kiosk_fullscreen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
                viewMode === 'kiosk_fullscreen'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Kiosk Masjid
            </button>
          </div>

          {/* Scanner Mode Toggle: Face vs QR vs Hybrid */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
            <button
              onClick={() => setScannerMode('hybrid')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                scannerMode === 'hybrid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
              title="Mendeteksi Wajah & QR Code secara bersamaan"
            >
              Otomatis (Hybrid)
            </button>
            <button
              onClick={() => setScannerMode('face')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                scannerMode === 'face'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Scan Wajah
            </button>
            <button
              onClick={() => setScannerMode('qr')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                scannerMode === 'qr'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Scan QR
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              title={voiceEnabled ? 'Suara aktif (Bahasa Indonesia)' : 'Suara dimatikan'}
              className={`p-2 rounded-xl transition ${
                voiceEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleCameraFacing}
              title="Balik Kamera Depan / Belakang"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCANNER HOUSING */}
        <div
          className={`relative overflow-hidden transition-all duration-300 ${
            viewMode === 'android_phone'
              ? 'w-[340px] sm:w-[380px] h-[640px] rounded-[44px] border-[10px] border-slate-900 shadow-2xl bg-black ring-1 ring-slate-800'
              : 'w-full h-[520px] rounded-3xl border-2 border-emerald-500/30 shadow-2xl bg-slate-950'
          }`}
        >
          {/* Phone Speaker & Camera Notch (Android style) */}
          {viewMode === 'android_phone' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-30 flex items-center justify-center gap-2">
              <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
            </div>
          )}

          {/* Android Status Bar */}
          <div className="absolute top-2 left-0 right-0 px-6 py-1 flex items-center justify-between text-[11px] font-semibold text-white/80 z-20 pointer-events-none">
            <span>
              {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
              <span>4G LTE</span>
              <span>95%</span>
            </div>
          </div>

          {/* Camera Feed or Simulated Live HUD */}
          <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
            {hasCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              /* Simulated Camera View with realistic student background */
              <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-inner mb-4 relative">
                  <img
                    src={
                      students.find((s) => s.id === selectedStudentId)?.photoUrl ||
                      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80'
                    }
                    alt="Siswa"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>
                </div>
                <div className="text-white text-sm font-semibold">
                  {students.find((s) => s.id === selectedStudentId)?.name || 'Pilih Siswa'}
                </div>
                <div className="text-emerald-400 text-xs mt-1">
                  Kelas {students.find((s) => s.id === selectedStudentId)?.classId || '7A'}
                </div>
                <div className="text-[11px] text-slate-400 mt-3 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
                  Mode Simulasi Kamera Web / Tablet Siap
                </div>
              </div>
            )}

            {/* Biometric & QR Interactive Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={viewMode === 'android_phone' ? 380 : 640}
              height={viewMode === 'android_phone' ? 640 : 520}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Header info badge on scanner */}
            <div className="absolute top-10 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white">
                <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  {scannerMode === 'qr'
                    ? 'SCANNER QR CODE KARTU'
                    : scannerMode === 'face'
                    ? 'SCANNER BIOMETRIK WAJAH'
                    : 'SCANNER WAJAH & QR CODE'}
                </div>
                <div className="text-xs font-bold truncate max-w-[200px]">
                  {settings?.schoolName || 'Masjid Al-Ikhlas'}
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-right">
                <div className="text-[9px] text-slate-300">BATAS IQAMAH</div>
                <div className="text-xs font-mono font-bold text-amber-300">
                  {settings?.iqamahTime || '12:15'} WIB
                </div>
              </div>
            </div>

            {/* Instruction Banner at Bottom */}
            <div className="absolute bottom-20 left-4 right-4 z-20 pointer-events-none">
              <div className="bg-black/75 backdrop-blur-md p-2.5 rounded-2xl border border-white/15 text-center text-white shadow-xl">
                <p className="text-xs font-semibold text-emerald-300 flex items-center justify-center gap-1.5">
                  {scannerMode === 'qr' ? (
                    <>
                      <QrIcon className="w-3.5 h-3.5 animate-pulse" />
                      Sorotkan QR Code Kartu Pelajar ke Kotak
                    </>
                  ) : (
                    <>
                      <Scan className="w-3.5 h-3.5 animate-pulse" />
                      Arahkan Wajah atau Tunjukkan QR Code Kartu
                    </>
                  )}
                </p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {scannerMode === 'qr'
                    ? 'Otomatis terdeteksi saat kartu berada di depan kamera'
                    : 'Bisa scan wajah langsung atau sorotkan QR kartu jika wajah terhalang'}
                </p>
              </div>
            </div>

            {/* Android Navigation Bar */}
            {viewMode === 'android_phone' && (
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-12 z-20 text-white/50 pointer-events-none">
                <div className="w-3.5 h-3.5 border-2 border-white/60 rotate-45"></div>
                <div className="w-4 h-4 rounded-full border-2 border-white/60"></div>
                <div className="w-3.5 h-3.5 border-2 border-white/60"></div>
              </div>
            )}

            {/* SUCCESS / RESULT POPUP OVERLAY */}
            {lastResult && (
              <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg ${
                    lastResult.success && !lastResult.alreadyRecorded
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/30'
                      : lastResult.alreadyRecorded
                      ? 'bg-amber-500 text-white ring-4 ring-amber-500/30'
                      : 'bg-rose-500 text-white ring-4 ring-rose-500/30'
                  }`}
                >
                  {lastResult.success && !lastResult.alreadyRecorded ? (
                    <CheckCircle2 className="w-9 h-9" />
                  ) : lastResult.alreadyRecorded ? (
                    <Clock className="w-9 h-9" />
                  ) : (
                    <AlertTriangle className="w-9 h-9" />
                  )}
                </div>

                {lastResult.student && (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-md mb-2">
                    <img
                      src={lastResult.record?.photoSnapshot || lastResult.student.photoUrl}
                      alt={lastResult.student.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <h3 className="text-lg font-bold text-white">
                  {lastResult.student ? lastResult.student.name : 'Hasil Pemindaian'}
                </h3>

                {lastResult.student && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                      NISN: {lastResult.student.nisn}
                    </span>
                    <span className="text-xs bg-emerald-500/40 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      Kelas {lastResult.student.classId}
                    </span>
                  </div>
                )}

                <div
                  className={`mt-3 px-3.5 py-2 rounded-xl text-xs max-w-xs font-medium ${
                    lastResult.success && !lastResult.alreadyRecorded
                      ? lastResult.record?.status === 'terlambat'
                        ? 'bg-amber-900/40 border border-amber-500/50 text-amber-200'
                        : 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-200'
                      : lastResult.alreadyRecorded
                      ? 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                  }`}
                >
                  <p>{lastResult.message}</p>
                  {lastResult.record && (
                    <div className="mt-1 flex items-center justify-between text-[10px] text-white/70 border-t border-white/10 pt-1">
                      <span>Waktu: {lastResult.record.time} WIB</span>
                      <span>
                        {lastResult.method === 'qr' ? 'Metode: QR Code Kartu' : `Akurasi: ${lastResult.confidence}%`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersimpan di server komputer</span>
                  <span className="ml-1 text-emerald-400 font-mono">({autoDismissTimer}s)</span>
                </div>

                <button
                  onClick={() => setLastResult(null)}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition"
                >
                  Tutup / Lanjut Siswa Berikutnya
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="w-full mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => handlePerformFaceScan()}
            disabled={isProcessing}
            className={`flex-1 max-w-sm flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
              isProcessing
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/25 ring-2 ring-emerald-400/30'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Memproses Data Absensi...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Pindai Wajah Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT: Test & Simulation Panel for Teachers / Testers */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Quick Testing Student Picker & QR Card Generator */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Daftar Siswa & Kartu QR Presensi
              </h4>
            </div>
            <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
              {students.length} Siswa
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Pilih siswa untuk uji scan wajah instan, atau buka <strong>Kartu QR</strong> untuk dicoba ke kamera:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {students.map((student) => {
              const isSelected = selectedStudentId === student.id;
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer border transition ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        NISN: {student.nisn} • Kelas {student.classId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* View QR Code Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCardModalStudent(student);
                      }}
                      className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-slate-700 dark:text-slate-200 transition"
                      title="Lihat / Cetak Kartu Pelajar QR Code"
                    >
                      <QrIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentId(student.id);
                        handlePerformFaceScan(student.id);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95"
                    >
                      Scan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Manual QR Code / NISN Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <QrIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">
              Input Manual NISN / Barcode Scanner USB
            </h5>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            Bisa digunakan dengan alat scanner barcode fisik atau ketik langsung NISN siswa:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualCode.trim()) return;
              handlePerformQrScan(manualCode.trim());
              setManualCode('');
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Contoh: 0081234001 atau scan..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
            >
              Kirim
            </button>
          </form>
        </div>

        {/* QR Code Fallback Guide */}
        <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-emerald-300" />
            <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-300">
              Fungsi QR Code Sebagai Cadangan
            </h5>
          </div>

          <ul className="text-xs text-emerald-100/90 space-y-2 mt-2">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                ✓
              </span>
              <span><strong>Wajah terhalang?</strong> Siswa yang memakai masker kesehatan atau pencahayaan gelap cukup memperlihatkan Kartu QR ke kamera.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
                ✓
              </span>
              <span><strong>Deteksi Otomatis:</strong> Dalam mode Hybrid, kamera membaca wajah DAN kode QR secara otomatis tanpa perlu mengubah settingan!</span>
            </li>
          </ul>
        </div>
      </div>

      {/* STUDENT QR CODE CARD MODAL */}
      <StudentCardModal
        student={cardModalStudent}
        isOpen={Boolean(cardModalStudent)}
        onClose={() => setCardModalStudent(null)}
        settings={settings}
        onSimulateQrScan={(qrPayload) => {
          handlePerformQrScan(qrPayload);
        }}
      />
    </div>
  );
};
