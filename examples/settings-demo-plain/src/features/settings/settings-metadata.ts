import type { AppAccent, AppDensity, AppLanguage, AppTheme, RecorderStyle } from './settings-store.ts'

export const themeOptions: { value: AppTheme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', description: 'Always use dark mode' },
  { value: 'system', label: 'System', description: 'Follow your device preference' },
]

export const densityOptions: { value: AppDensity; label: string; description: string }[] = [
  { value: 'comfortable', label: 'Comfortable', description: 'More spacing between items' },
  { value: 'compact', label: 'Compact', description: 'Fit more on screen' },
]

export const accentOptions: { id: string; value: AppAccent; label: string }[] = [
  { id: 'charcoal', value: '#111827', label: 'Charcoal' },
  { id: 'blue', value: '#3b82f6', label: 'Blue' },
  { id: 'green', value: '#10b981', label: 'Green' },
  { id: 'amber', value: '#f59e0b', label: 'Amber' },
  { id: 'red', value: '#ef4444', label: 'Red' },
  { id: 'purple', value: '#8b5cf6', label: 'Purple' },
]

export const defaultLanguageOptions: { id: string; value: AppLanguage; label: string }[] = [
  { id: 'english', value: 'en', label: 'English' },
  { id: 'german', value: 'de', label: 'German' },
  { id: 'spanish', value: 'es', label: 'Spanish' },
]

export const transcriptionLanguageOptions = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
] as const

export const summaryLengthOptions = [
  { value: 'short', label: 'Short paragraph' },
  { value: 'bullet', label: 'Bullet points' },
  { value: 'detailed', label: 'Detailed recap' },
] as const

export const retentionOptions = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'forever', label: 'Forever' },
] as const

export const digestFrequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'never', label: 'Never' },
] as const

export const timezoneOptions = [
  { value: 'Europe/Berlin', label: 'Europe/Berlin' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
] as const

export const weekStartOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' },
] as const

export const webhookEventOptions = [
  { value: 'all', label: 'All events' },
  { value: 'record', label: 'Record changes' },
  { value: 'user', label: 'User events' },
] as const

export const passwordPolicyOptions = [
  { value: 'basic', label: 'Basic' },
  { value: 'strong', label: 'Strong' },
  { value: 'custom', label: 'Custom' },
] as const

export const recordVisibilityOptions = [
  { value: 'private', label: 'Private' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'public', label: 'Public' },
] as const

export const sourceCrmOptions = [
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'pipedrive', label: 'Pipedrive' },
  { value: 'csv', label: 'CSV upload' },
] as const

export const recorderStyleOptions: { value: RecorderStyle; title: string; description: string }[] = [
  { value: 'default', title: 'Default', description: 'Branded recorder' },
  { value: 'workspace', title: 'Workspace', description: 'Workspace branded recorder' },
  { value: 'minimal', title: 'Minimal', description: 'No logo' },
  { value: 'none', title: 'None', description: 'No image' },
]
