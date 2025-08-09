# Account Modeling Design

## Overview

This document outlines the account and household modeling system for the Kimmy App, designed to support multi-user households with different permission levels and account types.

## Core Concepts

### 1. User Accounts
- **User**: Someone with login credentials (email/password)
- **UserProfile**: Public information about a user
- Only adults/teens have user accounts
- Children under a certain age don't need accounts

### 2. Households
- **Household**: A family unit or group that shares records
- Has a unique name and invite code
- Can contain multiple members with different roles
- One admin creates the household initially

### 3. Household Members
- **HouseholdMember**: A person within a household (may or may not have a User account)
- Can be linked to a User account (adults) or standalone (children)
- Has role-based permissions

## Role-Based Access Control

### Roles

1. **ADMIN** 
   - The household creator and any other designated admins
   - Full control over household management
   - Can invite members, manage all records, create custom record types

2. **MEMBER**
   - Adults invited to join the household
   - Can create and view records
   - Can only edit their own records
   - Cannot manage other members

3. **CHILD**
   - Children added to the household (no account required)
   - Cannot log in or manage records independently
   - Records are managed by adults in the household

### Permission Matrix

| Action | Admin | Member | Child |
|--------|-------|---------|-------|
| Invite new members | ✅ | ❌ | ❌ |
| Add/remove children | ✅ | ❌ | ❌ |
| Create records | ✅ | ✅ | ❌ |
| View all records | ✅ | ✅ | ❌ |
| Edit any record | ✅ | ❌* | ❌ |
| Delete records | ✅ | ❌ | ❌ |
| Manage record types | ✅ | ❌ | ❌ |
| Manage household | ✅ | ❌ | ❌ |

*Members can only edit their own records

## Data Model Architecture

### Core Entities

```
User (1) ──── (M) HouseholdMember (M) ──── (1) Household
                      │
                      │ (1)
                      │
                      ▼ (M)
                   Record (M) ──── (1) RecordType
```

### Key Relationships

1. **User ↔ HouseholdMember**: One-to-many
   - A user can be a member of multiple households
   - A household member may or may not have a user account

2. **Household ↔ HouseholdMember**: One-to-many
   - A household contains multiple members
   - Each member belongs to one household

3. **HouseholdMember ↔ Record**: One-to-many
   - Each record belongs to one household member
   - A member can have multiple records

4. **RecordType ↔ Record**: One-to-many
   - Records are based on record type templates
   - Record types can be system-wide or household-specific

## User Flows

### 1. Creating a Household
```
1. User signs up/logs in
2. Creates household with name
3. Automatically becomes admin
4. Gets unique invite code
5. Can add children or invite adults
```

### 2. Inviting Adult Members
```
1. Admin sends invitation by email
2. Recipient gets email with join link
3. They sign up (if new) or log in
4. Accept invitation to join household
5. Become a MEMBER with limited permissions
```

### 3. Adding Children
```
1. Admin adds child directly (no invitation)
2. Provides name, birthday, relationship
3. Child becomes CHILD role (no account)
4. Admin/members can create records for child
```

### 4. Multi-Household Support
```
1. User can be member of multiple households
2. Each household maintains separate permissions
3. User switches between households in UI
4. Records are isolated per household
```

## Security Considerations

### Authentication
- Email/password authentication
- Session-based auth with household context
- Secure password hashing (bcrypt/argon2)

### Authorization
- Role-based permissions enforced server-side
- Household membership verified for all operations
- Records are household-visible by default
- Optional private records only visible to creators + admins
- Record type `allowPrivate` field controls privacy option availability

### Data Protection
- Household data isolation
- Audit trails for sensitive operations
- Secure invitation tokens with expiration

## Implementation Phases

### Phase 1: Basic Household System
- [ ] User registration/authentication
- [ ] Household creation and management
- [ ] Basic member roles (admin/member)
- [ ] Invitation system

### Phase 2: Children and Records
- [ ] Child member support
- [ ] Record creation and management
- [ ] Permission enforcement
- [ ] Basic record types

### Phase 3: Advanced Features
- [ ] Custom record types per household
- [ ] Advanced permissions (private records)
- [ ] Audit logs and activity tracking
- [ ] Bulk operations and reporting

### Phase 4: Enhanced UX
- [ ] Mobile app support
- [ ] Offline functionality
- [ ] Rich media attachments
- [ ] Advanced search and filtering

## Database Schema Considerations

### Scalability
- UUID primary keys for distributed systems
- Indexed foreign keys for performance
- Partitioning by household for large datasets

### Flexibility
- JSON fields for dynamic form data
- Soft deletes for audit trails
- Versioning for record changes

### Security
- Row-level security policies
- Encrypted sensitive fields
- Regular security audits

## API Design Patterns

### RESTful Endpoints
```
GET    /api/households/:id/members
POST   /api/households/:id/members
PUT    /api/households/:id/members/:memberId
DELETE /api/households/:id/members/:memberId

GET    /api/members/:id/records
POST   /api/members/:id/records
PUT    /api/records/:id
DELETE /api/records/:id
```

### GraphQL Alternative
- Single endpoint with flexible queries
- Real-time subscriptions for updates
- Strong typing with schema validation

This modeling approach provides a solid foundation for multi-user household management while maintaining security, flexibility, and scalability.