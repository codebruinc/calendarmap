'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, FileText, Clock } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isActivated, setIsActivated] = useState(false);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Generate a 24-hour token and store in localStorage
      const token = {
        id: sessionId,
        activated: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        maxEvents: 250000
      };
      
      localStorage.setItem('calendarmap_large_calendar_pass', JSON.stringify(token));
      setIsActivated(true);
    }
  }, [sessionId]);

  const timeRemaining = () => {
    const token = localStorage.getItem('calendarmap_large_calendar_pass');
    if (!token) return '0 hours';
    
    const parsed = JSON.parse(token);
    const remaining = parsed.expires - Date.now();
    const hours = Math.ceil(remaining / (1000 * 60 * 60));
    
    return `${Math.max(0, hours)} hours`;
  };

  if (!sessionId) {
    router.push('/pricing');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              CalendarMap
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-xl text-gray-600">Payment Success</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600">
              Your Large Calendar Pass has been activated
            </p>
          </div>

          {isActivated && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">250,000</div>
                  <div className="text-sm text-green-700">Max events per file</div>
                </div>
                <div className="text-center">
                  <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{timeRemaining()}</div>
                  <div className="text-sm text-green-700">Remaining</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">Active</div>
                  <div className="text-sm text-green-700">On this device</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-gray-600">
              You can now process calendars up to 250,000 events for the next 24 hours on this device.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/map?schema=calendar-ics"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Converting Large Calendars
              </Link>
              <Link
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500 border-t pt-6">
            <p className="mb-2">
              <strong>Session ID:</strong> {sessionId}
            </p>
            <p>
              Your pass is stored locally on this device. No account needed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}