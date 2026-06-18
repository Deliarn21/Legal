export type DemoRole = 'SUPER_ADMIN' | 'ADMIN' | 'PIC' | 'USER'

export type DemoAccount = {
  group: 'Admin' | 'PIC' | 'Signer'
  login: string
  identifiers: string[]
  password: string
  accessNote: string
  user: {
    id: number
    email: string
    name: string
    role: DemoRole
    nrp?: string
    department?: string
    entity?: string
    position?: string
    noKtp?: string
  }
}

export type PublicDemoAccount = {
  group: DemoAccount['group']
  login: string
  password: string
  name: string
  email: string
  role: DemoRole
  nrp: string | null
  accessNote: string
}

export function getLocalDemoAccounts(env: NodeJS.ProcessEnv = process.env): DemoAccount[] {
  const superAdminEmail = normalize(env.LOCAL_SUPERADMIN_EMAIL || 'superadmin.legal@hasnurgroup.com')
  const superAdminPassword = env.LOCAL_SUPERADMIN_PASSWORD || 'admin123'
  const configuredPicEmail = normalize(env.LOCAL_PIC_EMAIL || '')
  const configuredSignerEmail = normalize(env.LOCAL_SIGNER_EMAIL || '')

  return [
    {
      group: 'Admin',
      login: superAdminEmail,
      identifiers: uniqueIdentifiers([
        superAdminEmail,
        'admin',
        'superadmin',
        ...parseAliases(env.LOCAL_SUPERADMIN_EMAIL_ALIASES)
      ]),
      password: superAdminPassword,
      accessNote: 'Upload dokumen dan atur distribusi semua PIC',
      user: {
        id: 1,
        email: superAdminEmail,
        name: 'Super Admin Legal',
        role: 'SUPER_ADMIN'
      }
    },
    {
      group: 'Admin',
      login: 'coordinator@company.com',
      identifiers: uniqueIdentifiers(['coordinator@company.com', 'admin.hji', '200002']),
      password: 'admin123',
      accessNote: 'Admin entitas HASNUR JAYA INTERNATIONAL',
      user: {
        id: 2,
        email: 'coordinator@company.com',
        name: 'Admin HJI',
        role: 'ADMIN',
        entity: 'HASNUR JAYA INTERNATIONAL'
      }
    },
    {
      group: 'PIC',
      login: 'pic@company.com',
      identifiers: uniqueIdentifiers([
        'pic@company.com',
        'pic.finance@hasnurgroup.com',
        configuredPicEmail,
        'pic.finance',
        '300003',
        ...parseAliases(env.LOCAL_PIC_EMAIL_ALIASES)
      ]),
      password: env.LOCAL_PIC_PASSWORD || 'pic123',
      accessNote: 'PIC Finance untuk Ari, Maya, dan Dimas',
      user: {
        id: 3,
        email: 'pic@company.com',
        name: 'PIC Finance',
        role: 'PIC',
        department: 'Finance'
      }
    },
    {
      group: 'PIC',
      login: 'pic.legal@company.com',
      identifiers: uniqueIdentifiers(['pic.legal@company.com', 'pic.legal', '300005']),
      password: 'pic123',
      accessNote: 'PIC Legal untuk Nadia dan Bima',
      user: {
        id: 5,
        email: 'pic.legal@company.com',
        name: 'PIC Legal',
        role: 'PIC',
        department: 'Legal'
      }
    },
    {
      group: 'PIC',
      login: 'pic.hr@company.com',
      identifiers: uniqueIdentifiers(['pic.hr@company.com', 'pic.hr', '300006']),
      password: 'pic123',
      accessNote: 'PIC HR untuk Sari dan Reno',
      user: {
        id: 6,
        email: 'pic.hr@company.com',
        name: 'PIC HR',
        role: 'PIC',
        department: 'Human Resources'
      }
    },
    signerAccount({
      id: 11,
      nrp: '100011',
      name: 'Ari Finance',
      email: 'ari.finance@company.com',
      department: 'Finance',
      entity: 'HASNUR JAYA INTERNATIONAL',
      position: 'Finance Officer',
      noKtp: '123456',
      aliases: ['user.finance.1']
    }),
    signerAccount({
      id: 12,
      nrp: '100012',
      name: 'Maya Finance',
      email: 'maya.finance@company.com',
      department: 'Finance',
      entity: 'HASNUR JAYA INTERNATIONAL',
      position: 'Finance Officer',
      noKtp: '6125367521673521',
      aliases: [
        'user@company.com',
        'user.signer@hasnurgroup.com',
        configuredSignerEmail,
        ...parseAliases(env.LOCAL_SIGNER_USERNAME_ALIASES)
      ],
      password: env.LOCAL_SIGNER_PASSWORD || 'user123'
    }),
    signerAccount({
      id: 13,
      nrp: '100013',
      name: 'Dimas Finance',
      email: 'dimas.finance@company.com',
      department: 'Finance',
      entity: 'ENERGI BATUBARA LESTARI',
      position: 'Finance Officer',
      noKtp: '234567',
      aliases: ['user.finance.2']
    }),
    signerAccount({
      id: 21,
      nrp: '100021',
      name: 'Nadia Legal',
      email: 'nadia.legal@company.com',
      department: 'Legal',
      entity: 'HASNUR GROUP INDONESIA',
      position: 'Legal Officer',
      noKtp: '321456',
      aliases: ['user.legal.1']
    }),
    signerAccount({
      id: 22,
      nrp: '100022',
      name: 'Bima Legal',
      email: 'bima.legal@company.com',
      department: 'Legal',
      entity: 'BARITO PUTERA',
      position: 'Legal Officer',
      noKtp: '654321',
      aliases: ['user.legal.2']
    }),
    signerAccount({
      id: 31,
      nrp: '100031',
      name: 'Sari HR',
      email: 'sari.hr@company.com',
      department: 'Human Resources',
      entity: 'HASNUR INFORMASI TEKNOLOGI',
      position: 'HR Officer',
      noKtp: '789123',
      aliases: ['user.hr.1']
    }),
    signerAccount({
      id: 32,
      nrp: '100032',
      name: 'Reno HR',
      email: 'reno.hr@company.com',
      department: 'Human Resources',
      entity: 'PUTERA BARITO BERBAKTI',
      position: 'HR Officer',
      noKtp: '987321',
      aliases: ['user.hr.2']
    })
  ]
}

