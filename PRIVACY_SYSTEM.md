# Privacy System Implementation

## Overview

The Hey, Kimmy privacy system provides flexible record visibility while maintaining household collaboration as the default behavior.

## Privacy Model

### Default Behavior

- **Records are visible to all household members by default**
- This promotes family transparency and collaboration
- All adults (ADMIN/MEMBER roles) can see records for all household members
- Children don't have accounts, so this doesn't affect them

### Private Records Option

- Users can optionally mark specific records as **private**
- Private records are only visible to:
  - The record creator
  - Household administrators
- This allows for sensitive information to be kept confidential

## Record Type Privacy Control

### `allowPrivate` Field

- Each `RecordType` has an `allowPrivate` boolean field
- When `true`: Users see a privacy checkbox when creating records
- When `false`: All records of this type are household-visible (no privacy option)

### Example Configuration

```typescript
// Health records can be private (sensitive medical info)
{
  name: "Doctor Visit",
  allowPrivate: true,
  // ... other fields
}

// School events are always shared (family coordination)
{
  name: "School Event",
  allowPrivate: false,
  // ... other fields
}
```

## User Interface

### Record Creation Form

- When `recordType.allowPrivate === true`:
  - Privacy checkbox appears at bottom of form
  - Unchecked by default (household-visible)
  - Clear explanation of privacy implications

### Privacy Checkbox Text

```
☐ Make this record private (only visible to you and administrators)
By default, records are visible to all household members
```

## Permission Logic

### Viewing Records

```typescript
function canViewRecord(record, viewer) {
  // Children can't view any records
  if (viewer.role === "CHILD") return false;

  // Non-private records: all household members can view
  if (!record.isPrivate) return true;

  // Private records: only creator and admins
  return viewer.role === "ADMIN" || record.createdByUserId === viewer.id;
}
```

### Editing Records

- Admins can edit any record (private or public)
- Members can edit:
  - Their own records (private or public)
  - Records for children (since children can't manage their own)
- Private records don't change edit permissions (same as public)

## Database Schema

### Records Table

```sql
records {
  id: UUID PRIMARY KEY
  household_member_id: UUID (who the record is about)
  created_by_user_id: UUID (who created it)
  is_private: BOOLEAN DEFAULT FALSE
  -- other fields...
}
```

### Record Types Table

```sql
record_types {
  id: UUID PRIMARY KEY
  allow_private: BOOLEAN DEFAULT TRUE
  -- other fields...
}
```

## Use Cases

### Family Health Management

- **Public Health Records**: Vaccination schedules, regular checkups
- **Private Health Records**: Personal medical consultations, sensitive diagnoses

### School & Activities

- **Public Events**: School performances, sports games (family coordination)
- **Private Notes**: Parent concerns, disciplinary discussions

### Personal Achievements

- **Public Achievements**: Graduations, sports wins (family celebration)
- **Private Goals**: Personal milestones, private aspirations

## Implementation Examples

### Mock Data Examples

```typescript
// Public record (default)
{
  title: "Emma's Annual Checkup",
  isPrivate: false, // Visible to whole household
  createdByUserId: "sarah-id"
}

// Private record
{
  title: "Mike's Private Consultation",
  isPrivate: true, // Only visible to Mike and admins
  createdByUserId: "mike-id"
}
```

### API Filtering

```typescript
// Get records visible to current user
function getVisibleRecords(userId, userRole) {
  return records.filter(
    record =>
      !record.isPrivate ||
      userRole === "ADMIN" ||
      record.createdByUserId === userId
  );
}
```

## Future Enhancements

### Record Type Categories

- System-wide privacy policies per category
- e.g., "Health" category defaults to `allowPrivate: true`

### Granular Sharing

- Share private records with specific household members
- Time-limited privacy (auto-expire private status)

### Audit Trail

- Track when records are marked private/public
- Log who accessed private records

This privacy system balances family transparency with personal privacy, giving users control while maintaining the collaborative household focus.
