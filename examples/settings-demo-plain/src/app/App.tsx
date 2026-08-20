import { Navigate, Route, Routes } from 'react-router-dom'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { useAppSelector } from '../features/settings/settings-store.ts'
import './App.css'

/**
 * Clean settings shell — no cmdk / cmdk-vectorized / SupaSearch wiring.
 * Use this app to validate the dashboard install prompt + integrate skill.
 */
function AppShell() {
  const theme = useAppSelector((state) => state.settings.theme)
  const effectiveTheme = theme === 'system' ? 'light' : theme

  return (
    <div className={`app-shell theme-${effectiveTheme}`}>
      <Routes>
        <Route path="/" element={<Navigate to="/settings" replace />} />
        <Route path="/settings/*" element={<SettingsLayout />} />
        <Route path="*" element={<Navigate to="/settings" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return <AppShell />
}
