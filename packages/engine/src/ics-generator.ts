import { format, parse, isValid } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export interface ICSEvent {
  title: string;
  start: string;
  end?: string;
  duration?: string;
  all_day?: boolean;
  timezone?: string;
  location?: string;
  description?: string;
  url?: string;
  uid?: string;
  organizer?: string;
  attendees?: string;
}

export function generateICS(events: ICSEvent[], defaultTimezone = 'UTC'): string {
  const lines: string[] = [];
  
  // ICS Header
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//CalendarMap//CalendarMap v1//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  
  // Process each event
  events.forEach((event, index) => {
    lines.push('BEGIN:VEVENT');
    
    // UID (required)
    const uid = event.uid || generateUID(event.title, event.start, index);
    lines.push(`UID:${uid}`);
    
    // Title (required)
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    
    // Dates (required)
    const tz = event.timezone || defaultTimezone;
    const isAllDay = event.all_day === true;
    
    if (isAllDay) {
      const startDate = formatDateOnly(event.start);
      lines.push(`DTSTART;VALUE=DATE:${startDate}`);
      
      if (event.end) {
        const endDate = formatDateOnly(event.end);
        lines.push(`DTEND;VALUE=DATE:${endDate}`);
      }
    } else {
      const startDateTime = formatDateTime(event.start, tz);
      lines.push(`DTSTART;TZID=${tz}:${startDateTime}`);
      
      if (event.end) {
        const endDateTime = formatDateTime(event.end, tz);
        lines.push(`DTEND;TZID=${tz}:${endDateTime}`);
      } else if (event.duration) {
        lines.push(`DURATION:${event.duration}`);
      }
    }
    
    // Optional fields
    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`);
    }
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    
    if (event.url) {
      lines.push(`URL:${event.url}`);
    }
    
    if (event.organizer) {
      lines.push(`ORGANIZER:mailto:${event.organizer}`);
    }
    
    if (event.attendees) {
      const emails = event.attendees.split(';').map(email => email.trim());
      emails.forEach(email => {
        if (email) {
          lines.push(`ATTENDEE:mailto:${email}`);
        }
      });
    }
    
    // Created/Modified timestamps
    const now = formatDateTime(new Date().toISOString(), 'UTC');
    lines.push(`CREATED:${now}Z`);
    lines.push(`LAST-MODIFIED:${now}Z`);
    
    lines.push('END:VEVENT');
  });
  
  lines.push('END:VCALENDAR');
  
  // Fold long lines to 75 characters
  return lines.map(foldLine).join('\r\n');
}

function generateUID(title: string, start: string, index: number): string {
  const hash = simpleHash(title + start + index);
  return `${hash}@calendarmap.app`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function formatDateOnly(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (!isValid(date)) return '';
    return format(date, 'yyyyMMdd');
  } catch {
    return '';
  }
}

function formatDateTime(dateStr: string, timezone: string): string {
  try {
    const date = new Date(dateStr);
    if (!isValid(date)) return '';
    
    if (timezone === 'UTC') {
      return format(date, 'yyyyMMddTHHmmss');
    } else {
      return formatInTimeZone(date, timezone, 'yyyyMMddTHHmmss');
    }
  } catch {
    return '';
  }
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  
  const folded: string[] = [];
  let pos = 0;
  
  while (pos < line.length) {
    if (pos === 0) {
      folded.push(line.substring(0, Math.min(75, line.length)));
      pos = 75;
    } else {
      folded.push(' ' + line.substring(pos, Math.min(pos + 74, line.length)));
      pos += 74;
    }
  }
  
  return folded.join('\r\n');
}