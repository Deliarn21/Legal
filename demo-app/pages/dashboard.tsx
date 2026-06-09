import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PIC' | 'USER'
type AdminView = 'upload' | 'distribution' | 'analytics' | 'users'
type SignaturePlacementOption = 'left' | 'center' | 'right'

type Person = {
  id: number
  nrp?: string
  name: string
  email: string
  department: string
  entity?: string
  picId: number
}

type PicUser = {
  id: number
  name: string
  email: string
  department: string
}

type DocumentItem = {
  id: number
  name: string
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING' | 'OVERDUE'
  category: string
  deadline: string
  picId: number
  picName: string
  assigneeIds: number[]
  downloadedIds: number[]
  signedIds: number[]
  downloadUrl?: string
  previewText?: string[]
}

type WatermarkSettings = {
  text: string
  opacity: number
  size: number
}

type SignatureRecord = {
  docId: number
  personId: number
  signerName: string
  signatureDataUrl: string
}

const defaultWatermark: WatermarkSettings = {
  text: 'CONFIDENTIAL - PREVIEW ONLY',
  opacity: 11,
  size: 25
}

const defaultSignaturePlacement: SignaturePlacementOption = 'center'

const entityOptions = [
  'HASNUR JAYA',
  'ENERGI BAT',
  'HASNUR GROUP',
  'BARITO PUTERA',
  'HASNUR INF',
  'PUTERA BAR',
  'HASNUR INT',
  'HASNUR RES',
  'HASNUR MIT',
  'CIPTA DAYA',
  'INSAN PENDIDIK',
  'GRAHA NUS',
  'HASNUR CIT',
  'BAYANG NYA',
  'HASNUR RIU',
  'JAYA AGENS',
  'NUR JAYA SA',
  'BARITO JAYA',
  'MITRA SIGRA',
  'MAGMA SIG',
  'SINERGI SIG',
  'NUSANTARA',
  'NUR UMMI',
  'YAYASAN HA'
]

const entityPicUsers: PicUser[] = entityOptions.map((entity, index) => ({
  id: 1000 + index,
  name: entity,
  email: `${entity.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@company.local`,
  department: entity
}))

const peopleUploadTemplate = `NRP,Nama,Entitas
100001,Budi Santoso,HASNUR JAYA
100002,Siti Rahma,ENERGI BAT
100003,Agus Pratama,HASNUR GROUP
`

const integrityPreview = [
  'PAKTA INTEGRITAS',
  'Saya yang bertanda tangan dibawah ini:',
  'Nama:',
  'No. KTP:',
  'NRP:',
  'Jabatan:',
  'Secara sukarela dengan ini menyatakan, berkomitmen dan menjamin kepada PT Hasnur Group Indonesia dan PT Hasnur Jaya Utama beserta afiliasinya ("Perusahaan"), bahwa:',
  'Saya akan bersikap transparan, jujur, obyektif, dan akuntabel dalam melaksanakan tugas.',
  'Saya tidak akan melakukan perbuatan yang melanggar peraturan perundang-undangan, melanggar peraturan perusahaan, dan perilaku yang tidak dapat diterima masyarakat/tindakan asusila/bertentangan dengan norma agama.',
  'Saya akan berperan secara aktif dalam melakukan upaya-upaya pencegahan dan pemberantasan Korupsi, Kolusi dan Nepotisme (KKN).',
  'Saya tidak akan meminta atau menerima pemberian secara langsung berupa imbalan, komisi, uang tambahan, pelayanan, uang atau barang berharga, hadiah, bonus, atau gratifikasi dalam bentuk apapun kepada pihak lain yang berhubungan dengan pekerjaan dan tanggung jawab saya sebagai karyawan Perusahaan.',
  'Saya tidak akan melakukan usaha atau kegiatan yang secara langsung maupun tidak langsung bertentangan, berpotensi memiliki konflik kepentingan, dan berpotensi menimbulkan kerugian bagi Perusahaan.',
  'Saya akan menghindari pertentangan kepentingan (conflict of interest) dalam melaksanakan tugas.',
  'Saya senantiasa menerapkan standard operation procedures yang telah ditetapkan oleh Perusahaan dan ketentuan lainnya khususnya fungsi pengadaan barang dan jasa (procurement).',
  'Saya tidak akan menggunakan atau mengambil uang milik Perusahaan atau pelanggan untuk kepentingan pribadi atau kepentingan orang lain.',
  'Saya tidak akan melakukan tindakan pemalsuan apapun yang dapat merugikan Perusahaan, rekan kerja, dan pelanggan.',
  'Saya akan berkomitmen menjaga nama baik dan reputasi Perusahaan.',
  'Demikian Surat Pakta Integritas dan Pernyataan Kerahasiaan ini telah saya baca dan mengerti dalam keadaan sehat jasmani dan rohani, dengan penuh kesadaran tanpa ada paksaan dari pihak manapun.',
  'Jakarta,',
  'Yang Menyatakan,',
  '__________________________'
]

