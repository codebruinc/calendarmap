import { ICSEvent } from './ics-generator';
import { parse, isValid } from 'date-fns';

export interface ICSValidationIssue {
  severity: 'error' | 'warning';
  field?: string;
  eventIndex?: number;
  message: string;
}

export interface ICSValidationResult {
  isValid: boolean;
  issues: ICSValidationIssue[];
  stats: {
    totalEvents: number;
    validEvents: number;
    hasAllRequiredFields: boolean;
    hasTimezone: boolean;
    hasAllDayEvents: boolean;
    hasTimedEvents: boolean;
  };
}

/**
 * Validates ICS events for RFC 5545 compliance and best practices
 */
export function validateICSEvents(events: ICSEvent[]): ICSValidationResult {
  const issues: ICSValidationIssue[] = [];
  let validEvents = 0;
  let hasAllDayEvents = false;
  let hasTimedEvents = false;
  let hasTimezone = false;

  if (!events || events.length === 0) {
    issues.push({
      severity: 'error',
      message: 'No events to validate'
    });
    return {
      isValid: false,
      issues,
      stats: {
        totalEvents: 0,
        validEvents: 0,
        hasAllRequiredFields: false,
        hasTimezone: false,
        hasAllDayEvents: false,
        hasTimedEvents: false
      }
    };
  }

  events.forEach((event, index) => {
    let eventValid = true;

    // Check required fields
    if (!event.title || event.title.trim() === '') {
      issues.push({
        severity: 'error',
        field: 'title',
        eventIndex: index,
        message: `Event ${index + 1}: Missing required field 'title'`
      });
      eventValid = false;
    }

    if (!event.start) {
      issues.push({
        severity: 'error',
        field: 'start',
        eventIndex: index,
        message: `Event ${index + 1}: Missing required field 'start'`
      });
      eventValid = false;
    } else {
      // Validate start date format
      if (!isValidDateString(event.start)) {
        issues.push({
          severity: 'error',
          field: 'start',
          eventIndex: index,
          message: `Event ${index + 1}: Invalid start date format`
        });
        eventValid = false;
      }
    }

    // Check end date/duration logic
    if (!event.end && !event.duration && !event.all_day) {
      issues.push({
        severity: 'warning',
        eventIndex: index,
        message: `Event ${index + 1}: No end time or duration specified (will default to 1 hour)`
      });
    }

    if (event.end && event.duration) {
      issues.push({
        severity: 'warning',
        eventIndex: index,
        message: `Event ${index + 1}: Both end time and duration specified (end time will be used)`
      });
    }

    // Validate end date if present
    if (event.end && !isValidDateString(event.end)) {
      issues.push({
        severity: 'error',
        field: 'end',
        eventIndex: index,
        message: `Event ${index + 1}: Invalid end date format`
      });
      eventValid = false;
    }

    // Check if end is after start
    if (event.start && event.end && !event.all_day) {
      try {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        if (endDate <= startDate) {
          issues.push({
            severity: 'error',
            eventIndex: index,
            message: `Event ${index + 1}: End time must be after start time`
          });
          eventValid = false;
        }
      } catch (e) {
        // Date parsing error already handled above
      }
    }

    // Track event types
    if (event.all_day) {
      hasAllDayEvents = true;
    } else {
      hasTimedEvents = true;
    }

    // Check timezone
    if (event.timezone) {
      hasTimezone = true;
      // Validate timezone format (basic check)
      if (!isValidTimezone(event.timezone)) {
        issues.push({
          severity: 'warning',
          field: 'timezone',
          eventIndex: index,
          message: `Event ${index + 1}: Unrecognized timezone '${event.timezone}'`
        });
      }
    }

    // Validate duration format if present
    if (event.duration && !isValidDuration(event.duration)) {
      issues.push({
        severity: 'warning',
        field: 'duration',
        eventIndex: index,
        message: `Event ${index + 1}: Invalid duration format (should be like 'PT1H' for 1 hour)`
      });
    }

    // Check for special characters that need escaping
    if (event.title && containsUnescapedSpecialChars(event.title)) {
      issues.push({
        severity: 'warning',
        field: 'title',
        eventIndex: index,
        message: `Event ${index + 1}: Title contains special characters that will be escaped`
      });
    }

    if (event.description && containsUnescapedSpecialChars(event.description)) {
      issues.push({
        severity: 'warning',
        field: 'description',
        eventIndex: index,
        message: `Event ${index + 1}: Description contains special characters that will be escaped`
      });
    }

    // Validate email formats
    if (event.organizer && !isValidEmail(event.organizer)) {
      issues.push({
        severity: 'warning',
        field: 'organizer',
        eventIndex: index,
        message: `Event ${index + 1}: Organizer should be a valid email address`
      });
    }

    if (event.attendees) {
      const emails = event.attendees.split(/[;,]/).map(e => e.trim());
      emails.forEach(email => {
        if (email && !isValidEmail(email)) {
          issues.push({
            severity: 'warning',
            field: 'attendees',
            eventIndex: index,
            message: `Event ${index + 1}: Invalid attendee email '${email}'`
          });
        }
      });
    }

    if (eventValid) {
      validEvents++;
    }
  });

  // Add general recommendations
  if (!hasTimezone && hasTimedEvents) {
    issues.push({
      severity: 'warning',
      message: 'No timezone specified for timed events (will default to UTC)'
    });
  }

  const hasAllRequiredFields = events.every(e => e.title && e.start);
  const isValid = validEvents === events.length && issues.filter(i => i.severity === 'error').length === 0;

  return {
    isValid,
    issues,
    stats: {
      totalEvents: events.length,
      validEvents,
      hasAllRequiredFields,
      hasTimezone,
      hasAllDayEvents,
      hasTimedEvents
    }
  };
}

function isValidDateString(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    return isValid(date) && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

function isValidTimezone(tz: string): boolean {
  // Basic validation - check if it matches common timezone patterns
  const commonTimezones = [
    'UTC', 'GMT',
    /^(America|Europe|Asia|Africa|Australia|Pacific|Atlantic|Indian)\//,
    /^(US|Canada)\//,
    /^Etc\//
  ];
  
  return commonTimezones.some(pattern => {
    if (typeof pattern === 'string') {
      return tz === pattern;
    }
    return pattern.test(tz);
  });
}

function isValidDuration(duration: string): boolean {
  // RFC 5545 duration format: P[n]Y[n]M[n]DT[n]H[n]M[n]S
  return /^P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+S)?)?$/.test(duration);
}

function containsUnescapedSpecialChars(text: string): boolean {
  // Check for characters that need escaping in ICS format
  return /[,;\\]/.test(text);
}

function isValidEmail(email: string): boolean {
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Generates a validation report for display
 */
export function formatValidationReport(result: ICSValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`ICS Validation Report`);
  lines.push(`=====================`);
  lines.push(`Total Events: ${result.stats.totalEvents}`);
  lines.push(`Valid Events: ${result.stats.validEvents}`);
  lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push('');
  
  if (result.issues.length > 0) {
    lines.push('Issues Found:');
    lines.push('-------------');
    
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    
    if (errors.length > 0) {
      lines.push(`\nErrors (${errors.length}):`);
      errors.forEach(issue => {
        lines.push(`  ❌ ${issue.message}`);
      });
    }
    
    if (warnings.length > 0) {
      lines.push(`\nWarnings (${warnings.length}):`);
      warnings.forEach(issue => {
        lines.push(`  ⚠️ ${issue.message}`);
      });
    }
  } else {
    lines.push('✅ No issues found - ICS is fully compliant!');
  }
  
  return lines.join('\n');
}