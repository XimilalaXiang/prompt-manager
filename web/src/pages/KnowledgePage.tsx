import { useState, useEffect } from 'react'
import api from '../lib/api'
import { KnowledgeArticle, Category } from '../lib/types'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import BrutalBadge from '../components/BrutalBadge'
import { BrutalInput, BrutalTextarea, BrutalSelect } from '../components/BrutalInput'
import { Plus, Star, Edit2, Trash2, X, BookOpen, Archive, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function KnowledgePage() {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filter, setFilter] = useState({ search: '', category: '', archived: '' })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<KnowledgeArticle | null>(null)
  const [viewArticle, setViewArticle] = useState<KnowledgeArticle | null>(null)
  const [form, setForm] = useState({ title: '', content: '', description: '', category_id: '', tags: '', author: '', source_url: '' })

  useEffect(() => { load() }, [filter])
  useEffect(() => { loadCategories() }, [])

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.search) params.set('search', filter.search)
      if (filter.category) params.set('category_id', filter.category)
      if (filter.archived) params.set('archived', filter.archived)
      const { data } = await api.get(`/knowledge?${params}`)
      setArticles(data || [])
    } catch { toast.error('加载失败') }
  }

  const loadCategories = async () => {
    try { const { data } = await api.get('/categories'); setCategories(data || []) } catch {}
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/knowledge/${editing.id}`, form)
        toast.success('更新成功')
      } else {
        await api.post('/knowledge', form)
        toast.success('创建成功')
      }
      setShowForm(false); setEditing(null)
      setForm({ title: '', content: '', description: '', category_id: '', tags: '', author: '', source_url: '' })
      load()
    } catch (err: any) { toast.error(err.response?.data?.error || '保存失败') }
  }

  const handleEdit = (a: KnowledgeArticle) => {
    setEditing(a)
    setForm({ title: a.title, content: a.content, description: a.description, category_id: a.category_id || '', tags: a.tags, author: a.author, source_url: a.source_url })
    setShowForm(true)
    setViewArticle(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除?')) return
    try { await api.delete(`/knowledge/${id}`); toast.success('已删除'); load(); setViewArticle(null) } catch { toast.error('删除失败') }
  }

  const handleFavorite = async (id: string) => { try { await api.post(`/knowledge/${id}/favorite`); load() } catch {} }
  const handleArchive = async (id: string) => { try { await api.post(`/knowledge/${id}/archive`); load() } catch {} }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-black text-3xl md:text-5xl tracking-tight">知识库</h1>
          <p className="font-mono text-sm text-gray-600 mt-1">收集和管理参考资料与最佳实践</p>
        </div>
        <BrutalButton onClick={() => { setEditing(null); setForm({ title: '', content: '', description: '', category_id: '', tags: '', author: '', source_url: '' }); setShowForm(true); setViewArticle(null) }}>
          <Plus className="w-4 h-4 inline mr-1" /> 新建文章
        </BrutalButton>
      </div>

      <BrutalCard className="mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <BrutalInput placeholder="搜索文章..." value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
          </div>
          <BrutalSelect label="" value={filter.category} onChange={(e: any) => setFilter((f) => ({ ...f, category: e.target.value }))} options={[{ value: '', label: '全部分类' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          <BrutalButton variant={filter.archived ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter((f) => ({ ...f, archived: f.archived ? '' : 'true' }))}>
            <Archive className="w-4 h-4" />
          </BrutalButton>
        </div>
      </BrutalCard>

      {showForm && (
        <BrutalCard className="mb-6" accentColor="#ff006e">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl">{editing ? '编辑文章' : '新建文章'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null) }}><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <BrutalInput label="标题" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <BrutalSelect label="分类" value={form.category_id} onChange={(e: any) => setForm((f) => ({ ...f, category_id: e.target.value }))} options={[{ value: '', label: '无分类' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
            <BrutalInput label="描述" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <BrutalInput label="作者" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
            <BrutalInput label="来源URL" value={form.source_url} onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))} />
            <BrutalInput label="标签 (JSON数组)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder='["标签1"]' />
            <div className="md:col-span-2">
              <BrutalTextarea label="内容" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={8} required />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <BrutalButton onClick={handleSave}>{editing ? '更新' : '创建'}</BrutalButton>
            <BrutalButton variant="ghost" onClick={() => { setShowForm(false); setEditing(null) }}>取消</BrutalButton>
          </div>
        </BrutalCard>
      )}

      {viewArticle && (
        <BrutalCard className="mb-6" accentColor="#3a86ff">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-2xl">{viewArticle.title}</h2>
            <button onClick={() => setViewArticle(null)}><X className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-3 mb-4 font-mono text-xs text-gray-500">
            {viewArticle.author && <span>作者: {viewArticle.author}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {viewArticle.reading_time} 分钟阅读</span>
            <span>{viewArticle.word_count} 字</span>
          </div>
          <div className="font-mono text-sm whitespace-pre-wrap border-t-2 border-black pt-4">{viewArticle.content}</div>
          <div className="mt-4 flex gap-2 border-t-2 border-black pt-3">
            <BrutalButton size="sm" variant="ghost" onClick={() => handleEdit(viewArticle)}><Edit2 className="w-3 h-3 mr-1" /> 编辑</BrutalButton>
            <BrutalButton size="sm" variant="danger" onClick={() => handleDelete(viewArticle.id)}><Trash2 className="w-3 h-3 mr-1" /> 删除</BrutalButton>
          </div>
        </BrutalCard>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {articles.map((a) => (
          <BrutalCard key={a.id} hover className="cursor-pointer" onClick={() => setViewArticle(a)}>
            <div className="flex items-start justify-between mb-2">
              {a.category && <BrutalBadge color={a.category.color}>{a.category.name}</BrutalBadge>}
              <button onClick={(e) => { e.stopPropagation(); handleFavorite(a.id) }}>
                <Star className="w-5 h-5" fill={a.is_favorite ? '#fb5607' : 'none'} stroke={a.is_favorite ? '#fb5607' : 'currentColor'} />
              </button>
            </div>
            <h3 className="font-black text-lg mb-1 truncate">{a.title}</h3>
            {a.description && <p className="font-mono text-xs text-gray-500 mb-2 truncate">{a.description}</p>}
            <p className="font-mono text-sm text-gray-700 line-clamp-3 mb-3">{a.content}</p>
            <div className="flex items-center gap-3 font-mono text-xs text-gray-500 border-t-2 border-black pt-2">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.reading_time}min</span>
              <span>{a.word_count}字</span>
              {a.author && <span>{a.author}</span>}
            </div>
          </BrutalCard>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-black text-xl">知识库为空</p>
          <p className="font-mono text-sm text-gray-500 mt-1">添加你的第一篇文章</p>
        </div>
      )}
    </div>
  )
}
