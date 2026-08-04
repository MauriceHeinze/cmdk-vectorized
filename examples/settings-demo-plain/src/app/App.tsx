import { Navigate, Route, Routes } from 'react-router-dom'
import SettingsLayout from '../features/settings/SettingsLayout.tsx'
import { CmdkSaasPalette } from '../shared/ui/CmdkSaasPalette.tsx'
import { useAppSelector } from '../features/settings/settings-store.ts'
import './App.css'

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
      <CmdkSaasPalette />
    </div>
  )
}

export default function App() {
  return <AppShell />
}
