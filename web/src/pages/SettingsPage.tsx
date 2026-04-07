import { useState } from 'react'
import api from '../lib/api'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import { Settings, Download, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [importFile, setImportFile] = useState<File | null>(null)

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
