import { useState, useEffect } from 'react'
import api from '../lib/api'
import { ConversationSession, ConversationMessage, ConversationComparison } from '../lib/types'
import BrutalCard from '../components/BrutalCard'
import BrutalButton from '../components/BrutalButton'
import { History, Trash2, X, Bot, User, Star, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface SessionDetail {
  session: ConversationSession
  messages: ConversationMessage[]
  comparisons: ConversationComparison[]
}

export default function ConversationsPage() {
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [detail, setDetail] = useState<SessionDetail | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const { data } = await api.get('/conversations'); setSessions(data || []) }
    catch { toast.error('加载失败') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除?')) return
    try {
      await api.delete(`/conversations/${id}`)
      toast.success('已删除')
      if (detail?.session.id === id) setDetail(null)
      load()
    } catch { toast.error('删除失败') }
  }

  const handleView = async (id: string) => {
    try {
      const { data } = await api.get(`/conversations/${id}`)
      setDetail(data)
    } catch { toast.error('加载对话详情失败') }
  }

  const parseRatings = (ratingsJson: string): Record<string, any> => {
    try { return JSON.parse(ratingsJson) } catch { return {} }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-black text-3xl md:text-5xl tracking-tight">对话历史</h1>
        <p className="font-mono text-sm text-gray-600 mt-1">查看保存的对话和对比结果</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className={`${detail ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-4`}>
          {sessions.map((s) => (
            <BrutalCard
              key={s.id}
              hover
              className={detail?.session.id === s.id ? 'ring-4 ring-black' : ''}
            >
              <div
                className="cursor-pointer"
                onClick={() => handleView(s.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg truncate">{s.title}</h3>
                    <p className="font-mono text-xs text-gray-500">
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                    {s.system_prompt_content && (
                      <p className="font-mono text-xs text-gray-500 mt-1 truncate">
                        系统提示词: {s.system_prompt_content.substring(0, 60)}...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <BrutalButton size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }}>
                      <Trash2 className="w-3 h-3" />
                    </BrutalButton>
                  </div>
                </div>
              </div>
            </BrutalCard>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-20">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-black text-xl">没有对话历史</p>
              <p className="font-mono text-sm text-gray-500 mt-1">在对比页面保存对话后这里会显示</p>
            </div>
          )}
        </div>

        {detail && (
          <div className="lg:col-span-2 space-y-4">
            <BrutalCard>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-xl">{detail.session.title}</h3>
                  <p className="font-mono text-xs text-gray-500">
                    {new Date(detail.session.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setDetail(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {detail.session.system_prompt_content && (
                <div className="border-2 border-black bg-gray-50 p-3 mb-4">
                  <p className="font-black text-xs mb-1">系统提示词</p>
                  <p className="font-mono text-sm whitespace-pre-wrap">{detail.session.system_prompt_content}</p>
                </div>
              )}

              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {detail.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.message_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      max-w-[85%] p-3 border-2 border-black
                      ${msg.message_type === 'user'
                        ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,0,110,1)]'
                        : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                    `}>
                      {msg.message_type === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-black">
                          <Bot className="w-4 h-4" />
                          <span className="font-black text-sm">{msg.model_name}</span>
                          {msg.response_time_ms && (
                            <span className="font-mono text-xs">{msg.response_time_ms}ms</span>
                          )}
                          {msg.tokens_used && (
                            <span className="font-mono text-xs">{msg.tokens_used} tokens</span>
                          )}
                        </div>
                      )}
                      {msg.message_type === 'user' && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/30">
                          <User className="w-4 h-4" />
                          <span className="font-black text-sm">You</span>
                        </div>
                      )}
                      <p className="font-mono text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {detail.messages.length === 0 && (
                  <p className="text-center font-mono text-sm text-gray-500 py-8">暂无消息记录</p>
                )}
              </div>
            </BrutalCard>

            {detail.comparisons.length > 0 && (
              <BrutalCard>
                <h3 className="font-black text-lg mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" /> 对比评分结果
                </h3>
                {detail.comparisons.map((comp) => {
                  const r = parseRatings(comp.ratings)
                  return (
                    <div key={comp.id} className="border-2 border-black p-3 mb-3">
                      <div className="font-black text-sm mb-2">{comp.title}</div>
                      {Object.keys(r).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(r).map(([modelName, rating]: [string, any]) => (
                            <div key={modelName} className="flex items-center gap-3 border border-black/20 p-2 bg-gray-50">
                              <span className="font-black text-xs min-w-[100px]">{modelName}</span>
                              {rating.error ? (
                                <span className="font-mono text-xs text-red-500">{rating.error}</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-400" />
                                  <span className="font-black text-sm">{rating.overallScore || '?'}/5</span>
                                  {rating.reasoning && (
                                    <span className="font-mono text-xs text-gray-600 truncate max-w-xs">{rating.reasoning}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {comp.notes && (
                        <p className="font-mono text-xs text-gray-600 mt-2">{comp.notes}</p>
                      )}
                    </div>
                  )
                })}
              </BrutalCard>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
