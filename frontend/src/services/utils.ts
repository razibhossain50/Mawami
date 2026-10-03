import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Whole years since `dob` (YYYY-MM-DD), or null if missing, invalid, in the future or over 120
export function ageFromDob(dob: unknown): number | null {
  if (typeof dob !== "string" || dob.trim() === "") return null
  const birth = new Date(dob)
  const today = new Date()
  if (isNaN(birth.getTime()) || birth > today) return null

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 && age <= 120 ? age : null
}
