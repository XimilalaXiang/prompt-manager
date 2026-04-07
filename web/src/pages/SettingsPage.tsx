import { useState, useEffect } from 'react'
import api from '../lib/api'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import { BrutalInput } from '../components/BrutalInput'
import { Settings, Download, Upload, Sliders, Save, CloudUpload, Wifi, Trash2, RotateCcw, Loader2 } from 'lucide-react'
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
  const [webdav, setWebdav] = useState({ url: '', username: '', password: '', path: '' })
  const [webdavConfigured, setWebdavConfigured] = useState(false)
  const [webdavHasPassword, setWebdavHasPassword] = useState(false)
  const [backups, setBackups] = useState<any[]>([])
  const [backupLoading, setBackupLoading] = useState('')

  useEffect(() => { loadSettings(); loadWebDAVConfig() }, [])

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

  const loadWebDAVConfig = async () => {
    try {
      const { data } = await api.get('/backup/webdav/config')
      setWebdavConfigured(data.configured)
      setWebdavHasPassword(data.has_password || false)
      if (data.configured) {
        setWebdav({ url: data.url || '', username: data.username || '', password: '', path: data.path || '' })
        loadBackups()
      }
    } catch {}
  }

  const saveWebDAVConfig = async () => {
    setBackupLoading('config')
    try {
      await api.post('/backup/webdav/config', webdav)
      toast.success('WebDAV 配置已保存')
      setWebdavConfigured(true)
      if (webdav.password) setWebdavHasPassword(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || '保存失败')
    } finally { setBackupLoading('') }
  }

  const testWebDAV = async () => {
    setBackupLoading('test')
    try {
      const { data } = await api.post('/backup/webdav/test')
      if (data.status === 'ok') toast.success(data.message)
      else toast.error(data.message)
    } catch (err: any) {
      toast.error(err.response?.data?.error || '测试失败')
    } finally { setBackupLoading('') }
  }

  const createBackup = async () => {
    setBackupLoading('create')
    try {
      const { data } = await api.post('/backup/webdav/create')
      toast.success(`${data.message} — ${data.filename}`)
      loadBackups()
    } catch (err: any) {
      toast.error(err.response?.data?.error || '备份失败')
    } finally { setBackupLoading('') }
  }

  const loadBackups = async () => {
    try {
      const { data } = await api.get('/backup/webdav/list')
      setBackups(data.backups || [])
    } catch {}
  }

  const deleteBackup = async (name: string) => {
    if (!confirm(`确定删除备份 ${name}？`)) return
    try {
      await api.delete(`/backup/webdav/${name}`)
      toast.success('已删除')
      loadBackups()
    } catch { toast.error('删除失败') }
  }

  const restoreBackup = async (name: string) => {
    if (!confirm(`确定从 ${name} 恢复？当前数据将被覆盖！`)) return
    setBackupLoading('restore-' + name)
    try {
      const { data } = await api.post(`/backup/webdav/restore/${name}`)
      toast.success(data.message)
    } catch (err: any) {
      toast.error(err.response?.data?.error || '恢复失败')
    } finally { setBackupLoading('') }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
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

        <BrutalCard className="md:col-span-2">
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <CloudUpload className="w-5 h-5" /> WebDAV 备份
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <BrutalInput
              label="WebDAV URL"
              value={webdav.url}
              onChange={(e) => setWebdav((w) => ({ ...w, url: e.target.value }))}
              placeholder="https://dav.example.com"
            />
            <BrutalInput
              label="用户名"
              value={webdav.username}
              onChange={(e) => setWebdav((w) => ({ ...w, username: e.target.value }))}
              placeholder="username"
            />
            <BrutalInput
              label="密码"
              type="password"
              value={webdav.password}
              onChange={(e) => setWebdav((w) => ({ ...w, password: e.target.value }))}
              placeholder={webdavHasPassword ? '留空保持不变' : '输入密码'}
            />
            <BrutalInput
              label="远程路径"
              value={webdav.path}
              onChange={(e) => setWebdav((w) => ({ ...w, path: e.target.value }))}
              placeholder="/prompt-manager-backups"
            />
          </div>
          <div className="flex gap-2 mb-4">
            <BrutalButton size="sm" onClick={saveWebDAVConfig} disabled={backupLoading === 'config' || !webdav.url}>
              {backupLoading === 'config' ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <Save className="w-3 h-3 inline mr-1" />}
              保存配置
            </BrutalButton>
            <BrutalButton size="sm" variant="ghost" onClick={testWebDAV} disabled={!!backupLoading || !webdavConfigured}>
              {backupLoading === 'test' ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <Wifi className="w-3 h-3 inline mr-1" />}
              测试连接
            </BrutalButton>
            <BrutalButton size="sm" variant="secondary" onClick={createBackup} disabled={!!backupLoading || !webdavConfigured}>
              {backupLoading === 'create' ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <CloudUpload className="w-3 h-3 inline mr-1" />}
              立即备份
            </BrutalButton>
          </div>

          {backups.length > 0 && (
            <div>
              <h4 className="font-black text-sm mb-2">备份列表</h4>
              <div className="border-2 border-black max-h-48 overflow-y-auto">
                {backups.map((b) => (
                  <div key={b.name} className="flex items-center justify-between px-3 py-2 border-b border-black/10 last:border-0 font-mono text-xs">
                    <div>
                      <span className="font-black">{b.name}</span>
                      <span className="text-gray-500 ml-2">{formatSize(b.size)}</span>
                      <span className="text-gray-400 ml-2">{new Date(b.mod_time).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-1">
                      <BrutalButton
                        size="sm"
                        variant="ghost"
                        onClick={() => restoreBackup(b.name)}
                        disabled={!!backupLoading}
                        title="恢复"
                      >
                        {backupLoading === 'restore-' + b.name
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <RotateCcw className="w-3 h-3" />}
                      </BrutalButton>
                      <BrutalButton
                        size="sm"
                        variant="danger"
                        onClick={() => deleteBackup(b.name)}
                        disabled={!!backupLoading}
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </BrutalButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!webdavConfigured && (
            <p className="font-mono text-xs text-gray-500">配置 WebDAV 服务器后即可使用云端备份功能</p>
          )}
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
