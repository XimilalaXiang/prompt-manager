import { useState, useEffect } from 'react'
import api from '../lib/api'
import { AIConfig } from '../lib/types'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import BrutalBadge from '../components/BrutalBadge'
import { BrutalInput, BrutalTextarea, BrutalSelect } from '../components/BrutalInput'
import { Plus, Edit2, Trash2, X, Key, Zap, RefreshCw, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const providerColors: Record<string, string> = {
  openai: '#10a37f',
  claude: '#8338ec',
  gemini: '#4285f4',
  custom: '#fb5607',
}

export default function AIConfigsPage() {
  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AIConfig | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [form, setForm] = useState({
    name: '', provider: 'openai', api_endpoint: '', models: '', api_key: '',
    max_tokens: 2000, temperature: 0.7, top_p: 1.0,
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await api.get('/ai-configs')
      setConfigs(data || [])
    } catch { toast.error('加载失败') }
  }

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        models: JSON.stringify(selectedModels),
        max_tokens: Number(form.max_tokens),
        temperature: Number(form.temperature),
        top_p: Number(form.top_p),
      }
      if (editing) {
        await api.put(`/ai-configs/${editing.id}`, payload)
        toast.success('更新成功')
      } else {
        await api.post('/ai-configs', payload)
        toast.success('创建成功')
      }
      setShowForm(false)
      setEditing(null)
      resetForm()
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || '保存失败')
    }
  }

  const resetForm = () => {
    setForm({
      name: '', provider: 'openai', api_endpoint: '', models: '', api_key: '',
      max_tokens: 2000, temperature: 0.7, top_p: 1.0,
    })
    setAvailableModels([])
    setSelectedModels([])
    setModelSearch('')
  }

  const handleEdit = (c: AIConfig) => {
    setEditing(c)
    const existingModels = parseModels(c.models)
    setSelectedModels(existingModels)
    setAvailableModels(existingModels)
    setForm({
      name: c.name, provider: c.provider, api_endpoint: c.api_endpoint,
      models: c.models, api_key: '',
      max_tokens: c.max_tokens, temperature: c.temperature, top_p: c.top_p,
    })
    setShowForm(true)
  }

  const handleFetchModels = async () => {
    if (!form.api_endpoint && !form.api_key && !editing) {
      toast.error('请先填写 API 端点和 API Key')
      return
    }
    setFetchingModels(true)
    try {
      const { data } = await api.post('/ai-configs/fetch-models', {
        api_endpoint: form.api_endpoint,
        api_key: form.api_key || undefined,
        config_id: editing?.id || undefined,
      })
      const models: string[] = data.models || []
      setAvailableModels(models)
      toast.success(`获取到 ${models.length} 个模型`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || '获取模型列表失败')
    } finally {
      setFetchingModels(false)
    }
  }

  const toggleModel = (model: string) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除?')) return
    try {
      await api.delete(`/ai-configs/${id}`)
      toast.success('已删除')
      load()
    } catch { toast.error('删除失败') }
  }

  const parseModels = (models: string): string[] => {
    try { return JSON.parse(models) } catch { return [] }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-black text-3xl md:text-5xl tracking-tight">AI 配置</h1>
          <p className="font-mono text-sm text-gray-600 mt-1">管理AI提供商和模型配置</p>
        </div>
        <BrutalButton onClick={() => { setEditing(null); resetForm(); setShowForm(true) }}>
          <Plus className="w-4 h-4 inline mr-1" /> 新建配置
        </BrutalButton>
      </div>

      {showForm && (
        <BrutalCard className="mb-6" accentColor="#ff006e">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-xl">{editing ? '编辑配置' : '新建配置'}</h3>
            <button onClick={() => { setShowForm(false); setEditing(null) }}><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <BrutalInput label="名称" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <BrutalSelect
              label="提供商"
              value={form.provider}
              onChange={(e: any) => setForm((f) => ({ ...f, provider: e.target.value }))}
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'claude', label: 'Claude' },
                { value: 'gemini', label: 'Gemini' },
                { value: 'custom', label: '自定义 (OpenAI兼容)' },
              ]}
            />
            <BrutalInput label="API 端点" value={form.api_endpoint} onChange={(e) => setForm((f) => ({ ...f, api_endpoint: e.target.value }))} placeholder="https://api.openai.com/v1/chat/completions" required />
            <BrutalInput label="API Key" type="password" value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))} placeholder={editing ? '留空保持不变' : '输入API Key'} />
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="font-black text-sm">模型列表</label>
                <BrutalButton size="sm" onClick={handleFetchModels} disabled={fetchingModels}>
                  <RefreshCw className={`w-3 h-3 inline mr-1 ${fetchingModels ? 'animate-spin' : ''}`} />
                  {fetchingModels ? '获取中...' : '获取模型列表'}
                </BrutalButton>
              </div>
              {selectedModels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedModels.map((m) => (
                    <span
                      key={m}
                      className="border-2 border-black bg-[#ccff00] px-2 py-0.5 text-xs font-mono cursor-pointer hover:bg-red-300 transition-colors"
                      onClick={() => toggleModel(m)}
                      title="点击移除"
                    >
                      {m} ×
                    </span>
                  ))}
                </div>
              )}
              {availableModels.length > 0 && (
                <>
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="搜索模型..."
                    className="w-full border-2 border-black rounded-none px-3 py-1.5 font-mono text-sm mb-2 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none transition-all duration-200"
                  />
                  <div className="border-2 border-black max-h-48 overflow-y-auto">
                    {availableModels
                      .filter((m) => !modelSearch || m.toLowerCase().includes(modelSearch.toLowerCase()))
                      .map((m) => (
                        <label
                          key={m}
                          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-100 font-mono text-sm border-b border-gray-200 last:border-0 transition-colors ${selectedModels.includes(m) ? 'bg-[#ccff00]/30' : ''}`}
                        >
                          <span className={`w-4 h-4 border-2 border-black flex items-center justify-center flex-shrink-0 ${selectedModels.includes(m) ? 'bg-black' : 'bg-white'}`}>
                            {selectedModels.includes(m) && <Check className="w-3 h-3 text-white" />}
                          </span>
                          <span className="truncate">{m}</span>
                        </label>
                      ))}
                  </div>
                </>
              )}
              {availableModels.length === 0 && selectedModels.length === 0 && (
                <p className="font-mono text-xs text-gray-500">填写 API 端点和 Key 后，点击「获取模型列表」自动加载可用模型</p>
              )}
            </div>
            <BrutalInput label="Max Tokens" type="number" value={form.max_tokens} onChange={(e) => setForm((f) => ({ ...f, max_tokens: Number(e.target.value) }))} />
            <BrutalInput label="Temperature" type="number" step="0.1" value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: Number(e.target.value) }))} />
          </div>
          <div className="mt-4 flex gap-2">
            <BrutalButton onClick={handleSave}>{editing ? '更新' : '创建'}</BrutalButton>
            <BrutalButton variant="ghost" onClick={() => { setShowForm(false); setEditing(null) }}>取消</BrutalButton>
          </div>
        </BrutalCard>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {configs.map((c) => (
          <BrutalCard key={c.id} hover>
            <div className="flex items-center justify-between mb-3">
              <BrutalBadge color={providerColors[c.provider] || '#000'}>{c.provider.toUpperCase()}</BrutalBadge>
              <div className="flex items-center gap-1">
                {c.has_api_key && <Key className="w-4 h-4 text-green-600" />}
                <span className={`w-3 h-3 border-2 border-black ${c.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
            </div>
            <h3 className="font-black text-lg mb-1">{c.name}</h3>
            <p className="font-mono text-xs text-gray-500 mb-2 truncate">{c.api_endpoint}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {parseModels(c.models).map((m, i) => (
                <span key={i} className="border border-black px-1.5 py-0.5 text-xs font-mono">{m}</span>
              ))}
            </div>
            <div className="font-mono text-xs text-gray-500 mb-3">
              Temp: {c.temperature} | Top-P: {c.top_p} | Max: {c.max_tokens}
            </div>
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

      {configs.length === 0 && (
        <div className="text-center py-20">
          <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-black text-xl">没有AI配置</p>
          <p className="font-mono text-sm text-gray-500 mt-1">添加你的第一个AI提供商配置</p>
        </div>
      )}
    </div>
  )
}
