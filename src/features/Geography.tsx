import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { getErrorMessage } from '@/core/api/errors'
import type {
  CreateGeographicZoneRequest,
  GeographicZone,
  UpdateGeographicZoneRequest,
} from '@/core/api/geographyService'
import { useAuthStore } from '@/core/auth/authStore'
import { getPermissionsForFeature } from '@/constants/permissions'
import {
  useCreateGeographicZone,
  useGeographicZone,
  useGeographicZones,
  useUpdateGeographicZone,
  useUpdateGeographicZoneStatus,
} from '@/modules/geography/hooks/useGeography'
import { TextSkeleton } from '@/ui/components/SkeletonCards'

const ZONE_TYPES = [
  'CONTINENT',
  'SUB_REGION',
  'COUNTRY',
  'ADM1',
  'ADM2',
  'ADM3',
  'CITY',
  'POSTAL_ZONE',
] as const

type ZoneType = (typeof ZONE_TYPES)[number]
type FormMode = 'create' | 'edit'

type ZoneFormState = {
  code: string
  name: string
  type: ZoneType
  currency: string
  timezone: string
  postalCodeRegex: string
}

const EMPTY_FORM: ZoneFormState = {
  code: '',
  name: '',
  type: 'CONTINENT',
  currency: '',
  timezone: '',
  postalCodeRegex: '',
}

