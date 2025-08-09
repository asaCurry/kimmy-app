/**
 * Mock data for development and testing
 * This simulates the new household model structure
 */

import type {
  User,
  UserProfile,
  Household,
  HouseholdMember,
  HouseholdMemberWithDetails,
  RecordType,
  Record,
  AuthSession,
  FormField
} from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'sarah.johnson@email.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    hashedPassword: 'hashed-password-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    lastLoginAt: new Date('2024-01-20'),
  },
  {
    id: 'user-2',
    email: 'mike.johnson@email.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    hashedPassword: 'hashed-password-2',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    lastLoginAt: new Date('2024-01-19'),
  }
];

export const mockUserProfiles: UserProfile[] = mockUsers.map(user => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
}));

// Mock Households
export const mockHouseholds: Household[] = [
  {
    id: 'household-1',
    name: 'The Johnson Family',
    inviteCode: 'JOHNSON2024',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  }
];

// Mock Household Members
export const mockHouseholdMembers: HouseholdMember[] = [
  {
    id: 'member-1',
    householdId: 'household-1',
    userId: 'user-1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    dateOfBirth: new Date('1985-03-15'),
    role: 'ADMIN',
    relationshipToAdmin: 'parent',
    hasAccount: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isActive: true,
  },
  {
    id: 'member-2',
    householdId: 'household-1',
    userId: 'user-2',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@email.com',
    dateOfBirth: new Date('1983-07-22'),
    role: 'MEMBER',
    relationshipToAdmin: 'spouse',
    hasAccount: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    isActive: true,
  },
  {
    id: 'member-3',
    householdId: 'household-1',
    userId: undefined, // Child without account
    firstName: 'Emma',
    lastName: 'Johnson',
    email: undefined,
    dateOfBirth: new Date('2015-09-10'),
    role: 'CHILD',
    relationshipToAdmin: 'child',
    hasAccount: false,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    isActive: true,
  },
  {
    id: 'member-4',
    householdId: 'household-1',
    userId: undefined, // Child without account
    firstName: 'Liam',
    lastName: 'Johnson',
    email: undefined,
    dateOfBirth: new Date('2018-12-03'),
    role: 'CHILD',
    relationshipToAdmin: 'child',
    hasAccount: false,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    isActive: true,
  }
];

// Helper function to calculate age
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Mock Household Members with Details
export const mockHouseholdMembersWithDetails: HouseholdMemberWithDetails[] = mockHouseholdMembers.map(member => {
  const household = mockHouseholds.find(h => h.id === member.householdId)!;
  const user = member.userId ? mockUserProfiles.find(u => u.id === member.userId) : undefined;
  
  return {
    ...member,
    household,
    user,
    fullName: `${member.firstName} ${member.lastName}`,
    age: member.dateOfBirth ? calculateAge(member.dateOfBirth) : undefined,
    canManageRecords: member.role !== 'CHILD',
  };
});

// Mock Auth Session (simulating logged-in user)
export const mockAuthSession: AuthSession = {
  userId: 'user-1',
  email: 'sarah.johnson@email.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  currentHouseholdId: 'household-1',
  households: [
    {
      id: 'household-1',
      name: 'The Johnson Family',
      role: 'ADMIN',
    }
  ],
};

