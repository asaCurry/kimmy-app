import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Legacy types - these should be replaced with the actual database types
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