import type { FC } from 'react'
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  DataTable,
  Field,
  Input,
  ProgressBar,
  SectionHeader,
  Select,
  TextArea,
  Toggle,
} from '../../../shared/ui/FormComponents.tsx'
import {
  defaultLanguageOptions,
  passwordPolicyOptions,
  recordVisibilityOptions,
  retentionOptions,
  sourceCrmOptions,
  timezoneOptions,
  webhookEventOptions,
  weekStartOptions,
} from '../settings-metadata.ts'
import {
  settingsActions,
  useAppDispatch,
  useAppSelector,
  type AppLanguage,
  type AppPasswordPolicy,
  type AppRecordVisibility,
  type AppRetention,
  type AppSourceCrm,
  type AppTimezone,
  type AppWebhookEvents,
  type AppWeekStart,
} from '../settings-store.ts'
import type { SettingsFormProps } from './form-types.ts'

function GeneralForm() {
  const dispatch = useAppDispatch()
  const { workspaceName, defaultLanguage, timezone, weekStart } = useAppSelector((state) => state.settings)
  return (
    <>
      <Card>
        <SectionHeader title="Workspace details" description="Basic workspace preferences." />
        <Field label="Workspace name">
          <Input value={workspaceName} onChange={(event) => dispatch(settingsActions.setWorkspaceName(event.target.value))} />
        </Field>
        <Field label="Timezone">
          <Select
            value={timezone}
            onChange={(event) => dispatch(settingsActions.setTimezone(event.target.value as AppTimezone))}
          >
            {timezoneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Default language">
          <Select
            value={defaultLanguage}
            onChange={(event) => dispatch(settingsActions.setDefaultLanguage(event.target.value as AppLanguage))}
          >
            {defaultLanguageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Week starts on">
          <Select
            value={weekStart}
            onChange={(event) => dispatch(settingsActions.setWeekStart(event.target.value as AppWeekStart))}
          >
            {weekStartOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <ButtonGroup>
          <Button>Save changes</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function MembersForm() {
  const members = [
    { name: 'Jane Doe', role: 'Owner', status: 'Active' },
    { name: 'John Smith', role: 'Admin', status: 'Active' },
    { name: 'Alice Wong', role: 'Member', status: 'Pending' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Workspace members" description="Manage teammates and their access." />
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: '' },
          ]}
          rows={members.map((m) => ({
            ...m,
            status: <Badge variant={m.status === 'Active' ? 'success' : 'warning'}>{m.status}</Badge>,
            actions: (
              <ButtonGroup>
                <Button variant="secondary">Change role</Button>
                <Button variant="danger">Remove</Button>
              </ButtonGroup>
            ),
          }))}
        />
        <ButtonGroup>
          <Button>Invite member</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function PlansForm() {
  return (
    <>
      <Card>
        <SectionHeader title="Current plan" description="You are on the Pro plan." />
        <div className="form-row">
          <Field label="Plan">
            <Input readOnly value="Pro" />
          </Field>
          <Field label="Renewal date">
            <Input readOnly value="Dec 31, 2026" />
          </Field>
        </div>
        <ProgressBar value={65} max={100} label="65 of 100 seats used" />
      </Card>
      <Card>
        <SectionHeader title="Available plans" />
        <div className="plan-grid">
          <div className="plan-card">
            <h3>Starter</h3>
            <p className="plan-price">$0</p>
            <ul>
              <li>Up to 5 members</li>
              <li>Basic reporting</li>
              <li>Email support</li>
            </ul>
            <Button variant="secondary">Downgrade</Button>
          </div>
          <div className="plan-card plan-current">
            <h3>Pro</h3>
            <p className="plan-price">$29/seat</p>
            <ul>
              <li>Unlimited members</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
            </ul>
            <Button disabled>Current plan</Button>
          </div>
          <div className="plan-card">
            <h3>Enterprise</h3>
            <p className="plan-price">Custom</p>
            <ul>
              <li>SSO & SCIM</li>
              <li>Dedicated success manager</li>
              <li>Custom contracts</li>
            </ul>
            <Button>Contact sales</Button>
          </div>
        </div>
      </Card>
    </>
  )
}

function BillingForm() {
  const dispatch = useAppDispatch()
  const { billingEmail, billingAddress } = useAppSelector((state) => state.settings)
  const invoices = [
    { id: 'INV-001', date: 'Nov 1, 2026', amount: '$290.00', status: 'Paid' },
    { id: 'INV-002', date: 'Oct 1, 2026', amount: '$290.00', status: 'Paid' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Payment method" />
        <div className="form-row">
          <Field label="Card">
            <Input readOnly value="Visa ending in 4242" />
          </Field>
          <Field label="Expiry">
            <Input readOnly value="12/2028" />
          </Field>
        </div>
        <ButtonGroup>
          <Button variant="secondary">Update card</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Billing details" />
        <Field label="Billing email">
          <Input
            type="email"
            value={billingEmail}
            onChange={(event) => dispatch(settingsActions.setBillingEmail(event.target.value))}
          />
        </Field>
        <Field label="Billing address">
          <TextArea value={billingAddress} onChange={(event) => dispatch(settingsActions.setBillingAddress(event.target.value))} />
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Invoices" />
        <DataTable
          columns={[
            { key: 'id', label: 'Invoice' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'action', label: '' },
          ]}
          rows={invoices.map((inv) => ({
            ...inv,
            status: <Badge variant="success">{inv.status}</Badge>,
            action: <Button variant="secondary">Download</Button>,
          }))}
        />
      </Card>
      <Card>
        <SectionHeader title="Subscription" />
        <Button variant="danger">Cancel subscription</Button>
      </Card>
    </>
  )
}

function DevelopersForm() {
  const dispatch = useAppDispatch()
  const keys = [
    { name: 'Production', created: 'Jan 5, 2026', lastUsed: '2 hours ago' },
    { name: 'Staging', created: 'Mar 12, 2026', lastUsed: '3 days ago' },
  ]
  const { webhooks, webhookUrl, webhookEvents } = useAppSelector((state) => state.settings)
  return (
    <>
      <Card>
        <SectionHeader title="API keys" description="Keys for accessing the API." />
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'created', label: 'Created' },
            { key: 'lastUsed', label: 'Last used' },
            { key: 'actions', label: '' },
          ]}
          rows={keys.map((k) => ({
            ...k,
            actions: (
              <ButtonGroup>
                <Button variant="secondary">Copy</Button>
                <Button variant="secondary">Rotate</Button>
                <Button variant="danger">Revoke</Button>
              </ButtonGroup>
            ),
          }))}
        />
        <ButtonGroup>
          <Button>Create key</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Webhooks" />
        <Toggle
          checked={webhooks}
          onChange={(value) => dispatch(settingsActions.setWebhooks(value))}
          label="Enable webhooks"
        />
        <Field label="Webhook URL">
          <Input
            value={webhookUrl}
            onChange={(event) => dispatch(settingsActions.setWebhookUrl(event.target.value))}
          />
        </Field>
        <Field label="Events">
          <Select
            value={webhookEvents}
            onChange={(event) => dispatch(settingsActions.setWebhookEvents(event.target.value as AppWebhookEvents))}
          >
            {webhookEventOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <ButtonGroup>
          <Button>Save</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function SecurityForm() {
  const dispatch = useAppDispatch()
  const { sso, mfa, passwordPolicy } = useAppSelector((state) => state.settings)
  const logs = [
    { action: 'Password changed', user: 'Jane Doe', time: '2 hours ago' },
    { action: 'MFA enabled', user: 'John Smith', time: '1 day ago' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Authentication" />
        <div className="form-field">
          <Toggle checked={sso} onChange={(value) => dispatch(settingsActions.setSso(value))} label="Enable SSO" />
        </div>
        <div className="form-field">
          <Toggle
            checked={mfa}
            onChange={(value) => dispatch(settingsActions.setMfa(value))}
            label="Require MFA for all members"
          />
        </div>
        <Field label="Password policy">
          <Select
            value={passwordPolicy}
            onChange={(event) => dispatch(settingsActions.setPasswordPolicy(event.target.value as AppPasswordPolicy))}
          >
            {passwordPolicyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>
      <Card>
        <SectionHeader title="Audit log" />
        <DataTable
          columns={[
            { key: 'action', label: 'Action' },
            { key: 'user', label: 'User' },
            { key: 'time', label: 'Time' },
          ]}
          rows={logs}
        />
      </Card>
    </>
  )
}

function RecordsForm() {
  const dispatch = useAppDispatch()
  const { audit, recordVisibility, recordHistoryRetention } = useAppSelector((state) => state.settings)
  return (
    <>
      <Card>
        <SectionHeader title="Record settings" description="Control how records are stored and tracked." />
        <Field label="Default visibility">
          <Select
            value={recordVisibility}
            onChange={(event) => dispatch(settingsActions.setRecordVisibility(event.target.value as AppRecordVisibility))}
          >
            {recordVisibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="History retention">
          <Select
            value={recordHistoryRetention}
            onChange={(event) =>
              dispatch(settingsActions.setRecordHistoryRetention(event.target.value as AppRetention))
            }
          >
            {retentionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Toggle
          checked={audit}
          onChange={(value) => dispatch(settingsActions.setAudit(value))}
          label="Keep audit log for record changes"
        />
        <ButtonGroup>
          <Button>Save</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function SupportRequestsForm() {
  const dispatch = useAppDispatch()
  const { supportSubject, supportMessage } = useAppSelector((state) => state.settings)
  const tickets = [
    { subject: 'Billing question', status: 'Open', updated: '1 day ago' },
    { subject: 'Feature request', status: 'Closed', updated: '1 week ago' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Your requests" />
        <DataTable
          columns={[
            { key: 'subject', label: 'Subject' },
            { key: 'status', label: 'Status' },
            { key: 'updated', label: 'Updated' },
            { key: 'action', label: '' },
          ]}
          rows={tickets.map((t) => ({
            ...t,
            status: <Badge variant={t.status === 'Open' ? 'warning' : 'neutral'}>{t.status}</Badge>,
            action: <Button variant="secondary">View</Button>,
          }))}
        />
      </Card>
      <Card>
        <SectionHeader title="New request" />
        <Field label="Subject">
          <Input value={supportSubject} onChange={(event) => dispatch(settingsActions.setSupportSubject(event.target.value))} />
        </Field>
        <Field label="Message">
          <TextArea
            value={supportMessage}
            onChange={(event) => dispatch(settingsActions.setSupportMessage(event.target.value))}
          />
        </Field>
        <ButtonGroup>
          <Button>Submit request</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

function MigrateCrmForm() {
  const dispatch = useAppDispatch()
  const { sourceCrm, connectionOrFile } = useAppSelector((state) => state.settings)
  const mappings = [
    { source: 'Contact', destination: 'Person', status: 'Mapped' },
    { source: 'Account', destination: 'Company', status: 'Mapped' },
    { source: 'Opportunity', destination: 'Deal', status: 'Review needed' },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Source CRM" />
        <Field label="Choose source">
          <Select value={sourceCrm} onChange={(event) => dispatch(settingsActions.setSourceCrm(event.target.value as AppSourceCrm))}>
            {sourceCrmOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Connection or file">
          <Input
            value={connectionOrFile}
            onChange={(event) => dispatch(settingsActions.setConnectionOrFile(event.target.value))}
          />
        </Field>
        <ButtonGroup>
          <Button variant="secondary">Test connection</Button>
        </ButtonGroup>
      </Card>
      <Card>
        <SectionHeader title="Mapping preview" />
        <DataTable
          columns={[
            { key: 'source', label: 'Source field' },
            { key: 'destination', label: 'Destination field' },
            { key: 'status', label: 'Status' },
          ]}
          rows={mappings.map((m) => ({
            ...m,
            status: <Badge variant={m.status === 'Mapped' ? 'success' : 'warning'}>{m.status}</Badge>,
          }))}
        />
      </Card>
      <Card>
        <Button>Start import</Button>
      </Card>
    </>
  )
}

export const workspaceFormMap: Record<string, FC<SettingsFormProps>> = {
  'settings.general': GeneralForm,
  'settings.members': MembersForm,
  'settings.plans': PlansForm,
  'settings.billing': BillingForm,
  'settings.developers': DevelopersForm,
  'settings.security': SecurityForm,
  'settings.records': RecordsForm,
  'settings.support': SupportRequestsForm,
  'settings.migrate': MigrateCrmForm,
}
