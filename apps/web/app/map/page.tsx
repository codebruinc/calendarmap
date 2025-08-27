import { Suspense } from 'react';
import MapperComponent from './MapperComponent';

export const metadata = {
  title: 'CSV to ICS Converter — CalendarMap',
  description: 'Convert your CSV event files to ICS calendar format with smart field mapping and validation.',
};

function MapperFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading mapper...</p>
      </div>
    </div>
  );
}

export default function MapperPage() {
  return (
    <Suspense fallback={<MapperFallback />}>
      <MapperComponent />
    </Suspense>
  );
}