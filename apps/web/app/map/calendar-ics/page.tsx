import { redirect } from 'next/navigation'

// This is the canonical route for calendar-ics
// We redirect to the main /map page with the schema parameter
export default function CalendarICSPage() {
  redirect('/map?schema=calendar-ics')
}