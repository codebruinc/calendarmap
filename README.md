# CalendarMap

Convert CSV events to ICS calendar format in 30 seconds. No login. Runs in your browser.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/codebruinc/calendarmap/workflows/ci/badge.svg)](https://github.com/codebruinc/calendarmap/actions)

## 🚀 Quick Start

**Web App:** [calendarmap.app](https://calendarmap.app)

**Direct Links:**
- [CSV to ICS Converter](https://calendarmap.app/map/calendar-ics)
- [Try with Sample Events](https://calendarmap.app/map/calendar-ics#sample=events)

**CLI:**
```bash
npm install -g calendarmap-cli
calendarmap --help
```

## 🔒 Privacy Statement

**Browser-only processing by default.** Your CSV files are never uploaded to our servers. All conversion and validation happens locally in your browser using JavaScript. 

For large calendars (>2,000 events), you can either:
- Use our free CLI tool (unlimited size)
- Purchase a one-off browser credit ($5 for 24h)

## ✨ Features

- **Smart auto-mapping** - Automatically detects date, time, and event fields from your CSV
- **Timezone support** - Handles multiple timezones and all-day events
- **Validation** - Shows specific errors and suggests fixes for dates and times
- **No signup required** - Start converting immediately
- **Privacy-safe** - Files never leave your device (browser-only processing)
- **Open source** - MIT licensed, contribute on GitHub
- **CLI included** - Unlimited file size, perfect for automation
- **RFC 5545 compliant** - Works with Google Calendar, Outlook, Apple Calendar

## 🎯 Supported Format

### Calendar ICS
**Required:** Title, Start Date/Time
**Optional:** End Date/Time, Duration, All Day, Location, Description, URL, Organizer, Attendees, Timezone

**Common Use Cases:**
- Conference schedules and session lists
- Class schedules and academic calendars  
- Team meeting schedules and project timelines
- Event planning spreadsheets
- Training schedules and workshops

## 🛠 How It Works

1. **Upload** your CSV file with event data
2. **Map** - We auto-detect columns like Title, Start, End, Location
3. **Validate** - Check for date/time issues and missing fields
4. **Download** - Get your ICS file ready for import into any calendar app

## 🖥 CLI Usage

```bash
# Convert events CSV to ICS calendar
calendarmap convert events.csv -o calendar.ics

# Specify timezone
calendarmap convert events.csv -o calendar.ics --timezone "America/New_York"

# Validate before converting
calendarmap validate events.csv
```

## 📂 CSV Format Example

```csv
Title,Start,End,All Day,Location,Description
Team Meeting,2025-01-25 09:00,2025-01-25 10:00,FALSE,Conference Room A,Weekly standup
Product Launch,2025-01-30,2025-01-30,TRUE,San Francisco,Company-wide launch event
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## 📦 Project Structure

```
calendarmap/
├── apps/web/          # Next.js web application
├── packages/
│   ├── engine/        # Core mapping and ICS generation
│   └── cli/          # Command-line interface
└── docs/             # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run `npm run test` and `npm run lint`
5. Commit: `git commit -am 'Add feature'`
6. Push: `git push origin feature-name`
7. Create a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Web App**: https://calendarmap.app
- **GitHub**: https://github.com/codebruinc/calendarmap
- **Issues**: https://github.com/codebruinc/calendarmap/issues

---

Built with ❤️ for the community. Convert your events, import everywhere.