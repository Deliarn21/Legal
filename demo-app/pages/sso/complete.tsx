import React, { useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'

type CompleteProps = {
  ssoUser: any
  setUser: (user: any) => void
}

export default function SsoComplete({ ssoUser, setUser }: CompleteProps) {
  const router = useRouter()

  useEffect(() => {
    if (!ssoUser) {
      router.replace('/?error=sso_session')
      return
    }

    localStorage.setItem('user', JSON.stringify(ssoUser))
    setUser(ssoUser)
    router.replace('/dashboard')
  }, [router, setUser, ssoUser])

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="font-semibold text-slate-900">Completing SSO login</p>
        <p className="mt-2 text-sm text-slate-600">Mohon tunggu sebentar.</p>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const rawUser = getCookie(req.headers.cookie || '', 'demo_sso_user')

  if (!rawUser) {
    return {
      redirect: {
        destination: '/?error=sso_session',
        permanent: false
      }
    }
  }

  try {
    const ssoUser = JSON.parse(decodeURIComponent(rawUser))

    res.setHeader('Set-Cookie', 'demo_sso_user=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')

    return {
      props: {
        ssoUser
      }
    }
  } catch {
    return {
      redirect: {
        destination: '/?error=sso_session',
        permanent: false
      }
    }
  }
}

function getCookie(cookieHeader: string, name: string) {
  const prefix = `${name}=`
  const cookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))

  return cookie ? cookie.slice(prefix.length) : ''
}
