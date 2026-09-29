'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Cpu,
  Tv,
  Wifi,
  Radio,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Wrench,
  Gauge,
  SlidersHorizontal,
  Layers,
  Sparkles,
  BookOpen,
  Info,
  Cable,
  Server,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface EquipmentRecord {
  id: string;
  name: string;
  location: string;
  category: string;
  status: 'done' | 'in_progress' | 'scheduled' | 'overdue';
  due_date?: string | null;
  technician?: string | null;
  note?: string | null;
  created_at?: string;
}

interface DeviceItem {
  id: string;
  name: string;
  category: string;
  icon: typeof Cpu;
  status: 'connected' | 'active' | 'standby' | 'offline';
  pingMs: number;
  specs: string;
  channel: string;
  lastSync: string;
  connectedClients?: number;
}

const INITIAL_DEVICES: DeviceItem[] = [
  {
    id: 'dev-omega',
    name: 'Swiss Timing Omega Console',
    category: 'Konsol Utama Timing & Touchpad',
    icon: Cpu,
    status: 'standby',
    pingMs: 4,
    specs: 'Quantum Aquatics Timer • 8 Lane Touchpad Ready',
    channel: 'COM1 / TCP 192.168.1.105:4000',
    lastSync: 'Mode Simulasi Aktif',
  },
  {
    id: 'dev-led',
    name: 'Skor Digital LED Arena',
    category: 'Papan Skor Fisik Kolam',
    icon: Tv,
    status: 'connected',
    pingMs: 8,
    specs: 'Matrix P10 HD Outdoor • Resolusi 512x256 Full Color',
    channel: 'Channel 01 • Port HDMI-1 & NDI Stream',
    lastSync: 'Output Siap Ditransmisikan',
  },
  {
    id: 'dev-stream',
    name: 'Live Web Stream Sync',
    category: 'Sinkronisasi Realtime Cloud',
    icon: Wifi,
    status: 'connected',
    pingMs: 12,
    specs: 'Upstash Redis Event Stream + Supabase Realtime WS',
    channel: 'WebSocket TLS 443',
    lastSync: 'Tersinkronisasi Cloud Server',
    connectedClients: 1420,
  },
  {
    id: 'dev-touchpads',
    name: 'Sensor Touchpad Kolam (Lintasan 1–8)',
    category: 'Sensor Sentuh Finish',
    icon: SlidersHorizontal,
    status: 'standby',
    pingMs: 2,
    specs: 'OSV9 FINA Approved Touchplates • Sensitivitas 2.5 kg',
    channel: 'BUS-8 Line Terminal',
    lastSync: 'Siap Terima Sinyal Input',
  },
  {
    id: 'dev-false-start',
    name: 'False Start Detector Blocks',
    category: 'Sensor Start Block',
    icon: Zap,
    status: 'standby',
    pingMs: 3,
    specs: 'Reaction Time Trigger (< 0.10s) • Speaker Klakson Start',
    channel: 'Relay Audio 24V',
    lastSync: 'Standby Kalibrasi',
  },
  {
    id: 'dev-backup-timer',
    name: 'Backup Stopwatch Cadangan',
    category: 'Timer Sekunder',
    icon: Gauge,
    status: 'connected',
    pingMs: 0,
    specs: '8 Unit Seiko S141 300-Lap Memory • Standar Juri Finish',
    channel: 'Manual Juri Cadangan',
    lastSync: 'Tersedia di Call Room',
  },
];

