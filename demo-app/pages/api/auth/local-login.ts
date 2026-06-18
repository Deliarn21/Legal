import type { NextApiRequest, NextApiResponse } from 'next'
import { findLocalDemoAccount } from '../../../lib/localDemoAccounts'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ message: 'Method Not Allowed' })
    return
  }

  const identifier = typeof req.body?.email === 'string' ? req.body.email : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const matchedAccount = findLocalDemoAccount(identifier, password)

  if (!matchedAccount) {
    res.status(401).json({ message: 'NRP / Email atau password tidak valid.' })
    return
  }

  res.status(200).json({
    user: matchedAccount.user
  })
}
