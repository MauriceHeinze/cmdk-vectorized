import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AICommandPalette } from 'cmdk-vectorized'
import 'cmdk-vectorized/styles.css'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { useAppSelector } from '../features/settings/settings-store.ts'
import './App.css'

function AppShell() {
  const navigate = useNavigate()
  const theme = useAppSelector((state) => state.settings.theme)
  const effectiveTheme = theme === 'system' ? 'light' : theme
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).has('palette'))

  return (
    <div
      className={`app-shell theme-${effectiveTheme}${effectiveTheme === 'dark' ? ' dark' : ''}`}
      data-theme={effectiveTheme}
    >
      <header className="app-shortcut-hint" aria-label="Keyboard shortcuts">
        Press <kbd>⌘K</kbd> to open the drop-in palette or <kbd>⌘M</kbd> for voice.
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/settings" replace />} />
        <Route path="/settings/*" element={<SettingsLayout />} />
        <Route path="*" element={<Navigate to="/settings" replace />} />
      </Routes>

      <AICommandPalette
        open={open}
        onOpenChange={setOpen}
        endpoint="/api/command-search"
        navigate={(href) => {
          void navigate(href)
        }}
        placeholder="Search settings…"
        listHeading="Settings"
        minConfidence={0.7}
        maxResults={8}
        minQueryLength={1}
      />
    </div>
  )
}

export default function App() {
  return <AppShell />
}
