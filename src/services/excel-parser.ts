import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/client';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface ExcelImportStats {
  eventsCreated: number;
  competitionEventsCreated: number;
  athletesCreated: number;
  registrationsCreated: number;
}

export interface ExcelImportResult {
  success: boolean;
  message: string;
  stats?: ExcelImportStats;
}

// Interface untuk baris Sheet 1 (Event)
interface EventSheetRow {
  'Nama Event'?: string;
  Name?: string;
  Penyelenggara?: string;
  Organizer?: string;
  Lokasi?: string;
  Location?: string;
  'Tanggal Mulai'?: string | number;
  'Start Date'?: string | number;
  'Tanggal Selesai'?: string | number;
  'End Date'?: string | number;
  'Jenis Kolam'?: string;
  'Pool Type'?: string;
  'Panjang Kolam'?: number | string;
  'Jumlah Lane'?: number | string;
  Deskripsi?: string;
}

// Interface untuk baris Sheet 3 (Nomor Lomba)
interface CompetitionEventSheetRow {
  'Nama Nomor'?: string;
  'Event Name'?: string;
  'Gaya Renang'?: string;
  Stroke?: string;
  Jarak?: number | string;
  Gender?: string;
  'Jenis Kelamin'?: string;
  Tingkat?: string;
  Grade?: string;
  Kelas?: string;
  Class?: string;
  'Kelompok Umur'?: string;
  'Age Group'?: string;
}

// Interface untuk baris Sheet 4 (Peserta & Registrasi)
interface ParticipantSheetRow {
  'Nama Atlet'?: string;
  'Athlete Name'?: string;
  'Nomor Peserta'?: string;
  'Athlete Number'?: string;
  'Jenis Kelamin'?: string;
  Gender?: string;
  'Tanggal Lahir'?: string | number;
  Tingkat?: string;
  Kelas?: string;
  'Kelompok Umur'?: string;
  'Sekolah/Klub'?: string;
  'School/Club'?: string;
  'Nomor Lomba'?: string;
  'Competition Event'?: string;
  'Seed Time MS'?: number | string;
}

// Interface Payload Database Supabase
interface EventInsertPayload {
  name: string;
  organizer: string;
  location: string;
  start_date: string;
  end_date: string;
  pool_type: string;
  pool_length_meters: number;
  lane_count: number;
  description: string;
}

interface CompetitionEventInsertPayload {
  event_id: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: 'female' | 'male';
  grade_level: string;
  class_name: string;
  age_group: string;
}

interface AthleteInsertPayload {
  athlete_number: string;
  full_name: string;
  gender: 'female' | 'male';
  birth_date: string;
  grade_level: string;
  class_name: string;
  age_group: string;
  school_id: string | null;
}

interface RegistrationInsertPayload {
  event_id: string;
  athlete_id: string;
  competition_event_id: string;
  seed_time_ms: number;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Mengonversi nilai Tanggal dari Excel (Date, Numeric Serial, atau String) ke format YYYY-MM-DD
 */
function parseExcelDate(val: string | number | Date | undefined | null): string {
  if (!val) return new Date().toISOString().split('T')[0];

  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }

  if (typeof val === 'number') {
    // Serial date Excel: hari sejak 1899-12-30 (epoch 1900 system)
    const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
    const date = new Date(EXCEL_EPOCH_MS + val * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  return String(val).trim();
}

/**
 * Mengonversi cell value ExcelJS menjadi nilai primitif sederhana.
 */
function cellValue(cell: ExcelJS.Cell): string | number | Date | null {
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number' || typeof v === 'string') return v;
  if (typeof v === 'object') {
    if ('text' in v && typeof v.text === 'string') return v.text;
    if ('result' in v) {
      const r = (v as ExcelJS.CellFormulaValue).result;
      if (typeof r === 'number' || typeof r === 'string') return r;
      if (r instanceof Date) return r;
    }
    if ('richText' in v) {
      return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('');
    }
  }
  return String(v);
}

/**
 * Padanan XLSX.utils.sheet_to_json: baris pertama dipakai sebagai header.
 */
function sheetToJson<T>(worksheet: ExcelJS.Worksheet | undefined): T[] {
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headers: (string | null)[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const raw = cellValue(cell);
    headers[colNumber] = raw === null ? null : String(raw).trim();
  });

  const rows: T[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const obj: Record<string, string | number | Date | null> = {};
    let hasValue = false;

    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headers[colNumber];
      if (!key) return;
      const value = cellValue(cell);
      if (value !== null && value !== '') {
        obj[key] = value;
        hasValue = true;
      }
    });

