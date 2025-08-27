import { Copy, Download, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function CLIPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900">CalendarMap</Link>
            <span>/</span>
            <span className="text-gray-900">CLI</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">CLI Tool</h1>
          <p className="text-gray-600 mt-2">
            Convert CSV files to ICS calendar format from the command line
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Installation */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Download className="w-6 h-6" />
              Installation
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Install globally with npm:</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  npm install -g calendarmap-cli
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Verify installation:</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  calendarmap --version
                </div>
              </div>
            </div>
          </section>

          {/* Basic Usage */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Terminal className="w-6 h-6" />
              Basic Usage
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Convert CSV to ICS:</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  calendarmap convert events.csv -o calendar.ics
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Specify timezone:</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  calendarmap convert events.csv -o calendar.ics --timezone "America/New_York"
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Map specific columns:</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  {`calendarmap convert events.csv -o calendar.ics \\
  --title "Event Name" \\
  --start "Start Date" \\
  --end "End Date" \\
  --location "Venue"`}
                </div>
              </div>
            </div>
          </section>

          {/* Commands */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Commands</h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-mono font-medium">convert</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Convert CSV file to ICS calendar format
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-mono font-medium">validate</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Check CSV for date/time issues before conversion
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-mono font-medium">preview</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Show first few events that would be created
                </p>
              </div>
            </div>
          </section>

          {/* Examples */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Examples</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Conference Schedule</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  {`# Convert conference sessions to calendar
calendarmap convert conference.csv -o conference2025.ics \\
  --timezone "America/Chicago"`}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Class Schedule</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  {`# Convert semester schedule with recurring events
calendarmap convert classes.csv -o semester.ics \\
  --recurring --until "2025-05-15"`}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Team Calendar</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  {`# Process team events with validation
calendarmap validate team-events.csv
calendarmap convert team-events.csv -o team.ics`}
                </div>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Why Use the CLI?</h2>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <div>
                  <strong className="font-medium">Automation</strong>
                  <p className="text-gray-600 text-sm">Integrate into scripts and workflows</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <div>
                  <strong className="font-medium">Batch Processing</strong>
                  <p className="text-gray-600 text-sm">Convert multiple CSV files at once</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <div>
                  <strong className="font-medium">Large Files</strong>
                  <p className="text-gray-600 text-sm">No size limits on CSV files</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <div>
                  <strong className="font-medium">Privacy</strong>
                  <p className="text-gray-600 text-sm">All processing happens locally</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Get Started */}
          <section className="bg-gray-100 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-3">Ready to get started?</h2>
            <p className="text-gray-600 mb-4">
              Install the CLI tool and start converting your CSV files to calendar format
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm inline-block">
              npm install -g calendarmap-cli
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}