import type { FC } from 'react'
import { Button, ButtonGroup, Card, DataTable, SectionHeader } from '../../../shared/ui/FormComponents.tsx'
import type { SettingsFormProps } from './form-types.ts'

function ObjectsForm() {
  const objects = [
    { object: 'People', attributes: 24, records: 1240 },
    { object: 'Companies', attributes: 18, records: 340 },
    { object: 'Deals', attributes: 22, records: 89 },
  ]
  return (
    <>
      <Card>
        <SectionHeader title="Object types" description="Define the data model for your workspace." />
        <DataTable
          columns={[
            { key: 'object', label: 'Object' },
            { key: 'attributes', label: 'Attributes' },
            { key: 'records', label: 'Records' },
            { key: 'actions', label: '' },
          ]}
          rows={objects.map((o) => ({
            ...o,
            actions: (
              <ButtonGroup>
                <Button variant="secondary">Configure</Button>
              </ButtonGroup>
            ),
          }))}
        />
        <ButtonGroup>
          <Button>Add object</Button>
        </ButtonGroup>
      </Card>
    </>
  )
}

export const dataFormMap: Record<string, FC<SettingsFormProps>> = {
  'settings.objects': ObjectsForm,
}
