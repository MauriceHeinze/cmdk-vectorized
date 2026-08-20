import type { SVGProps } from 'react'

function createIcon(paths: React.ReactNode) {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {paths}
      </svg>
    )
  }
}

export const UserIcon = createIcon(
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
)

export const AppearanceIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </>
)

export const EmailCalendarIcon = createIcon(
  <>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 8 10 6 10-6" />
    <path d="M6 1v3M18 1v3" />
  </>
)

export const CallIntelligenceIcon = createIcon(
  <>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    <path d="M15 3v4M13 5h4" />
  </>
)

export const StorageIcon = createIcon(
  <>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </>
)

export const ReferIcon = createIcon(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </>
)

export const NotificationsIcon = createIcon(
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>
)

export const SessionsIcon = createIcon(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </>
)

export const GeneralIcon = createIcon(
  <>
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
)

export const CallRecorderIcon = createIcon(
  <>
    <rect x="5" y="7" width="14" height="10" rx="2" />
    <circle cx="12" cy="12" r="2" />
  </>
)

export const MembersIcon = createIcon(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </>
)

export const PlansIcon = createIcon(
  <>
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </>
)

export const BillingIcon = createIcon(
  <>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </>
)

export const DevelopersIcon = createIcon(
  <>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </>
)

export const SecurityIcon = createIcon(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </>
)

export const RecordsIcon = createIcon(
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13h8M8 17h5" />
  </>
)

export const SupportIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </>
)

export const MigrateIcon = createIcon(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <path d="M12 15V3" />
  </>
)

export const ObjectsIcon = createIcon(
  <>
    <path d="m21 16-9 5-9-5V8l9-5 9 5v8z" />
    <path d="m3 8 9 5 9-5" />
    <path d="M12 13V3" />
  </>
)

export const HelpIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </>
)

export const SearchIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </>
)

export const ChevronLeftIcon = createIcon(
  <path d="m15 18-6-6 6-6" />
)

export const ChevronDownIcon = createIcon(
  <path d="m6 9 6 6 6-6" />
)

export const MicrophoneIcon = createIcon(
  <>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v4M8 23h8" />
  </>
)

export function MicOrbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 5.5c1.2 1.4 3.1 3.8 3.1 6.5s-1.9 5.1-3.1 6.5c-1.2-1.4-3.1-3.8-3.1-6.5s1.9-5.1 3.1-6.5z" />
    </svg>
  )
}

export const CloseIcon = createIcon(
  <>
    <path d="M18 6 6 18M6 6l12 12" />
  </>
)

export const iconMap: Record<string, React.FC<SVGProps<SVGSVGElement>>> = {
  user: UserIcon,
  appearance: AppearanceIcon,
  emailCalendar: EmailCalendarIcon,
  callIntelligence: CallIntelligenceIcon,
  storage: StorageIcon,
  refer: ReferIcon,
  notifications: NotificationsIcon,
  sessions: SessionsIcon,
  general: GeneralIcon,
  callRecorder: CallRecorderIcon,
  members: MembersIcon,
  plans: PlansIcon,
  billing: BillingIcon,
  developers: DevelopersIcon,
  security: SecurityIcon,
  records: RecordsIcon,
  support: SupportIcon,
  migrate: MigrateIcon,
  objects: ObjectsIcon,
  help: HelpIcon,
  search: SearchIcon,
  chevronLeft: ChevronLeftIcon,
  chevronDown: ChevronDownIcon,
  microphone: MicrophoneIcon,
  close: CloseIcon,
}
