import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'

export type AppTheme = 'light' | 'dark' | 'system'
export type AppDensity = 'comfortable' | 'compact'
export type AppAccent = '#111827' | '#3b82f6' | '#10b981' | '#f59e0b' | '#ef4444' | '#8b5cf6'
export type AppLanguage = 'en' | 'de' | 'es'
export type AppTranscriptionLanguage = 'en' | 'de' | 'es' | 'fr'
export type RecorderStyle = 'default' | 'workspace' | 'minimal' | 'none'
export type AppSummaryLength = 'short' | 'bullet' | 'detailed'
export type AppRetention = '30' | '90' | '365' | 'forever'
export type AppDigestFrequency = 'daily' | 'weekly' | 'never'
export type AppTimezone = 'Europe/Berlin' | 'America/New_York' | 'Asia/Tokyo'
export type AppWeekStart = 'monday' | 'sunday'
export type AppPasswordPolicy = 'basic' | 'strong' | 'custom'
export type AppRecordVisibility = 'private' | 'workspace' | 'public'
export type AppWebhookEvents = 'all' | 'record' | 'user'
export type AppSourceCrm = 'salesforce' | 'hubspot' | 'pipedrive' | 'csv'

type SettingsState = {
  theme: AppTheme
  density: AppDensity
  accent: AppAccent
  displayName: string
  emailAddress: string
  bio: string
  workspaceName: string
  emailNotifications: boolean
  pushNotifications: boolean
  defaultLanguage: AppLanguage
  isPublicProfile: boolean
  transcription: boolean
  transcriptionLanguage: AppTranscriptionLanguage
  coaching: boolean
  slackNotifications: boolean
  digest: boolean
  quietHours: boolean
  quietHoursFrom: string
  quietHoursTo: string
  webhooks: boolean
  webhookUrl: string
  sso: boolean
  mfa: boolean
  audit: boolean
  recorderName: string
  recorderStyle: RecorderStyle
  summaryLength: AppSummaryLength
  transcriptRetention: AppRetention
  digestFrequency: AppDigestFrequency
  timezone: AppTimezone
  weekStart: AppWeekStart
  passwordPolicy: AppPasswordPolicy
  recordVisibility: AppRecordVisibility
  recordHistoryRetention: AppRetention
  webhookEvents: AppWebhookEvents
  billingEmail: string
  billingAddress: string
  referralEmail: string
  supportSubject: string
  supportMessage: string
  sourceCrm: AppSourceCrm
  connectionOrFile: string
}

