import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { useAppSelector } from '../features/settings/settings-store.ts'
import './App.css'
import CommandDialog from './CommandDialog.tsx'
import SiriVoiceNavigator from './SiriVoiceNavigator.tsx'
import type { WeaviateRouteResult } from './command-types.ts'
import { createWeaviateRouteSearch } from './weaviate-route-search.ts'

const HOME_RECOMMENDATIONS_QUERY = 'settings'
const HOME_RECOMMENDATIONS_LIMIT = 5

let prefetchedHomeRecommendations: WeaviateRouteResult[] | null = null
let prefetchedHomeRecommendationsPromise: Promise<WeaviateRouteResult[]> | null = null

function hasHomeRecommendationsCache() {
  return (prefetchedHomeRecommendations?.length ?? 0) > 0
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  )
}

function loadHomeRecommendations(
  searchWeaviateRoutes: (query: string, limit?: number) => Promise<WeaviateRouteResult[]>,
) {
  if (hasHomeRecommendationsCache()) {
    return Promise.resolve(prefetchedHomeRecommendations!)
  }

  if (prefetchedHomeRecommendationsPromise) {
    return prefetchedHomeRecommendationsPromise
  }

  prefetchedHomeRecommendationsPromise = searchWeaviateRoutes(
    HOME_RECOMMENDATIONS_QUERY,
    HOME_RECOMMENDATIONS_LIMIT,
  )
    .then((routes) => {
      prefetchedHomeRecommendations = routes
      return routes
    })
    .finally(() => {
      prefetchedHomeRecommendationsPromise = null
    })

  return prefetchedHomeRecommendationsPromise
}

function AppShell() {
  const navigate = useNavigate()
  const [widgetOpen, setWidgetOpen] = useState(false)
  const [recommendedWeaviateRoutes, setRecommendedWeaviateRoutes] = useState<WeaviateRouteResult[]>(
    () => prefetchedHomeRecommendations ?? [],
  )
  const theme = useAppSelector((state) => state.settings.theme)

  const searchWeaviateRoutes = useMemo(() => createWeaviateRouteSearch(), [])

  useEffect(() => {
    if (hasHomeRecommendationsCache()) {
      setRecommendedWeaviateRoutes(prefetchedHomeRecommendations!)
      return
    }

    let cancelled = false

    void loadHomeRecommendations(searchWeaviateRoutes)
      .then((routes) => {
        if (!cancelled) {
          setRecommendedWeaviateRoutes(routes)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecommendedWeaviateRoutes([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [searchWeaviateRoutes])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) {
        return
      }

      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setWidgetOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={`app-shell theme-${effectiveTheme}`}>
      <header className="app-shortcut-hint" aria-label="Keyboard shortcuts">
        Press <kbd>⌘K</kbd> to open the command palette or <kbd>⌘M</kbd> for voice mode.
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/settings" replace />} />
        <Route
          path="/settings/*"
          element={
            <SettingsLayout
              onOpenCommand={() => setWidgetOpen(true)}
            />
          }
        />
        <Route path="*" element={<Navigate to="/settings" replace />} />
      </Routes>

      <CommandDialog
        open={widgetOpen}
        onOpenChange={setWidgetOpen}
        recommendedWeaviateRoutes={recommendedWeaviateRoutes}
        onNavigate={(route) => {
          navigate(route)
          setWidgetOpen(false)
        }}
      />

      <SiriVoiceNavigator
        onShortcut={() => setWidgetOpen(false)}
        onNavigate={(route) => {
          navigate(route)
          setWidgetOpen(false)
        }}
      />
    </div>
  )
}

export default function App() {
  return <AppShell />
}