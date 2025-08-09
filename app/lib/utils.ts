import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Family/household member utilities
export interface FamilyMember {
  id: number
  name: string
  email: string
  role: 'admin' | 'member'
}

// Record type utilities
export interface RecordType {
  id: number
  name: string
  description?: string
  icon?: string
  color?: string
  fields: FormField[]
}

export interface FormField {
  id: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'file'
  label: string
  required: boolean
  placeholder?: string
  options?: string[] // For select fields
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

// Mock data for development (will be replaced with API calls)
export const mockFamilyMembers: FamilyMember[] = [
  { id: 1, name: "Me", email: "me@family.com", role: "admin" },
  { id: 2, name: "Sarah", email: "sarah@family.com", role: "member" },
  { id: 3, name: "John", email: "john@family.com", role: "member" },
  { id: 4, name: "Emma", email: "emma@family.com", role: "member" }
]

export const mockRecordTypes: Record<string, RecordType[]> = {
  "Health": [
    {
      id: 1,
      name: "Doctor Visit",
      description: "Track medical appointments and visits",
      icon: "🏥",
      color: "bg-blue-500/20",
      fields: [
        { id: "date", type: "date", label: "Visit Date", required: true },
        { id: "doctor", type: "text", label: "Doctor Name", required: true },
        { id: "reason", type: "text", label: "Reason for Visit", required: true },
        { id: "notes", type: "textarea", label: "Visit Notes", required: false },
        { id: "followup", type: "date", label: "Follow-up Date", required: false }
      ]
    },
    {
      id: 2,
      name: "Medication",
      description: "Track medication and dosages",
      icon: "💊",
      color: "bg-emerald-500/20",
      fields: [
        { id: "medication", type: "text", label: "Medication Name", required: true },
        { id: "dosage", type: "text", label: "Dosage", required: true },
        { id: "frequency", type: "select", label: "Frequency", required: true, options: ["Once daily", "Twice daily", "Three times daily", "As needed"] },
        { id: "startdate", type: "date", label: "Start Date", required: true },
        { id: "enddate", type: "date", label: "End Date", required: false }
      ]
    }
  ],
  "Activities": [
    {
      id: 3,
      name: "School Event",
      description: "Track school activities and events",
      icon: "🎓",
      color: "bg-orange-500/20",
      fields: [
        { id: "event", type: "text", label: "Event Name", required: true },
        { id: "date", type: "date", label: "Event Date", required: true },
        { id: "time", type: "text", label: "Event Time", required: true },
        { id: "location", type: "text", label: "Location", required: true },
        { id: "notes", type: "textarea", label: "Additional Notes", required: false }
      ]
    }
  ],
  "Personal": [
    {
      id: 4,
      name: "Achievement",
      description: "Record personal achievements and milestones",
      icon: "🏆",
      color: "bg-purple-500/20",
      fields: [
        { id: "achievement", type: "text", label: "Achievement", required: true },
        { id: "date", type: "date", label: "Date Achieved", required: true },
        { id: "description", type: "textarea", label: "Description", required: false },
        { id: "photo", type: "file", label: "Photo", required: false }
      ]
    }
  ]
}