import type { FC } from 'react'
import {
  AvatarUpload,
  Badge,
  Button,
  ButtonGroup,
  Card,
  ColorSwatches,
  DataTable,
  Field,
  Input,
  ProgressBar,
  RadioGroup,
  SectionHeader,
  Select,
  TextArea,
  Toggle,
} from '../../../shared/ui/FormComponents.tsx'
import {
  accentOptions,
  densityOptions,
  digestFrequencyOptions,
  retentionOptions,
  summaryLengthOptions,
  themeOptions,
  transcriptionLanguageOptions,
} from '../settings-metadata.ts'
import {
  settingsActions,
  useAppDispatch,
  useAppSelector,
  type AppAccent,
  type AppDensity,
  type AppDigestFrequency,
  type AppRetention,
  type AppSummaryLength,
  type AppTheme,
  type AppTranscriptionLanguage,
} from '../settings-store.ts'
import type { SettingsFormProps } from './form-types.ts'

function ProfileForm() {
  const dispatch = useAppDispatch()
  const { displayName, emailAddress, bio, isPublicProfile } = useAppSelector((state) => state.settings)
  return (
    <>
      <Card>
        <SectionHeader title="Profile information" description="Manage how you appear across the workspace." />
        <AvatarUpload initials="JD" />
        <Field label="Display name">
          <Input value={displayName} onChange={(e) => dispatch(settingsActions.setDisplayName(e.target.value))} />
        </Field>
        <Field label="Email address">
          <Input
            type="email"
            value={emailAddress}
            onChange={(e) => dispatch(settingsActions.setEmailAddress(e.target.value))}
          />
        </Field>
        <Field label="Bio" hint="A short bio visible on your profile.">
          <TextArea value={bio} onChange={(e) => dispatch(settingsActions.setBio(e.target.value))} />
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Visibility" description="Control who can see your profile." />
        <Toggle
          checked={isPublicProfile}
          onChange={(value) => dispatch(settingsActions.setIsPublicProfile(value))}
          label="Make profile visible to everyone"
        />
        <ButtonGroup>
          <Button>Save profile</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function AppearanceForm() {
  const dispatch = useAppDispatch()
  const { theme, density, accent } = useAppSelector((state) => state.settings)
  return (
    <>
      <Card>
        <SectionHeader title="Theme" />
        <RadioGroup
          value={theme}
          onChange={(value) => dispatch(settingsActions.setTheme(value as AppTheme))}
          options={themeOptions}
        />
      </Card>
      <Card>
        <SectionHeader title="Density" />
        <RadioGroup
          value={density}
          onChange={(value) => dispatch(settingsActions.setDensity(value as AppDensity))}
          options={densityOptions}
        />
      </Card>
      <Card>
        <SectionHeader title="Accent color" />
        <ColorSwatches
          value={accent}
          onChange={(value) => dispatch(settingsActions.setAccent(value as AppAccent))}
          options={accentOptions.map((option) => option.value)}
        />
      </Card>
    </>
  )
}

function EmailCalendarForm() {
  const accounts = [
    { name: 'Google', email: 'jane@example.com', status: 'connected' },
    { name: 'Microsoft Outlook', email: 'jane@work.example', status: 'connected' },
    { name: 'Apple iCloud', email: 'jane@icloud.com', status: 'error' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Connected accounts" description="Link accounts to sync email, events, and contacts." />
        {accounts.map((account) => (
          <div key={account.name} className="account-row">
            <div className="account-info">
              <span className="account-name">{account.name}</span>
              <span className="account-meta">{account.email}</span>
            </div>
            <div className="account-actions">
              <Badge variant={account.status === 'connected' ? 'success' : 'warning'}>{account.status}</Badge>
              <Toggle checked={account.status === 'connected'} onChange={() => {}} />
              <Button variant="secondary">Remove</Button>
            </div>
          </div>
        ))}
        <ButtonGroup>
          <Button>Add account</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function CallIntelligenceForm() {
  const dispatch = useAppDispatch()
  const { transcription, transcriptionLanguage, coaching, summaryLength, transcriptRetention } = useAppSelector(
    (state) => state.settings,
  )
  return (
    <>
      <Card>
        <SectionHeader title="Transcription" description="Convert calls into searchable text." />
        <Toggle
          checked={transcription}
          onChange={(value) => dispatch(settingsActions.setTranscription(value))}
          label="Enable call transcription"
        />
        <Field label="Transcription language">
          <Select
            value={transcriptionLanguage}
            onChange={(event) =>
              dispatch(settingsActions.setTranscriptionLanguage(event.target.value as AppTranscriptionLanguage))
            }
          >
            {transcriptionLanguageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Summaries" />
        <Field label="Default summary length">
          <Select
            value={summaryLength}
            onChange={(event) => dispatch(settingsActions.setSummaryLength(event.target.value as AppSummaryLength))}
          >
            {summaryLengthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Toggle
          checked={coaching}
          onChange={(value) => dispatch(settingsActions.setCoaching(value))}
          label="Enable coaching insights"
        />
      </Card>
      <Card>
        <SectionHeader title="Data retention" />
        <Field label="Keep transcripts for">
          <Select
            value={transcriptRetention}
            onChange={(event) => dispatch(settingsActions.setTranscriptRetention(event.target.value as AppRetention))}
          >
            {retentionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>
    </>
  )
}

function StorageAccountsForm() {
  const storages = [
    { name: 'Google Drive', used: '12 GB', total: '15 GB', status: 'connected' },
    { name: 'Dropbox', used: '4 GB', total: '10 GB', status: 'connected' },
    { name: 'OneDrive', used: '-', total: '-', status: 'disconnected' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Workspace storage" description="Total storage across connected providers." />
        <ProgressBar value={42} max={100} label="42 GB of 100 GB used" />
      </Card>
      <Card>
        <SectionHeader title="Connected storage" />
        {storages.map((s) => (
          <div key={s.name} className="connected-row">
            <div className="connected-info">
              <span className="connected-name">{s.name}</span>
              <span className="connected-meta">{s.status === 'connected' ? `${s.used} of ${s.total} used` : 'Not connected'}</span>
            </div>
            <div className="connected-actions">
              <Badge variant={s.status === 'connected' ? 'success' : 'neutral'}>{s.status}</Badge>
              <Toggle checked={s.status === 'connected'} onChange={() => {}} />
              <Button variant="secondary">Configure</Button>
            </div>
          </div>
        ))}
        <ButtonGroup>
          <Button>Add storage</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function ReferForm() {
  const dispatch = useAppDispatch()
  const { referralEmail } = useAppSelector((state) => state.settings)
  return (
    <>
      <Card>
        <SectionHeader title="Invite a team" description="Send an invite and earn workspace credits." />
        <Field label="Email address">
          <Input
            type="email"
            value={referralEmail}
            onChange={(event) => dispatch(settingsActions.setReferralEmail(event.target.value))}
            placeholder="team@example.com"
          />
        </Field>
        <ButtonGroup>
          <Button>Send invite</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Referral link" />
        <Field>
          <Input readOnly value="https://app.example.com/r/team-xyz" />
        </Field>
        <Button variant="secondary">Copy link</Button>
      </Card>
      <Card>
        <SectionHeader title="Rewards" />
        <div className="form-row">
          <Field label="Successful referrals">
            <Input readOnly value="3" />
          </Field>
          <Field label="Credits earned">
            <Input readOnly value="$150" />
          </Field>
        </div>
      </Card>
    </>
  )
}

function NotificationsForm() {
  const dispatch = useAppDispatch()
  const {
    emailNotifications,
    pushNotifications,
    slackNotifications,
    digest,
    quietHours,
    quietHoursFrom,
    quietHoursTo,
    digestFrequency,
  } = useAppSelector((state) => state.settings)
  return (
    <>
      <Card>
        <SectionHeader title="Notification channels" />
        <div className="form-field">
          <Toggle
            checked={emailNotifications}
            onChange={(value) => dispatch(settingsActions.setEmailNotifications(value))}
            label="Email notifications"
          />
        </div>
        <div className="form-field">
          <Toggle
            checked={pushNotifications}
            onChange={(value) => dispatch(settingsActions.setPushNotifications(value))}
            label="Push notifications"
          />
        </div>
        <div className="form-field">
          <Toggle
            checked={slackNotifications}
            onChange={(value) => dispatch(settingsActions.setSlackNotifications(value))}
            label="Slack notifications"
          />
        </div>
      </Card>
      <Card>
        <SectionHeader title="Email digests" />
        <Toggle
          checked={digest}
          onChange={(value) => dispatch(settingsActions.setDigest(value))}
          label="Send me a daily digest"
        />
        <Field label="Digest frequency">
          <Select
            value={digestFrequency}
            onChange={(event) => dispatch(settingsActions.setDigestFrequency(event.target.value as AppDigestFrequency))}
          >
            {digestFrequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Quiet hours" />
        <Toggle
          checked={quietHours}
          onChange={(value) => dispatch(settingsActions.setQuietHours(value))}
          label="Enable quiet hours"
        />
        <div className="form-row">
          <Field label="From">
            <Input
              type="time"
              value={quietHoursFrom}
              onChange={(event) => dispatch(settingsActions.setQuietHoursFrom(event.target.value))}
            />
          </Field>
          <Field label="To">
            <Input
              type="time"
              value={quietHoursTo}
              onChange={(event) => dispatch(settingsActions.setQuietHoursTo(event.target.value))}
            />
          </Field>
        </div>
      </Card>
    </>
  )
}

function SessionsForm() {
  const sessions = [
    { device: 'Chrome on macOS', location: 'Berlin, Germany', lastActive: 'Active now' },
    { device: 'Safari on iPhone', location: 'Berlin, Germany', lastActive: '2 hours ago' },
    { device: 'Firefox on Windows', location: 'Munich, Germany', lastActive: '3 days ago' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Active sessions" description="Devices currently signed in to your account." />
        <DataTable
          columns={[
            { key: 'device', label: 'Device' },
            { key: 'location', label: 'Location' },
            { key: 'lastActive', label: 'Last active' },
            { key: 'action', label: '' },
          ]}
          rows={sessions.map((s) => ({
            ...s,
            action: <Button variant="secondary">Revoke</Button>,
          }))}
        />
        <ButtonGroup>
          <Button variant="danger">Log out all devices</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

export const personalFormMap: Record<string, FC<SettingsFormProps>> = {
  'settings.profile': ProfileForm,
  'settings.appearance': AppearanceForm,
  'settings.email-calendar': EmailCalendarForm,
  'settings.call-intelligence': CallIntelligenceForm,
  'settings.storage': StorageAccountsForm,
  'settings.refer': ReferForm,
  'settings.notifications': NotificationsForm,
  'settings.sessions': SessionsForm,
}