const STATUS_CONFIG: Record<string, { label: string; badgeCls: string }> = {
  done: { label: 'Siap Pakai / Normal', badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  in_progress: { label: 'Sedang Kalibrasi / Cek', badgeCls: 'bg-amber-50 text-amber-800 border-amber-300' },
  scheduled: { label: 'Terjadwal Perawatan', badgeCls: 'bg-blue-50 text-blue-800 border-blue-300' },
  overdue: { label: 'Perlu Perbaikan Segera', badgeCls: 'bg-rose-50 text-rose-800 border-rose-300' },
};

const HARDWARE_CHECKLIST = [
  { id: 'chk-1', text: 'Koneksikan kabel data serial/USB Swiss Timing Quantum ke laptop operator IT' },
  { id: 'chk-2', text: 'Pasang pelat Touchpad OSV9 di dinding kolam lintasan 1–8 dengan bracket kokoh' },
  { id: 'chk-3', text: 'Sambungkan kabel BUS Terminal dari tiap lintasan ke kotak konsol timing utama' },
  { id: 'chk-4', text: 'Uji respons sensor sentuh (Touchpad) dengan tekanan tangan 2.5 kg di masing-masing lintasan' },
  { id: 'chk-5', text: 'Uji coba klakson start horn & lampu strobe false start dari podium wasit' },
  { id: 'chk-6', text: 'Koneksikan kabel HDMI/LAN dari laptop ke Video Processor LED Matrix Stadion' },
  { id: 'chk-7', text: 'Pastikan 8 unit stopwatch cadangan juri waktu dalam kondisi baterai penuh' },
  { id: 'chk-8', text: 'Hubungkan laptop operator ke sumber daya darurat (UPS 1000VA+) guna mengantisipasi mati listrik' },
];

export function EquipmentTelemetryManager({
  maintenanceItems = [],
}: {
  maintenanceItems: EquipmentRecord[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'telemetry' | 'guide' | 'maintenance'>('telemetry');
  const [devices, setDevices] = useState<DeviceItem[]>(INITIAL_DEVICES);
  const [testingPing, setTestingPing] = useState(false);
  const [simulatedLane, setSimulatedLane] = useState<number | null>(null);

  // Logistics & Maintenance State (CRUD)
  const [equipments, setEquipments] = useState<EquipmentRecord[]>(maintenanceItems);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Touchpad Plates');
  const [formLocation, setFormLocation] = useState('');
  const [formStatus, setFormStatus] = useState<'done' | 'in_progress' | 'scheduled' | 'overdue'>('done');
  const [formDueDate, setFormDueDate] = useState('');
  const [formTechnician, setFormTechnician] = useState('');
  const [formNote, setFormNote] = useState('');

  // Checklist State
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'chk-1': true,
    'chk-2': true,
    'chk-6': true,
    'chk-7': true,
  });

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestAllPing = () => {
    setTestingPing(true);
    toast.info('Mengirim sinyal uji ping ke simulator perangkat & interface jaringan...');

    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          pingMs: Math.floor(Math.random() * 8) + 2,
          lastSync: 'Baru saja diuji (< 1 dtk lalu)',
        }))
      );
      setTestingPing(false);
      toast.success('Interface telemetri merespons normal. Latensi rata-rata 4.5 ms.');
    }, 600);
  };

  const handleSimulateTouchpad = (lane: number) => {
    setSimulatedLane(lane);
    toast.info(`Simulasi sentuhan Touchpad Lintasan ${lane} dipicu.`);
    setTimeout(() => {
      setSimulatedLane(null);
    }, 1800);
  };

  // CRUD Operations
  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('Touchpad Plates');
    setFormLocation('Dinding Kolam Sisi Finish (50M)');
    setFormStatus('done');
    setFormDueDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
    setFormTechnician('Tim IT & Wasit Akuatik');
    setFormNote('');
    setShowModal(true);
  };

  const openEditModal = (item: EquipmentRecord) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormLocation(item.location || '');
    setFormStatus(item.status);
    setFormDueDate(item.due_date || '');
    setFormTechnician(item.technician || '');
    setFormNote(item.note || '');
    setShowModal(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Nama peralatan wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem?.id,
          name: formName.trim(),
          category: formCategory,
          location: formLocation.trim(),
          status: formStatus,
          due_date: formDueDate || null,
          technician: formTechnician.trim() || null,
          note: formNote.trim() || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        toast.success(editingItem ? 'Peralatan berhasil diperbarui.' : 'Peralatan baru berhasil dicatat.');
        setEquipments((prev) => {
          if (editingItem) {
            return prev.map((it) => (it.id === json.data.id ? json.data : it));
          }
          return [json.data, ...prev];
        });
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(json.error || 'Gagal menyimpan peralatan.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Yakin ingin menghapus catatan logistik peralatan ini?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/equipment?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Peralatan berhasil dihapus dari inventaris.');
        setEquipments((prev) => prev.filter((it) => it.id !== id));
        router.refresh();
      } else {
        toast.error('Gagal menghapus peralatan.');
      }
    } catch {
      toast.error('Gagal menghubungi server.');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = Array.from(new Set(equipments.map((it) => it.category).filter(Boolean)));

  const filteredEquipments = equipments.filter((it) => {
    if (filterStatus !== 'all' && it.status !== filterStatus) return false;
    if (filterCategory !== 'all' && it.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── NOTIFIKASI INFORMASI TRANSPARAN MODE SISTEM ── */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4.5 shadow-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-sm shadow-2xs mt-0.5">
            <Info className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="font-heading font-black text-sm text-amber-950">
                Informasi Integrasi Hardware &amp; Mode Operasi
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                Mode Digital / Tanpa Perangkat Fisik Aktif
              </span>
            </div>
            <p className="text-xs text-amber-900/90 leading-relaxed max-w-4xl">
              Anda <b>tidak wajib</b> memiliki konsol Swiss Timing Omega fisik untuk menjalankan kejuaraan. Sistem Rajendra Swim System dapat beroperasi mandiri menggunakan <b>Input Waktu Juri / Stopwatch Digital</b>, dan live scoreboard akan tetap aktif real-time. Jika Anda ingin menghubungkan perangkat Omega/Touchpad fisik di masa mendatang, ikuti panduan kabel pada tab <b>Tata Cara Pemasangan</b>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className="self-start sm:self-center shrink-0 rounded-xl bg-amber-900 hover:bg-amber-950 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
        >
          <BookOpen className="h-3.5 w-3.5" /> Baca Panduan Pemasangan &rarr;
        </button>
      </div>

      {/* ── SUB-TABS NAVIGATION ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'telemetry'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          )}
        >
          <Activity className="h-4 w-4" /> Telemetri &amp; Simulator Live
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'guide'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          )}
        >
          <Cable className="h-4 w-4" /> Tata Cara Pemasangan &amp; Koneksi Hardware
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('maintenance')}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'maintenance'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          )}
        >
          <Wrench className="h-4 w-4" /> Pemeliharaan &amp; Logistik Fisik ({equipments.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: TELEMETRI & SIMULATOR ARENA
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Top Banner Control */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                  INTERFACE TELEMETRI DIGITAL AKTIF
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono font-bold">
                  8 LINTASAN READY
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
                Telemetri Sensor Start Block &amp; Timing Scoreboard
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Antarmuka digital pemantau status komunikasi konsol waktu, touchpad 8 lintasan, skor LED stadion, dan cloud stream scoreboard penonton.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleTestAllPing}
                disabled={testingPing}
                className="h-10 px-4 text-xs font-bold bg-cyan-400 hover:bg-cyan-500 text-slate-950 gap-2 shadow-xs cursor-pointer"
              >
                <RefreshCw className={cn('h-4 w-4', testingPing && 'animate-spin')} />
                {testingPing ? 'Menguji Sinyal...' : 'Uji Sinyal Telemetri'}
              </Button>
            </div>
          </div>

          {/* Device Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((dev) => {
              const IconComp = dev.icon;
              const isOk = dev.status === 'connected' || dev.status === 'active';

              return (
                <div
                  key={dev.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">
                            {dev.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {dev.category}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          isOk
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        )}
                      >
                        {isOk ? 'Terhubung' : 'Standby'}
                      </Badge>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-xs border border-slate-100 font-mono">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Latency Ping:</span>
                        <span className="font-bold text-blue-700">{dev.pingMs} ms</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Port / Saluran:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]" title={dev.channel}>
                          {dev.channel}
                        </span>
                      </div>
                      {dev.connectedClients && (
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Penonton Web:</span>
                          <span className="font-bold text-cyan-700">{dev.connectedClients.toLocaleString()} orang</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-snug">
                      {dev.specs}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">{dev.lastSync}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">DIGITAL READY</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Touchpad Sensor Simulator Matrix (Lintasan 1–8) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Uji Responsivitas Touchpad 8 Lintasan (Finish Plates Simulator)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Klik nomor lintasan untuk menyimulasikan sentuhan perenang pada dinding kolam
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> 8 Touchplates Aktif
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((lane) => {
                const isTriggered = simulatedLane === lane;

                return (
                  <button
                    key={lane}
                    type="button"
                    onClick={() => handleSimulateTouchpad(lane)}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1.5 shadow-2xs active:scale-95',
                      isTriggered
                        ? 'bg-emerald-500 text-white border-emerald-600 scale-105 ring-2 ring-emerald-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-800'
                    )}
                  >
                    <span className="text-xs font-semibold uppercase opacity-75">Lintasan</span>
                    <span className="text-2xl font-black font-mono leading-none">{lane}</span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full mt-1',
                        isTriggered ? 'bg-white text-emerald-700' : 'bg-white border text-slate-600'
                      )}
                    >
                      {isTriggered ? 'STOP TRIGGER!' : 'Test Touch'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: TATA CARA PEMASANGAN & PANDUAN HARDWARE LENGKAP
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Header Panduan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-2">
            <span className="pub-eyebrow">Panduan Resmi Teknisi &amp; Panitia</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
              Tata Cara Pemasangan &amp; Konektivitas Perangkat Keras Kolam
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              Panduan langkah demi langkah pengkabelan, kalibrasi touchpad, integrasi konsol waktu Swiss Timing Omega / Quantum, serta transmisi tampilan papan skor LED stadion.
            </p>
          </div>

          {/* 5 Langkah Pemasangan Hardware */}
          <div className="space-y-4">
            {/* Langkah 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base font-mono">
                1
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-heading font-black text-sm sm:text-base text-slate-900">
                  Topologi Pengkabelan &amp; Jalur Kabel Kolam (Wiring Setup)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pasang <b>Kabel BUS Utama 8 Lintasan</b> di sepanjang tepi kolam finish. Sambungkan kabel konektor water-resistant dari setiap pelat Touchpad lintasan 1 s/d 8 ke terminal junction box kolam. Pastikan jalur kabel tidak terendam air genangan dan tertutup pelindung kabel karet (cable protector) agar aman dari injakan atlet dan juri.
                </p>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono text-[11px] text-slate-700">
                  Alur: Touchpad Lintasan 1–8 &rarr; Junction Box Tepi Kolam &rarr; Kabel Multi-core 50M &rarr; Konsol Quantum / Omega Meja Juri
                </div>
              </div>
            </div>

            {/* Langkah 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base font-mono">
                2
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-heading font-black text-sm sm:text-base text-slate-900">
                  Pemasangan Fisik Pelat Touchpad di Dinding Kolam
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gantung pelat Touchpad OSV9 menggunakan bracket penjepit stainless steel di bibir kolam tiap lintasan. Pastikan posisi pelat menempel rapat pada dinding kolam dan terendam minimal 30 cm di bawah permukaan air serta 30 cm di atas air sesuai standar World Aquatics SW 3.5. Uji sensitivitas dengan menekan permukaan pelat dengan telapak tangan (ambang batas 2.5 kg).
                </p>
              </div>
            </div>

            {/* Langkah 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base font-mono">
                3
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-heading font-black text-sm sm:text-base text-slate-900">
                  Koneksi Sistem Start &amp; False Start Detection
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sambungkan kabel trigger dari <b>Starter Horn / Pistol Elektronik</b> wasit ke konsol timing utama. Bila menggunakan starting block ber-sensor reaksi, sambungkan sensor beban start block lintasan 1–8 untuk mendeteksi false start otomatis (reaksi perenang di bawah 0.10 detik). Pasang lampu flash visual di hadapan perenang bagi atlet tunarungu.
                </p>
              </div>
            </div>

            {/* Langkah 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base font-mono">
                4
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-heading font-black text-sm sm:text-base text-slate-900">
                  Konfigurasi Port Serial / Ethernet ke Laptop Operator Rajendra Swim System
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gunakan konverter <b>RS232-to-USB FTDI berlisensi</b> atau kabel LAN Ethernet langsung dari port data konsol Swiss Timing ke laptop operator. Konfigurasikan port komunikasi pada software pengatur:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-slate-700 pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-50 border">
                    <b>Parameter Serial (COM Port):</b><br />
                    • Baud Rate: 9600 atau 19200 bps<br />
                    • Data Bits: 8, Parity: None, Stop: 1
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border">
                    <b>Parameter Ethernet (TCP/IP):</b><br />
                    • IP Konsol: 192.168.1.105 (Subnet 255.255.255.0)<br />
                    • Socket Port Data: 4000 (Stream Realtime)
                  </div>
                </div>
              </div>
            </div>

            {/* Langkah 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col md:flex-row gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-base font-mono">
                5
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-heading font-black text-sm sm:text-base text-slate-900">
                  Transmisi Skor ke LED Matrix Stadion &amp; Live Web
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka halaman <b>/scoreboard</b> di browser laptop operator, lalu tampilkan dalam mode layar penuh (Full Screen / F11) ke layar videotron melalui kabel HDMI atau SDI. Sistem secara otomatis memperbarui catatan waktu lintasan, status perenang, dan urutan finish tanpa perlu refresh browser.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Checklist Hari-H */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Checklist Kesiapan Teknis Hari Pertandingan (H-1 &amp; Hari H)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Centang setiap tahap yang telah diselesaikan oleh tim teknisi kolam
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600">
                {Object.values(checkedItems).filter(Boolean).length} / {HARDWARE_CHECKLIST.length} Selesai
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {HARDWARE_CHECKLIST.map((chk) => {
                const isChecked = checkedItems[chk.id];
                return (
                  <label
                    key={chk.id}
                    onClick={() => toggleCheck(chk.id)}
                    className={cn(
                      'p-3 rounded-xl border text-xs flex items-start gap-3 transition-all cursor-pointer select-none',
                      isChecked
                        ? 'bg-blue-50/60 border-blue-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 transition-colors',
                        isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      )}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className={cn('leading-relaxed', isChecked && 'font-medium')}>{chk.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 3: PEMELIHARAAN & LOGISTIK FISIK (FULL CRUD)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
                <Filter className="h-3.5 w-3.5 text-blue-600" /> Filter:
              </span>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">Semua Kondisi</option>
                <option value="done">Siap Pakai / Normal</option>
                <option value="in_progress">Sedang Kalibrasi</option>
                <option value="scheduled">Terjadwal Perawatan</option>
                <option value="overdue">Perlu Perbaikan</option>
              </select>

              {categories.length > 0 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Button
              onClick={openAddModal}
              className="h-9 px-4 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Catat Logistik Peralatan Baru
            </Button>
          </div>

          {/* Cards Grid */}
          {filteredEquipments.length === 0 ? (
            <EmptyState
              icon={<Wrench className="h-6 w-6" />}
              title="Belum Ada Catatan Peralatan"
              description="Catat data fisik pelat touchpad, kabel terminal, konsol waktu, atau stopwatch cadangan untuk memantau logistik kejuaraan."
              action={
                <Button onClick={openAddModal} className="mt-2 text-xs font-bold bg-blue-600 text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Tambah Peralatan Sekarang
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipments.map((it) => {
                const conf = STATUS_CONFIG[it.status] || STATUS_CONFIG.done;

                return (
                  <div
                    key={it.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5 hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {it.category}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight mt-1">
                            {it.name}
                          </h3>
                        </div>

                        <Badge variant="outline" className={cn('text-[10px] font-bold', conf.badgeCls)}>
                          {conf.label}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <span className="text-slate-400 font-medium">Lokasi:</span>
                        <b>{it.location || 'Gudang Kolam Akuatik'}</b>
                      </p>

                      {it.note && (
                        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {it.note}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-500 font-mono">
                        <div className="flex items-center justify-between">
                          <span>Jatuh Tempo:</span>
                          <span className="font-bold text-slate-700">{it.due_date || '—'}</span>
                        </div>
                        {it.technician && (
                          <div className="flex items-center justify-between font-sans">
                            <span className="text-slate-400">Teknisi:</span>
                            <span className="font-semibold text-slate-700">{it.technician}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(it)}
                        className="h-8 px-2.5 gap-1 text-xs border-slate-300 hover:bg-slate-50 cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === it.id}
                        onClick={() => handleDeleteEquipment(it.id)}
                        className="h-8 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                      >
                        {deletingId === it.id ? <BrandedSpinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT LOGISTIK PERALATAN ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEquipment}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingItem ? 'Edit Peralatan & Logistik' : 'Catat Logistik Peralatan Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Manajemen inventaris dan kondisi teknis perangkat kolam</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Nama Peralatan *</label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Set Touchpad OSV9 Lintasan 1-8"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-10 text-xs rounded-xl font-semibold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Kategori Peralatan</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="Touchpad Plates">Touchpad Plates</option>
                    <option value="Timing Console">Timing Console</option>
                    <option value="Sensor Start">Sensor Start Block</option>
                    <option value="Scoreboard LED">Scoreboard LED</option>
                    <option value="Timer Manual">Timer Manual / Stopwatch</option>
                    <option value="Kabel & Jaringan">Kabel &amp; Jaringan</option>
                    <option value="Fasilitas Kolam">Fasilitas Kolam</option>
                    <option value="Peralatan Umum">Peralatan Umum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Status Kondisi</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="done">Siap Pakai / Normal</option>
                    <option value="in_progress">Sedang Kalibrasi / Cek</option>
                    <option value="scheduled">Terjadwal Perawatan</option>
                    <option value="overdue">Perlu Perbaikan Segera</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Lokasi / Penempatan</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Dinding Kolam Finish"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Jatuh Tempo Perawatan</label>
                  <Input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="h-10 text-xs rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Teknisi / Petugas Penanggung Jawab</label>
                <Input
                  type="text"
                  placeholder="Contoh: Budi Santoso (Head IT)"
                  value={formTechnician}
                  onChange={(e) => setFormTechnician(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Catatan Khusus / Riwayat Kalibrasi</label>
                <textarea
                  rows={3}
                  placeholder="Catatan kondisi fisik, hasil tes ohm resistansi kabel, atau kelayakan pakai..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="h-9 px-3 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {saving ? <BrandedSpinner className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Simpan Logistik
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
