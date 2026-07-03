import type { FC } from 'react'
import { dataFormMap } from './forms/data-forms.tsx'
import type { SettingsFormProps } from './forms/form-types.ts'
import { personalFormMap } from './forms/personal-forms.tsx'
import { workspaceFormMap } from './forms/workspace-forms.tsx'

const formMap: Record<string, FC<SettingsFormProps>> = {
  ...personalFormMap,
  ...workspaceFormMap,
  ...dataFormMap,
}

export function SettingForm(props: SettingsFormProps) {
  const { route } = props
  const Form = formMap[route.id]
  if (!Form) return null
  return <Form route={route} />
}