// Mock System Record Types (available to all households)
export const mockSystemRecordTypes: RecordType[] = [
  {
    id: 'rt-health-doctor',
    name: 'Doctor Visit',
    description: 'Track medical appointments and visits',
    icon: '🏥',
    color: 'bg-blue-500/20',
    category: 'Health',
    isSystemType: true,
    householdId: undefined,
    allowPrivate: true, // Health records can be marked private
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    fields: [
      { id: 'date', type: 'date', label: 'Visit Date', required: true },
      { id: 'doctor', type: 'text', label: 'Doctor Name', required: true },
      { id: 'reason', type: 'text', label: 'Reason for Visit', required: true },
      { id: 'notes', type: 'textarea', label: 'Visit Notes', required: false },
      { id: 'followup', type: 'date', label: 'Follow-up Date', required: false }
    ]
  },
  {
    id: 'rt-health-medication',
    name: 'Medication',
    description: 'Track medication and dosages',
    icon: '💊',
    color: 'bg-emerald-500/20',
    category: 'Health',
    isSystemType: true,
    householdId: undefined,
    allowPrivate: true, // Health records can be marked private
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    fields: [
      { id: 'medication', type: 'text', label: 'Medication Name', required: true },
      { id: 'dosage', type: 'text', label: 'Dosage', required: true },
      { id: 'frequency', type: 'select', label: 'Frequency', required: true, options: ['Once daily', 'Twice daily', 'Three times daily', 'As needed'] },
      { id: 'startdate', type: 'date', label: 'Start Date', required: true },
      { id: 'enddate', type: 'date', label: 'End Date', required: false }
    ]
  },
  {
    id: 'rt-activities-school',
    name: 'School Event',
    description: 'Track school activities and events',
    icon: '🎓',
    color: 'bg-orange-500/20',
    category: 'Activities',
    isSystemType: true,
    householdId: undefined,
    allowPrivate: false, // School events are typically shared
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    fields: [
      { id: 'event', type: 'text', label: 'Event Name', required: true },
      { id: 'date', type: 'date', label: 'Event Date', required: true },
      { id: 'time', type: 'text', label: 'Event Time', required: true },
      { id: 'location', type: 'text', label: 'Location', required: true },
      { id: 'notes', type: 'textarea', label: 'Additional Notes', required: false }
    ]
  },
  {
    id: 'rt-personal-achievement',
    name: 'Achievement',
    description: 'Record personal achievements and milestones',
    icon: '🏆',
    color: 'bg-purple-500/20',
    category: 'Personal',
    isSystemType: true,
    householdId: undefined,
    allowPrivate: true, // Personal achievements can be private
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    isActive: true,
    fields: [
      { id: 'achievement', type: 'text', label: 'Achievement', required: true },
      { id: 'date', type: 'date', label: 'Date Achieved', required: true },
      { id: 'description', type: 'textarea', label: 'Description', required: false },
      { id: 'photo', type: 'file', label: 'Photo', required: false }
    ]
  }
];

// Mock Custom Record Types (specific to a household)
export const mockCustomRecordTypes: RecordType[] = [
  {
    id: 'rt-custom-allowance',
    name: 'Allowance Tracker',
    description: 'Track weekly allowance for children',
    icon: '💰',
    color: 'bg-green-500/20',
    category: 'Family',
    isSystemType: false,
    householdId: 'household-1',
    allowPrivate: false, // Family allowance is typically shared
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    isActive: true,
    fields: [
      { id: 'week', type: 'date', label: 'Week Starting', required: true },
      { id: 'amount', type: 'number', label: 'Amount ($)', required: true },
      { id: 'earned', type: 'checkbox', label: 'Fully Earned', required: false },
      { id: 'chores', type: 'textarea', label: 'Chores Completed', required: false }
    ]
  }
];

// All record types (system + custom)
export const mockAllRecordTypes = [...mockSystemRecordTypes, ...mockCustomRecordTypes];

// Group record types by category for easy display
export const mockRecordTypesByCategory = mockAllRecordTypes.reduce((acc, recordType) => {
  if (!acc[recordType.category]) {
    acc[recordType.category] = [];
  }
  acc[recordType.category].push(recordType);
  return acc;
}, {} as Record<string, RecordType[]>);

