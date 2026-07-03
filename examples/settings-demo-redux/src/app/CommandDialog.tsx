import { useEffect, useMemo, useState } from 'react'
import { Command, useAICommand, type CommandSearchResult } from 'cmdk-vectorized'
import type { WeaviateRouteResult } from './command-types.ts'
import './CommandDialog.css'

type CommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendedWeaviateRoutes: WeaviateRouteResult[]
  onNavigate: (route: string) => void
}

const SEARCH_ENDPOINT = '/api/command-search'
const RECOMMENDATIONS_LIMIT = 5
const SEARCH_RESULT_LIMIT = 8

function routeToResult(route: WeaviateRouteResult): CommandSearchResult {
  return {
    id: `route:${route.route}`,
    type: 'navigation',
    title: route.label || route.route,
    description: route.description,
    href: route.route,
    score: route.score,
    meta: {
      explainScore: route.explainScore,
    },
  }
}

export default function CommandDialog({
  open,
  onOpenChange,
  recommendedWeaviateRoutes,
  onNavigate,
}: CommandDialogProps) {
  const initialResults = useMemo(
    () => recommendedWeaviateRoutes.slice(0, RECOMMENDATIONS_LIMIT).map(routeToResult),
    [recommendedWeaviateRoutes],
  )

  const command = useAICommand({
    endpoint: SEARCH_ENDPOINT,
    initialResults,
    maxResults: SEARCH_RESULT_LIMIT,
    minConfidence: 0.7,
    minQueryLength: 1,
    searchOnEmptyQuery: false,
    navigate: (href) => {
      onNavigate(href)
      onOpenChange(false)
    },
  })

  const { clear } = command

  const results = useMemo(() => {
    const source = command.query.trim() === '' ? initialResults : command.results
    const seen = new Set<string>()

    return source.filter((result) => {
      if (seen.has(result.id)) {
        return false
      }

      seen.add(result.id)
      return true
    })
  }, [command.query, command.results, initialResults])

  const resultIds = useMemo(() => results.map((result) => result.id).join('\0'), [results])
  const [selectedValue, setSelectedValue] = useState('')

  useEffect(() => {
    setSelectedValue(results[0]?.id ?? '')
  }, [resultIds, results])

  useEffect(() => {
    clear()
    setSelectedValue('')
  }, [clear, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenChange, open])

  if (!open) {
    return null
  }

  return (
    <div className="settings-command-overlay" role="presentation">
      <button
        className="settings-command-backdrop"
        type="button"
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
      />

      <Command
        className="settings-command-dialog"
        shouldFilter={false}
        loop
        value={selectedValue}
        onValueChange={setSelectedValue}
      >
        <div className="settings-command-search">
          <Command.Input
            className="settings-command-input"
            value={command.query}
            onValueChange={command.setQuery}
            autoFocus
            placeholder="Search settings or describe where you want to go"
            aria-label="Command query"
          />
          {command.loading ? (
            <span className="settings-command-spinner" role="status" aria-label="Searching">
              <span className="settings-command-spinner-icon" aria-hidden="true" />
            </span>
          ) : null}
        </div>

        <Command.List className="settings-command-list">
          {command.error ? (
            <div className="settings-command-error" role="alert">
              {command.error.message}
            </div>
          ) : null}

          {!command.loading && !command.error && results.length === 0 ? (
            <Command.Empty className="settings-command-state">No matching commands.</Command.Empty>
          ) : null}

          {results.map((result) => (
            <Command.Item
              className="settings-command-item"
              key={result.id}
              value={result.id}
              onSelect={() => {
                void command.execute(result)
              }}
            >
              <span className="settings-command-item-title">{result.title}</span>
              {result.description ? (
                <span className="settings-command-item-description">{result.description}</span>
              ) : null}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}