const initialPeople: Person[] = [
  { id: 11, nrp: '100011', name: 'Ari Finance', email: 'ari.finance@company.com', department: 'Finance', entity: 'HASNUR JAYA', picId: 3 },
  { id: 12, nrp: '100012', name: 'Maya Finance', email: 'maya.finance@company.com', department: 'Finance', entity: 'HASNUR JAYA', picId: 3 },
  { id: 13, nrp: '100013', name: 'Dimas Finance', email: 'dimas.finance@company.com', department: 'Finance', entity: 'ENERGI BAT', picId: 3 },
  { id: 21, nrp: '100021', name: 'Nadia Legal', email: 'nadia.legal@company.com', department: 'Legal', entity: 'HASNUR GROUP', picId: 5 },
  { id: 22, nrp: '100022', name: 'Bima Legal', email: 'bima.legal@company.com', department: 'Legal', entity: 'BARITO PUTERA', picId: 5 },
  { id: 31, nrp: '100031', name: 'Sari HR', email: 'sari.hr@company.com', department: 'Human Resources', entity: 'HASNUR INF', picId: 6 },
  { id: 32, nrp: '100032', name: 'Reno HR', email: 'reno.hr@company.com', department: 'Human Resources', entity: 'PUTERA BAR', picId: 6 }
]

const initialPicUsers: PicUser[] = [
  { id: 3, name: 'PIC Finance', email: 'pic@company.com', department: 'Finance' },
  { id: 5, name: 'PIC Legal', email: 'pic.legal@company.com', department: 'Legal' },
  { id: 6, name: 'PIC HR', email: 'pic.hr@company.com', department: 'Human Resources' }
]

const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    name: 'Annual Company Policy 2026',
    status: 'ACTIVE',
    category: 'Integrity',
    deadline: '2026-06-30',
    picId: 3,
    picName: 'PIC Finance',
    assigneeIds: [11, 12, 13],
    downloadedIds: [11, 12],
    signedIds: [11],
    downloadUrl: '/documents/Draft_Pakta_Integritas.pdf',
    previewText: integrityPreview
  },
  {
    id: 2,
    name: 'Compliance Requirements',
    status: 'ACTIVE',
    category: 'Compliance',
    deadline: '2026-07-15',
    picId: 5,
    picName: 'PIC Legal',
    assigneeIds: [21, 22],
    downloadedIds: [21],
    signedIds: []
  },
  {
    id: 3,
    name: 'Employee Handbook Update',
    status: 'COMPLETED',
    category: 'HR',
    deadline: '2026-05-20',
    picId: 6,
    picName: 'PIC HR',
    assigneeIds: [31, 32],
    downloadedIds: [31, 32],
    signedIds: [31, 32]
  },
  {
    id: 4,
    name: 'Data Protection Notice',
    status: 'ACTIVE',
    category: 'Legal',
    deadline: '2026-08-01',
    picId: 3,
    picName: 'PIC Finance',
    assigneeIds: [11, 12],
    downloadedIds: [11],
    signedIds: []
  }
]

const currentUserPersonId: Record<string, number> = {
  'user@company.com': 12
}

