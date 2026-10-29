import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { BrutalInput } from '../components/BrutalInput'
import BrutalButton from '../components/BrutalButton'
import { MessageSquare, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, setup, isConfigured } = useAuth()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    try {
      if (isConfigured) {
        await login(password)
        toast.success('Logged in!')
      } else {
        if (password.length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }
        await setup(password)
        toast.success('Setup complete!')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brutal-yellow flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <MessageSquare className="w-10 h-10 md:w-12 md:h-12" />
            <h1 className="font-black text-4xl md:text-5xl tracking-tight">
              PROMPT<span className="text-brutal-pink">MGR</span>
            </h1>
          </div>
          <p className="font-mono text-sm md:text-base">
            AI Prompt Management and Multi-Model Comparison Platform
          </p>
        </div>

        <div className="rounded-none border-2 md:border-4 border-black bg-white p-6 md:p-8
          shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5" />
            <h2 className="font-black text-xl md:text-2xl">
              {isConfigured ? 'Log In' : 'Initial Setup'}
            </h2>
          </div>

          {!isConfigured && (
            <p className="font-mono text-sm text-gray-600 mb-4 border-l-4 border-brutal-pink pl-3">
              First time here? Set a password to protect your data.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <BrutalInput
              type="password"
              label="Password"
              placeholder={isConfigured ? 'Enter password' : 'Set a password (min 6 characters)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isConfigured ? 1 : 6}
            />
            <BrutalButton
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Processing...' : isConfigured ? 'Log In' : 'Get Started'}
            </BrutalButton>
          </form>
        </div>
      </div>
    </div>
  )
}
