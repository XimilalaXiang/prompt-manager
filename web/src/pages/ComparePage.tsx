import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { AIConfig, Prompt } from '../lib/types'
import BrutalButton from '../components/BrutalButton'
import BrutalCard from '../components/BrutalCard'
import { BrutalTextarea, BrutalSelect } from '../components/BrutalInput'
import { Send, Save, Bot, Zap, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface ModelOption {
  configId: string
  config: AIConfig
  modelName: string
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  modelName?: string
  tokensUsed?: number
  responseTimeMs?: number
  timestamp: Date
}

export default function ComparePage() {
  const [searchParams] = useSearchParams()
  const [configs, setConfigs] = useState<AIConfig[]>([])
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [systemPrompt, setSystemPrompt] = useState(searchParams.get('systemPrompt') || '')
  const [userInput, setUserInput] = useState(searchParams.get('userPrompt') || '')
  const [messages, setMessages] = useState<Message[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadConfigs() }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadConfigs = async () => {
    try {
      const { data } = await api.get('/ai-configs?active=true')
      setConfigs(data || [])
      const options: ModelOption[] = []
      for (const c of data || []) {
        try {
          const models = JSON.parse(c.models || '[]')
          models.forEach((m: string) => options.push({ configId: c.id, config: c, modelName: m }))
        } catch {
          options.push({ configId: c.id, config: c, modelName: c.name })
        }
      }
      setModelOptions(options)
    } catch { toast.error('加载AI配置失败') }
  }

  const toggleModel = (key: string) => {
    setSelectedModels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const sendMessage = async () => {
    if (!userInput.trim() || selectedModels.length === 0) {
      toast.error('请输入消息并选择至少一个模型')
      return
    }

    setIsRunning(true)
    const userMsg: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    const prompt = userInput.trim()
    setUserInput('')

    try {
      const models = selectedModels.map((key) => {
        const [configId, ...rest] = key.split('-')
        const modelName = rest.join('-')
        return { config_id: configId, model_name: modelName, temperature }
      })

      const history = messages.map((m) => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      const { data } = await api.post('/compare/send', {
        prompt,
        system_prompt: systemPrompt,
        conversation_history: history,
        models,
      })

      const aiMessages: Message[] = data.results.map((r: any) => ({
        id: crypto.randomUUID(),
        type: 'assistant' as const,
        content: r.error || r.content,
        modelName: r.model_name,
        tokensUsed: r.tokens_used,
        responseTimeMs: r.response_time_ms,
        timestamp: new Date(),
      }))

      setMessages((prev) => [...prev, ...aiMessages])
    } catch (err: any) {
      toast.error(err.response?.data?.error || '发送失败')
    } finally {
      setIsRunning(false)
    }
  }

  const modelKey = (opt: ModelOption) => `${opt.configId}-${opt.modelName}`

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-black text-3xl md:text-5xl tracking-tight">AI 多模型对比</h1>
        <p className="font-mono text-sm text-gray-600 mt-1">与多个AI模型同时对话并对比响应效果</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <BrutalCard>
            <h3 className="font-black text-lg mb-3">对话设置</h3>
            <BrutalTextarea
              label="系统提示词"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="定义AI的角色和行为..."
              rows={4}
            />
            <div className="mt-4">
              <label className="font-black text-sm">温度: {temperature}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-1 accent-brutal-pink"
              />
            </div>
          </BrutalCard>

          <BrutalCard>
            <h3 className="font-black text-lg mb-3">选择模型</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {modelOptions.map((opt) => {
                const key = modelKey(opt)
                const checked = selectedModels.includes(key)
                return (
                  <label
                    key={key}
                    className={`
                      flex items-center gap-2 p-2 border-2 border-black cursor-pointer
                      transition-all duration-200
                      ${checked ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModel(key)}
                      className="accent-brutal-pink"
                    />
                    <div>
                      <div className="font-black text-sm">{opt.modelName}</div>
                      <div className="font-mono text-xs opacity-70">{opt.config.provider}</div>
                    </div>
                  </label>
                )
              })}
              {modelOptions.length === 0 && (
                <p className="font-mono text-sm text-gray-500">先在 AI配置 中添加模型</p>
              )}
            </div>
          </BrutalCard>
        </div>

        <div className="lg:col-span-3">
          <BrutalCard className="min-h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[50vh]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    max-w-[80%] p-3 border-2 border-black
                    ${msg.type === 'user'
                      ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,0,110,1)]'
                      : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }
                  `}>
                    {msg.type === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-black">
                        <Bot className="w-4 h-4" />
                        <span className="font-black text-sm">{msg.modelName}</span>
                        {msg.responseTimeMs && (
                          <span className="font-mono text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {msg.responseTimeMs}ms
                          </span>
                        )}
                        {msg.tokensUsed && (
                          <span className="font-mono text-xs">{msg.tokensUsed} tokens</span>
                        )}
                      </div>
                    )}
                    <p className="font-mono text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-black text-xl">开始对话</p>
                    <p className="font-mono text-sm text-gray-500">选择模型并发送消息</p>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t-2 md:border-t-4 border-black pt-4">
              <BrutalTextarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="输入消息..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={isRunning}
              />
              <div className="flex gap-2 mt-3">
                <BrutalButton onClick={sendMessage} disabled={isRunning || !userInput.trim()} className="flex-1">
                  <Send className="w-4 h-4 inline mr-1" />
                  {isRunning ? '发送中...' : '发送'}
                </BrutalButton>
              </div>
            </div>
          </BrutalCard>
        </div>
      </div>
    </div>
  )
}
