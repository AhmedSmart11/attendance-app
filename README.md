# Employee Attendance Tracking System - Complete Documentation

## Project Overview

A full-stack Employee Attendance Tracking Web Application with two distinct interfaces:
1. **Employee Mobile-Responsive Dashboard** - For clocking in/out with geo-fencing
2. **Admin Control Panel** - For managing locations, shifts, and reviewing attendance

## Tech Stack

- **Framework**: Next.js 16.3.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Icons**: lucide-react
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: In-memory mock database (easily replaceable with Supabase/PostgreSQL)

## File Structure

```
attendance-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/route.ts          # Auth endpoints (login, logout, me)
│   │   │   └── attendance/route.ts    # Attendance endpoints
│   │   ├── (app)/
│   │   │   ├── admin/
│   │   │   │   └── page.tsx           # Admin dashboard
│   │   │   ├── employee/
│   │   │   │   ├── page.tsx           # Employee home
│   │   │   │   ├── clock/
│   │   │   │   │   └── page.tsx       # Clock in/out page
│   │   │   │   └── history/
│   │   │   │       └── page.tsx       # Attendance history
│   │   │   └── layout.tsx             # App layout with auth
│   │   ├── globals.css                # Tailwind + shadcn styles
│   │   └── layout.tsx                 # Root layout with AuthProvider
│   ├── components/
│   │   └── ui/                        # shadcn/ui components
│   ├── lib/
│   │   ├── actions.ts                 # Server actions (CRUD operations)
│   │   ├── auth-context.tsx           # Auth context provider
│   │   └── db.ts                      # Mock database + utilities
│   └── types/                         # Type definitions
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

## Core Features Implemented

### 1. Authentication & Roles
- **Login Page**: `/page.tsx` - Login with email/password
- **Role-based access**: Admin and Employee roles
- **Session management**: Cookie-based auth tokens
- **Demo accounts**:
  - Admin: `admin@company.com` / `admin123`
  - Employee: `employee@company.com` / `emp123`

### 2. Employee Interface (Mobile-First)

#### Geo-Fenced Clock In/Out (`/employee/clock`)
- Large "Clock In" / "Clock Out" buttons
- HTML5 Geolocation permission request
- Real-time distance calculation from HQ using Haversine formula
- **Out of Bounds detection**: Blocks clock-in if outside radius
- **Late detection**: If past shift start + grace period
- **Late reason form**: Required text input for late arrivals
- Status feedback with success/error toasts

#### Attendance History (`/employee/history`)
- Filterable list (All, On Time, Pending, Approved, Rejected)
- Shows date, time, location, status for each record
- Duration calculation for completed shifts
- Reason display for late submissions
- Approval/rejection status with timestamps

### 3. Admin Control Panel (`/admin`)

#### Dashboard Stats
- Today's clock-ins count
- Pending approvals count
- Late arrivals count

#### Attendance Table
- Real-time table of all employee logs for the day
- Columns: Employee, Clock In, Clock Out, Location, Status
- Search/filter functionality
- Inline approve/reject buttons for pending records
- Export to CSV functionality

#### Pending Approvals Queue
- Dedicated section for late clock-ins awaiting review
- Show employee name, time, location, and reason
- Approve Exception / Reject buttons with reason input

#### Location Management
- Add/Edit/Delete work locations
- Fields: Name, Latitude, Longitude, Radius (meters)
- Lists all configured locations

#### Shift Settings
- Add/Edit/Delete shift schedules
- Fields: Start Time, End Time, Grace Period (minutes)
- Global or employee-specific shifts

## Database Schema (Recommended for Production)

For production, replace the in-memory mock DB with a proper database.

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'employee')) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  employee_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Shifts Table
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INTEGER DEFAULT 15,
  is_global BOOLEAN DEFAULT true,
  employee_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  location_id UUID REFERENCES locations(id) NOT NULL,
  clock_in TIMESTAMP NOT NULL,
  clock_out TIMESTAMP,
  status VARCHAR(20) CHECK (
    status IN ('on_time', 'late', 'absent', 'pending_approval', 'approved', 'rejected')
  ) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations

### Client-Side Geolocation
- The Haversine formula calculates distance on client AND server
- Server-side verification is the authoritative check
- In production:
  - Use server-side geolocation verification
  - Consider IP-based location as additional factor
  - Implement rate limiting on clock-in attempts
  - Add device fingerprinting to detect spoofing

### Authentication
- Current implementation uses simple token-based auth
- Production should use:
  - JWT with proper signing (RS256/ES256)
  - Refresh tokens
  - Password hashing (bcrypt/argon2)
  - HTTPS-only cookies
  - CSRF protection

## How to Run

```bash
cd attendance-app
npm run dev
```

Then open:
- **Employee view**: http://localhost:3000/employee (login first with employee credentials)
- **Admin view**: http://localhost:3000/admin (login first with admin credentials)
- **Login page**: http://localhost:3000/

## API Endpoints

### Auth
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user session

### Attendance
- `POST /api/attendance/clock-in` - Clock in (with lat, lng, optional reason)
- `POST /api/attendance/clock-out` - Clock out
- `GET /api/attendance/today` - Get all today's attendance records
- `GET /api/attendance/pending` - Get pending approvals
- `POST /api/attendance/approve` - Approve an exception
- `POST /api/attendance/reject` - Reject an exception

### Locations
- `GET /api/locations` - List all locations
- `POST /api/locations` - Add location
- `PUT /api/locations/[id]` - Update location
- `DELETE /api/locations/[id]` - Delete location

### Shifts
- `GET /api/shifts` - List all shifts
- `POST /api/shifts` - Add shift
- `PUT /api/shifts/[id]` - Update shift
- `DELETE /api/shifts/[id]` - Delete shift

### Export
- `GET /api/export/csv` - Export attendance data as CSV

## Customization Points

1. **Colors**: Edit `globals.css` to change the corporate palette
2. **Default location**: Modify the mock data in `db.ts`
3. **Shift times**: Configure in Admin panel or modify mock data
4. **Grace period**: Set in Shift Settings
5. **Radius**: Set per location in Location Management

## Next Steps for Production

1. Replace mock database with Supabase/PostgreSQL
2. Implement proper JWT authentication
3. Add password hashing (bcrypt)
4. Set up HTTPS
5. Add rate limiting
6. Implement server-side geolocation verification
7. Add audit logging
8. Set up email notifications for approvals
9. Add multi-location support (currently uses first location)
10. Add employee management (CRUD for employees)
