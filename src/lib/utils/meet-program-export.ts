/**
 * Generator Buku Acara / Heat Sheet (Meet Program) Standar Nasional/Internasional
 * Format resmi PB Akuatik Indonesia (PRSI) & World Aquatics
 *
 * Menghasilkan lembar start list resmi per heat untuk Technical Delegate,
 * Referee, Starter, dan Juri Pencatat Waktu Lintasan (Lane Timekeepers).
 */

import { formatMsToTime } from '@/lib/utils';

export interface MeetProgramLane {
  laneNumber: number;
  athleteName: string;
  athleteNumber?: string | null;
  teamName: string;
  seedTimeMs?: number | null;
}

export interface MeetProgramHeat {
  heatNumber: number;
  totalHeatsInEvent: number;
  lanes: MeetProgramLane[];
}

export interface MeetProgramEvent {
  orderNo?: number | null;
  eventName: string;
  stroke: string;
  distanceMeters: number;
  gender: string;
  gradeLevel?: string | null;
  className?: string | null;
  meetRecord?: { timeMs: number; holderName: string; year?: number } | null;
  heats: MeetProgramHeat[];
}

export interface MeetProgramData {
  meetName: string;
  location?: string | null;
  dates?: string | null;
  poolType?: string | null; // e.g. "LCM 50m" | "SCM 25m"
  laneCount: number;
  sanctionBy?: string;     // e.g. "PB Akuatik Indonesia"
  events: MeetProgramEvent[];
}

/**
 * Generate Printable HTML String untuk Buku Acara / Heat Sheet Resmi
 */
export function generateMeetProgramHtml(data: MeetProgramData): string {
  const eventsHtml = data.events
    .map((ev) => {
      const recordText = ev.meetRecord
        ? `Rekor Kejuaraan (MR): ${formatMsToTime(ev.meetRecord.timeMs)} (${ev.meetRecord.holderName}${ev.meetRecord.year ? `, ${ev.meetRecord.year}` : ''})`
        : '';

      const heatsHtml = ev.heats
        .map((heat) => {
          const lanesRows = heat.lanes
            .sort((a, b) => a.laneNumber - b.laneNumber)
            .map((lane) => {
              const seedFormatted = lane.seedTimeMs && lane.seedTimeMs > 0 ? formatMsToTime(lane.seedTimeMs) : 'NT';
              return `
              <tr>
                <td style="text-align: center; font-weight: bold; width: 45px; background-color: #f1f5f9;">${lane.laneNumber}</td>
                <td style="font-weight: 600;">${lane.athleteName || '—'}</td>
                <td style="width: 70px; text-align: center; font-family: monospace;">${lane.athleteNumber || '-'}</td>
                <td>${lane.teamName || 'Umum'}</td>
                <td style="width: 85px; text-align: right; font-family: monospace; font-weight: 600;">${seedFormatted}</td>
                <td style="width: 110px; border-left: 2px solid #cbd5e1;"></td>
                <td style="width: 50px; text-align: center;"></td>
              </tr>
            `;
            })
            .join('');

          return `
            <div style="margin-top: 14px; page-break-inside: avoid;">
              <div style="background-color: #0f172a; color: white; padding: 4px 10px; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between; border-radius: 4px 4px 0 0;">
                <span>SERI / HEAT ${heat.heatNumber} DARI ${heat.totalHeatsInEvent}</span>
                <span>${data.laneCount} LINTASAN</span>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 11px;" border="1" bordercolor="#cbd5e1">
                <thead>
                  <tr style="background-color: #e2e8f0; text-align: left; font-size: 10px; text-transform: uppercase;">
                    <th style="padding: 4px; text-align: center;">Ln</th>
                    <th style="padding: 4px;">Nama Atlet</th>
                    <th style="padding: 4px; text-align: center;">No. Atlet</th>
                    <th style="padding: 4px;">Sekolah / Klub Kontingen</th>
                    <th style="padding: 4px; text-align: right;">Seed Time</th>
                    <th style="padding: 4px; text-align: center;">Waktu Stopwatch</th>
                    <th style="padding: 4px; text-align: center;">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  ${lanesRows}
                </tbody>
              </table>
            </div>
          `;
        })
        .join('');

      return `
        <div style="margin-bottom: 24px; page-break-after: auto;">
          <div style="border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-top: 20px;">
            <h3 style="margin: 0; font-size: 14px; text-transform: uppercase; color: #0f172a;">
              ${ev.orderNo ? `Acara ${ev.orderNo} : ` : ''}${ev.eventName}
            </h3>
            ${recordText ? `<div style="font-size: 10px; color: #0284c7; font-weight: 600; margin-top: 2px;">${recordText}</div>` : ''}
          </div>
          ${heatsHtml}
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Buku Acara (Meet Program) - ${data.meetName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; margin: 20px; }
        @media print {
          body { margin: 10mm; }
          .no-print { display: none; }
        }
        table td { padding: 4px 6px; }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; padding: 10px; background: #e0f2fe; border: 1px solid #7dd3fc; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 600; color: #0369a1;">Buku Acara & Start List Resmi Siap Cetak</span>
        <button onclick="window.print()" style="padding: 6px 14px; background: #0284c7; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">🖨️ Cetak Buku Acara</button>
      </div>

      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
          <img src="/brand/logo.png" alt="Logo" style="height: 48px; width: auto; object-fit: contain;" />
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px;">${data.meetName}</div>
            <div style="font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">SPORT SCHOOL SERIES · OFFICIAL START LIST</div>
          </div>
          <img src="/brand/rajendra-organizer-logo.png" alt="Rajendra Swimming Organizer" style="height: 42px; width: auto; object-fit: contain;" />
        </div>

        <div style="text-align: center; margin: 12px 0 8px 0;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; color: #0f172a;">Official Start List</h1>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 2px;">${data.meetName}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <tr>
            <td style="padding: 6px 12px; width: 50%;"><b>Place:</b> ${data.location || 'Kolam Renang Resmi'}</td>
            <td style="padding: 6px 12px; width: 50%;"><b>Organizer:</b> ${data.sanctionBy || 'Panitia Pelaksana'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px;"><b>Pool:</b> ${data.poolType || '50m (LCM)'} · ${data.laneCount} Lintasan</td>
            <td style="padding: 6px 12px;"><b>Competition Date:</b> ${data.dates || '-'}</td>
          </tr>
        </table>
      </div>

      ${eventsHtml}

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #cbd5e1; text-align: center;">
        <img src="/brand/banner-rajendra.jpg" alt="Rajendra Meet Swimming System - Champion Sports (Mascot Rajen & Dara)" style="width: 100%; max-height: 100px; object-fit: cover; border-radius: 6px;" />
      </div>
    </body>
    </html>
  `;
}

/**
 * Membuka jendela cetak buku acara langsung di browser
 */
export function openPrintableMeetProgram(data: MeetProgramData): void {
  const html = generateMeetProgramHtml(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
