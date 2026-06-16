import type { NextApiRequest, NextApiResponse } from 'next'

type DemoAccount = {
  identifiers: string[]
  password: string
  user: {
    id: number
    email: string
    name: string
    role: 'SUPER_ADMIN' | 'PIC' | 'USER'
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ message: 'Method Not Allowed' })
    return
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const superAdminEmail = (process.env.LOCAL_SUPERADMIN_EMAIL || '').toLowerCase()
  const superAdminPassword = process.env.LOCAL_SUPERADMIN_PASSWORD || ''
  const picEmail = (process.env.LOCAL_PIC_EMAIL || 'pic.finance@hasnurgroup.com').toLowerCase()
  const picPassword = process.env.LOCAL_PIC_PASSWORD || 'pic123'
  const signerEmail = (process.env.LOCAL_SIGNER_EMAIL || 'maya.finance@company.com').toLowerCase()
  const signerPassword = process.env.LOCAL_SIGNER_PASSWORD || 'user123'

  const demoAccounts: DemoAccount[] = [
    {
      identifiers: [superAdminEmail, ...parseAliases(process.env.LOCAL_SUPERADMIN_EMAIL_ALIASES)].filter(Boolean),
      password: superAdminPassword,
      user: {
        id: 1,
        email: superAdminEmail,
        name: 'Super Admin Legal',
        role: 'SUPER_ADMIN'
      }
    },
    {
      identifiers: [picEmail, ...parseAliases(process.env.LOCAL_PIC_EMAIL_ALIASES)].filter(Boolean),
      password: picPassword,
      user: {
        id: 3,
        email: picEmail,
        name: 'PIC Finance',
        role: 'PIC'
      }
    },
    {
      identifiers: [signerEmail, ...parseAliases(process.env.LOCAL_SIGNER_USERNAME_ALIASES)].filter(Boolean),
      password: signerPassword,
      user: {
        id: 12,
        email: signerEmail,
        name: 'Maya Finance',
        role: 'USER'
      }
    }
  ]

  if (demoAccounts.some((account) => account.identifiers.length === 0 || !account.password)) {
    res.status(500).json({ message: 'Konfigurasi login demo belum lengkap.' })
    return
  }

  const matchedAccount = demoAccounts.find((account) => account.identifiers.includes(email) && account.password === password)

  if (!matchedAccount) {
    res.status(401).json({ message: 'NRP / Email atau password tidak valid.' })
    return
  }

  res.status(200).json({
    user: matchedAccount.user
  })
}

function parseAliases(value?: string) {
  return (value || '')
    .split(',')
    .map((alias) => alias.trim().toLowerCase())
    .filter(Boolean)
}
