import type { ReactNode } from 'react'
import './FormComponents.css'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`settings-card ${className}`}>{children}</div>
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  )
}

export function Field({ label, children, hint }: { label?: string; children: ReactNode; hint?: string }) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      {children}
      {hint ? <span className="form-hint">{hint}</span> : null}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="form-input" {...props} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="form-textarea" {...props} />
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className="form-select" {...props}>
      {children}
    </select>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      className={`form-toggle ${checked ? 'checked' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="form-toggle-track">
        <span className="form-toggle-thumb" />
      </span>
      {label ? <span className="form-toggle-label">{label}</span> : null}
    </button>
  )
}

export function Button({ variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return <button className={`form-button ${variant}`} {...props} />
}

export function ButtonGroup({ children }: { children: ReactNode }) {
  return <div className="button-group">{children}</div>
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; description?: string }[]
}) {
  return (
    <div className="radio-group" role="radiogroup">
      {options.map((option) => {
        const checked = value === option.value
        return (
          <label key={option.value} className={`radio-option ${checked ? 'checked' : ''}`}>
            <input
              type="radio"
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="visually-hidden"
            />
            <span className="radio-circle">
              {checked && <span className="radio-dot" />}
            </span>
            <span className="radio-option-text">
              <span className="radio-option-title">{option.label}</span>
              {option.description ? <span className="radio-option-description">{option.description}</span> : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export function ColorSwatches({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div className="color-swatches">
      {options.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch ${value === color ? 'selected' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
          aria-label={`Select accent color ${color}`}
        />
      ))}
    </div>
  )
}

export function DataTable({ rows, columns }: { rows: Record<string, ReactNode>[]; columns: { key: string; label: string }[] }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Badge({ variant = 'neutral', children }: { variant?: 'success' | 'warning' | 'neutral'; children: ReactNode }) {
  return <span className={`badge ${variant}`}>{children}</span>
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="progress-bar">
      {label ? <span className="progress-bar-label">{label}</span> : null}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function AvatarUpload({ initials }: { initials: string }) {
  return (
    <div className="avatar-upload">
      <div className="avatar-preview">{initials}</div>
      <Button variant="secondary">Upload photo</Button>
    </div>
  )
}
