import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CalendarMap — Convert CSV to ICS Calendar in 30 seconds',
  description: 'Drop your CSV events, get an ICS calendar file. Works with Google Calendar & Outlook. No login. Runs in your browser.',
  keywords: ['CSV', 'ICS', 'calendar', 'events', 'Google Calendar', 'Outlook', 'iCalendar', 'data conversion', 'no-code'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'CalendarMap — CSV to ICS Calendar Converter',
    description: 'Convert CSV events to ICS calendar format in 30 seconds. No login. Runs in your browser.',
    url: 'https://calendarmap.app',
    siteName: 'CalendarMap',
    type: 'website',
    images: [{
      url: 'https://calendarmap.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'CalendarMap - CSV to ICS Converter',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CalendarMap — CSV to ICS Calendar Converter',
    description: 'Convert CSV events to ICS calendar format in 30 seconds. No login. Runs in your browser.',
    images: ['https://calendarmap.app/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script defer data-domain="calendarmap.app" src="https://analytics.pikasim.com/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"></script>
        <script dangerouslySetInnerHTML={{ __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }` }} />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}