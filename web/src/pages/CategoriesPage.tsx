import { useState, useEffect } from 'react'
import api from '../lib/api'
import { Category } from '../lib/types'
import BrutalCard from '../components/BrutalCard'
import BrutalButton from '../components/BrutalButton'
import { BrutalInput, BrutalTextarea } from '../components/BrutalInput'
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const colorPresets = [
  '#ff006e', '#3a86ff', '#8338ec', '#fb5607', '#ffbe0b',
  '#06d6a0', '#118ab2', '#073b4c', '#ef476f', '#26547c',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', description: '', color: '#ff006e' })

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const { data } = await api.get('/categories'); setCategories(data || []) }
    catch { toast.error('Failed to load') }
  }

  const resetForm = () => {
    setForm({ name: '', description: '', color: '#ff006e' })
    setEditing(null)
  }

  const handleEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, description: c.description, color: c.color || '#ff006e' })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Please enter a category name'); return }
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form)
        toast.success('Updated')
      } else {
        await api.post('/categories', form)
        toast.success('Created')
      }
      setShowForm(false)
      resetForm()
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deleting this category will unlink related prompts and knowledge articles. Delete?')) return
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-black text-3xl md:text-5xl tracking-tight">Category Management</h1>
          <p className="font-mono text-sm text-gray-600 mt-1">Manage categories for prompts and knowledge articles</p>
        </div>
        <BrutalButton onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="w-4 h-4 inline mr-1" /> New Category
        </BrutalButton>
      </div>

      {showForm && (
        <BrutalCard className="mb-6" accentColor="#8338ec">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl">{editing ? 'Edit Category' : 'New Category'}</h3>
            <button onClick={() => { setShowForm(false); resetForm() }}><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <BrutalInput
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Coding, Writing, Translation"
              required
            />
            <div>
              <label className="font-black text-sm block mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm((f) => ({ ...f, color }))}
                    className={`w-8 h-8 border-2 border-black transition-all ${form.color === color ? 'scale-125 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <BrutalTextarea
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description of the category..."
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <BrutalButton onClick={handleSave}>{editing ? 'Update' : 'Create'}</BrutalButton>
            <BrutalButton variant="ghost" onClick={() => { setShowForm(false); resetForm() }}>Cancel</BrutalButton>
          </div>
        </BrutalCard>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categories.map((c) => (
          <BrutalCard key={c.id} hover>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-6 h-6 border-2 border-black flex-shrink-0"
                style={{ backgroundColor: c.color || '#ff006e' }}
              />
              <h3 className="font-black text-lg">{c.name}</h3>
            </div>
            {c.description && (
              <p className="font-mono text-sm text-gray-600 mb-3">{c.description}</p>
            )}
            <p className="font-mono text-xs text-gray-400 mb-3">
              Created {new Date(c.created_at).toLocaleDateString()}
            </p>
            <div className="flex gap-2 border-t-2 border-black pt-3">
              <BrutalButton size="sm" variant="ghost" onClick={() => handleEdit(c)}>
                <Edit2 className="w-3 h-3" />
              </BrutalButton>
              <BrutalButton size="sm" variant="danger" onClick={() => handleDelete(c.id)}>
                <Trash2 className="w-3 h-3" />
              </BrutalButton>
            </div>
          </BrutalCard>
        ))}
      </div>

      {categories.length === 0 && !showForm && (
        <div className="text-center py-20">
          <Tag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-black text-xl">No categories</p>
          <p className="font-mono text-sm text-gray-500 mt-1">Create categories to organize your prompts and knowledge articles</p>
        </div>
      )}
    </div>
  )
}