// Mock Records
export const mockRecords: Record[] = [
  {
    id: 'record-1',
    householdMemberId: 'member-3', // Emma
    recordTypeId: 'rt-health-doctor',
    title: 'Annual Checkup',
    data: {
      date: '2024-01-15',
      doctor: 'Dr. Smith',
      reason: 'Annual wellness checkup',
      notes: 'Height: 4\'2", Weight: 65lbs. All vitals normal.',
      followup: '2025-01-15'
    },
    createdByUserId: 'user-1', // Created by Sarah (admin)
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isPrivate: false, // Public health record - visible to household
    tags: ['annual', 'wellness']
  },
  {
    id: 'record-2',
    householdMemberId: 'member-4', // Liam
    recordTypeId: 'rt-activities-school',
    title: 'Science Fair',
    data: {
      event: 'Elementary Science Fair',
      date: '2024-02-10',
      time: '10:00 AM',
      location: 'Elementary School Gymnasium',
      notes: 'Liam presenting volcano project'
    },
    createdByUserId: 'user-1',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    isPrivate: false, // School events are public
    tags: ['school', 'science']
  },
  {
    id: 'record-3',
    householdMemberId: 'member-2', // Mike
    recordTypeId: 'rt-health-doctor',
    title: 'Private Consultation',
    data: {
      date: '2024-01-22',
      doctor: 'Dr. Johnson',
      reason: 'Personal health consultation',
      notes: 'Private medical discussion',
      followup: ''
    },
    createdByUserId: 'user-2', // Created by Mike
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
    isPrivate: true, // Private record - only visible to Mike and admins
    tags: ['private', 'consultation']
  },
  {
    id: 'record-4',
    householdMemberId: 'member-1', // Sarah
    recordTypeId: 'rt-personal-achievement',
    title: 'Promotion Achievement',
    data: {
      achievement: 'Got promoted to Senior Manager',
      date: '2024-01-25',
      description: 'Finally got the promotion I\'ve been working towards!',
      photo: ''
    },
    createdByUserId: 'user-1', // Created by Sarah
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    isPrivate: false, // Shared achievement - visible to household
    tags: ['work', 'promotion', 'achievement']
  }
];

// Utility functions for mock data

/**
 * Get household member by ID
 */
export function getMockHouseholdMember(memberId: string): HouseholdMemberWithDetails | undefined {
  return mockHouseholdMembersWithDetails.find(m => m.id === memberId);
}

/**
 * Get household members for a specific household
 */
export function getMockHouseholdMembers(householdId: string): HouseholdMemberWithDetails[] {
  return mockHouseholdMembersWithDetails.filter(m => m.householdId === householdId && m.isActive);
}

/**
 * Get record types available to a household (system + custom)
 */
export function getMockRecordTypesForHousehold(householdId: string): RecordType[] {
  return mockAllRecordTypes.filter(rt => 
    rt.isSystemType || rt.householdId === householdId
  );
}

/**
 * Get records for a specific household member
 */
export function getMockRecordsForMember(memberId: string): Record[] {
  return mockRecords.filter(r => r.householdMemberId === memberId);
}

/**
 * Check if a member ID represents a child
 */
export function isMockMemberChild(memberId: string): boolean {
  const member = getMockHouseholdMember(memberId);
  return member?.role === 'CHILD';
}

/**
 * Get records visible to a specific user (considering privacy settings)
 */
export function getMockVisibleRecords(
  viewerUserId: string, 
  viewerRole: 'ADMIN' | 'MEMBER' | 'CHILD'
): Record[] {
  return mockRecords.filter(record => {
    // If record is not private, everyone in household can see it
    if (!record.isPrivate) {
      return true;
    }
    
    // For private records, only creator and admins can see
    return viewerRole === 'ADMIN' || record.createdByUserId === viewerUserId;
  });
}

// For backward compatibility with existing components
export const mockFamilyMembers = mockHouseholdMembersWithDetails.map(member => ({
  id: member.id,
  name: member.fullName,
  email: member.email || '',
  role: member.role === 'ADMIN' ? 'admin' as const : 'member' as const
}));

export const mockRecordTypes = mockRecordTypesByCategory;