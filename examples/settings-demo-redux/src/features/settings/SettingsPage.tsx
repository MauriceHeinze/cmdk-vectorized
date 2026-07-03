import { SettingForm } from './SettingForms.tsx'
import type { SettingsRoute } from './settings-routes.ts'
import './SettingsPage.css'

type SettingsPageProps = {
  route: SettingsRoute
}

export default function SettingsPage(props: SettingsPageProps) {
  const { route } = props
  return (
    <section className="settings-page">
      <div className="settings-page-header">
        <h1>{route.title}</h1>
        <p>{route.description}</p>
      </div>
      <SettingForm route={route} />
    </section>
  )
}
