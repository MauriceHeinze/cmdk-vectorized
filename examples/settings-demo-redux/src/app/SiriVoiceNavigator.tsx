import { useEffect } from 'react'
import { useCommandVoice } from 'cmdk-vectorized'
import './SiriVoiceNavigator.css'

type SiriVoiceNavigatorProps = {
  onNavigate: (route: string) => void
  onShortcut?: () => void
}

/**
 * Headless-track demo: custom chrome on top of useCommandVoice.
 * Smart routing: single clear intent navigates; multiple → pick from list.
 */
export default function SiriVoiceNavigator({
  onNavigate,
  onShortcut,
}: SiriVoiceNavigatorProps) {
  const voice = useCommandVoice({
    endpoint: '/api/command-search',
    maxResults: 5,
    voiceListLimit: 3,
    autoExecute: 'single',
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

  const showResults = voice.status === 'results' && voice.results.length > 0

  return (
    <div className="siri-voice-overlay" role="dialog" aria-modal="true" aria-label="Voice navigation">
      <button className="siri-voice-backdrop" type="button" aria-label="Close voice navigation" onClick={voice.reset} />

      <div className={`siri-voice-panel${showResults ? ' siri-voice-panel--results' : ''}`}>
        {showResults ? (
          <div className="siri-voice-results" role="listbox" aria-label="Top voice results">
            <div className="siri-voice-results-heading">Top results</div>
            {voice.results.map((result) => (
              <button
                key={result.id}
                type="button"
                className="siri-voice-result"
                role="option"
                onClick={() => {
                  void voice.execute(result)
                }}
              >
                <span className="siri-voice-result-arrow" aria-hidden="true">
                  →
                </span>
                <span className="siri-voice-result-title">{result.title}</span>
              </button>
            ))}
          </div>
        ) : null}

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
          {voice.status === 'results' ? 'Choose a result' : null}
          {voice.status === 'executing' ? 'Navigating' : null}
          {voice.status === 'error' ? voice.error?.message : null}
        </div>

        {voice.transcript ? <div className="siri-voice-transcript">{voice.transcript}</div> : null}

        {(voice.status === 'listening' || showResults) && (
          <button
            type="button"
            className="siri-voice-stop"
            aria-label={voice.status === 'listening' ? 'Stop listening' : 'Listen again'}
            onClick={() => {
              if (voice.status === 'listening') {
                voice.stop()
                return
              }
              voice.start()
            }}
          >
            <span className="siri-voice-stop-icon" />
          </button>
        )}
      </div>
    </div>
  )
}
