import { useEffect } from 'react'
import { useCommandVoice } from 'cmdk-vectorized'
import './SiriVoiceNavigator.css'

type SiriVoiceNavigatorProps = {
  onNavigate: (route: string) => void
  onShortcut?: () => void
}

export default function SiriVoiceNavigator({
  onNavigate,
  onShortcut,
}: SiriVoiceNavigatorProps) {
  const voice = useCommandVoice({
    endpoint: '/api/command-search',
    maxResults: 1,
    navigate: onNavigate,
    onShortcut,
  })

  useEffect(() => {
    if (!voice.open) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return
      }

      event.preventDefault()
      voice.reset()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [voice.open, voice.reset])

  if (!voice.open) {
    return null
  }

  return (
    <div className="siri-voice-overlay" role="dialog" aria-modal="true" aria-label="Voice navigation">
      <button className="siri-voice-backdrop" type="button" aria-label="Close voice navigation" onClick={voice.reset} />

      <div className="siri-voice-panel">
        <div
          className={`siri-voice-orb${voice.status === 'listening' ? ' siri-voice-orb--listening' : ''}`}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>

        <div className="siri-voice-status" aria-live="polite">
          {voice.status === 'listening' ? 'Listening' : null}
          {voice.status === 'searching' ? 'Searching' : null}
          {voice.status === 'executing' ? 'Navigating' : null}
          {voice.status === 'error' ? voice.error?.message : null}
        </div>

        {voice.transcript ? <div className="siri-voice-transcript">{voice.transcript}</div> : null}
      </div>
    </div>
  )
}