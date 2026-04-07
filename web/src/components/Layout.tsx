import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  MessageSquare, FileText, Settings, BookOpen, GitCompare,
  History, LogOut, Menu, X, Zap,
} from 'lucide-react'

const navItems = [
  { path: '/prompts', label: '提示词', icon: FileText },
  { path: '/compare', label: '对比', icon: GitCompare },
  { path: '/knowledge', label: '知识库', icon: BookOpen },
  { path: '/conversations', label: '对话历史', icon: History },
  { path: '/ai-configs', label: 'AI配置', icon: Zap },
  { path: '/settings', label: '设置', icon: Settings },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brutal-bg">
      <nav className="bg-white border-b-2 md:border-b-4 border-black px-4 md:px-8 py-3 md:py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/prompts" className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
            <span className="font-black text-xl md:text-2xl tracking-wider">
              PROMPT<span className="text-brutal-pink">MGR</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 font-mono text-sm
                    border-2 border-black transition-all duration-200
                    ${active
                      ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 font-mono text-sm border-2 border-black bg-white
                shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
                transition-all duration-200 text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
              hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white border-l-4 border-black p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-16 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-2 px-4 py-3 font-mono text-sm w-full
                      border-2 border-black transition-all duration-200
                      ${active ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={() => { logout(); setSidebarOpen(false) }}
                className="flex items-center gap-2 px-4 py-3 font-mono text-sm w-full
                  border-2 border-black bg-white text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {children}
      </main>
    </div>
  )
}