function titleCaseZoneType(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildPayload(
  state: ZoneFormState,
  parentId?: string | null,
): CreateGeographicZoneRequest {
  return {
    code: state.code.trim().toUpperCase(),
    name: state.name.trim(),
    type: state.type,
    parentId: parentId || undefined,
    currency: state.currency.trim() || undefined,
    timezone: state.timezone.trim() || undefined,
    postalCodeRegex: state.postalCodeRegex.trim() || undefined,
  }
}

function buildUpdatePayload(state: ZoneFormState): UpdateGeographicZoneRequest {
  return {
    code: state.code.trim().toUpperCase(),
    name: state.name.trim(),
    type: state.type,
    currency: state.currency.trim() || null,
    timezone: state.timezone.trim() || null,
    postalCodeRegex: state.postalCodeRegex.trim() || null,
  }
}

export function Geography() {
  const { user } = useAuthStore()
  const perms = getPermissionsForFeature(user?.role, 'geography')
  const [currentParent, setCurrentParent] = useState<GeographicZone | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<GeographicZone[]>([])
  const [selectedZone, setSelectedZone] = useState<GeographicZone | null>(null)
  const [typeFilter, setTypeFilter] = useState<'ALL' | ZoneType>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [mode, setMode] = useState<FormMode>('create')
  const [form, setForm] = useState<ZoneFormState>(EMPTY_FORM)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const zoneQuery = useGeographicZones({
    parentId: currentParent?.id ?? null,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    active:
      statusFilter === 'ALL'
        ? undefined
        : statusFilter === 'ACTIVE',
  })
  const currentParentQuery = useGeographicZone(currentParent?.id)
  const createMutation = useCreateGeographicZone()
  const updateMutation = useUpdateGeographicZone()
  const statusMutation = useUpdateGeographicZoneStatus()

  const zones = useMemo(
    () => (Array.isArray(zoneQuery.data) ? zoneQuery.data : []),
    [zoneQuery.data],
  )

  useEffect(() => {
    if (mode === 'edit' && selectedZone) {
      setForm({
        code: selectedZone.code || '',
        name: selectedZone.name || '',
        type: (selectedZone.type as ZoneType) || 'CONTINENT',
        currency: selectedZone.currency || '',
        timezone: selectedZone.timezone || '',
        postalCodeRegex: selectedZone.postalCodeRegex || '',
      })
      return
    }

    setForm((prev) => ({
      ...EMPTY_FORM,
      type:
        currentParent?.type === 'CONTINENT'
          ? 'COUNTRY'
          : currentParent?.type === 'COUNTRY'
            ? 'CITY'
            : currentParent?.type === 'SUB_REGION'
              ? 'COUNTRY'
              : 'CONTINENT',
      timezone: prev.timezone && mode === 'create' ? prev.timezone : '',
    }))
  }, [currentParent, mode, selectedZone])

  const parentZone = currentParentQuery.data || currentParent

  function resetMessages() {
    setSubmitError(null)
    setSuccessMessage(null)
  }

  function drillInto(zone: GeographicZone) {
    resetMessages()
    setBreadcrumbs((prev) => [...prev, zone])
    setCurrentParent(zone)
    setSelectedZone(null)
    setMode('create')
  }

  function goToBreadcrumb(index: number) {
    resetMessages()
    if (index < 0) {
      setBreadcrumbs([])
      setCurrentParent(null)
      setSelectedZone(null)
      setMode('create')
      return
    }
    const nextPath = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(nextPath)
    setCurrentParent(nextPath[nextPath.length - 1] || null)
    setSelectedZone(null)
    setMode('create')
  }

  async function submitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    resetMessages()

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(buildPayload(form, currentParent?.id))
        setSuccessMessage('Zone created successfully.')
        setForm(EMPTY_FORM)
      } else if (selectedZone) {
        await updateMutation.mutateAsync({
          id: selectedZone.id,
          payload: buildUpdatePayload(form),
        })
        setSuccessMessage('Zone updated successfully.')
      }
      setSelectedZone(null)
      setMode('create')
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  }

  async function toggleStatus(zone: GeographicZone) {
    resetMessages()
    try {
      await statusMutation.mutateAsync({
        id: zone.id,
        isActive: !zone.isActive,
      })
      setSuccessMessage(
        zone.isActive ? 'Zone deactivated successfully.' : 'Zone activated successfully.',
      )
      if (selectedZone?.id === zone.id) {
        setSelectedZone({
          ...zone,
          isActive: !zone.isActive,
        })
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  }

  if (!perms.access) {
    return (
      <DashboardLayout pageTitle="Geography">
        <div className="card text-sm text-text-secondary">
          You do not have access to geography management.
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout pageTitle="Geography">
      <div className="space-y-4">
        {(zoneQuery.error || submitError) && (
          <div className="card bg-red-50 border border-red-200 text-red-700 text-sm">
            {submitError || getErrorMessage(zoneQuery.error)}
          </div>
        )}
        {successMessage && (
          <div className="card bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            {successMessage}
          </div>
        )}

        <div className="card flex flex-wrap items-center gap-3">
          <button className="btn secondary" onClick={() => goToBreadcrumb(-1)}>
            Root
          </button>
          {breadcrumbs.map((crumb, index) => (
            <button
              key={crumb.id}
              className="btn secondary"
              onClick={() => goToBreadcrumb(index)}
            >
              {crumb.name}
            </button>
          ))}
          <div className="ml-auto text-sm text-text-secondary">
            Parent: <span className="font-semibold text-text">{parentZone?.name || 'Top Level'}</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-4">
            <div className="card grid gap-3 md:grid-cols-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'ALL' | ZoneType)}
                className="select"
              >
                <option value="ALL">All Types</option>
                {ZONE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {titleCaseZoneType(type)}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="select"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>

              {perms.create && (
                <button
                  className="btn secondary"
                  onClick={() => {
                    setMode('create')
                    setSelectedZone(null)
                    resetMessages()
                  }}
                >
                  + Create {currentParent ? 'Child Zone' : 'Root Zone'}
                </button>
              )}
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Children</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr
                      key={zone.id}
                      className={selectedZone?.id === zone.id ? 'bg-white/5' : undefined}
                    >
                      <td className="font-semibold">
                        {zone.name}
                        <div className="text-xs text-muted">
                          {zone.timezone || zone.currency || 'No metadata'}
                        </div>
                      </td>
                      <td>{zone.code}</td>
                      <td>{titleCaseZoneType(zone.type)}</td>
                      <td>
                        <span className={`pill ${zone.isActive ? 'approved' : 'bg-slate-200 text-slate-700'}`}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{zone._count?.children ?? 0}</td>
                      <td className="text-right">
                        <div className="inline-flex gap-2">
                          <button className="btn secondary" onClick={() => drillInto(zone)}>
                            Open
                          </button>
                          {perms.edit && (
                            <button
                              className="btn secondary"
                              onClick={() => {
                                setMode('edit')
                                setSelectedZone(zone)
                                resetMessages()
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {perms.edit && (
                            <button
                              className="btn secondary"
                              onClick={() => toggleStatus(zone)}
                            >
                              {zone.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {zoneQuery.isLoading && (
                <div className="p-8">
                  <TextSkeleton lines={2} centered />
                </div>
              )}

              {!zoneQuery.isLoading && zones.length === 0 && (
                <div className="p-8 text-center text-subtle">
                  No zones found for the current filter.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="mb-4">
              <div className="text-lg font-semibold text-text">
                {mode === 'create' ? 'Create Zone' : 'Edit Zone'}
              </div>
              <div className="text-sm text-text-secondary">
                {mode === 'create'
                  ? `Register a ${currentParent ? 'child zone' : 'top-level region'} in the hierarchy.`
                  : `Update ${selectedZone?.name || 'zone'} metadata and hierarchy details.`}
              </div>
            </div>

            <form className="space-y-3" onSubmit={submitForm}>
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Zone name"
                className="input"
                required
                disabled={mode === 'edit' ? !perms.edit : !perms.create}
              />
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Code (e.g. UG, KE-30, KAMPALA-CBD)"
                className="input"
                required
                disabled={mode === 'edit' ? !perms.edit : !perms.create}
              />
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as ZoneType }))}
                className="select"
                disabled={mode === 'edit' ? !perms.edit : !perms.create}
              >
                {ZONE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {titleCaseZoneType(type)}
                  </option>
                ))}
              </select>
              <input
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                placeholder="Currency (optional)"
                className="input"
                disabled={mode === 'edit' ? !perms.edit : !perms.create}
              />
              <input
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                placeholder="Timezone (optional)"
                className="input"
                disabled={mode === 'edit' ? !perms.edit : !perms.create}
              />
              <input
                value={form.postalCodeRegex}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, postalCodeRegex: e.target.value }))
                }
                placeholder="Postal regex (optional)"
                className="input"
                disabled={mode === 'edit' ? !perms.edit : !perms.create}
              />

              {currentParent && mode === 'create' && (
                <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
                  Parent: <span className="font-semibold text-text">{currentParent.name}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {(perms.create || perms.edit) && (
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={
                      createMutation.isPending ||
                      updateMutation.isPending ||
                      (mode === 'create' ? !perms.create : !perms.edit)
                    }
                  >
                    {mode === 'create' ? 'Create Zone' : 'Save Changes'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setMode('create')
                    setSelectedZone(null)
                    setForm(EMPTY_FORM)
                    resetMessages()
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
