import { useEffect, useState } from 'react'
import { Plus, Search, X, Dumbbell, Image, Video, Trash2, Upload } from 'lucide-react'
import { api, call } from '../../utils/api'
import { PageHeader, EmptyState, LoadingState } from '../../components/Layout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { EQUIPMENT_TYPES } from '@shared/constants'
import type { Exercise, MuscleGroup } from '@shared/types'

const EQ_OPTIONS = [{ value: '', label: 'Todo el equipamiento' }, ...EQUIPMENT_TYPES]

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'webm', 'mkv']

function mediaUrl(path: string): string {
  return `media://${path.replace(/\\/g, '/')}`
}

export function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('')
  const [filterEquipment, setFilterEquipment] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editExercise, setEditExercise] = useState<Exercise | null>(null)
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState<'image' | 'video' | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadExercises()
  }, [search, filterMuscle, filterEquipment])

  async function loadData() {
    setLoading(true)
    try {
      const [exs, mgs] = await Promise.all([
        call(() => api.exercises.getAll()),
        call(() => api.exercises.getMuscleGroups()),
      ])
      setExercises(exs)
      setMuscleGroups(mgs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadExercises() {
    try {
      const data = await call(() =>
        api.exercises.getAll({
          search: search || undefined,
          muscleGroupId: filterMuscle ? Number(filterMuscle) : undefined,
          equipment: filterEquipment || undefined,
        }),
      )
      setExercises(data)
      // Actualizar el ejercicio seleccionado si sigue en la lista
      if (selected) {
        const updated = data.find((e) => e.id === selected.id)
        if (updated) setSelected(updated)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(ex: Exercise) {
    if (ex.isDefault) { alert('No se pueden eliminar ejercicios predeterminados'); return }
    if (!confirm(`¿Eliminar "${ex.name}"?`)) return
    try {
      await call(() => api.exercises.delete(ex.id))
      setExercises((prev) => prev.filter((e) => e.id !== ex.id))
      if (selected?.id === ex.id) setSelected(null)
    } catch (err) {
      alert((err as Error).message)
    }
  }

  async function handlePickMedia(type: 'image' | 'video') {
    if (!selected) return
    setUploadingMedia(type)
    try {
      const extensions = type === 'image' ? IMAGE_EXTS : VIDEO_EXTS
      const name = type === 'image' ? 'Imágenes' : 'Videos'
      const result = await call(() =>
        api.dialog.openFile([{ name, extensions }])
      )
      if (!result) return
      const updated = await call(() =>
        api.exercises.setMedia(selected.id, type, result)
      )
      setSelected(updated)
      setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setUploadingMedia(null)
    }
  }

  async function handleRemoveMedia(type: 'image' | 'video') {
    if (!selected) return
    if (!confirm(`¿Eliminar ${type === 'image' ? 'la imagen' : 'el video'}?`)) return
    try {
      const updated = await call(() =>
        api.exercises.setMedia(selected.id, type, null)
      )
      setSelected(updated)
      setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const mgOptions = [
    { value: '', label: 'Todos los músculos' },
    ...muscleGroups.map((m) => ({ value: m.id.toString(), label: m.name })),
  ]
  const hasFilters = !!search || !!filterMuscle || !!filterEquipment

  return (
    <div className="p-6">
      <PageHeader
        title="Biblioteca de ejercicios"
        subtitle={`${exercises.length} ejercicios`}
        actions={
          <Button size="sm" onClick={() => { setEditExercise(null); setShowModal(true) }}>
            <Plus className="w-4 h-4" /> Nuevo ejercicio
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-100"
        >
          {mgOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filterEquipment}
          onChange={(e) => setFilterEquipment(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-100"
        >
          {EQ_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterMuscle(''); setFilterEquipment('') }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" /> Limpiar
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* Lista */}
        <Card className="flex-1 overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : exercises.length === 0 ? (
            <EmptyState title="Sin resultados" description="Probá con otros filtros" />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[600px]">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelected(ex)}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                    selected?.id === ex.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    {ex.imagePath ? (
                      <img
                        src={mediaUrl(ex.imagePath)}
                        alt={ex.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <Dumbbell className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{ex.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {ex.primaryMuscleGroupName} · {ex.equipmentType}
                      {ex.videoPath && <span className="ml-1 text-blue-400">▶</span>}
                    </p>
                  </div>
                  {ex.isDefault ? <Badge variant="indigo">Predefinido</Badge> : null}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Panel de detalle */}
        {selected && (
          <Card className="w-80 shrink-0 self-start overflow-hidden">
            {/* Zona de imagen */}
            <div className="relative bg-gray-900 aspect-video flex items-center justify-center group">
              {selected.imagePath ? (
                <>
                  <img
                    src={mediaUrl(selected.imagePath)}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveMedia('image')}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Quitar imagen"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handlePickMedia('image')}
                  disabled={uploadingMedia === 'image'}
                  className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors p-6"
                >
                  <Image className="w-8 h-8" />
                  <span className="text-xs">{uploadingMedia === 'image' ? 'Cargando...' : 'Agregar imagen'}</span>
                </button>
              )}
            </div>

            {/* Acciones de imagen si ya existe */}
            {selected.imagePath && (
              <div className="px-4 pt-3">
                <button
                  onClick={() => handlePickMedia('image')}
                  disabled={uploadingMedia === 'image'}
                  className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  {uploadingMedia === 'image' ? 'Cargando...' : 'Cambiar imagen'}
                </button>
              </div>
            )}

            {/* Info básica */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{selected.name}</h3>
              <Badge variant="blue" className="mt-1">{selected.primaryMuscleGroupName}</Badge>
            </div>

            {/* Video */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Video
                </span>
                {selected.videoPath && (
                  <button
                    onClick={() => handleRemoveMedia('video')}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {selected.videoPath ? (
                <>
                  <video
                    src={mediaUrl(selected.videoPath)}
                    controls
                    className="w-full rounded-lg max-h-40 bg-black"
                  />
                  <button
                    onClick={() => handlePickMedia('video')}
                    disabled={uploadingMedia === 'video'}
                    className="mt-1.5 flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    {uploadingMedia === 'video' ? 'Cargando...' : 'Cambiar video'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handlePickMedia('video')}
                  disabled={uploadingMedia === 'video'}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-400 hover:border-primary-400 hover:text-primary-400 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingMedia === 'video' ? 'Cargando...' : 'Agregar video'}
                </button>
              )}
            </div>

            {/* Descripción y notas */}
            <div className="p-4 space-y-3">
              {selected.description && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Descripción</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selected.description}</p>
                </div>
              )}
              {selected.techniqueNotes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Notas de técnica</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selected.techniqueNotes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-400">Equipamiento</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{selected.equipmentType}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tipo</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{selected.exerciseType}</p>
                </div>
              </div>

              {!selected.isDefault && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setEditExercise(selected); setShowModal(true) }}
                  >
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(selected)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {showModal && (
        <ExerciseModal
          exercise={editExercise}
          muscleGroups={muscleGroups}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadData() }}
        />
      )}
    </div>
  )
}

function ExerciseModal({
  exercise,
  muscleGroups,
  onClose,
  onSaved,
}: {
  exercise: Exercise | null
  muscleGroups: MuscleGroup[]
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!exercise
  const [name, setName] = useState(exercise?.name ?? '')
  const [primaryMuscleGroupId, setPrimaryMuscleGroupId] = useState(exercise?.primaryMuscleGroupId?.toString() ?? '')
  const [equipment, setEquipment] = useState(exercise?.equipmentType ?? 'peso_corporal')
  const [description, setDescription] = useState(exercise?.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mgOpts = muscleGroups.map((m) => ({ value: m.id.toString(), label: m.name }))
  const eqOpts = EQUIPMENT_TYPES.map((e) => ({ value: e.value, label: e.label }))

  async function handleSave() {
    if (!name.trim() || !primaryMuscleGroupId) { setError('Nombre y músculo son obligatorios'); return }
    setSaving(true)
    setError(null)
    const payload = {
      name: name.trim(),
      primaryMuscleGroupId: parseInt(primaryMuscleGroupId),
      secondaryMuscleGroupIds: [],
      equipmentType: equipment,
      exerciseType: 'libre',
      description: description.trim() || null,
      techniqueNotes: null,
      imagePath: null,
      isDefault: 0,
    }
    try {
      if (isEdit) {
        await call(() => api.exercises.update({ ...payload, id: exercise!.id }))
      } else {
        await call(() => api.exercises.create(payload))
      }
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
      <div className="space-y-4">
        <Input label="Nombre *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Select
          label="Músculo principal *"
          value={primaryMuscleGroupId}
          onChange={(e) => setPrimaryMuscleGroupId(e.target.value)}
          options={[{ value: '', label: 'Seleccionar...' }, ...mgOpts]}
        />
        <Select
          label="Equipamiento"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          options={eqOpts}
        />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Descripción de la técnica..."
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? 'Guardar' : 'Crear'}</Button>
        </div>
      </div>
    </Modal>
  )
}
