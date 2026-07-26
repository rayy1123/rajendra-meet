import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';

export interface ExcelImportResult {
  success: boolean;
  message: string;
  stats?: {
    eventsCreated: number;
    competitionEventsCreated: number;
    athletesCreated: number;
    registrationsCreated: number;
  };
}

/**
 * Membaca dan memproses file Excel Buku Acara SCMS
 * @param file File Excel yang diunggah oleh user
 * @returns Object status eksekusi dan statistik import
 */
export async function parseAndImportExcel(file: File): Promise<ExcelImportResult> {
  const supabase = createClient();

  try {
    // 1. Baca ArrayBuffer dari file
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    // Pastikan sheet utama tersedia
    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return { success: false, message: 'File Excel kosong atau corrupt.' };
    }

    let eventsCreated = 0;
    let competitionEventsCreated = 0;
    let athletesCreated = 0;
    let registrationsCreated = 0;

    // Map untuk menampung ID relasi sementara
    let activeEventId = '';
    const compEventMap = new Map<string, string>(); // Key: "Name_Gender_Grade", Value: competition_event_id
    const athleteMap = new Map<string, string>();   // Key: "AthleteNumber", Value: athlete_id

    // ==========================================
    // SHEET 1: EVENT INFORMATION
    // ==========================================
    if (sheetNames[0]) {
      const eventSheet = workbook.Sheets[sheetNames[0]];
      const eventRows: any[] = XLSX.utils.sheet_to_json(eventSheet);

      if (eventRows.length > 0) {
        const row = eventRows[0];
        
        // Simpan / Buat Event Baru
        const { data: eventData, error: eventErr } = await supabase
          .from('events')
          .insert({
            name: row['Nama Event'] || row['Name'] || 'Kejuaraan Renang SCMS',
            organizer: row['Penyelenggara'] || row['Organizer'] || 'Panitia Pelaksana',
            location: row['Lokasi'] || row['Location'] || 'Kolam Renang Utama',
            start_date: row['Tanggal Mulai'] || row['Start Date'] || new Date().toISOString().split('T')[0],
            end_date: row['Tanggal Selesai'] || row['End Date'] || new Date().toISOString().split('T')[0],
            pool_type: row['Jenis Kolam'] || row['Pool Type'] || 'Long Course',
            pool_length_meters: Number(row['Panjang Kolam']) || 50,
            lane_count: Number(row['Jumlah Lane']) || 8,
            description: row['Deskripsi'] || 'Diimpor dari Buku Acara Excel',
          })
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
    // SHEET 3: COMPETITION EVENTS (Nomor Lomba)
    // ==========================================
    if (sheetNames[2]) {
      const compSheet = workbook.Sheets[sheetNames[2]];
      const compRows: any[] = XLSX.utils.sheet_to_json(compSheet);

      for (const row of compRows) {
        const name = row['Nama Nomor'] || row['Event Name'];
        const stroke = row['Gaya Renang'] || row['Stroke'] || 'Freestyle';
        const distance = Number(row['Jarak']) || 50;
        const gender = (row['Gender'] || row['Jenis Kelamin'] || 'male').toLowerCase();
        const gradeLevel = row['Tingkat'] || row['Grade'] || 'SD';
        const className = row['Kelas'] || row['Class'] || 'Kelas 1';
        const ageGroup = row['Kelompok Umur'] || row['Age Group'] || 'KU 2015-2016';

        if (name) {
          const { data: compData, error: compErr } = await supabase
            .from('competition_events')
            .insert({
              event_id: activeEventId,
              name,
              stroke,
              distance_meters: distance,
              gender: gender.includes('putri') || gender.includes('female') ? 'female' : 'male',
              grade_level: gradeLevel,
              class_name: className,
              age_group: ageGroup,
            })
            .select('id')
            .single();

          if (!compErr && compData) {
            const mapKey = `${name}_${gender}_${className}`.toLowerCase();
            compEventMap.set(mapKey, compData.id);
            competitionEventsCreated++;
          }
        }
      }
    }

    // ==========================================
    // SHEET 4: PARTICIPANTS & REGISTRATIONS
    // ==========================================
    if (sheetNames[3]) {
      const participantSheet = workbook.Sheets[sheetNames[3]];
      const participantRows: any[] = XLSX.utils.sheet_to_json(participantSheet);

      for (const row of participantRows) {
        const athleteNum = row['Nomor Peserta'] || row['Athlete Number'] || `ATL-${Math.floor(Math.random() * 899999 + 100000)}`;
        const fullName = row['Nama Atlet'] || row['Athlete Name'];
        const gender = (row['Jenis Kelamin'] || row['Gender'] || 'male').toLowerCase();
        const birthDate = row['Tanggal Lahir'] || '2012-01-01';
        const gradeLevel = row['Tingkat'] || 'SD';
        const className = row['Kelas'] || 'Kelas 6';
        const ageGroup = row['Kelompok Umur'] || 'KU';
        const schoolName = row['Sekolah/Klub'] || row['School/Club'] || 'Umum';
        const compEventName = row['Nomor Lomba'] || row['Competition Event'];
        const seedTimeMs = Number(row['Seed Time MS']) || 0;

        if (fullName) {
          // Ambil ID dari Map atau inisialisasi sebagai null
          let athleteId: string | null = athleteMap.get(athleteNum) || null;

          // 1. Buat / Ambil Atlet jika belum ada di Map
          if (!athleteId) {
            let schoolId: string | null = null;
            
            // Cek / Buat Sekolah
            const { data: schoolData } = await supabase
              .from('schools')
              .select('id')
              .eq('name', schoolName)
              .maybeSingle();

            if (schoolData) {
              schoolId = schoolData.id;
            } else {
              const { data: newSchool } = await supabase
                .from('schools')
                .insert({ name: schoolName, city: 'Kota', province: 'Provinsi' })
                .select('id')
                .single();
              if (newSchool) schoolId = newSchool.id;
            }

            // Insert Atlet Baru
            const { data: athleteData } = await supabase
              .from('athletes')
              .insert({
                athlete_number: athleteNum,
                full_name: fullName,
                gender: gender.includes('putri') || gender.includes('female') ? 'female' : 'male',
                birth_date: birthDate,
                grade_level: gradeLevel,
                class_name: className,
                age_group: ageGroup,
                school_id: schoolId,
              })
              .select('id')
              .single();

            if (athleteData && athleteData.id) {
              athleteId = athleteData.id;
              athleteMap.set(athleteNum, athleteData.id);
              athletesCreated++;
            }
          }

          // 2. Hubungkan Atlet ke Nomor Lomba (Registrasi)
          if (athleteId && compEventName) {
            const mapKey = `${compEventName}_${gender}_${className}`.toLowerCase();
            let targetCompEventId = compEventMap.get(mapKey);

            // Cari ID fallback jika tidak ada di map
            if (!targetCompEventId) {
              const { data: foundComp } = await supabase
                .from('competition_events')
                .select('id')
                .eq('event_id', activeEventId)
                .ilike('name', `%${compEventName}%`)
                .maybeSingle();

              if (foundComp) targetCompEventId = foundComp.id;
            }

            if (targetCompEventId) {
              const { error: regErr } = await supabase.from('registrations').insert({
                event_id: activeEventId,
                athlete_id: athleteId,
                competition_event_id: targetCompEventId,
                seed_time_ms: seedTimeMs,
              });

              if (!regErr) registrationsCreated++;
            }
          }
        }
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
  } catch (error: any) {
    console.error('Excel Parser Error:', error);
    return {
      success: false,
      message: error.message || 'Terjadi kesalahan saat membaca file Excel.',
    };
  }
}