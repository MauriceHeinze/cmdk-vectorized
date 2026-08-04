import type { ReactNode } from 'react'
import './CallRecorderPage.css'
import { recorderStyleOptions } from './settings-metadata.ts'
import { settingsActions, useAppDispatch, useAppSelector, type RecorderStyle } from './settings-store.ts'

function DefaultIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="currentColor" />
      <path
        d="M20 10L27 30H23.5L21.8 24.8H18.2L16.5 30H13L20 10ZM19 21.5H21L20 18.2L19 21.5Z"
        fill="white"
      />
    </svg>
  )
}

function WorkspaceIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="currentColor" />
      <rect x="9" y="9" width="9" height="9" rx="2" fill="white" />
      <rect x="22" y="9" width="9" height="9" rx="2" fill="white" />
      <rect x="9" y="22" width="9" height="9" rx="2" fill="white" />
      <rect x="22" y="22" width="9" height="9" rx="2" fill="white" />
    </svg>
  )
}

function MinimalIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="currentColor" />
      <rect x="9" y="13" width="22" height="3" rx="1.5" fill="white" />
      <rect x="9" y="19" width="17" height="3" rx="1.5" fill="white" />
      <rect x="9" y="25" width="12" height="3" rx="1.5" fill="white" />
    </svg>
  )
}

function NoneIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#f3f4f6" />
      <path d="M12 14L28 26M28 14L12 26" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 26H26L23 20L20 23L18 21L14 26Z" fill="#d1d5db" />
    </svg>
  )
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span className={`style-radio ${checked ? 'checked' : ''}`}>
      {checked && <span className="style-radio-dot" />}
    </span>
  )
}

function PreviewCard({ name, style }: { name: string; style: RecorderStyle }) {
  if (style === 'none') {
    return (
      <div className="preview-wrapper">
        <div className="preview-card preview-none">
          <span className="preview-none-label">No image</span>
        </div>
        <p className="preview-caption">Preview</p>
      </div>
    )
  }

  const isWorkspace = style === 'workspace'
  const isMinimal = style === 'minimal'

  return (
    <div className="preview-wrapper">
      <div className="preview-card">
        <div className="preview-backdrop" />
        {!isMinimal && (
          <div className="preview-brand">
            {isWorkspace ? (
              <WorkspaceIcon className="preview-brand-logo" />
            ) : (
              <DefaultIcon className="preview-brand-logo" />
            )}
            <p className="preview-brand-title">
              {isWorkspace ? 'Workspace Call Intelligence' : 'Call Intelligence'}
            </p>
            <p className="preview-brand-url">Learn more</p>
          </div>
        )}
        <div className="preview-footer">
          <span className="preview-recorder-name">{name || 'Notetaker'}</span>
          <span className="preview-recording">
            <span className="recording-dot" />
            Recording
          </span>
        </div>
      </div>
      <p className="preview-caption">Preview</p>
    </div>
  )
}

export default function CallRecorderPage() {
  const dispatch = useAppDispatch()
  const recorderName = useAppSelector((state) => state.settings.recorderName)
  const style = useAppSelector((state) => state.settings.recorderStyle)

  const iconByStyle: Record<RecorderStyle, ReactNode> = {
    default: <DefaultIcon className="style-option-icon style-option-icon-dark" />,
    workspace: <WorkspaceIcon className="style-option-icon style-option-icon-dark" />,
    minimal: <MinimalIcon className="style-option-icon style-option-icon-dark" />,
    none: <NoneIcon className="style-option-icon" />,
  }

  return (
    <section className="call-recorder-page">
      <div className="recorder-heading">
        <h1>Call recorder</h1>
        <p>Manage your call recorder settings</p>
      </div>

      <section className="recorder-section">
        <div className="recorder-section-header">
          <h2>Recorder settings</h2>
          <p>Customize how the recorder appears in your team's meetings</p>
        </div>

        <label className="recorder-field">
          <span className="recorder-label">Recorder name</span>
          <input
            type="text"
            value={recorderName}
            onChange={(e) => dispatch(settingsActions.setRecorderName(e.target.value))}
            className="recorder-input"
          />
        </label>

        <div className="style-field">
          <span className="recorder-label">Style</span>
          <div className="style-layout">
            <div className="style-options" role="radiogroup" aria-label="Recorder style">
              {recorderStyleOptions.map((option) => {
                const checked = style === option.value
                return (
                  <label
                    key={option.value}
                    className={`style-option ${checked ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="recorder-style"
                      value={option.value}
                      checked={checked}
                      onChange={() => dispatch(settingsActions.setRecorderStyle(option.value))}
                      className="visually-hidden"
                    />
                    {iconByStyle[option.value]}
                    <span className="style-option-text">
                      <span className="style-option-title">{option.title}</span>
                      <span className="style-option-description">{option.description}</span>
                    </span>
                    <Radio checked={checked} />
                  </label>
                )
              })}
            </div>
            <PreviewCard name={recorderName} style={style} />
          </div>
        </div>
      </section>
    </section>
  )
}
