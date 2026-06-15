import type { NextApiRequest, NextApiResponse } from 'next'

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

  if (!superAdminEmail || !superAdminPassword) {
    res.status(500).json({ message: 'Konfigurasi login demo belum lengkap.' })
    return
  }

  if (email !== superAdminEmail || password !== superAdminPassword) {
    res.status(401).json({ message: 'NRP / Email atau password tidak valid.' })
    return
  }

  res.status(200).json({
    user: {
      id: 1,
      email: superAdminEmail,
      name: 'Super Admin Legal',
      role: 'SUPER_ADMIN'
    }
  })
}