export function findLocalDemoAccount(identifier: string, password: string) {
  const normalizedIdentifier = normalize(identifier)
  return getLocalDemoAccounts().find((account) => {
    return account.password === password && account.identifiers.includes(normalizedIdentifier)
  })
}

export function getPublicDemoAccounts(): PublicDemoAccount[] {
  return getLocalDemoAccounts().map((account) => ({
    group: account.group,
    login: account.login,
    password: account.password,
    name: account.user.name,
    email: account.user.email,
    role: account.user.role,
    nrp: account.user.nrp || null,
    accessNote: account.accessNote
  }))
}

function signerAccount({
  id,
  nrp,
  name,
  email,
  department,
  entity,
  position,
  noKtp,
  aliases = [],
  password = 'user123'
}: {
  id: number
  nrp: string
  name: string
  email: string
  department: string
  entity: string
  position?: string
  noKtp?: string
  aliases?: string[]
  password?: string
}): DemoAccount {
  return {
    group: 'Signer',
    login: nrp,
    identifiers: uniqueIdentifiers([nrp, email, ...aliases]),
    password,
    accessNote: `User tanda tangan ${department}`,
    user: {
      id,
      nrp,
      email,
      name,
      role: 'USER',
      department,
      entity,
      position,
      noKtp
    }
  }
}

function parseAliases(value?: string) {
  return (value || '')
    .split(',')
    .map((alias) => normalize(alias))
    .filter(Boolean)
}

function uniqueIdentifiers(values: string[]) {
  return Array.from(new Set(values.map((value) => normalize(value)).filter(Boolean)))
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}
