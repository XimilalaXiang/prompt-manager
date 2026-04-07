import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Prompt, Category, PromptVersion } from '../lib/types'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import BrutalBadge from '../components/BrutalBadge'
import { BrutalInput, BrutalTextarea, BrutalSelect } from '../components/BrutalInput'
import { Plus, Star, Search, Edit2, Trash2, X, GitCompare, Filter, Tag, History, RotateCcw, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PromptsPage() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState({ type: '', search: '', category: '', favorite: '' })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Prompt | null>(null)
  const [form, setForm] = useState({ title: '', description: '', content: '', category_id: '', tags: '', prompt_type: 'user' })
  const [tagsList, setTagsList] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [versionPrompt, setVersionPrompt] = useState<Prompt | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null)

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
      const payload = { ...form, tags: JSON.stringify(tagsList) }
      if (editing) {
        await api.put(`/prompts/${editing.id}`, payload)
        toast.success('更新成功')
      } else {
        await api.post('/prompts', payload)
        toast.success('创建成功')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ title: '', description: '', content: '', category_id: '', tags: '', prompt_type: 'user' })
      setTagsList([])
      setTagInput('')
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
    setTagsList(parseTags(p.tags))
    setTagInput('')
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

  const handleVersions = async (p: Prompt) => {
    setVersionPrompt(p)
    setSelectedVersion(null)
    try {
      const { data } = await api.get(`/prompts/${p.id}/versions`)
      setVersions(data || [])
    } catch { toast.error('加载版本历史失败') }
  }

  const handleRollback = async (version: PromptVersion) => {
    if (!versionPrompt) return
    if (!confirm(`确定回滚到版本 ${version.version_number}？当前内容将被替换。`)) return
    try {
      await api.post(`/prompts/${versionPrompt.id}/rollback/${version.version_number}`)
      toast.success(`已回滚到版本 ${version.version_number}`)
      setVersionPrompt(null)
      load()
    } catch { toast.error('回滚失败') }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-black text-3xl md:text-5xl tracking-tight">提示词管理</h1>
          <p className="font-mono text-sm md:text-base text-gray-600 mt-1">管理你的系统提示词和用户提示词</p>
        </div>
        <BrutalButton onClick={() => { setEditing(null); setForm({ title: '', description: '', content: '', category_id: '', tags: '', prompt_type: 'user' }); setTagsList([]); setTagInput(''); setShowForm(true) }}>
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
            <div className="md:col-span-2">
              <label className="font-black text-sm md:text-base block mb-1">标签</label>
              <div className="border-2 md:border-4 border-black rounded-none bg-white px-3 py-2 flex flex-wrap gap-1.5 items-center min-h-[44px] focus-within:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                {tagsList.map((tag, i) => (
                  <span
                    key={i}
                    className="border-2 border-black bg-[#ccff00] px-2 py-0.5 text-xs font-mono font-black cursor-pointer hover:bg-red-300 transition-colors flex items-center gap-1 select-none"
                    onClick={() => setTagsList((prev) => prev.filter((_, idx) => idx !== i))}
                    title="点击移除"
                  >
                    {tag} <X className="w-3 h-3" />
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = tagInput.trim()
                      if (val && !tagsList.includes(val)) {
                        setTagsList((prev) => [...prev, val])
                      }
                      setTagInput('')
                    }
                    if (e.key === 'Backspace' && !tagInput && tagsList.length > 0) {
                      setTagsList((prev) => prev.slice(0, -1))
                    }
                  }}
                  placeholder={tagsList.length === 0 ? '输入标签后按回车添加...' : '继续添加...'}
                  className="flex-1 min-w-[120px] outline-none font-mono text-sm bg-transparent"
                />
              </div>
              <p className="font-mono text-xs text-gray-500 mt-1">输入标签名后按 Enter 添加，点击标签可移除，Backspace 可删除最后一个</p>
            </div>
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
              <BrutalButton size="sm" variant="ghost" onClick={() => handleVersions(p)}>
                <History className="w-3 h-3" />
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

      {versionPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setVersionPrompt(null)}>
          <div className="bg-[#fffbe6] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black">
              <div>
                <h3 className="font-black text-xl flex items-center gap-2">
                  <History className="w-5 h-5" /> 版本历史
                </h3>
                <p className="font-mono text-sm text-gray-600">{versionPrompt.title}</p>
              </div>
              <button onClick={() => setVersionPrompt(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex min-h-0">
              <div className="w-1/3 border-r-4 border-black overflow-auto">
                {versions.length === 0 ? (
                  <p className="font-mono text-sm text-gray-500 p-4">暂无版本记录</p>
                ) : (
                  versions.map((v) => (
                    <div
                      key={v.id}
                      className={`px-4 py-3 border-b-2 border-black cursor-pointer hover:bg-[#ccff00]/30 transition-colors ${selectedVersion?.id === v.id ? 'bg-[#ccff00]/50' : ''}`}
                      onClick={() => setSelectedVersion(v)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm">v{v.version_number}</span>
                        <BrutalButton
                          size="sm"
                          variant="ghost"
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleRollback(v) }}
                          title="回滚到此版本"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </BrutalButton>
                      </div>
                      <p className="font-mono text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(v.created_at).toLocaleString()}
                      </p>
                      {v.change_description && (
                        <p className="font-mono text-xs text-gray-600 mt-1 truncate">{v.change_description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="flex-1 overflow-auto p-6">
                {selectedVersion ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-lg">版本 {selectedVersion.version_number} 内容</h4>
                      <BrutalButton size="sm" onClick={() => handleRollback(selectedVersion)}>
                        <RotateCcw className="w-3 h-3 mr-1" /> 回滚到此版本
                      </BrutalButton>
                    </div>
                    <pre className="font-mono text-sm whitespace-pre-wrap bg-white border-2 border-black p-4 leading-relaxed">
                      {selectedVersion.content}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <History className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-mono text-sm">选择左侧版本查看内容</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
