import { useState, useEffect } from 'react'
import api from '../lib/api'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import { BrutalInput } from '../components/BrutalInput'
import { Settings, Download, Upload, Sliders, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface AppSetting {
  id: string
  setting_key: string
  setting_value: string
  created_at: string
  updated_at: string
}

const settingsConfig = [
  { key: 'default_temperature', label: '默认 Temperature', type: 'number', default: '0.7', hint: '对比页面默认温度值 (0-2)' },
  { key: 'default_top_p', label: '默认 Top-P', type: 'number', default: '1.0', hint: '对比页面默认 Top-P 值 (0-1)' },
  { key: 'default_max_tokens', label: '默认 Max Tokens', type: 'number', default: '2000', hint: 'AI 回复最大 Token 数' },
  { key: 'app_title', label: '应用标题', type: 'text', default: 'Prompt Manager', hint: '显示在浏览器标签页的标题' },
]

export default function SettingsPage() {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const { data } = await api.get('/settings')
      const map: Record<string, string> = {}
      for (const s of data || []) {
        map[s.setting_key] = s.setting_value
      }
      setSettings(map)
    } catch {}
  }

  const handleSaveSetting = async (key: string, value: string) => {
    setSaving(true)
    try {
      await api.post('/settings', { key, value })
      setSettings((prev) => ({ ...prev, [key]: value }))
      toast.success('设置已保存')
    } catch (err: any) {
      toast.error(err.response?.data?.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const exportPrompts = async (format: string) => {
    try {
      const { data } = await api.get(`/export/prompts?format=${format}`)
      const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : data], {
        type: format === 'json' ? 'application/json' : 'text/markdown',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prompts.${format === 'json' ? 'json' : 'md'}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('导出成功')
    } catch { toast.error('导出失败') }
  }

  const exportConfigs = async () => {
    try {
      const { data } = await api.get('/export/ai-configs')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ai-configs.json'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('导出成功')
    } catch { toast.error('导出失败') }
  }

  const importPrompts = async () => {
    if (!importFile) return
    try {
      const text = await importFile.text()
      const json = JSON.parse(text)
      const { data } = await api.post('/import/prompts', { prompts: json.prompts || json })
      toast.success(`导入成功: ${data.imported}/${data.total}`)
      setImportFile(null)
    } catch { toast.error('导入失败，请检查文件格式') }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-black text-3xl md:text-5xl tracking-tight">设置</h1>
        <p className="font-mono text-sm text-gray-600 mt-1">系统配置和数据管理</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <BrutalCard className="md:col-span-2">
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5" /> 系统设置
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {settingsConfig.map((cfg) => {
              const value = settings[cfg.key] ?? cfg.default
              return (
                <div key={cfg.key}>
                  <BrutalInput
                    label={cfg.label}
                    type={cfg.type === 'number' ? 'number' : 'text'}
                    step={cfg.type === 'number' ? '0.1' : undefined}
                    value={value}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [cfg.key]: e.target.value }))}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="font-mono text-xs text-gray-400">{cfg.hint}</p>
                    <BrutalButton
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSaveSetting(cfg.key, value)}
                      disabled={saving}
                    >
                      <Save className="w-3 h-3" />
                    </BrutalButton>
                  </div>
                </div>
              )
            })}
          </div>
        </BrutalCard>

        <BrutalCard>
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" /> 导出数据
          </h3>
          <div className="space-y-3">
            <BrutalButton variant="ghost" className="w-full" onClick={() => exportPrompts('json')}>
              导出提示词 (JSON)
            </BrutalButton>
            <BrutalButton variant="ghost" className="w-full" onClick={() => exportPrompts('markdown')}>
              导出提示词 (Markdown)
            </BrutalButton>
            <BrutalButton variant="ghost" className="w-full" onClick={exportConfigs}>
              导出 AI 配置 (JSON)
            </BrutalButton>
          </div>
        </BrutalCard>

        <BrutalCard>
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" /> 导入数据
          </h3>
          <div className="space-y-3">
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full font-mono text-sm border-2 border-black p-2"
            />
            <BrutalButton
              variant="secondary"
              className="w-full"
              onClick={importPrompts}
              disabled={!importFile}
            >
              导入提示词
            </BrutalButton>
          </div>
        </BrutalCard>

        <BrutalCard className="md:col-span-2">
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" /> 关于
          </h3>
          <div className="font-mono text-sm space-y-2">
            <p><strong>Prompt Manager</strong> — AI 提示词管理与多模型对比平台</p>
            <p>后端: Go + Gin + SQLite</p>
            <p>前端: React + Vite + Tailwind CSS</p>
            <p>风格: Neo-Brutalist</p>
          </div>
        </BrutalCard>
      </div>
    </div>
  )
}
