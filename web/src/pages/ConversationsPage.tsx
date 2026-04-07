import { useState, useEffect } from 'react'
import api from '../lib/api'
import { ConversationSession } from '../lib/types'
import BrutalCard from '../components/BrutalCard'
import BrutalButton from '../components/BrutalButton'
import { History, Trash2, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<ConversationSession[]>([])

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const { data } = await api.get('/conversations'); setSessions(data || []) }
    catch { toast.error('加载失败') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除?')) return
    try { await api.delete(`/conversations/${id}`); toast.success('已删除'); load() }
    catch { toast.error('删除失败') }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-black text-3xl md:text-5xl tracking-tight">对话历史</h1>
        <p className="font-mono text-sm text-gray-600 mt-1">查看保存的对话和对比结果</p>
      </div>

      <div className="space-y-4">
        {sessions.map((s) => (
          <BrutalCard key={s.id} hover>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg">{s.title}</h3>
                <p className="font-mono text-xs text-gray-500">
                  {new Date(s.created_at).toLocaleString()}
                </p>
                {s.system_prompt_content && (
                  <p className="font-mono text-xs text-gray-500 mt-1 truncate max-w-md">
                    系统提示词: {s.system_prompt_content.substring(0, 80)}...
                  </p>
                )}
              </div>
              <BrutalButton size="sm" variant="danger" onClick={() => handleDelete(s.id)}>
                <Trash2 className="w-3 h-3" />
              </BrutalButton>
            </div>
          </BrutalCard>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-20">
          <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="font-black text-xl">没有对话历史</p>
          <p className="font-mono text-sm text-gray-500 mt-1">在对比页面保存对话后这里会显示</p>
        </div>
      )}
    </div>
  )
}
