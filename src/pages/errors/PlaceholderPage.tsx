import { useParams } from 'react-router-dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { Panel } from '@/ui/components/Panel'

export function PlaceholderPage() {
  const { section } = useParams()
  return (
    <DashboardLayout pageTitle={section ? section.toUpperCase() : 'Section'}>
      <div className="bg-panel border border-border-light rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,.2)] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,.3)]">
        <h2 className="mt-0">Placeholder</h2>
        <p className="text-muted">
          This section is scaffolded for the role sidebar. You can migrate the matching page from the old CRA code into this route later.
        </p>
      </div>
      <div className="h-3.5" />
      <div className="grid gap-4">
        <Panel title="Widget A" subtitle="Drop in a real component here" />
        <Panel title="Widget B" subtitle="Drop in a real component here" />
      </div>
    </DashboardLayout>
  )
}

