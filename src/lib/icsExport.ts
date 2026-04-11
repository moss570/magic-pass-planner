/**
 * ICS file builder for Best Days to Go — no external dependencies.
 * Produces a valid iCalendar file that works with Google Calendar, Apple Calendar, Outlook.
 */

interface BestDaySelection {
  parkName: string;
  date: string; // YYYY-MM-DD
  score: number;
  grade: string;
  reasons: string[];
}

function escapeIcs(text: string): string {
  return text.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

function dateToIcsDate(dateStr: string): string {
  // YYYY-MM-DD → YYYYMMDD (VALUE=DATE for all-day events)
  return dateStr.replace(/-/g, "");
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function buildIcsForBestDays(selections: BestDaySelection[]): string {
  const events = selections.map((s) => {
    const uid = `bestday-${simpleHash(s.parkName + s.date)}@magicpassplanner.app`;
    const dtStart = dateToIcsDate(s.date);
    // All-day event: DTEND is the next day
    const endDate = new Date(s.date + "T00:00:00");
    endDate.setDate(endDate.getDate() + 1);
    const dtEnd = dateToIcsDate(endDate.toISOString().substring(0, 10));

    const desc = `Score: ${s.score}/100 (${s.grade})\\n${s.reasons.join("\\n")}`;

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:Best day for ${escapeIcs(s.parkName)}`,
      `DESCRIPTION:${escapeIcs(desc)}`,
      "STATUS:TENTATIVE",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Magic Pass Planner//Best Days//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
