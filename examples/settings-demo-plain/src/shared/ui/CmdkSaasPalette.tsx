import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command, useAICommand, type CommandSearchResult } from 'cmdk-vectorized'
import { routes } from '../../features/settings/settings-routes.ts'
import { settingsActions, useAppDispatch } from '../../features/settings/settings-store.ts'
import './CmdkSaasPalette.css'

const baseUrl = import.meta.env.VITE_CMDK_API_BASE_URL as string | undefined
const siteKey = import.meta.env.VITE_CMDK_SITE_KEY as string | undefined

const MAX_RESULTS = 10
const MIN_CONFIDENCE = 0.6

export const OPEN_PALETTE_EVENT = 'cmdk-saas:open-palette'

function resolveHrefTemplate(
  href: string,
  params: Record<string, string | undefined>,
): string | null {
  let out = href
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue
    out = out.replaceAll(`[${key}]`, value).replaceAll(`:${key}`, value)
  }
  if (/\[[^\]]+\]/.test(out)) return null
  return out
}

function routeIdFromActionKey(actionKey: string) {
  return actionKey.split('.').slice(0, 2).join('.')
}

export function CmdkSaasPalette() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)

  const initialResults = useMemo<CommandSearchResult[]>(
    () =>
      routes.map((route) => ({
        id: `route:${route.id}`,
        type: 'navigation',
        title: route.title,
        description: route.description,
        href: route.path,
      })),
    [],
  )

  const navigateAndClose = useMemo(
    () => (href: string) => {
      navigate(href)
      setOpen(false)
    },
    [navigate],
  )

  const actions = useMemo(() => {
    const storeActions: Record<string, () => void> = {
      'settings.profile.visibility': () => dispatch(settingsActions.setIsPublicProfile(true)),
      'settings.call-intelligence.transcription': () => dispatch(settingsActions.setTranscription(true)),
      'settings.call-intelligence.coaching': () => dispatch(settingsActions.setCoaching(true)),
      'settings.notifications.quiet-hours': () => dispatch(settingsActions.setQuietHours(true)),
      'settings.security.sso': () => dispatch(settingsActions.setSso(true)),
      'settings.security.mfa': () => dispatch(settingsActions.setMfa(true)),
      'settings.records.audit': () => dispatch(settingsActions.setAudit(true)),
      'settings.developers.webhooks': () => dispatch(settingsActions.setWebhooks(true)),
    }

    const map: Record<string, () => void> = {}
    for (const [actionKey, run] of Object.entries(storeActions)) {
      map[actionKey] = () => {
        run()
        const route = routes.find((r) => r.id === routeIdFromActionKey(actionKey))
        if (route) navigateAndClose(route.path)
      }
    }
    return map
  }, [dispatch, navigateAndClose])

  const command = useAICommand({
    endpoint: `${baseUrl ?? ''}/api/v1/search`,
    headers: siteKey ? { Authorization: `Bearer ${siteKey}` } : undefined,
    initialResults,
    maxResults: MAX_RESULTS,
    minConfidence: MIN_CONFIDENCE,
    minQueryLength: 1,
    searchOnEmptyQuery: false,
    navigate: navigateAndClose,
    resolveHref: (href) => resolveHrefTemplate(href, {}),
    actions,
    onUnresolvedHref: (href) => {
      console.warn(`[cmdk-saas] Cannot resolve href template: ${href}`)
    },
    onUnknownAction: (actionKey) => {
      const route = routes.find((r) => r.id === routeIdFromActionKey(actionKey))
      if (route) navigateAndClose(route.path)
    },
  })

  const { clear } = command

  useEffect(() => {
    if (open) clear()
  }, [open, clear])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    const onOpenEvent = () => setOpen(true)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_PALETTE_EVENT, onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpenEvent)
    }
  }, [])

  if (!open) return null

  return (
    <div className="cmdk-overlay" role="presentation">
      <button
        type="button"
        className="cmdk-backdrop"
        aria-label="Close command palette"
        onClick={() => setOpen(false)}
      />

      <Command className="cmdk-dialog" shouldFilter={false} loop>
        <div className="cmdk-search">
          <Command.Input
            className="cmdk-input"
            value={command.query}
            onValueChange={command.setQuery}
            autoFocus
            placeholder="Search settings or describe what you want to do…"
            aria-label="Command query"
          />
          {command.loading ? (
            <span className="cmdk-spinner" role="status" aria-label="Searching" />
          ) : null}
        </div>

        <Command.List className="cmdk-list">
          {command.error ? (
            <div className="cmdk-error" role="alert">
              {command.error.message}
            </div>
          ) : null}

          {!command.loading && !command.error && command.results.length === 0 ? (
            <Command.Empty className="cmdk-empty">No matching commands.</Command.Empty>
          ) : null}

          {command.results.map((result) => (
            <Command.Item
              className="cmdk-item"
              key={result.id}
              value={result.id}
              onSelect={() => {
                void command.execute(result)
              }}
            >
              <span className="cmdk-item-title">{result.title}</span>
              {result.description ? (
                <span className="cmdk-item-description">{result.description}</span>
              ) : null}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}
