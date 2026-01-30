# Multi-Center Support Plan for I Can Swim

## Current Business Context
I Can Swim currently operates two locations:
1. **Modesto**: 1212 Kansas Ave, Modesto, CA 95351
2. **Merced**: 750 Motel Dr, Merced, CA 95340

## Phase 1: Database Schema Updates

### 1.1 Add Location Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., "Modesto", "Merced"
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial locations
INSERT INTO locations (name, address, city, state, zip_code) VALUES
  ('Modesto', '1212 Kansas Ave', 'Modesto', 'CA', '95351'),
  ('Merced', '750 Motel Dr', 'Merced', 'CA', '95340');
```

### 1.2 Update Sessions Table
```sql
-- Add location_id to sessions table
ALTER TABLE sessions ADD COLUMN location_id UUID REFERENCES locations(id);

-- Update existing sessions (assign to Modesto as default)
UPDATE sessions SET location_id = (SELECT id FROM locations WHERE name = 'Modesto' LIMIT 1);
```

### 1.3 Update Swimmers Table
```sql
-- Add preferred_location_id to swimmers table
ALTER TABLE swimmers ADD COLUMN preferred_location_id UUID REFERENCES locations(id);

-- Add home_location_id to swimmers table (for VMRC regional assignments)
ALTER TABLE swimmers ADD COLUMN home_location_id UUID REFERENCES locations(id);
```

### 1.4 Update Instructors Table
```sql
-- Add location assignments to profiles (instructors can work at multiple locations)
CREATE TABLE instructor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES profiles(id),
  location_id UUID REFERENCES locations(id),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, location_id)
);
```

## Phase 2: Backend API Updates

### 2.1 Location Management API
- `GET /api/locations` - List all active locations
- `GET /api/locations/:id` - Get specific location details
- `POST /api/locations` - Create new location (admin only)
- `PUT /api/locations/:id` - Update location (admin only)
- `DELETE /api/locations/:id` - Deactivate location (admin only)

### 2.2 Session Filtering by Location
- Update `/api/sessions/available` endpoint to accept `location_id` parameter
- Update `/api/admin/sessions/generate` to include location_id in session creation
- Update booking APIs to validate location availability

### 2.3 Swimmer Location Preferences
- Update swimmer creation/update APIs to include `preferred_location_id`
- Add location-based filtering to swimmer search APIs

## Phase 3: Frontend Updates

### 3.1 Location Selection in Booking Flow
```typescript
// Update BookingWizard to include location selection step
interface LocationSelectStepProps {
  availableLocations: Location[];
  selectedLocation: Location | null;
  onSelect: (location: Location) => void;
}
```

### 3.2 Admin Dashboard Updates
- Add location filter to session management
- Add location assignment to session generator
- Add location-based analytics and reporting

### 3.3 Parent Dashboard Updates
- Show location in upcoming sessions
- Allow location preference setting in swimmer profiles
- Filter available sessions by preferred location

### 3.4 Instructor Dashboard Updates
- Show location-specific schedules
- Filter by assigned locations
- Location-based attendance tracking

## Phase 4: Business Logic Updates

### 4.1 Session Opening Logic
- Update to respect location-specific opening times
- Location-based capacity limits
- Cross-location booking restrictions (if needed)

### 4.2 VMRC Coordinator Assignments
- Assign VMRC coordinators to specific locations/regions
- Location-based referral processing
- Regional PO management

### 4.3 Pricing & Billing
- Location-specific pricing (if different)
- Location-based revenue tracking
- Consolidated billing across locations

## Phase 5: User Experience Enhancements

### 5.1 Location-aware UI
- Show location badge on session cards
- Location filter in session browsing
- Clear location indicators throughout the app

### 5.2 Location Switching
- Allow users to switch between locations
- Remember location preferences
- Cross-location session visibility (with clear indicators)

### 5.3 Mobile Responsiveness
- Optimize location selection for mobile
- Location-aware notifications
- Mobile check-in by location

## Phase 6: Testing & Deployment

### 6.1 Test Scenarios
1. **Basic Location Functionality**
   - Create sessions at different locations
   - Book sessions at specific locations
   - Filter sessions by location

2. **Cross-location Edge Cases**
   - Swimmer trying to book at non-preferred location
   - Instructor assigned to multiple locations
   - Session conflicts across locations

3. **Admin Operations**
   - Location management
   - Location-based reporting
   - Bulk operations across locations

### 6.2 Migration Strategy
1. **Week 1**: Deploy database changes (off-hours)
2. **Week 2**: Update backend APIs
3. **Week 3**: Update frontend components
4. **Week 4**: User testing and feedback
5. **Week 5**: Full deployment

### 6.3 Rollback Plan
- Database migration rollback scripts
- API versioning for backward compatibility
- Feature flags for gradual rollout

## Technical Implementation Details

### Database Indexes
```sql
CREATE INDEX idx_sessions_location ON sessions(location_id);
CREATE INDEX idx_sessions_location_time ON sessions(location_id, start_time);
CREATE INDEX idx_swimmers_preferred_location ON swimmers(preferred_location_id);
CREATE INDEX idx_instructor_locations ON instructor_locations(instructor_id, location_id);
```

### TypeScript Types
```typescript
interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface SessionWithLocation extends Session {
  location: Location;
}

interface SwimmerWithLocation extends Swimmer {
  preferred_location?: Location;
  home_location?: Location;
}
```

### API Response Updates
```typescript
// Updated session response
{
  "id": "session-uuid",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T10:30:00Z",
  "location": {
    "id": "location-uuid",
    "name": "Modesto",
    "address": "1212 Kansas Ave"
  },
  // ... other session fields
}
```

## Business Rules by Location

### 1. Capacity Management
- Each location has independent capacity limits
- Location-specific waitlists
- Cross-location overflow handling

### 2. Instructor Scheduling
- Instructors can be assigned to multiple locations
- Travel time consideration between locations
- Location-specific availability

### 3. Client Management
- Swimmers can have preferred location
- VMRC regional assignments
- Location transfer requests

### 4. Financial Tracking
- Location-specific revenue reporting
- Consolidated financial statements
- Location-based expense tracking

## Success Metrics

### Technical Metrics
- API response times with location filtering
- Database query performance
- Mobile app performance

### Business Metrics
- Location utilization rates
- Cross-location booking rates
- Client satisfaction by location
- Revenue per location

### User Metrics
- Location selection completion rate
- Session booking success rate
- User feedback on location features

## Future Expansion Considerations

### 1. Additional Locations
- Scalable location management
- Regional configuration templates
- Bulk location setup tools

### 2. Advanced Features
- Location-based promotions
- Cross-location session transfers
- Location-specific communication templates

### 3. Integration Points
- Google Maps integration for directions
- Location-based weather alerts
- Local event coordination

## Risk Mitigation

### Technical Risks
- **Database performance**: Implement proper indexing and query optimization
- **API complexity**: Use clear separation of concerns and documentation
- **Mobile app updates**: Ensure backward compatibility during rollout

### Business Risks
- **User confusion**: Clear UI indicators and user education
- **Operational complexity**: Staff training and documentation
- **Financial tracking**: Robust reporting and audit trails

### Timeline Risks
- **Scope creep**: Stick to phased implementation
- **Testing delays**: Allocate buffer time for QA
- **User adoption**: Provide training and support materials

## Conclusion

This multi-center support plan provides a comprehensive roadmap for expanding I Can Swim's platform to support multiple locations while maintaining the high-quality user experience and operational efficiency that the business requires. The phased approach ensures minimal disruption to current operations while building a scalable foundation for future growth.