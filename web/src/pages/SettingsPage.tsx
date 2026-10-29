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
  { key: 'default_temperature', label: 'Default Temperature', type: 'number', default: '0.7', hint: 'Default temperature on the Compare page (0-2)' },
  { key: 'default_top_p', label: 'Default Top-P', type: 'number', default: '1.0', hint: 'Default Top-P on the Compare page (0-1)' },
  { key: 'default_max_tokens', label: 'Default Max Tokens', type: 'number', default: '2000', hint: 'Maximum tokens in an AI reply' },
  { key: 'app_title', label: 'App Title', type: 'text', default: 'Prompt Manager', hint: 'Title shown in the browser tab' },
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
      toast.success('Settings saved')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save')
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
      toast.success('WebDAV config saved')
      setWebdavConfigured(true)
      if (webdav.password) setWebdavHasPassword(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally { setBackupLoading('') }
  }

  const testWebDAV = async () => {
    setBackupLoading('test')
    try {
      const { data } = await api.post('/backup/webdav/test')
      if (data.status === 'ok') toast.success(data.message)
      else toast.error(data.message)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Test failed')
    } finally { setBackupLoading('') }
  }

  const createBackup = async () => {
    setBackupLoading('create')
    try {
      const { data } = await api.post('/backup/webdav/create')
      toast.success(`${data.message} — ${data.filename}`)
      loadBackups()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Backup failed')
    } finally { setBackupLoading('') }
  }

  const loadBackups = async () => {
    try {
      const { data } = await api.get('/backup/webdav/list')
      setBackups(data.backups || [])
    } catch {}
  }

  const deleteBackup = async (name: string) => {
    if (!confirm(`Delete backup ${name}?`)) return
    try {
      await api.delete(`/backup/webdav/${name}`)
      toast.success('Deleted')
      loadBackups()
    } catch { toast.error('Failed to delete') }
  }

  const restoreBackup = async (name: string) => {
    if (!confirm(`Restore from ${name}? Current data will be overwritten!`)) return
    setBackupLoading('restore-' + name)
    try {
      const { data } = await api.post(`/backup/webdav/restore/${name}`)
      toast.success(data.message)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Restore failed')
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
      toast.success('Exported')
    } catch { toast.error('Export failed') }
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
      toast.success('Exported')
    } catch { toast.error('Export failed') }
  }

  const importPrompts = async () => {
    if (!importFile) return
    try {
      const text = await importFile.text()
      const json = JSON.parse(text)
      const { data } = await api.post('/import/prompts', { prompts: json.prompts || json })
      toast.success(`Imported: ${data.imported}/${data.total}`)
      setImportFile(null)
    } catch { toast.error('Import failed, please check the file format') }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-black text-3xl md:text-5xl tracking-tight">Settings</h1>
        <p className="font-mono text-sm text-gray-600 mt-1">System configuration and data management</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <BrutalCard className="md:col-span-2">
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Sliders className="w-5 h-5" /> System Settings
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
            <CloudUpload className="w-5 h-5" /> WebDAV Backup
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <BrutalInput
              label="WebDAV URL"
              value={webdav.url}
              onChange={(e) => setWebdav((w) => ({ ...w, url: e.target.value }))}
              placeholder="https://dav.example.com"
            />
            <BrutalInput
              label="Username"
              value={webdav.username}
              onChange={(e) => setWebdav((w) => ({ ...w, username: e.target.value }))}
              placeholder="username"
            />
            <BrutalInput
              label="Password"
              type="password"
              value={webdav.password}
              onChange={(e) => setWebdav((w) => ({ ...w, password: e.target.value }))}
              placeholder={webdavHasPassword ? 'Leave blank to keep unchanged' : 'Enter password'}
            />
            <BrutalInput
              label="Remote Path"
              value={webdav.path}
              onChange={(e) => setWebdav((w) => ({ ...w, path: e.target.value }))}
              placeholder="/prompt-manager-backups"
            />
          </div>
          <div className="flex gap-2 mb-4">
            <BrutalButton size="sm" onClick={saveWebDAVConfig} disabled={backupLoading === 'config' || !webdav.url}>
              {backupLoading === 'config' ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <Save className="w-3 h-3 inline mr-1" />}
              Save Config
            </BrutalButton>
            <BrutalButton size="sm" variant="ghost" onClick={testWebDAV} disabled={!!backupLoading || !webdavConfigured}>
              {backupLoading === 'test' ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <Wifi className="w-3 h-3 inline mr-1" />}
              Test Connection
            </BrutalButton>
            <BrutalButton size="sm" variant="secondary" onClick={createBackup} disabled={!!backupLoading || !webdavConfigured}>
              {backupLoading === 'create' ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : <CloudUpload className="w-3 h-3 inline mr-1" />}
              Back Up Now
            </BrutalButton>
          </div>

          {backups.length > 0 && (
            <div>
              <h4 className="font-black text-sm mb-2">Backups</h4>
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
                        title="Restore"
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
                        title="Delete"
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
            <p className="font-mono text-xs text-gray-500">Configure a WebDAV server to enable cloud backup</p>
          )}
        </BrutalCard>

        <BrutalCard>
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" /> Export Data
          </h3>
          <div className="space-y-3">
            <BrutalButton variant="ghost" className="w-full" onClick={() => exportPrompts('json')}>
              Export Prompts (JSON)
            </BrutalButton>
            <BrutalButton variant="ghost" className="w-full" onClick={() => exportPrompts('markdown')}>
              Export Prompts (Markdown)
            </BrutalButton>
            <BrutalButton variant="ghost" className="w-full" onClick={exportConfigs}>
              Export AI Configs (JSON)
            </BrutalButton>
          </div>
        </BrutalCard>

        <BrutalCard>
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" /> Import Data
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
              Import Prompts
            </BrutalButton>
          </div>
        </BrutalCard>

        <BrutalCard className="md:col-span-2">
          <h3 className="font-black text-xl mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" /> About
          </h3>
          <div className="font-mono text-sm space-y-2">
            <p><strong>Prompt Manager</strong> — AI Prompt Management and Multi-Model Comparison Platform</p>
            <p>Backend: Go + Gin + SQLite</p>
            <p>Frontend: React + Vite + Tailwind CSS</p>
            <p>Style: Neo-Brutalist</p>
          </div>
        </BrutalCard>
      </div>
    </div>
  )
}
