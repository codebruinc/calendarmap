'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import * as Papa from 'papaparse';
import { 
  templates, 
  guessMapping,
  validateRows,
  applyMapping,
  generateICS,
  Template,
  GuessMappingResult,
  ValidationResult,
  BusinessWarning,
  ICSEvent
} from '@calendarmap/engine';
import Link from 'next/link';
import TimezonePicker from '../../components/TimezonePicker';

const LARGE_FILE_LIMIT = 2000;
const PREMIUM_FILE_LIMIT = 250000;

// Check if user has valid large file pass
function hasValidLargeFilePass(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('calendarmap_large_file_pass');
  if (!token) return false;
  
  try {
    const parsed = JSON.parse(token);
    return Date.now() < parsed.expires;
  } catch {
    return false;
  }
}

function getLargeFilePassInfo() {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('calendarmap_large_file_pass');
  if (!token) return null;
  
  try {
    const parsed = JSON.parse(token);
    const remaining = Math.max(0, parsed.expires - Date.now());
    const hours = Math.ceil(remaining / (1000 * 60 * 60));
    return {
      ...parsed,
      hoursRemaining: hours,
      isValid: remaining > 0
    };
  } catch {
    return null;
  }
}

export default function MapperComponent() {
  const searchParams = useSearchParams();
  const schema = searchParams.get('schema') || 'calendar-ics';
  const template = templates[schema as keyof typeof templates] as Template;

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<GuessMappingResult>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showLargeFileModal, setShowLargeFileModal] = useState(false);
  const [transforms, setTransforms] = useState<Record<string, string[]>>({});
  const [hasLargeFilePass, setHasLargeFilePass] = useState(false);
  const [largeFilePassInfo, setLargeFilePassInfo] = useState<any>(null);
  const [defaultTimezone, setDefaultTimezone] = useState<string>('UTC');

  // Check for large file pass on mount and interval
  useEffect(() => {
    const checkPass = () => {
      const isValid = hasValidLargeFilePass();
      const info = getLargeFilePassInfo();
      
      // Clean up expired tokens after 48 hours to avoid confusion
      if (info && !info.isValid && (Date.now() - info.expires) > (48 * 60 * 60 * 1000)) {
        localStorage.removeItem('calendarmap_large_file_pass');
        setLargeFilePassInfo(null);
      } else {
        setLargeFilePassInfo(info);
      }
      
      setHasLargeFilePass(isValid);
    };

    checkPass();
    const interval = setInterval(checkPass, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Load sample CSV if specified in URL hash
  useEffect(() => {
    if (!template) return;
    
    // Wait for client-side hydration and URL to be available
    const checkAndLoadSample = () => {
      if (typeof window === 'undefined') return;
      
      const hash = window.location.hash;
      console.log('Checking hash for sample:', hash);
      
      if (hash.includes('#sample=')) {
        const sampleType = hash.split('#sample=')[1];
        console.log('Loading sample type:', sampleType);
        
        // Track sample data load
        if (typeof window !== 'undefined' && window.plausible) {
          window.plausible('Sample Data Load', {
            props: {
              sampleType: sampleType,
              schema: schema
            }
          });
        }
        
        // Inline 5-row samples for instant loading
        const sampleData = {
        'products': [
          { 'Product Title': 'Wireless Headphones', 'Handle': 'wireless-headphones', 'Status': 'active', 'Published': 'TRUE', 'SKU': 'WH001', 'Price': '89.99', 'Description': 'Premium wireless headphones', 'Vendor': 'AudioTech', 'Category': 'Electronics', 'Stock': '50', 'Inventory Policy': 'continue' },
          { 'Product Title': 'Coffee Mug', 'Handle': 'coffee-mug-ceramic', 'Status': 'active', 'Published': 'FALSE', 'SKU': 'MUG002', 'Price': '12.50', 'Description': 'Ceramic coffee mug', 'Vendor': 'HomeBrew', 'Category': 'Kitchen', 'Stock': '100', 'Inventory Policy': 'continue' },
          { 'Product Title': 'Yoga Mat', 'Handle': 'yoga-mat-premium', 'Status': 'active', 'Published': 'TRUE', 'SKU': 'YM003', 'Price': '0.00', 'Description': 'Premium yoga mat', 'Vendor': 'FitLife', 'Category': 'Sports', 'Stock': '25', 'Inventory Policy': 'continue' },
          { 'Product Title': 'Notebook Set', 'Handle': 'notebook-set-leather', 'Status': 'active', 'Published': 'TRUE', 'SKU': 'NB004', 'Price': '24.99', 'Description': 'Leather notebook set', 'Vendor': 'PaperCraft', 'Category': 'Stationery', 'Stock': '0', 'Inventory Policy': 'deny' },
          { 'Product Title': 'Phone Case', 'Handle': 'phone-case-clear', 'Status': 'active', 'Published': 'TRUE', 'SKU': 'PC005', 'Price': '15.00', 'Description': 'Clear protective case', 'Vendor': 'TechGuard', 'Category': 'Accessories', 'Stock': '200', 'Inventory Policy': 'continue' }
        ],
        'inventory': [
          { 'SKU': 'WH001', 'Available Qty': '45', 'Location': 'Main Warehouse', 'Unit Cost': '35.00' },
          { 'SKU': 'MUG002', 'Available Qty': '-5', 'Location': 'Store A', 'Unit Cost': '4.50' },
          { 'SKU': 'YM003', 'Available Qty': '20', 'Location': 'Main Warehouse', 'Unit Cost': '18.00' },
          { 'SKU': 'NB004', 'Available Qty': '0', 'Location': 'Store B', 'Unit Cost': '8.99' },
          { 'SKU': 'PC005', 'Available Qty': '180', 'Location': 'Distribution Center', 'Unit Cost': '5.50' }
        ],
        'customers': [
          { 'Email': 'john.smith@example.com', 'Name': 'John Smith', 'Phone': '+1-555-0123', 'Address Line 1': '123 Main St', 'Address Line 2': 'Unit 4B', 'City': 'New York', 'State': 'NY', 'Postal Code': '10001', 'Country': 'US', 'Description': 'VIP Customer' },
          { 'Email': 'sarah.doe@company.co.uk', 'Name': 'Sarah Doe', 'Phone': '+44-20-7946-0958', 'Address Line 1': '42 Baker Street', 'Address Line 2': '', 'City': 'London', 'State': 'England', 'Postal Code': 'NW1 6XE', 'Country': 'GB', 'Description': 'Corporate account' },
          { 'Email': 'mike.davis@tech.ca', 'Name': 'Mike Davis', 'Phone': '+1-416-555-0125', 'Address Line 1': '789 Pine St', 'Address Line 2': '', 'City': 'Toronto', 'State': 'ON', 'Postal Code': 'M5H 2N2', 'Country': 'CA', 'Description': '' },
          { 'Email': 'emma@startup.io', 'Name': 'Emma Chen', 'Phone': '+1-415-555-0199', 'Address Line 1': '1 Hacker Way', 'Address Line 2': '', 'City': 'Menlo Park', 'State': 'CA', 'Postal Code': '94301', 'Country': 'US', 'Description': 'Bulk orders' },
          { 'Email': 'alex.brown@example.com', 'Name': 'Alex Brown', 'Phone': '+1-555-0127', 'Address Line 1': '654 Maple Lane', 'Address Line 2': '', 'City': 'Phoenix', 'State': 'AZ', 'Postal Code': '85001', 'Country': 'US', 'Description': 'Regular customer' }
        ],
        'events': [
          { 'Title': 'Team Meeting', 'Start': '2025-01-25 09:00', 'End': '2025-01-25 10:00', 'All Day': 'FALSE', 'Location': 'Conference Room A', 'Description': 'Weekly team standup meeting', 'URL': 'https://example.com/meeting', 'Organizer': 'admin@company.com' },
          { 'Title': 'Product Launch', 'Start': '2025-01-30', 'End': '2025-01-30', 'All Day': 'TRUE', 'Location': 'San Francisco', 'Description': 'Company-wide product launch event', 'URL': 'https://example.com/launch', 'Organizer': 'events@company.com' },
          { 'Title': 'Client Presentation', 'Start': '2025-02-05 14:00', 'End': '2025-02-05 15:30', 'All Day': 'FALSE', 'Location': 'Zoom', 'Description': 'Quarterly business review with client', 'URL': 'https://zoom.us/j/123456789', 'Organizer': 'sales@company.com' },
          { 'Title': 'Company Holiday', 'Start': '2025-02-17', 'End': '2025-02-17', 'All Day': 'TRUE', 'Location': '', 'Description': 'Presidents Day - Office Closed', 'URL': '', 'Organizer': 'hr@company.com' },
          { 'Title': 'Workshop: React Training', 'Start': '2025-02-20 10:00', 'End': '2025-02-20 16:00', 'All Day': 'FALSE', 'Location': 'Training Room B', 'Description': 'Full-day React development workshop', 'URL': 'https://example.com/training', 'Organizer': 'training@company.com' }
        ]
      };

      const data = sampleData[sampleType as keyof typeof sampleData];
      if (data && data.length > 0) {
        const detectedHeaders = Object.keys(data[0] || {});
        console.log('Sample headers detected:', detectedHeaders);
        
        // Create a fake file object for the file info display
        const fakeFile = new File([''], `sample-${sampleType}.csv`, { type: 'text/csv' });
        setCsvFile(fakeFile);
        
        setHeaders(detectedHeaders);
        setCsvData(data);
        
        // Auto-generate mapping
        const autoMapping = guessMapping(detectedHeaders, template);
        console.log('Auto-generated mapping:', autoMapping);
        setMapping(autoMapping);
        
        // Initialize transforms
        const initialTransforms: Record<string, string[]> = {};
        template.fields.forEach(field => {
          initialTransforms[field.key] = [];
        });
        setTransforms(initialTransforms);
        
        console.log('Sample data loaded successfully:', sampleType, data.length, 'rows');
        console.log('Data sample:', data[0]);
        }
      }
    };

    // Check immediately if window is available
    if (typeof window !== 'undefined') {
      checkAndLoadSample();
    }
    
    // Also listen for hash changes and try again after a small delay for client-side routing
    const handleHashChange = () => {
      console.log('Hash changed, checking for sample...');
      setTimeout(checkAndLoadSample, 100);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
    }
    
    // Also try again after component mounts fully to handle SSR/hydration timing
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        checkAndLoadSample();
      }
    }, 1000);
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', handleHashChange);
      }
      clearTimeout(timeoutId);
    };
  }, [template]);

  const handleFileUpload = useCallback((file: File) => {
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      alert('File too large. Maximum size is 100MB.');
      return;
    }

    // Track file upload event
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('File Upload', {
        props: {
          fileSize: Math.round(file.size / 1024), // KB
          schema: schema
        }
      });
    }

    const effectiveLimit = hasLargeFilePass ? PREMIUM_FILE_LIMIT : LARGE_FILE_LIMIT;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: effectiveLimit + 1, // Parse one extra to detect if it's large
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }

        const data = results.data as any[];
        const detectedHeaders = Object.keys(data[0] || {});
        
        if (data.length > effectiveLimit) {
          // Track large file detection
          if (typeof window !== 'undefined' && window.plausible) {
            window.plausible('Large File Detected', {
              props: {
                rowCount: data.length,
                hasPass: hasLargeFilePass,
                schema: schema
              }
            });
          }
          
          // Check if user had a pass but it expired
          const passInfo = getLargeFilePassInfo();
          if (passInfo && !passInfo.isValid) {
            alert('⏰ Your 24-hour Large File Pass has expired! Purchase a new pass or use the free CLI for unlimited processing.');
            setShowLargeFileModal(true);
            return;
          }
          
          if (hasLargeFilePass) {
            // Even premium users have limits
            if (data.length > PREMIUM_FILE_LIMIT) {
              alert(`File too large. Premium limit is ${PREMIUM_FILE_LIMIT.toLocaleString()} rows. Use the CLI for unlimited processing.`);
            } else {
              // This shouldn't happen, but just in case
              alert('An error occurred with your Large File Pass. Please try again or contact support.');
            }
          } else {
            setShowLargeFileModal(true);
          }
          return;
        }

        setHeaders(detectedHeaders);
        setCsvData(data);
        setCsvFile(file);
        
        // Auto-generate mapping
        const autoMapping = guessMapping(detectedHeaders, template);
        setMapping(autoMapping);
        
        // Initialize transforms
        const initialTransforms: Record<string, string[]> = {};
        template.fields.forEach(field => {
          initialTransforms[field.key] = [];
        });
        setTransforms(initialTransforms);
      }
    });
  }, [template]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    if (csvFile) {
      handleFileUpload(csvFile);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const validateMapping = useCallback(() => {
    if (csvData.length === 0) return;
    
    const validationResult = validateRows(csvData, template, mapping);
    setValidation(validationResult);
  }, [csvData, template, mapping]);

  useEffect(() => {
    if (Object.keys(mapping).length > 0) {
      validateMapping();
    }
  }, [mapping, validateMapping]);

  const downloadMappedFile = useCallback(() => {
    if (csvData.length === 0) return;
    
    // Track the main conversion event
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Calendar Download', {
        props: {
          rowCount: csvData.length,
          schema: schema,
          isGoal: true
        }
      });
    }
    
    const result = applyMapping(csvData, template, mapping);
    
    if (schema === 'calendar-ics') {
      // Generate ICS file
      const events: ICSEvent[] = result.rows.map(row => ({
        title: row.title || '',
        start: row.start || '',
        end: row.end || '',
        duration: row.duration || '',
        all_day: row.all_day === true || row.all_day === 'true',
        timezone: row.timezone || defaultTimezone,  // Use defaultTimezone if no per-row override
        location: row.location || '',
        description: row.description || '',
        url: row.url || '',
        uid: row.uid || '',
        organizer: row.organizer || '',
        attendees: row.attendees || '',
      }));
      
      const ics = generateICS(events, defaultTimezone);
      const blob = new Blob([ics], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = csvFile ? csvFile.name.replace('.csv', '.ics') : 'calendar.ics';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Generate CSV file (for other schemas)
      const csv = Papa.unparse(result.rows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = csvFile ? csvFile.name.replace('.csv', '_mapped.csv') : 'mapped.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [csvData, template, mapping, schema, csvFile]);

  const downloadMapping = useCallback(() => {
    // Track mapping download
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Mapping Download', {
        props: {
          schema: schema,
          fieldCount: Object.keys(mapping).length
        }
      });
    }
    
    const mappingData = {
      schema: schema,
      ...(template.templateVersion && {
        templateVersion: template.templateVersion,
        ruleVersion: template.ruleVersion,
        lastVerified: template.lastVerified,
        sourceUrls: template.sourceUrls,
      }),
      mapping: mapping,
      transforms: transforms,
      generatedAt: new Date().toISOString(),
      generatedBy: 'CalendarMap Web Interface'
    };
    const blob = new Blob([JSON.stringify(mappingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema}-mapping.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [schema, template, mapping, transforms]);

  const downloadErrorReport = useCallback(() => {
    if (!validation || validation.sampleErrors.length === 0) return;
    
    // Track error report download
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Error Report Download', {
        props: {
          errorCount: validation.errorCount,
          schema: schema
        }
      });
    }
    
    const errorData = validation.sampleErrors.map(error => ({
      'Row': error.row,
      'Field': error.field,
      'Issue': error.issue,
      'Value': error.value || ''
    }));
    
    const csv = Papa.unparse(errorData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema}-errors.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [validation, schema]);

  const getCLICommand = useCallback(() => {
    const outputExtension = schema === 'calendar-ics' ? 'ics' : 'csv';
    const toolName = 'calendarmap';
    return `${toolName} map --schema ${schema} --mapping mapping.json < input.csv > output.${outputExtension}`;
  }, [schema]);

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Schema not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
              CalendarMap
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-xl text-gray-600">{template.title} Mapper</span>
          </div>
          <p className="text-gray-600">
            Map your CSV to {template.title} format with validation
          </p>
        </div>
      </header>

      {/* Premium Banner */}
      {hasLargeFilePass && largeFilePassInfo && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-green-700 font-semibold">⭐ Large File Pass Active</span>
              <span className="text-green-600">Up to {PREMIUM_FILE_LIMIT.toLocaleString()} rows</span>
              <span className="text-green-600">{largeFilePassInfo.hoursRemaining}h remaining</span>
            </div>
          </div>
        </div>
      )}

      {/* Expired Pass Banner */}
      {!hasLargeFilePass && largeFilePassInfo && !largeFilePassInfo.isValid && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="text-orange-700 font-semibold">⏰ Large File Pass Expired</span>
              <span className="text-orange-600">Free limit: {LARGE_FILE_LIMIT.toLocaleString()} rows</span>
              <Link href="/pricing" className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors">
                Renew Pass
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Banner */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-blue-800 text-sm text-center">
            🔒 Processing happens in your browser. We do not upload your CSV. Share links include only the mapping, never your data.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!csvFile ? (
          // File upload area
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-gray-600">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold mb-2">Drop your CSV file here</h3>
                <p className="mb-4">or click to browse</p>
                <div className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block font-semibold">
                  Choose File
                </div>
              </div>
            </label>
          </div>
        ) : (
          // Mapping interface
          <div className="space-y-8">
            {/* File info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">File Information</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Filename</span>
                  <p className="text-gray-900">{csvFile.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Rows</span>
                  <p className="text-gray-900">{csvData.length.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Columns</span>
                  <p className="text-gray-900">{headers.length}</p>
                </div>
              </div>
            </div>

            {/* Timezone Picker for calendar-ics */}
            {schema === 'calendar-ics' && (
              <div className="bg-white rounded-lg shadow p-6">
                <TimezonePicker 
                  value={defaultTimezone}
                  onChange={setDefaultTimezone}
                  showPreview={true}
                />
              </div>
            )}

            {/* Template specification info */}
            {template.templateVersion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Template Specification</h3>
                    <div className="text-sm text-blue-800 mt-1 space-y-1">
                      <div>Version: {template.templateVersion} (Rules: {template.ruleVersion})</div>
                      <div>Last verified: {template.lastVerified}</div>
                      {template.sourceUrls && template.sourceUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {template.sourceUrls.map((url, idx) => (
                            <a 
                              key={idx} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-xs"
                            >
                              📋 Official Spec {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Mapping interface */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Field Mapping</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Required fields are marked with *
                </p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {template.fields.map(field => (
                    <div key={field.key} className="grid md:grid-cols-4 gap-4 items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </div>
                        <div className="text-sm text-gray-500">{field.key}</div>
                      </div>
                      
                      <div>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={mapping[field.key] || ''}
                          onChange={(e) => {
                            const newMapping = { ...mapping };
                            if (e.target.value) {
                              newMapping[field.key] = e.target.value;
                            } else {
                              delete newMapping[field.key];
                            }
                            setMapping(newMapping);
                          }}
                        >
                          <option value="">Select column...</option>
                          {headers.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        {field.transform && (
                          <div className="flex flex-wrap gap-1">
                            {field.transform.map(transform => (
                              <label key={transform} className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  className="mr-1"
                                  checked={transforms[field.key]?.includes(transform) || false}
                                  onChange={(e) => {
                                    setTransforms(prev => ({
                                      ...prev,
                                      [field.key]: e.target.checked
                                        ? [...(prev[field.key] || []), transform]
                                        : (prev[field.key] || []).filter(t => t !== transform)
                                    }));
                                  }}
                                />
                                {transform}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        {mapping[field.key] && csvData.length > 0 && (
                          <div className="text-sm text-gray-600 truncate">
                            Preview: {csvData[0][mapping[field.key]!]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Validation results */}
            {validation && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {validation.okCount.toLocaleString()}
                    </div>
                    <div className="text-gray-600">Rows OK</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {validation.errorCount.toLocaleString()}
                    </div>
                    <div className="text-gray-600">Rows with errors</div>
                  </div>
                </div>
                
                {validation.sampleErrors.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Error Samples:</h3>
                      <button
                        onClick={downloadErrorReport}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        📥 Download Error Report (.csv)
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {validation.sampleErrors.map((error, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-mono text-gray-600">Row {error.row}, {error.field}:</span>
                          <span className="text-red-600 ml-2">{error.issue}</span>
                        </div>
                      ))}
                    </div>
                    {validation.errorCount > validation.sampleErrors.length && (
                      <div className="text-sm text-gray-500 mt-2">
                        ... and {validation.errorCount - validation.sampleErrors.length} more errors
                      </div>
                    )}
                  </div>
                )}

                {validation.businessWarnings && validation.businessWarnings.length > 0 && (
                  <div className="mt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                        ⚠️ Business Logic Warnings
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {validation.businessWarnings.map((warning, idx) => (
                          <div key={idx} className="text-sm text-yellow-800">
                            <span className="font-mono text-yellow-700">Row {warning.row}:</span>
                            <span className="ml-2">{warning.message}</span>
                          </div>
                        ))}
                      </div>
                      {validation.businessWarnings.length === 10 && (
                        <div className="text-sm text-yellow-600 mt-2">
                          Showing first 10 warnings only
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Export buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Export & Actions</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">
                    🔒 Files never leave your device
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadMappedFile}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                  disabled={csvData.length === 0}
                >
                  {schema === 'calendar-ics' ? 'Download Calendar ICS' : 'Download Mapped CSV'}
                </button>
                <button
                  onClick={downloadMapping}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Download Mapping JSON
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getCLICommand());
                    // Track CLI command copy
                    if (typeof window !== 'undefined' && window.plausible) {
                      window.plausible('CLI Command Copy', {
                        props: {
                          schema: schema
                        }
                      });
                    }
                  }}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold"
                >
                  Copy CLI Command
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Footer */}
        <div className="mt-16 bg-gray-100 rounded-lg p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Schema Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                {template?.title}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                {schema === 'shopify-products' && (
                  <>
                    <p>• Map product catalogs with variants and pricing</p>
                    <p>• Handle inventory tracking and status updates</p>
                    <p>• Validate SKUs, prices, and product descriptions</p>
                  </>
                )}
                {schema === 'shopify-inventory' && (
                  <>
                    <p>• Update stock levels across multiple locations</p>
                    <p>• Handle inventory adjustments and tracking</p>
                    <p>• Validate quantities and location mappings</p>
                  </>
                )}
                {schema === 'stripe-customers' && (
                  <>
                    <p>• Import customer data with address validation</p>
                    <p>• Validate email formats and contact info</p>
                    <p>• Handle international address formats</p>
                  </>
                )}
                {schema === 'calendar-ics' && (
                  <>
                    <p>• Convert CSV events to ICS calendar format</p>
                    <p>• Handle both timed and all-day events</p>
                    <p>• Support timezones and recurring patterns</p>
                  </>
                )}
              </div>
            </div>

            {/* Processing Limits */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Processing Limits</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600">Free: Up to {LARGE_FILE_LIMIT.toLocaleString()} rows</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-600">Web Pass ($5): Up to {PREMIUM_FILE_LIMIT.toLocaleString()} rows</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span className="text-gray-600">CLI Tool: Unlimited (free)</span>
                </div>
                {hasLargeFilePass && largeFilePassInfo?.isValid && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    ✅ Large File Pass Active ({largeFilePassInfo.hoursRemaining}h remaining)
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Resources</h3>
              <div className="space-y-2 text-sm">
                <Link 
                  href={schema === 'calendar-ics' ? '/docs/csv-to-ics-converter' : `/docs/${schema}-csv-mapper`}
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  📖 Complete Guide & Examples
                </Link>
                <Link 
                  href="/pricing"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  💳 Pricing & Large Files
                </Link>
                <Link 
                  href="/cli"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ⚡ CLI Tool (Unlimited)
                </Link>
                <Link 
                  href="/self-host"
                  className="block text-blue-600 hover:text-blue-800 hover:underline"
                >
                  🔒 Self-Host Option
                </Link>
              </div>
            </div>
          </div>

          {/* Sample Data CTA */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Need test data?</span> Load our sample CSV to see how mapping works.
              </div>
              <button
                onClick={() => {
                  window.location.hash = `#sample=${
                    schema === 'shopify-products' ? 'products' :
                    schema === 'shopify-inventory' ? 'inventory' : 
                    schema === 'calendar-ics' ? 'events' : 'customers'
                  }`;
                  window.location.reload();
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                Load Sample CSV
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Large file modal */}
      {showLargeFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">🚀 Large File Detected</h3>
            <p className="text-gray-600 mb-6">
              Your file has more than {LARGE_FILE_LIMIT.toLocaleString()} rows. Get instant access to process large calendars!
            </p>
            
            {/* Paid Option - Prioritized */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-900">🌟 Instant Web Access - $5</h4>
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Recommended</span>
              </div>
              <ul className="text-sm text-blue-800 mb-3 space-y-1">
                <li>✅ Process up to {PREMIUM_FILE_LIMIT.toLocaleString()} rows instantly</li>
                <li>✅ No software to install - works in your browser</li>
                <li>✅ <strong>Valid for 24 hours from purchase</strong></li>
                <li>✅ Secure payment via Stripe</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                <p className="text-xs text-yellow-800">
                  <strong>⏰ 24-Hour Pass:</strong> After 24 hours, you'll need to purchase another pass or use the free CLI below for unlimited processing.
                </p>
              </div>
              <Link
                href="/pricing"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold text-sm inline-block transition-colors w-full text-center"
              >
                💳 Get Instant Access ($5)
              </Link>
            </div>
            
            {/* Free Option - Secondary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-700">🛠️ Free CLI Option</h4>
                <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">No Size Limit</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">For developers who prefer command-line tools:</p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm font-mono overflow-x-auto mb-3">
                {getCLICommand()}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getCLICommand());
                  // Track CLI command copy from modal
                  if (typeof window !== 'undefined' && window.plausible) {
                    window.plausible('CLI Command Copy', {
                      props: {
                        schema: schema,
                        source: 'large_file_modal'
                      }
                    });
                  }
                  alert('CLI command copied to clipboard!');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold w-full transition-colors text-sm"
              >
                📋 Copy Command to Clipboard
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowLargeFileModal(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}