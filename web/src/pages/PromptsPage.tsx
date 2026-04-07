import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Prompt, Category } from '../lib/types'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import BrutalBadge from '../components/BrutalBadge'
import { BrutalInput, BrutalTextarea, BrutalSelect } from '../components/BrutalInput'
import { Plus, Star, Search, Edit2, Trash2, X, GitCompare, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PromptsPage() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState({ type: '', search: '', category: '', favorite: '' })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Prompt | null>(null)
  const [form, setForm] = useState({ title: '', description: '', content: '', category_id: '', tags: '', prompt_type: 'user' })

  useEffect(() => { load() }, [filter])
  useEffect(() => { loadCategories() }, [])

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.type) params.set('type', filter.type)
      if (filter.search) params.set('search', filter.search)
      if (filter.category) params.set('category_id', filter.category)
      if (filter.favorite) params.set('favorite', filter.favorite)
      const { data } = await api.get(`/prompts?${params}`)
      setPrompts(data || [])
    } catch { toast.error('加载失败') }
  }

  const loadCategories = async () => {
    try {
      const { data } = await api.get('/categories')
      setCategories(data || [])
    } catch {}
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/prompts/${editing.id}`, form)
        toast.success('更新成功')
      } else {
        await api.post('/prompts', form)
        toast.success('创建成功')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ title: '', description: '', content: '', category_id: '', tags: '', prompt_type: 'user' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || '保存失败')
    }
  }

  const handleEdit = (p: Prompt) => {
    setEditing(p)
    setForm({
      title: p.title,
      description: p.description,
      content: p.content,
      category_id: p.category_id || '',
      tags: p.tags,
      prompt_type: p.prompt_type,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除?')) return
    try {
      await api.delete(`/prompts/${id}`)
      toast.success('已删除')
      load()
    } catch { toast.error('删除失败') }
  }

  const handleFavorite = async (id: string) => {
    try {
      await api.post(`/prompts/${id}/favorite`)
      load()
    } catch {}
  }

  const handleCompare = (p: Prompt) => {
    const params = new URLSearchParams()
    if (p.prompt_type === 'system') {
      params.set('systemPrompt', p.content)
    } else {
      params.set('userPrompt', p.content)
    }
    navigate(`/compare?${params}`)
  }

  const parseTags = (tags: string): string[] => {
    try { return JSON.parse(tags) } catch { return tags ? [tags] : [] }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-black text-3xl md:text-5xl tracking-tight">提示词管理</h1>
          <p className="font-mono text-sm md:text-base text-gray-600 mt-1">管理你的系统提示词和用户提示词</p>
        </div>
        <BrutalButton onClick={() => { setEditing(null); setForm({ title: '', description: '', content: '', category_id: '', tags: '', prompt_type: 'user' }); setShowForm(true) }}>
          <Plus className="w-4 h-4 inline mr-1" /> 新建提示词
        </BrutalButton>
      </div>

      <BrutalCard className="mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <BrutalInput
              placeholder="搜索提示词..."
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            />
          </div>
          <BrutalSelect
            label=""
            value={filter.type}
            onChange={(e: any) => setFilter((f) => ({ ...f, type: e.target.value }))}
            options={[
              { value: '', label: '全部类型' },
              { value: 'user', label: '用户提示词' },
              { value: 'system', label: '系统提示词' },
            ]}
          />
          <BrutalSelect
            label=""
            value={filter.category}
            onChange={(e: any) => setFilter((f) => ({ ...f, category: e.target.value }))}
            options={[
              { value: '', label: '全部分类' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <BrutalButton
            variant={filter.favorite ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter((f) => ({ ...f, favorite: f.favorite ? '' : 'true' }))}
          >
            <Star className="w-4 h-4" fill={filter.favorite ? '#fff' : 'none'} />
          </BrutalButton>
        </div>
      </BrutalCard>

      {showForm && (
        <BrutalCard className="mb-6 border-brutal-pink" accentColor="#ff006e">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl">{editing ? '编辑提示词' : '新建提示词'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null) }}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <BrutalInput label="标题" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <BrutalSelect
              label="类型"
              value={form.prompt_type}
              onChange={(e: any) => setForm((f) => ({ ...f, prompt_type: e.target.value }))}
              options={[{ value: 'user', label: '用户提示词' }, { value: 'system', label: '系统提示词' }]}
            />
            <BrutalInput label="描述" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <BrutalSelect
              label="分类"
              value={form.category_id}
              onChange={(e: any) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              options={[{ value: '', label: '无分类' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <div className="md:col-span-2">
              <BrutalTextarea label="内容" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={6} required />
            </div>
            <BrutalInput label="标签 (JSON 数组)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder='["标签1","标签2"]' />
          </div>
          <div className="mt-4 flex gap-2">
            <BrutalButton onClick={handleSave}>{editing ? '更新' : '创建'}</BrutalButton>
            <BrutalButton variant="ghost" onClick={() => { setShowForm(false); setEditing(null) }}>取消</BrutalButton>
          </div>
        </BrutalCard>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {prompts.map((p) => (
          <BrutalCard key={p.id} hover>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <BrutalBadge color={p.prompt_type === 'system' ? '#8338ec' : '#3a86ff'}>
                  {p.prompt_type === 'system' ? '系统' : '用户'}
                </BrutalBadge>
                {p.category && <BrutalBadge color={p.category.color}>{p.category.name}</BrutalBadge>}
              </div>
              <button onClick={() => handleFavorite(p.id)}>
                <Star className="w-5 h-5" fill={p.is_favorite ? '#fb5607' : 'none'} stroke={p.is_favorite ? '#fb5607' : 'currentColor'} />
              </button>
            </div>
            <h3 className="font-black text-lg mb-1 truncate">{p.title}</h3>
            {p.description && <p className="font-mono text-xs text-gray-500 mb-2 truncate">{p.description}</p>}
            <p className="font-mono text-sm text-gray-700 line-clamp-3 mb-3">{p.content}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {parseTags(p.tags).map((tag, i) => (
                <span key={i} className="border border-black px-1.5 py-0.5 text-xs font-mono">{tag}</span>
              ))}
            </div>
            <div className="flex gap-2 border-t-2 border-black pt-3">
              <BrutalButton size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                <Edit2 className="w-3 h-3" />
              </BrutalButton>
              <BrutalButton size="sm" variant="ghost" onClick={() => handleCompare(p)}>
                <GitCompare className="w-3 h-3" />
              </BrutalButton>
              <BrutalButton size="sm" variant="danger" onClick={() => handleDelete(p.id)}>
                <Trash2 className="w-3 h-3" />
              </BrutalButton>
            </div>
          </BrutalCard>
        ))}
      </div>

      {prompts.length === 0 && (
        <div className="text-center py-20">
          <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-black text-xl">没有找到提示词</p>
          <p className="font-mono text-sm text-gray-500 mt-1">创建你的第一个提示词开始吧</p>
        </div>
      )}
    </div>
  )
}