    if (hasValue) rows.push(obj as T);
  });

  return rows;
}

// ==========================================
// MAIN PARSER & IMPORTER FUNCTION
// ==========================================

/**
 * Membaca file Excel Buku Acara SCMS dan mengimpor seluruh datanya ke Supabase
 */
export async function parseAndImportExcel(file: File): Promise<ExcelImportResult> {
  const supabase = createClient();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheets = workbook.worksheets;
    if (worksheets.length === 0) {
      return { success: false, message: 'File Excel kosong atau rusak.' };
    }

    let eventsCreated = 0;
    let competitionEventsCreated = 0;
    let athletesCreated = 0;
    let registrationsCreated = 0;

    let activeEventId = '';

    // ==========================================
    // SHEET 1: EVENT INFORMATION
    // ==========================================
    if (worksheets[0]) {
      const eventRows = sheetToJson<EventSheetRow>(worksheets[0]);

      if (eventRows.length > 0) {
        const row = eventRows[0];
        const eventPayload: EventInsertPayload = {
          name: row['Nama Event'] || row['Name'] || 'Kejuaraan Renang SCMS',
          organizer: row['Penyelenggara'] || row['Organizer'] || 'Panitia Pelaksana',
          location: row['Lokasi'] || row['Location'] || 'Kolam Renang Utama',
          start_date: parseExcelDate(row['Tanggal Mulai'] || row['Start Date']),
          end_date: parseExcelDate(row['Tanggal Selesai'] || row['End Date']),
          pool_type: row['Jenis Kolam'] || row['Pool Type'] || 'Long Course',
          pool_length_meters: Number(row['Panjang Kolam']) || 50,
          lane_count: Number(row['Jumlah Lane']) || 8,
          description: row['Deskripsi'] || 'Diimpor dari Buku Acara Excel',
        };

        const { data: eventData, error: eventErr } = await supabase
          .from('events')
          .insert(eventPayload)
          .select('id')
          .single();

        if (eventErr || !eventData) {
          throw new Error(`Gagal menyimpan data Event: ${eventErr?.message}`);
        }

        activeEventId = eventData.id;
        eventsCreated++;
      }
    }

    if (!activeEventId) {
      return { success: false, message: 'Gagal mendapatkan Event ID dari Sheet 1.' };
    }

    // ==========================================
    // SHEET 3: COMPETITION EVENTS (Batch Insert)
    // ==========================================
    const compEventMap = new Map<string, string>(); // Key: lowerCaseName -> Value: competition_event_id

    if (worksheets[2]) {
      const compRows = sheetToJson<CompetitionEventSheetRow>(worksheets[2]);

      const compPayloads: CompetitionEventInsertPayload[] = compRows
        .map((row): CompetitionEventInsertPayload | null => {
          const name = row['Nama Nomor'] || row['Event Name'];
          if (!name) return null;

          const stroke = row['Gaya Renang'] || row['Stroke'] || 'Freestyle';
          const distance = Number(row['Jarak']) || 50;
          const genderInput = String(row['Gender'] || row['Jenis Kelamin'] || 'male').toLowerCase();
          const isFemale = genderInput.includes('putri') || genderInput.includes('female');

          return {
            event_id: activeEventId,
            name: name.trim(),
            stroke,
            distance_meters: distance,
            gender: isFemale ? 'female' : 'male',
            grade_level: row['Tingkat'] || row['Grade'] || 'SD',
            class_name: row['Kelas'] || row['Class'] || 'Kelas 1',
            age_group: row['Kelompok Umur'] || row['Age Group'] || 'KU',
          };
        })
        .filter((item): item is CompetitionEventInsertPayload => item !== null);

      if (compPayloads.length > 0) {
        const { data: insertedComps, error: compErr } = await supabase
          .from('competition_events')
          .insert(compPayloads)
          .select('id, name');

        if (compErr) {
          throw new Error(`Gagal menyimpan Nomor Lomba: ${compErr.message}`);
        }

        if (insertedComps) {
          insertedComps.forEach((compItem: { id: string; name: string }) => {
            compEventMap.set(compItem.name.trim().toLowerCase(), compItem.id);
          });
          competitionEventsCreated = insertedComps.length;
        }
      }
    }

    // ==========================================
    // SHEET 4: ATHLETES, SCHOOLS & REGISTRATIONS
    // ==========================================
    if (worksheets[3]) {
      const participantRows = sheetToJson<ParticipantSheetRow>(worksheets[3]);

      // 1. Kumpulkan Sekolah Dulu & Bulk Insert jika Belum Ada
      const rawSchoolNames = participantRows
        .map((row) => row['Sekolah/Klub'] || row['School/Club'] || 'Umum')
        .filter((name): name is string => Boolean(name));

      const schoolNames = Array.from(new Set(rawSchoolNames));
      const schoolMap = new Map<string, string>(); // Name -> ID

      if (schoolNames.length > 0) {
        const { data: existingSchools } = await supabase
          .from('schools')
          .select('id, name')
          .in('name', schoolNames);

        if (existingSchools) {
          existingSchools.forEach((school: { id: string; name: string }) => {
            schoolMap.set(school.name, school.id);
          });
        }

        const newSchoolsToInsert = schoolNames
          .filter((name) => !schoolMap.has(name))
          .map((name) => ({ name, city: 'Kota', province: 'Provinsi' }));

        if (newSchoolsToInsert.length > 0) {
          const { data: createdSchools } = await supabase
            .from('schools')
            .insert(newSchoolsToInsert)
            .select('id, name');

          if (createdSchools) {
            createdSchools.forEach((school: { id: string; name: string }) => {
              schoolMap.set(school.name, school.id);
            });
          }
        }
      }

      // 2. Kumpulkan & Bulk Insert Atlet
      const athleteMap = new Map<string, string>(); // AthleteNumber -> ID
      const athletePayloads: AthleteInsertPayload[] = [];
      const processedNumbers = new Set<string>();

      participantRows.forEach((row, index) => {
        const fullName = row['Nama Atlet'] || row['Athlete Name'];
        if (!fullName) return;

        const athleteNum =
          row['Nomor Peserta'] ||
          row['Athlete Number'] ||
          `ATL-${100000 + index}`;

        if (!processedNumbers.has(athleteNum)) {
          processedNumbers.add(athleteNum);
          const genderInput = String(row['Jenis Kelamin'] || row['Gender'] || 'male').toLowerCase();
          const isFemale = genderInput.includes('putri') || genderInput.includes('female');
          const schoolName = row['Sekolah/Klub'] || row['School/Club'] || 'Umum';

          athletePayloads.push({
            athlete_number: athleteNum,
            full_name: fullName,
            gender: isFemale ? 'female' : 'male',
            birth_date: parseExcelDate(row['Tanggal Lahir']),
            grade_level: row['Tingkat'] || 'SD',
            class_name: row['Kelas'] || 'Kelas 1',
            age_group: row['Kelompok Umur'] || 'KU',
            school_id: schoolMap.get(schoolName) || null,
          });
        }
      });

      if (athletePayloads.length > 0) {
        const { data: insertedAthletes, error: athErr } = await supabase
          .from('athletes')
          .insert(athletePayloads)
          .select('id, athlete_number');

        if (athErr) {
          throw new Error(`Gagal menyimpan Atlet: ${athErr.message}`);
        }

        if (insertedAthletes) {
          insertedAthletes.forEach((ath: { id: string; athlete_number: string }) => {
            athleteMap.set(ath.athlete_number, ath.id);
          });
          athletesCreated = insertedAthletes.length;
        }
      }

      // 3. Bulk Insert Registrasi Peserta ke Nomor Lomba
      const registrationPayloads: RegistrationInsertPayload[] = [];

      participantRows.forEach((row, index) => {
        const fullName = row['Nama Atlet'] || row['Athlete Name'];
        const compEventName = row['Nomor Lomba'] || row['Competition Event'];
        if (!fullName || !compEventName) return;

        const athleteNum =
          row['Nomor Peserta'] ||
          row['Athlete Number'] ||
          `ATL-${100000 + index}`;

        const athleteId = athleteMap.get(athleteNum);
        const compEventId = compEventMap.get(String(compEventName).trim().toLowerCase());

        if (athleteId && compEventId) {
          registrationPayloads.push({
            event_id: activeEventId,
            athlete_id: athleteId,
            competition_event_id: compEventId,
            seed_time_ms: Number(row['Seed Time MS']) || 0,
          });
        }
      });

      if (registrationPayloads.length > 0) {
        const { error: regErr } = await supabase
          .from('registrations')
          .insert(registrationPayloads);

        if (regErr) {
          throw new Error(`Gagal menyimpan Registrasi: ${regErr.message}`);
        }
        registrationsCreated = registrationPayloads.length;
      }
    }

    return {
      success: true,
      message: 'Import data Buku Acara dari file Excel berhasil dieksekusi!',
      stats: {
        eventsCreated,
        competitionEventsCreated,
        athletesCreated,
        registrationsCreated,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat membaca file Excel.';
    console.error('Excel Parser Error:', error);
    return {
      success: false,
      message: errorMessage,
    };
  }
}