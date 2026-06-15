import type { NextApiRequest, NextApiResponse } from 'next'

type EssEmployee = {
  nrp: string
  name: string
  email?: string
  entity?: string
  department?: string
  picId?: number
}

const demoEssEmployees: EssEmployee[] = [
  {
    nrp: '1250013',
    name: 'Demo Employee Hasnur',
    email: '1250013@hasnurgroup.com',
    entity: 'HASNUR JAYA INTERNATIONAL',
    department: 'HASNUR JAYA INTERNATIONAL',
    picId: 3
  },
  {
    nrp: '100011',
    name: 'Ari Finance',
    email: 'ari.finance@company.com',
    entity: 'HASNUR JAYA INTERNATIONAL',
    department: 'Finance',
    picId: 3
  },
  {
    nrp: '100021',
    name: 'Nadia Legal',
    email: 'nadia.legal@company.com',
    entity: 'HASNUR GROUP INDONESIA',
    department: 'Legal',
    picId: 5
  }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ message: 'Method Not Allowed' })
    return
  }

  const nrp = typeof req.query.nrp === 'string' ? req.query.nrp.trim() : ''
  if (!nrp) {
    res.status(400).json({ found: false, message: 'NRP wajib diisi.' })
    return
  }

  const remoteEmployee = await lookupRemoteEssEmployee(nrp)
  if (remoteEmployee) {
    res.status(200).json({ found: true, employee: remoteEmployee })
    return
  }

  const demoEmployee = demoEssEmployees.find((employee) => employee.nrp === nrp)
  if (demoEmployee) {
    res.status(200).json({ found: true, employee: demoEmployee })
    return
  }

  res.status(200).json({ found: false })
}

async function lookupRemoteEssEmployee(nrp: string): Promise<EssEmployee | null> {
  const lookupUrl = process.env.ESS_LOOKUP_URL
  if (!lookupUrl) return null

  try {
    const url = lookupUrl.includes('{nrp}')
      ? lookupUrl.replace('{nrp}', encodeURIComponent(nrp))
      : `${lookupUrl}${lookupUrl.includes('?') ? '&' : '?'}nrp=${encodeURIComponent(nrp)}`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(process.env.ESS_API_TOKEN ? { Authorization: `Bearer ${process.env.ESS_API_TOKEN}` } : {})
      }
    })

    if (!response.ok) return null

    const data = await response.json()
    const source = data.employee || data.data || data.user || data
    if (!source?.nrp && !source?.employee_id) return null

    return {
      nrp: String(source.nrp || source.employee_id || nrp),
      name: String(source.name || source.nama || source.full_name || ''),
      email: source.email ? String(source.email) : '',
      entity: source.entity || source.entitas || source.company || source.department || '',
      department: source.department || source.entity || source.entitas || '',
      picId: Number(source.picId || source.pic_id) || undefined
    }
  } catch {
    return null
  }
}
