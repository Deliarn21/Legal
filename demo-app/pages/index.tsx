import React, { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { LanguageToggle, useUiLanguage } from '../lib/uiLanguage'

type HomeProps = {
  ssoLoginUrl: string
  user: any
  setUser: (user: any) => void
  authLoaded?: boolean
}

export default function Home({ user, setUser, ssoLoginUrl, authLoaded }: HomeProps) {
  const router = useRouter()
  const { language, setLanguage } = useUiLanguage()
  const [showLocalLogin, setShowLocalLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ssoError = typeof router.query.error === 'string' ? router.query.error : ''

  useEffect(() => {
    if (authLoaded && user) router.push('/dashboard')
  }, [authLoaded, router, user])

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
    <div className="flex min-h-screen items-center justify-center bg-[#f1f2f4] p-4">
      <div className="fixed right-4 top-4 z-10">
        <LanguageToggle language={language} onChange={setLanguage} />
      </div>
      <div className="w-full max-w-[448px] rounded-[14px] bg-white px-8 py-9 shadow-[0_22px_42px_rgba(15,23,42,0.16)] sm:px-10">
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/hasnur-logo.png"
              alt="Hasnur Group"
              width={74}
              height={74}
              className="h-[74px] w-[74px] object-contain"
            />
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
          className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-full bg-[#3268ef] px-5 py-4 font-bold text-white shadow-[0_14px_24px_rgba(50,104,239,0.32)] transition hover:bg-[#255ce5] focus:outline-none focus:ring-4 focus:ring-blue-100"
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
          className="flex min-h-[60px] w-full items-center justify-center gap-3 rounded-full border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
          type="button"
        >
          <UserIcon />
          Login dengan NRP / Email
        </button>

        {showLocalLogin && (
          <div className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <form onSubmit={handleLocalLogin} className="space-y-3">
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
            <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
              Gunakan credential testing dari catatan terpisah project.
            </p>
          </div>
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
