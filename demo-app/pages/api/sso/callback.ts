import type { NextApiRequest, NextApiResponse } from 'next'

type SsoUser = {
  nrp?: string
  name?: string
  email?: string
}

type VerifyResponse = {
  valid?: boolean
  user?: SsoUser
  message?: string
}

const demoUsersByEmail: Record<string, any> = {
  'admin@company.com': {
    id: 1,
    email: 'admin@company.com',
    name: 'Admin User',
    role: 'SUPER_ADMIN'
  },
  'coordinator@company.com': {
    id: 2,
    email: 'coordinator@company.com',
    name: 'Coordinator',
    role: 'ADMIN',
    entity: 'HASNUR JAYA INTERNATIONAL'
  },
  'pic@company.com': {
    id: 3,
    email: 'pic@company.com',
    name: 'PIC Department',
    role: 'PIC'
  },
  'user@company.com': {
    id: 4,
    email: 'user@company.com',
    name: 'Regular User',
    role: 'USER'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).send('Method Not Allowed')
    return
  }

  const sessionId = readBodyValue(req.body, 'session_id')
  const ssoToken = readBodyValue(req.body, 'sso_token')
  const verifyUrl = process.env.SSO_VERIFY_URL
  const appSecret = process.env.SSO_APP_SECRET

  if (!sessionId || !ssoToken) {
    redirectToLogin(res, 'sso_missing')
    return
  }

  if (!verifyUrl || !appSecret) {
    redirectToLogin(res, 'sso_config')
    return
  }

  try {
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${ssoToken}`,
        'Content-Type': 'application/json',
        'X-App-Secret': appSecret
      },
      body: JSON.stringify({ session_id: sessionId })
    })
    const data = await readJson<VerifyResponse>(verifyResponse)

    if (!verifyResponse.ok || !data.valid || !data.user) {
      redirectToLogin(res, 'sso_invalid')
      return
    }

    const demoUser = mapSsoUserToDemoUser(data.user)
    const cookieValue = encodeURIComponent(JSON.stringify(demoUser))
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''

    res.setHeader(
      'Set-Cookie',
      `demo_sso_user=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300${secure}`
    )
    res.redirect(303, '/sso/complete')
  } catch {
    redirectToLogin(res, 'sso_verify_failed')
  }
}

function readBodyValue(body: unknown, key: string) {
  if (!body || typeof body !== 'object') return ''
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json()
  } catch {
    return {} as T
  }
}

function mapSsoUserToDemoUser(ssoUser: SsoUser) {
  const email = (ssoUser.email || '').toLowerCase()
  const existingUser = demoUsersByEmail[email]
  if (existingUser) return existingUser

  return {
    id: Number(ssoUser.nrp) || Date.now(),
    email: email || `${ssoUser.nrp || 'sso-user'}@employee.local`,
    name: ssoUser.name || 'SSO User',
    nrp: ssoUser.nrp || '',
    role: 'USER'
  }
}

function redirectToLogin(res: NextApiResponse, error: string) {
  res.redirect(303, `/?error=${encodeURIComponent(error)}`)
}
