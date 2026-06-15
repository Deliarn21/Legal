import React, { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'

type HomeProps = {
  ssoLoginUrl: string
  user: any
  setUser: (user: any) => void
}

export default function Home({ user, setUser, ssoLoginUrl }: HomeProps) {
  const router = useRouter()
  const [showLocalLogin, setShowLocalLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ssoError = typeof router.query.error === 'string' ? router.query.error : ''

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [router, user])

  const handleLocalLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/local-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()

      if (!response.ok || !data.user) {
        setError(data.message || 'Login gagal.')
        return
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      router.push('/dashboard')
    } catch {
      setError('Login gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f2f4] flex items-center justify-center p-4">
      <div className="w-full max-w-[448px] rounded-[14px] bg-white px-8 py-9 shadow-[0_20px_35px_rgba(15,23,42,0.18)] sm:px-10">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <HasnurLogo />
          </div>
          <h1 className="text-xl font-bold text-slate-950">Login User</h1>
          <p className="mt-3 text-slate-500">Silakan login untuk melanjutkan</p>
        </div>

        {ssoError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {ssoErrorMessage(ssoError)}
          </div>
        )}

        <button
          onClick={() => {
            window.location.href = ssoLoginUrl
          }}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-[#2f67f2] px-5 py-4 font-bold text-white shadow-[0_12px_22px_rgba(47,103,242,0.32)] transition hover:bg-[#245ce6]"
          type="button"
        >
          <ShieldIcon />
          Login SSO Hasnur Group
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400">atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          onClick={() => setShowLocalLogin((current) => !current)}
          className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
          type="button"
        >
          <UserIcon />
          Login dengan NRP / Email
        </button>

        {showLocalLogin && (
          <form onSubmit={handleLocalLogin} className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="NRP / Email"
              type="text"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Password"
              type="password"
            />
            <button
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const appId = process.env.SSO_APP_ID || 'app_lDVx3NwGXZC3JSD5l0PpgFB5cE73oxEH'
  const ssoLoginUrl = process.env.SSO_LOGIN_URL || `https://sso.hasnurgroup.com/sso/login/${appId}`

  return {
    props: {
      ssoLoginUrl
    }
  }
}

function HasnurLogo() {
  return (
    <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full border-[4px] border-[#22a95a] bg-[#f7dd2a] shadow-sm">
      <div className="flex h-12 w-8 items-center justify-center gap-[3px]">
        <span className="h-11 w-[4px] bg-[#143b85]" />
        <span className="h-12 w-[4px] bg-[#143b85]" />
        <span className="h-11 w-[4px] bg-[#143b85]" />
        <span className="h-12 w-[4px] bg-[#143b85]" />
      </div>
      <span className="absolute h-[8px] w-[56px] rotate-[-28deg] rounded-full bg-[#ec1c24]" />
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3.75 5.75 6.1v5.15c0 4.05 2.62 7.72 6.25 8.95 3.63-1.23 6.25-4.9 6.25-8.95V6.1L12 3.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m9.25 12.15 1.8 1.8 3.95-4.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M4.75 20a7.25 7.25 0 0 1 14.5 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function ssoErrorMessage(error: string) {
  switch (error) {
    case 'sso_missing':
      return 'Callback SSO tidak lengkap. Silakan login ulang.'
    case 'sso_config':
      return 'Konfigurasi SSO lokal belum lengkap.'
    case 'sso_invalid':
      return 'Token SSO tidak valid atau sudah kedaluwarsa.'
    case 'sso_verify_failed':
      return 'Verifikasi SSO gagal. Silakan coba lagi.'
    case 'sso_session':
      return 'Session SSO tidak ditemukan. Silakan login ulang.'
    default:
      return 'Login SSO gagal. Silakan coba lagi.'
  }
}