const initialState: SettingsState = {
  theme: 'system',
  density: 'comfortable',
  accent: '#111827',
  displayName: 'Jane Doe',
  emailAddress: 'jane@example.com',
  bio: 'Product manager based in Berlin.',
  workspaceName: 'Acme Corp',
  emailNotifications: true,
  pushNotifications: false,
  defaultLanguage: 'en',
  isPublicProfile: true,
  transcription: true,
  transcriptionLanguage: 'en',
  coaching: false,
  slackNotifications: true,
  digest: true,
  quietHours: false,
  quietHoursFrom: '20:00',
  quietHoursTo: '08:00',
  webhooks: true,
  webhookUrl: 'https://api.example.com/webhooks',
  sso: false,
  mfa: false,
  audit: true,
  recorderName: 'Notetaker',
  recorderStyle: 'default',
  summaryLength: 'bullet',
  transcriptRetention: '90',
  digestFrequency: 'daily',
  timezone: 'Europe/Berlin',
  weekStart: 'monday',
  passwordPolicy: 'strong',
  recordVisibility: 'workspace',
  recordHistoryRetention: 'forever',
  webhookEvents: 'all',
  billingEmail: 'billing@example.com',
  billingAddress: '123 Main St\nBerlin, Germany',
  referralEmail: '',
  supportSubject: '',
  supportMessage: '',
  sourceCrm: 'salesforce',
  connectionOrFile: '',
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<AppTheme>) {
      state.theme = action.payload
    },
    setDensity(state, action: PayloadAction<AppDensity>) {
      state.density = action.payload
    },
    setAccent(state, action: PayloadAction<AppAccent>) {
      state.accent = action.payload
    },
    setDisplayName(state, action: PayloadAction<string>) {
      state.displayName = action.payload
    },
    setEmailAddress(state, action: PayloadAction<string>) {
      state.emailAddress = action.payload
    },
    setBio(state, action: PayloadAction<string>) {
      state.bio = action.payload
    },
    setWorkspaceName(state, action: PayloadAction<string>) {
      state.workspaceName = action.payload
    },
    setEmailNotifications(state, action: PayloadAction<boolean>) {
      state.emailNotifications = action.payload
    },
    setPushNotifications(state, action: PayloadAction<boolean>) {
      state.pushNotifications = action.payload
    },
    setDefaultLanguage(state, action: PayloadAction<AppLanguage>) {
      state.defaultLanguage = action.payload
    },
    setIsPublicProfile(state, action: PayloadAction<boolean>) {
      state.isPublicProfile = action.payload
    },
    setTranscription(state, action: PayloadAction<boolean>) {
      state.transcription = action.payload
    },
    setTranscriptionLanguage(state, action: PayloadAction<AppTranscriptionLanguage>) {
      state.transcriptionLanguage = action.payload
    },
    setCoaching(state, action: PayloadAction<boolean>) {
      state.coaching = action.payload
    },
    setSlackNotifications(state, action: PayloadAction<boolean>) {
      state.slackNotifications = action.payload
    },
    setDigest(state, action: PayloadAction<boolean>) {
      state.digest = action.payload
    },
    setQuietHours(state, action: PayloadAction<boolean>) {
      state.quietHours = action.payload
    },
    setQuietHoursFrom(state, action: PayloadAction<string>) {
      state.quietHoursFrom = action.payload
    },
    setQuietHoursTo(state, action: PayloadAction<string>) {
      state.quietHoursTo = action.payload
    },
    setWebhooks(state, action: PayloadAction<boolean>) {
      state.webhooks = action.payload
    },
    setWebhookUrl(state, action: PayloadAction<string>) {
      state.webhookUrl = action.payload
    },
    setSso(state, action: PayloadAction<boolean>) {
      state.sso = action.payload
    },
    setMfa(state, action: PayloadAction<boolean>) {
      state.mfa = action.payload
    },
    setAudit(state, action: PayloadAction<boolean>) {
      state.audit = action.payload
    },
    setRecorderName(state, action: PayloadAction<string>) {
      state.recorderName = action.payload
    },
    setRecorderStyle(state, action: PayloadAction<RecorderStyle>) {
      state.recorderStyle = action.payload
    },
    setSummaryLength(state, action: PayloadAction<AppSummaryLength>) {
      state.summaryLength = action.payload
    },
    setTranscriptRetention(state, action: PayloadAction<AppRetention>) {
      state.transcriptRetention = action.payload
    },
    setDigestFrequency(state, action: PayloadAction<AppDigestFrequency>) {
      state.digestFrequency = action.payload
    },
    setTimezone(state, action: PayloadAction<AppTimezone>) {
      state.timezone = action.payload
    },
    setWeekStart(state, action: PayloadAction<AppWeekStart>) {
      state.weekStart = action.payload
    },
    setPasswordPolicy(state, action: PayloadAction<AppPasswordPolicy>) {
      state.passwordPolicy = action.payload
    },
    setRecordVisibility(state, action: PayloadAction<AppRecordVisibility>) {
      state.recordVisibility = action.payload
    },
    setRecordHistoryRetention(state, action: PayloadAction<AppRetention>) {
      state.recordHistoryRetention = action.payload
    },
    setWebhookEvents(state, action: PayloadAction<AppWebhookEvents>) {
      state.webhookEvents = action.payload
    },
    setBillingEmail(state, action: PayloadAction<string>) {
      state.billingEmail = action.payload
    },
    setBillingAddress(state, action: PayloadAction<string>) {
      state.billingAddress = action.payload
    },
    setReferralEmail(state, action: PayloadAction<string>) {
      state.referralEmail = action.payload
    },
    setSupportSubject(state, action: PayloadAction<string>) {
      state.supportSubject = action.payload
    },
    setSupportMessage(state, action: PayloadAction<string>) {
      state.supportMessage = action.payload
    },
    setSourceCrm(state, action: PayloadAction<AppSourceCrm>) {
      state.sourceCrm = action.payload
    },
    setConnectionOrFile(state, action: PayloadAction<string>) {
      state.connectionOrFile = action.payload
    },
  },
})

export const settingsActions = settingsSlice.actions

export const store = configureStore({
  reducer: {
    settings: settingsSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