export default function Dashboard({ user, setUser }: any) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [adminView, setAdminView] = useState<AdminView>('analytics')
  const [selectedDocId, setSelectedDocId] = useState(1)
  const [expandedDocId, setExpandedDocId] = useState<number | null>(1)
  const [managedPeople, setManagedPeople] = useState<Person[]>(initialPeople)
  const [sessionSignatures, setSessionSignatures] = useState<SignatureRecord[]>([])
  const [watermark, setWatermark] = useState<WatermarkSettings>(defaultWatermark)
  const [signaturePlacement, setSignaturePlacement] = useState<SignaturePlacementOption>(defaultSignaturePlacement)

  const role = user?.role as Role
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN'
  const isPic = role === 'PIC'
  const personId = currentUserPersonId[user?.email] || 12

  const visibleDocuments = useMemo(() => {
    const docsWithSessionSignoff = initialDocuments.map((doc) => {
      const hasSessionSignature = sessionSignatures.some((signature) => signature.docId === doc.id && signature.personId === personId)
      if (!hasSessionSignature || doc.signedIds.includes(personId)) return doc
      return { ...doc, signedIds: [...doc.signedIds, personId] }
    })

    if (isAdmin) return docsWithSessionSignoff
    if (isPic) return docsWithSessionSignoff.filter((doc) => doc.picId === user.id)
    return docsWithSessionSignoff.filter((doc) => doc.assigneeIds.includes(personId))
  }, [isAdmin, isPic, personId, sessionSignatures, user?.id])

  const visiblePeople = useMemo(() => {
    if (isAdmin) return managedPeople
    if (isPic) return managedPeople.filter((person) => person.picId === user.id)
    return managedPeople.filter((person) => person.id === personId)
  }, [isAdmin, isPic, managedPeople, personId, user?.id])

  const selectedDocument = useMemo(() => {
    return visibleDocuments.find((doc) => doc.id === selectedDocId) || visibleDocuments[0]
  }, [selectedDocId, visibleDocuments])

  useEffect(() => {
    const saved = localStorage.getItem('watermarkSettings')
    const savedPlacement = localStorage.getItem('signaturePlacement') as SignaturePlacementOption | null
    if (savedPlacement && ['left', 'center', 'right'].includes(savedPlacement)) {
      setSignaturePlacement(savedPlacement)
    }
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      setWatermark({ ...defaultWatermark, text: parsed.text || defaultWatermark.text })
    } catch {
      setWatermark(defaultWatermark)
    }
  }, [])

  useEffect(() => {
    if (selectedDocument) setSelectedDocId(selectedDocument.id)
  }, [selectedDocument])

  const saveWatermark = (next: WatermarkSettings) => {
    const textOnlySettings = { ...defaultWatermark, text: next.text }
    setWatermark(textOnlySettings)
    localStorage.setItem('watermarkSettings', JSON.stringify(textOnlySettings))
  }

  const saveSignaturePlacement = (placement: SignaturePlacementOption) => {
    setSignaturePlacement(placement)
    localStorage.setItem('signaturePlacement', placement)
  }

  const saveDirectSignature = (signature: SignatureRecord) => {
    setSessionSignatures((current) => [
      ...current.filter((item) => !(item.docId === signature.docId && item.personId === signature.personId)),
      signature
    ])
  }

  const totals = useMemo(() => {
    const assignments = visibleDocuments.reduce((sum, doc) => sum + doc.assigneeIds.length, 0)
    const signed = visibleDocuments.reduce((sum, doc) => sum + doc.signedIds.length, 0)
    const downloaded = visibleDocuments.reduce((sum, doc) => sum + doc.downloadedIds.length, 0)
    const pending = visibleDocuments.filter((doc) => {
      if (role === 'USER') return !doc.signedIds.includes(personId)
      return doc.signedIds.length < doc.assigneeIds.length
    }).length

    return {
      active: visibleDocuments.filter((doc) => doc.status === 'ACTIVE').length,
      pending,
      completed: role === 'USER'
        ? visibleDocuments.filter((doc) => doc.signedIds.includes(personId)).length
        : visibleDocuments.filter((doc) => doc.status === 'COMPLETED').length,
      downloaded,
      compliance: assignments ? Math.round((signed / assignments) * 100) : 0
    }
  }, [personId, role, visibleDocuments])

  const notifications = useMemo(() => {
    if (role === 'USER') {
      return visibleDocuments
        .filter((doc) => !doc.signedIds.includes(personId))
        .map((doc) => ({
          id: doc.id,
          title: doc.downloadedIds.includes(personId) ? 'Upload signed document' : 'Download document',
          message: `${doc.name} needs your ${doc.downloadedIds.includes(personId) ? 'signed PDF upload' : 'download confirmation'}.`,
          timestamp: `Deadline ${formatDate(doc.deadline)}`
        }))
    }

    return visibleDocuments
      .filter((doc) => doc.signedIds.length < doc.assigneeIds.length)
      .map((doc) => ({
        id: doc.id,
        title: isAdmin ? `Pending at ${doc.picName}` : 'Pending team submissions',
        message: `${doc.assigneeIds.length - doc.signedIds.length} assignee(s) still need to sign ${doc.name}.`,
        timestamp: `Deadline ${formatDate(doc.deadline)}`
      }))
  }, [isAdmin, personId, role, visibleDocuments])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
  }

  if (!user) return null

  const pageTitle = role === 'USER'
    ? 'My Signoff Documents'
    : isPic
      ? `${user.name} Workspace`
      : 'Admin Control Center'

  const pageSubtitle = role === 'USER'
    ? 'Download assigned PDF files and upload your signed copies.'
    : isPic
      ? 'Monitor assigned users and documents for your department.'
      : 'Monitor all PIC teams, assignments, and distribution progress.'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Digital PDF Signoff</h1>
            <p className="text-slate-600 text-sm">{pageSubtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-slate-900">{user.name}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(role)}`}>
                {roleLabel(role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-slate-900 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">{pageTitle}</h2>
          <p className="text-sm text-slate-600 mt-1">{scopeText(role)}</p>
        </div>

        <div className={`grid grid-cols-1 gap-4 mb-8 ${role === 'USER' ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
          {role === 'USER' ? (
            <>
              <StatCard label="Belum Signoff" value={totals.pending} tone="amber" />
              <StatCard label="Completed" value={totals.completed} tone="green" />
            </>
          ) : (
            <>
              <StatCard label="Active Documents" value={totals.active} tone="blue" />
              <StatCard label="Pending Items" value={totals.pending} tone="amber" />
              <StatCard label="Completed" value={totals.completed} tone="green" />
              <StatCard label="Compliance Rate" value={`${totals.compliance}%`} tone="indigo" />
            </>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200 flex gap-3 px-6 overflow-x-auto">
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</TabButton>
            <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')}>Documents</TabButton>
            <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')}>Notifications</TabButton>
            {(isAdmin || isPic) && (
              <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')}>
                {isAdmin ? 'PIC Teams' : 'Assigned Users'}
              </TabButton>
            )}
            {isAdmin && <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>Admin</TabButton>}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <SectionHeader title={role === 'USER' ? 'Required Actions' : 'Recent Documents'} />
                {role === 'USER' ? (
                  <UserDocumentWorkspace
                    docs={visibleDocuments}
                    selectedDoc={selectedDocument}
                    personId={personId}
                    watermark={watermark}
                    signaturePlacement={signaturePlacement}
                    signature={sessionSignatures.find((signature) => signature.docId === selectedDocument?.id && signature.personId === personId)}
                    onSelectDoc={setSelectedDocId}
                    onDirectSignoff={saveDirectSignature}
                  />
                ) : (
                  <DocumentCards docs={visibleDocuments.slice(0, 4)} role={role} personId={personId} />
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <DocumentsTable
                docs={visibleDocuments}
                role={role}
                personId={personId}
                people={visiblePeople}
                onPreview={role === 'USER' ? (docId) => {
                  setSelectedDocId(docId)
                  setActiveTab('overview')
                } : undefined}
                expandedDocId={expandedDocId}
                onToggleDetails={(docId) => setExpandedDocId(expandedDocId === docId ? null : docId)}
              />
            )}

            {activeTab === 'notifications' && (
              <div>
                <SectionHeader title="Notifications" />
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">i</div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{notif.title}</p>
                        <p className="text-sm text-slate-700">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{notif.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(isAdmin || isPic) && activeTab === 'team' && (
              <TeamPanel isAdmin={isAdmin} people={visiblePeople} picUsers={initialPicUsers} />
            )}

            {isAdmin && activeTab === 'admin' && (
              <AdminPanel
                adminView={adminView}
                setAdminView={setAdminView}
                isSuperAdmin={role === 'SUPER_ADMIN'}
                watermark={watermark}
                onWatermarkChange={saveWatermark}
                signaturePlacement={signaturePlacement}
                onSignaturePlacementChange={saveSignaturePlacement}
                people={managedPeople}
                onPeopleChange={setManagedPeople}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: 'blue' | 'amber' | 'green' | 'indigo' }) {
  const tones = {
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    green: 'text-green-700 bg-green-50 border-green-100',
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-100'
  }

  return (
    <div className={`rounded-lg border p-6 ${tones[tone]}`}>
      <h3 className="text-sm font-semibold text-slate-600">{label}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
}

function DocumentCards({ docs, role, personId }: { docs: DocumentItem[]; role: Role; personId: number }) {
  return (
    <div className="space-y-3">
      {docs.map((doc) => (
        <div key={doc.id} className="flex flex-col gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900">{doc.name}</h4>
            <p className="text-sm text-slate-600">{doc.category} - {doc.picName}</p>
          </div>
          <DocumentActions doc={doc} role={role} personId={personId} />
        </div>
      ))}
    </div>
  )
}

function UserDocumentWorkspace({
  docs,
  selectedDoc,
  personId,
  watermark,
  signaturePlacement,
  signature,
  onSelectDoc,
  onDirectSignoff
}: {
  docs: DocumentItem[]
  selectedDoc?: DocumentItem
  personId: number
  watermark: WatermarkSettings
  signaturePlacement: SignaturePlacementOption
  signature?: SignatureRecord
  onSelectDoc: (docId: number) => void
  onDirectSignoff: (signature: SignatureRecord) => void
}) {
  const [isProtected, setIsProtected] = useState(false)
  const [signoffDocId, setSignoffDocId] = useState<number | null>(null)

  useEffect(() => {
    let timer: number | undefined
    const showCover = () => {
      setIsProtected(true)
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => setIsProtected(false), 1600)
    }
    const handleVisibility = () => setIsProtected(document.hidden || !document.hasFocus())
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const blocked =
        key === 'printscreen' ||
        (event.ctrlKey && ['p', 's', 'u'].includes(key)) ||
        (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        key === 'f12'

      if (blocked) {
        event.preventDefault()
        showCover()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleVisibility)
    window.addEventListener('focus', handleVisibility)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      if (timer) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleVisibility)
      window.removeEventListener('focus', handleVisibility)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!selectedDoc) {
    return (
      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 text-slate-600">
        No document is assigned to you right now.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
      <div className="space-y-3">
        {docs.map((doc) => {
          const isSelected = selectedDoc.id === doc.id
          const signed = doc.signedIds.includes(personId)

          return (
            <button
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={`w-full text-left border rounded-lg p-4 transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-semibold text-slate-900 block">{doc.name}</span>
              <span className="text-xs text-slate-500 block mt-1">Deadline {formatDate(doc.deadline)}</span>
              <span className={`inline-block mt-3 px-2 py-1 rounded-full text-xs font-semibold ${
                signed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {signed ? 'Signed Off' : 'Action Required'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="font-bold text-slate-900">{selectedDoc.name}</h4>
            <p className="text-sm text-slate-600">Choose manual download-upload or sign off directly from this preview.</p>
          </div>
          <DocumentActions
            doc={selectedDoc}
            role="USER"
            personId={personId}
            onStartDirectSignoff={() => setSignoffDocId(selectedDoc.id)}
          />
        </div>
        {signoffDocId === selectedDoc.id && (
          <SignatureSignoffModal
            doc={selectedDoc}
            onCancel={() => setSignoffDocId(null)}
            onConfirm={(signatureDataUrl, signerName) => {
              onDirectSignoff({
                docId: selectedDoc.id,
                personId,
                signerName,
                signatureDataUrl
              })
              setSignoffDocId(null)
            }}
          />
        )}
        <div className="relative">
          {isProtected && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-slate-950/90 text-white text-center p-6">
              <div>
                <p className="font-bold">Preview hidden for document protection</p>
                <p className="text-sm text-slate-200 mt-1">Return focus to continue viewing.</p>
              </div>
            </div>
          )}
          <DocumentPreview
            doc={selectedDoc}
            watermark={watermark}
            signature={signature}
            signaturePlacement={signaturePlacement}
          />
        </div>
      </div>
    </div>
  )
}

function DocumentPreview({
  doc,
  watermark,
  signature,
  signaturePlacement
}: {
  doc: DocumentItem
  watermark: WatermarkSettings
  signature?: SignatureRecord
  signaturePlacement: SignaturePlacementOption
}) {
  const previewText = doc.previewText || [
    doc.name,
    'Preview text is not available for this demo document.',
    'The original document can still be downloaded from the action button.'
  ]

  const watermarkPositions = [
    { top: '9%', left: '6%' },
    { top: '10%', left: '58%' },
    { top: '36%', left: '25%' },
    { top: '37%', left: '72%' },
    { top: '64%', left: '7%' },
    { top: '66%', left: '57%' },
    { top: '88%', left: '30%' },
    { top: '88%', left: '76%' }
  ]

  return (
    <div
      className="bg-slate-100 border border-slate-200 rounded-lg p-4 overflow-auto protected-preview"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="relative mx-auto bg-white shadow-sm border border-slate-200 min-h-[720px] max-w-3xl p-10 text-slate-900">
        <div
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="relative h-full w-full">
            {watermarkPositions.map((position, item) => (
              <div
                key={item}
                className="absolute font-bold text-slate-500 uppercase text-center whitespace-nowrap"
                style={{
                  opacity: Math.min(watermark.opacity, 11) / 100,
                  fontSize: Math.min(watermark.size, 25),
                  transform: 'rotate(-32deg)',
                  width: 360,
                  ...position
                }}
              >
                {watermark.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative space-y-4 leading-7">
          {previewText.map((line, index) => (
            index === 0 ? (
              <h2 key={line} className="text-center text-xl font-bold tracking-wide mb-8">{line}</h2>
            ) : line.includes('____') ? (
              <SignaturePlacement key={`${line}-${index}`} signature={signature} placement={signaturePlacement} />
            ) : (
              <p key={`${line}-${index}`}>
                {line}
              </p>
            )
          ))}
        </div>
      </div>
    </div>
  )
}

function DocumentsTable({
  docs,
  role,
  personId,
  people,
  onPreview,
  expandedDocId,
  onToggleDetails
}: {
  docs: DocumentItem[]
  role: Role
  personId: number
  people: Person[]
  onPreview?: (docId: number) => void
  expandedDocId: number | null
  onToggleDetails: (docId: number) => void
}) {
  return (
    <div>
      <SectionHeader title={role === 'USER' ? 'My Assigned Documents' : 'Documents'} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Document</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">PIC</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Progress</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Deadline</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {docs.map((doc) => (
              <React.Fragment key={doc.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => onToggleDetails(doc.id)}
                      className="font-semibold text-left text-blue-700 hover:text-blue-900"
                    >
                      {doc.name}
                    </button>
                    <p className="text-xs text-slate-500 mt-1">{doc.category}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{doc.picName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusClass(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="w-28 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.round((doc.signedIds.length / doc.assigneeIds.length) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{doc.signedIds.length}/{doc.assigneeIds.length} signed</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(doc.deadline)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        onClick={() => onToggleDetails(doc.id)}
                        className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg transition"
                      >
                        {expandedDocId === doc.id ? 'Hide Detail' : 'View Detail'}
                      </button>
                      <DocumentActions
                        doc={doc}
                        role={role}
                        personId={personId}
                        compact
                        onPreview={onPreview ? () => onPreview(doc.id) : undefined}
                      />
                    </div>
                  </td>
                </tr>
                {expandedDocId === doc.id && (
                  <tr>
                    <td colSpan={6} className="px-4 pb-5">
                      <DocumentSignoffDetail doc={doc} people={people} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SignaturePlacement({
  signature,
  placement
}: {
  signature?: SignatureRecord
  placement: SignaturePlacementOption
}) {
  const alignment = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[placement]

  return (
    <div className={`mt-8 flex ${alignment}`}>
      <div className="w-64 text-center">
        {signature ? (
          <>
            <img
              src={signature.signatureDataUrl}
              alt={`Signature of ${signature.signerName}`}
              className="mx-auto h-20 w-full object-contain"
            />
            <div className="border-t border-slate-900 pt-1">
              <p className="text-sm font-semibold text-slate-900">{signature.signerName}</p>
            </div>
          </>
        ) : (
          <>
            <div className="h-20" />
            <div className="border-t border-slate-900 pt-1">
              <p className="text-sm text-slate-400">Signature and name</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DocumentSignoffDetail({ doc, people }: { doc: DocumentItem; people: Person[] }) {
  const assignees = doc.assigneeIds
    .map((id) => people.find((person) => person.id === id))
    .filter(Boolean) as Person[]
  const pendingCount = doc.assigneeIds.length - doc.signedIds.length

  return (
    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-900">Signoff Detail</h4>
          <p className="text-sm text-slate-600">
            {doc.signedIds.length} signed, {doc.downloadedIds.length} downloaded, {pendingCount} pending approval.
          </p>
        </div>
        <span className="text-sm font-semibold text-blue-700">PIC Owner: {doc.picName}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {assignees.map((person) => {
          const signed = doc.signedIds.includes(person.id)
          const downloaded = doc.downloadedIds.includes(person.id)

          return (
            <div key={person.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-500">{person.email}</p>
                  <p className="text-xs text-slate-500">{person.department}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  signed ? 'bg-green-100 text-green-800' : downloaded ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {signed ? 'Signed' : downloaded ? 'Downloaded' : 'Pending'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SignatureSignoffModal({
  doc,
  onCancel,
  onConfirm
}: {
  doc: DocumentItem
  onCancel: () => void
  onConfirm: (signatureDataUrl: string, signerName: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [signerName, setSignerName] = useState('')
  const [note, setNote] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * ratio)
      canvas.height = Math.round(rect.height * ratio)

      const context = canvas.getContext('2d')
      if (!context) return
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.strokeStyle = '#0f172a'
      context.lineWidth = 2.5
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    event.preventDefault()
    canvas.setPointerCapture(event.pointerId)
    isDrawingRef.current = true
    lastPointRef.current = getPoint(event)
    setHasSignature(true)
  }

  const drawSignature = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    event.preventDefault()

    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    const lastPoint = lastPointRef.current
    const nextPoint = getPoint(event)
    if (!context || !lastPoint) return

    context.beginPath()
    context.moveTo(lastPoint.x, lastPoint.y)
    context.lineTo(nextPoint.x, nextPoint.y)
    context.stroke()
    lastPointRef.current = nextPoint
  }

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    isDrawingRef.current = false
    lastPointRef.current = null
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const submitSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !signerName.trim() || !accepted || !hasSignature) return
    onConfirm(canvas.toDataURL('image/png'), signerName.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 md:items-center md:p-6">
      <div className="w-full max-w-3xl max-h-[94vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-200 p-4 md:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900">Draw Signature</h4>
              <p className="text-sm text-slate-600 mt-1">{doc.name}</p>
            </div>
            <button
              onClick={onCancel}
              className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="signature-tutorial" aria-hidden="true">
                <div className="signature-guide-line" />
                <div className="signature-guide-pen" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Short guide</p>
                <p className="text-sm text-slate-600">
                  Use one smooth stroke inside the blank box. On mobile, rotate to landscape if you need more space.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={signerName}
              onChange={(event) => setSignerName(event.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
              placeholder="Signer name"
            />
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 bg-white"
              placeholder="Position or approval note"
            />
          </div>

          <div className="rounded-lg border border-slate-300 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Signature area</p>
              <button
                onClick={clearSignature}
                className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg transition"
              >
                Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={drawSignature}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              className="block w-full h-52 touch-none rounded-lg border border-dashed border-slate-300 bg-slate-50 md:h-64"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1"
            />
            <span>I confirm that I have reviewed the document and approve this signoff electronically.</span>
          </label>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onCancel}
              className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={submitSignature}
              disabled={!signerName.trim() || !accepted || !hasSignature}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Submit Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentActions({
  doc,
  role,
  personId,
  compact = false,
  onPreview,
  onStartDirectSignoff
}: {
  doc: DocumentItem
  role: Role
  personId: number
  compact?: boolean
  onPreview?: () => void
  onStartDirectSignoff?: () => void
}) {
  if (role === 'USER') {
    const downloaded = doc.downloadedIds.includes(personId)
    const signed = doc.signedIds.includes(personId)

    if (signed) return <span className="text-sm font-semibold text-green-700">Signed Off</span>

    return (
      <div className="flex flex-wrap gap-2">
        {onPreview && (
          <button
            onClick={onPreview}
            className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg transition"
          >
            Preview
          </button>
        )}
        <a
          href={doc.downloadUrl || '/documents/Draft_Pakta_Integritas.pdf'}
          download={`${doc.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.pdf`}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
        >
          {downloaded ? 'Download Again' : 'Download PDF'}
        </a>
        <label className="bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition cursor-pointer">
          Upload Signed PDF
          <input type="file" accept="application/pdf,.pdf" className="hidden" />
        </label>
        {onStartDirectSignoff && (
          <button
            onClick={onStartDirectSignoff}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
          >
            Signoff Directly
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={compact ? 'text-sm text-slate-700' : 'text-right'}>
      <p className="font-semibold text-slate-900">{doc.signedIds.length}/{doc.assigneeIds.length} signed</p>
      <p className="text-xs text-slate-500">Deadline {formatDate(doc.deadline)}</p>
    </div>
  )
}

function TeamPanel({ isAdmin, people, picUsers }: { isAdmin: boolean; people: Person[]; picUsers: PicUser[] }) {
  const grouped = picUsers.map((pic) => ({
    ...pic,
    members: people.filter((person) => person.picId === pic.id)
  })).filter((pic) => isAdmin || pic.members.length)

  return (
    <div>
      <SectionHeader title={isAdmin ? 'PIC Teams' : 'Assigned Users'} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {grouped.map((pic) => (
          <div key={pic.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="mb-4">
              <h4 className="font-bold text-slate-900">{pic.name}</h4>
              <p className="text-sm text-slate-600">{pic.department}</p>
            </div>
            <div className="space-y-2">
              {pic.members.map((person) => (
                <div key={person.id} className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="font-semibold text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-500">{person.email}</p>
                </div>
              ))}
              {!pic.members.length && <p className="text-sm text-slate-500">No assigned users yet.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPanel({
  adminView,
  setAdminView,
  isSuperAdmin,
  watermark,
  onWatermarkChange,
  signaturePlacement,
  onSignaturePlacementChange,
  people,
  onPeopleChange
}: {
  adminView: AdminView
  setAdminView: (view: AdminView) => void
  isSuperAdmin: boolean
  watermark: WatermarkSettings
  onWatermarkChange: (settings: WatermarkSettings) => void
  signaturePlacement: SignaturePlacementOption
  onSignaturePlacementChange: (placement: SignaturePlacementOption) => void
  people: Person[]
  onPeopleChange: (people: Person[]) => void
}) {
  const actions: { id: AdminView; label: string; description: string }[] = [
    { id: 'upload', label: 'Upload New Document', description: 'Prepare a new PDF package for distribution.' },
    { id: 'distribution', label: 'Create Distribution', description: 'Assign documents to PIC teams and recipients.' },
    { id: 'analytics', label: 'View Analytics', description: 'Review progress across all PIC ownership areas.' },
    { id: 'users', label: 'Manage Users', description: 'Maintain PIC ownership and recipient assignments.' }
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Admin Panel" />
      {isSuperAdmin && (
        <div className="space-y-4">
          <WatermarkSettingsPanel watermark={watermark} onChange={onWatermarkChange} />
          <SignaturePlacementSettingsPanel
            placement={signaturePlacement}
            onChange={onSignaturePlacementChange}
          />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => setAdminView(action.id)}
            className={`text-left border rounded-lg p-4 transition ${
              adminView === action.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <span className="font-bold block">{action.label}</span>
            <span className={`text-sm ${adminView === action.id ? 'text-blue-50' : 'text-slate-600'}`}>
              {action.description}
            </span>
          </button>
        ))}
      </div>
      <AdminDetail view={adminView} people={people} onPeopleChange={onPeopleChange} />
    </div>
  )
}

function SignaturePlacementSettingsPanel({
  placement,
  onChange
}: {
  placement: SignaturePlacementOption
  onChange: (placement: SignaturePlacementOption) => void
}) {
  const options: { id: SignaturePlacementOption; label: string }[] = [
    { id: 'left', label: 'Kiri bawah' },
    { id: 'center', label: 'Tengah bawah' },
    { id: 'right', label: 'Kanan bawah' }
  ]

  return (
    <div className="border border-green-100 rounded-lg p-5 bg-green-50">
      <div className="flex flex-col gap-1 mb-4">
        <h4 className="font-bold text-slate-900">Signature Placement</h4>
        <p className="text-sm text-slate-600">
          Pilih posisi tanda tangan yang akan dipakai pada preview dokumen user.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer ${
              placement === option.id
                ? 'border-green-500 bg-white text-green-800'
                : 'border-green-100 bg-white/70 text-slate-700'
            }`}
          >
            <input
              type="checkbox"
              checked={placement === option.id}
              onChange={() => onChange(option.id)}
            />
            <span className="font-semibold">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function WatermarkSettingsPanel({
  watermark,
  onChange
}: {
  watermark: WatermarkSettings
  onChange: (settings: WatermarkSettings) => void
}) {
  return (
    <div className="border border-blue-100 rounded-lg p-5 bg-blue-50">
      <div className="flex flex-col gap-1 mb-4">
        <h4 className="font-bold text-slate-900">Preview Watermark Settings</h4>
        <p className="text-sm text-slate-600">
          Applied only to document preview. Downloaded files remain original and clean.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Watermark Text
          <input
            value={watermark.text}
            onChange={(event) => onChange({ ...watermark, text: event.target.value, opacity: defaultWatermark.opacity, size: defaultWatermark.size })}
            className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal bg-white"
          />
        </label>
      </div>
    </div>
  )
}

function AdminDetail({
  view,
  people,
  onPeopleChange
}: {
  view: AdminView
  people: Person[]
  onPeopleChange: (people: Person[]) => void
}) {
  if (view === 'upload') {
    return (
      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
        <h4 className="font-bold text-slate-900 mb-4">Upload New Document</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border border-slate-300 rounded-lg px-3 py-2" placeholder="Document title" />
          <select className="border border-slate-300 rounded-lg px-3 py-2">
            <option>Policy</option>
            <option>Compliance</option>
            <option>Legal</option>
            <option>HR</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2">Choose PDF</button>
        </div>
      </div>
    )
  }

  if (view === 'distribution') {
    return (
      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
        <h4 className="font-bold text-slate-900 mb-4">Create Distribution</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border border-slate-300 rounded-lg px-3 py-2">
            {initialDocuments.map((doc) => <option key={doc.id}>{doc.name}</option>)}
          </select>
          <select className="border border-slate-300 rounded-lg px-3 py-2">
            {entityOptions.map((entity) => <option key={entity}>{entity}</option>)}
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2">Assign Distribution</button>
        </div>
      </div>
    )
  }

  if (view === 'users') {
    return <ManageUsersPanel people={people} onPeopleChange={onPeopleChange} />
  }

  return <DocumentAnalyticsPanel people={people} />
}

function DocumentAnalyticsPanel({ people }: { people: Person[] }) {
  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
      <h4 className="font-bold text-slate-900 mb-4">Document Approval Progress</h4>
      <div className="space-y-4">
        {initialDocuments.map((doc) => {
          const total = doc.assigneeIds.length
          const rate = total ? Math.round((doc.signedIds.length / total) * 100) : 0

          return (
            <div key={doc.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.picName} - Deadline {formatDate(doc.deadline)}</p>
                </div>
                <p className="font-bold text-blue-700">{doc.signedIds.length}/{total} signed ({rate}%)</p>
              </div>
              <div className="bg-slate-200 rounded-full h-2 my-3">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${rate}%` }} />
              </div>
              <DocumentSignoffDetail doc={doc} people={people} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ManageUsersPanel({
  people,
  onPeopleChange
}: {
  people: Person[]
  onPeopleChange: (people: Person[]) => void
}) {
  const emptyForm = {
    id: 0,
    nrp: '',
    name: '',
    email: '',
    department: entityOptions[0],
    entity: entityOptions[0],
    picId: initialPicUsers[0].id
  }
  const [form, setForm] = useState<Person>(emptyForm)
  const [selectedEntity, setSelectedEntity] = useState(entityOptions[0])
  const [entitySearch, setEntitySearch] = useState('')

  const filteredEntities = entityOptions.filter((entity) => (
    entity.toLowerCase().includes(entitySearch.toLowerCase())
  ))
  const selectedMembers = people.filter((person) => (person.entity || person.department) === selectedEntity)

  const savePerson = () => {
    if (!form.nrp?.trim() || !form.name.trim() || !form.entity) return

    const nextPerson = {
      ...form,
      email: form.email.trim() || `${form.nrp.trim()}@employee.local`,
      department: form.entity,
      entity: form.entity
    }

    if (form.id) {
      onPeopleChange(people.map((person) => person.id === form.id ? nextPerson : person))
    } else {
      const nextId = Math.max(...people.map((person) => person.id), 0) + 1
      onPeopleChange([...people, { ...nextPerson, id: nextId }])
    }

    setForm(emptyForm)
  }

  const uploadPeople = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const rows = text
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean)
        .slice(1)

      if (!rows.length) return

      const nextStartId = Math.max(...people.map((person) => person.id), 0) + 1
      const imported = rows.map((row, index) => {
        const [nrp = '', name = '', entity = entityOptions[0]] = row.split(',').map((cell) => cell.trim())
        const normalizedEntity = entityOptions.includes(entity) ? entity : entityOptions[0]

        return {
          id: nextStartId + index,
          nrp,
          name,
          email: `${nrp || `imported-${index + 1}`}@employee.local`,
          department: normalizedEntity,
          entity: normalizedEntity,
          picId: initialPicUsers[0].id
        }
      }).filter((person) => person.nrp && person.name)

      if (imported.length) onPeopleChange([...people, ...imported])
      event.target.value = ''
    }
    reader.readAsText(file)
  }

  const editPerson = (person: Person) => {
    setForm(person)
  }

  const removePerson = (personId: number) => {
    onPeopleChange(people.filter((person) => person.id !== personId))
    if (form.id === personId) setForm(emptyForm)
  }

  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
      <h4 className="font-bold text-slate-900 mb-4">Manage Users and PIC Ownership</h4>
      <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Template Upload PIC</p>
            <p className="text-sm text-slate-600">Format kolom: NRP, Nama, Entitas.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(peopleUploadTemplate)}`}
              download="template-maintain-pic.csv"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              Download Template
            </a>
            <label className="border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
              Upload CSV
              <input type="file" accept=".csv,text/csv" onChange={uploadPeople} className="hidden" />
            </label>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="font-semibold text-slate-900 mb-3">{form.id ? 'Edit User' : 'Create User'}</p>
          <div className="space-y-3">
            <input
              value={form.nrp || ''}
              onChange={(event) => setForm({ ...form, nrp: event.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="NRP"
            />
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Nama"
            />
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Email optional"
            />
            <select
              value={form.entity || entityOptions[0]}
              onChange={(event) => {
                setForm({ ...form, entity: event.target.value, department: event.target.value })
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              {entityOptions.map((entity) => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={savePerson}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2"
              >
                {form.id ? 'Save Changes' : 'Add User'}
              </button>
              {form.id !== 0 && (
                <button
                  onClick={() => setForm(emptyForm)}
                  className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg px-4 py-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 min-w-0">
          <div className="bg-white border border-slate-200 rounded-lg p-4 min-w-0">
            <div className="mb-3">
              <p className="font-semibold text-slate-900">Daftar Entitas</p>
              <p className="text-xs text-slate-500">Pilih satu entitas untuk melihat anggota.</p>
            </div>
            <input
              value={entitySearch}
              onChange={(event) => setEntitySearch(event.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3"
              placeholder="Cari entitas"
            />
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2">
              {filteredEntities.map((entity) => {
                const memberCount = people.filter((person) => (person.entity || person.department) === entity).length

                return (
                  <button
                    key={entity}
                    onClick={() => setSelectedEntity(entity)}
                    className={`w-full min-w-0 text-left rounded-lg border px-3 py-2 transition ${
                      selectedEntity === entity
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block truncate font-semibold">{entity}</span>
                    <span className="text-xs text-slate-500">{memberCount} user</span>
                  </button>
                )
              })}
              {!filteredEntities.length && <p className="text-sm text-slate-500">Entitas tidak ditemukan.</p>}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 min-w-0">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{selectedEntity}</p>
                <p className="text-xs text-slate-500">{selectedMembers.length} assigned user(s)</p>
              </div>
              <span className="text-xs font-semibold text-slate-600">Entitas</span>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {selectedMembers.map((person) => (
                <div key={person.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{person.name}</p>
                    <p className="text-xs text-slate-500 break-words">NRP {person.nrp || '-'} - {person.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => editPerson(person)}
                      className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removePerson(person.id)}
                      className="border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold px-3 py-2 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {!selectedMembers.length && <p className="text-sm text-slate-500">No users assigned to this entity.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRoleColor(role: Role) {
  switch (role) {
    case 'SUPER_ADMIN': return 'bg-indigo-100 text-indigo-800'
    case 'ADMIN': return 'bg-blue-100 text-blue-800'
    case 'PIC': return 'bg-amber-100 text-amber-800'
    case 'USER': return 'bg-green-100 text-green-800'
    default: return 'bg-slate-100 text-slate-800'
  }
}

function statusClass(status: DocumentItem['status']) {
  switch (status) {
    case 'ACTIVE': return 'bg-amber-100 text-amber-800'
    case 'COMPLETED': return 'bg-green-100 text-green-800'
    case 'PENDING': return 'bg-blue-100 text-blue-800'
    case 'OVERDUE': return 'bg-red-100 text-red-800'
    default: return 'bg-slate-100 text-slate-800'
  }
}

function roleLabel(role: Role) {
  if (role === 'SUPER_ADMIN') return 'Super Admin'
  if (role === 'ADMIN') return 'Admin'
  if (role === 'PIC') return 'PIC'
  return 'User'
}

function scopeText(role: Role) {
  if (role === 'SUPER_ADMIN') return 'You can review every PIC, recipient, document, and distribution.'
  if (role === 'ADMIN') return 'You can review all PIC teams and manage document distribution.'
  if (role === 'PIC') return 'You can only review users and documents assigned to your PIC area.'
  return 'You can only access documents assigned to you for download and signed upload.'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
