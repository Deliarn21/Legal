import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PIC' | 'USER'
type AdminView = 'upload' | 'distribution' | 'analytics' | 'users'

type Person = {
  id: number
  name: string
  email: string
  department: string
  picId: number
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

const defaultWatermark: WatermarkSettings = {
  text: 'CONFIDENTIAL - PREVIEW ONLY',
  opacity: 16,
  size: 28
}

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

const people: Person[] = [
  { id: 11, name: 'Ari Finance', email: 'ari.finance@company.com', department: 'Finance', picId: 3 },
  { id: 12, name: 'Maya Finance', email: 'maya.finance@company.com', department: 'Finance', picId: 3 },
  { id: 13, name: 'Dimas Finance', email: 'dimas.finance@company.com', department: 'Finance', picId: 3 },
  { id: 21, name: 'Nadia Legal', email: 'nadia.legal@company.com', department: 'Legal', picId: 5 },
  { id: 22, name: 'Bima Legal', email: 'bima.legal@company.com', department: 'Legal', picId: 5 },
  { id: 31, name: 'Sari HR', email: 'sari.hr@company.com', department: 'Human Resources', picId: 6 },
  { id: 32, name: 'Reno HR', email: 'reno.hr@company.com', department: 'Human Resources', picId: 6 }
]

const picUsers = [
  { id: 3, name: 'PIC Finance', email: 'pic@company.com', department: 'Finance' },
  { id: 5, name: 'PIC Legal', email: 'pic.legal@company.com', department: 'Legal' },
  { id: 6, name: 'PIC HR', email: 'pic.hr@company.com', department: 'Human Resources' }
]

const documents: DocumentItem[] = [
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
    downloadUrl: '/documents/Draft_Pakta_Integritas.docx',
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
  const [watermark, setWatermark] = useState<WatermarkSettings>(defaultWatermark)

  const role = user?.role as Role
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN'
  const isPic = role === 'PIC'
  const personId = currentUserPersonId[user?.email] || 12

  const visibleDocuments = useMemo(() => {
    if (isAdmin) return documents
    if (isPic) return documents.filter((doc) => doc.picId === user.id)
    return documents.filter((doc) => doc.assigneeIds.includes(personId))
  }, [isAdmin, isPic, personId, user?.id])

  const visiblePeople = useMemo(() => {
    if (isAdmin) return people
    if (isPic) return people.filter((person) => person.picId === user.id)
    return people.filter((person) => person.id === personId)
  }, [isAdmin, isPic, personId, user?.id])

  const selectedDocument = useMemo(() => {
    return visibleDocuments.find((doc) => doc.id === selectedDocId) || visibleDocuments[0]
  }, [selectedDocId, visibleDocuments])

  useEffect(() => {
    const saved = localStorage.getItem('watermarkSettings')
    if (!saved) return

    try {
      setWatermark({ ...defaultWatermark, ...JSON.parse(saved) })
    } catch {
      setWatermark(defaultWatermark)
    }
  }, [])

  useEffect(() => {
    if (selectedDocument) setSelectedDocId(selectedDocument.id)
  }, [selectedDocument])

  const saveWatermark = (next: WatermarkSettings) => {
    setWatermark(next)
    localStorage.setItem('watermarkSettings', JSON.stringify(next))
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
      completed: visibleDocuments.filter((doc) => doc.status === 'COMPLETED').length,
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Documents" value={totals.active} tone="blue" />
          <StatCard label={role === 'USER' ? 'Need Action' : 'Pending Items'} value={totals.pending} tone="amber" />
          <StatCard label="Completed" value={totals.completed} tone="green" />
          <StatCard label="Compliance Rate" value={`${totals.compliance}%`} tone="indigo" />
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
                    onSelectDoc={setSelectedDocId}
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
                onPreview={role === 'USER' ? (docId) => {
                  setSelectedDocId(docId)
                  setActiveTab('overview')
                } : undefined}
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
              <TeamPanel isAdmin={isAdmin} people={visiblePeople} />
            )}

            {isAdmin && activeTab === 'admin' && (
              <AdminPanel
                adminView={adminView}
                setAdminView={setAdminView}
                isSuperAdmin={role === 'SUPER_ADMIN'}
                watermark={watermark}
                onWatermarkChange={saveWatermark}
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
  onSelectDoc
}: {
  docs: DocumentItem[]
  selectedDoc?: DocumentItem
  personId: number
  watermark: WatermarkSettings
  onSelectDoc: (docId: number) => void
}) {
  const [isProtected, setIsProtected] = useState(false)

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
                {signed ? 'Uploaded' : 'Action Required'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="font-bold text-slate-900">{selectedDoc.name}</h4>
            <p className="text-sm text-slate-600">Preview includes watermark. Download uses the original file.</p>
          </div>
          <DocumentActions doc={selectedDoc} role="USER" personId={personId} />
        </div>
        <div className="relative">
          {isProtected && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-slate-950/90 text-white text-center p-6">
              <div>
                <p className="font-bold">Preview hidden for document protection</p>
                <p className="text-sm text-slate-200 mt-1">Return focus to continue viewing.</p>
              </div>
            </div>
          )}
          <DocumentPreview doc={selectedDoc} watermark={watermark} />
        </div>
      </div>
    </div>
  )
}

function DocumentPreview({ doc, watermark }: { doc: DocumentItem; watermark: WatermarkSettings }) {
  const previewText = doc.previewText || [
    doc.name,
    'Preview text is not available for this demo document.',
    'The original document can still be downloaded from the action button.'
  ]

  const repeatedWatermarks = Array.from({ length: 30 }, (_, index) => index)

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
          <div className="grid grid-cols-3 gap-x-8 gap-y-12 -m-16">
            {repeatedWatermarks.map((item) => (
              <div
                key={item}
                className="font-bold text-slate-700 uppercase tracking-wide text-center whitespace-nowrap"
                style={{
                  opacity: watermark.opacity / 100,
                  fontSize: watermark.size,
                  transform: 'rotate(-32deg)',
                  width: 320,
                  height: 120
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
            ) : (
              <p key={`${line}-${index}`} className={line.includes('____') ? 'mt-8 text-center' : ''}>
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
  onPreview
}: {
  docs: DocumentItem[]
  role: Role
  personId: number
  onPreview?: (docId: number) => void
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
              <tr key={doc.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{doc.name}</td>
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
                  <DocumentActions doc={doc} role={role} personId={personId} compact onPreview={onPreview ? () => onPreview(doc.id) : undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DocumentActions({
  doc,
  role,
  personId,
  compact = false,
  onPreview
}: {
  doc: DocumentItem
  role: Role
  personId: number
  compact?: boolean
  onPreview?: () => void
}) {
  if (role === 'USER') {
    const downloaded = doc.downloadedIds.includes(personId)
    const signed = doc.signedIds.includes(personId)

    if (signed) return <span className="text-sm font-semibold text-green-700">Uploaded</span>

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
          href={doc.downloadUrl || '#'}
          download
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition"
        >
          {downloaded ? 'Download Again' : 'Download PDF'}
        </a>
        <label className="bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition cursor-pointer">
          Upload Signed
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
        </label>
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

function TeamPanel({ isAdmin, people }: { isAdmin: boolean; people: Person[] }) {
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
  onWatermarkChange
}: {
  adminView: AdminView
  setAdminView: (view: AdminView) => void
  isSuperAdmin: boolean
  watermark: WatermarkSettings
  onWatermarkChange: (settings: WatermarkSettings) => void
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
        <WatermarkSettingsPanel watermark={watermark} onChange={onWatermarkChange} />
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
      <AdminDetail view={adminView} />
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

      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Watermark Text
          <input
            value={watermark.text}
            onChange={(event) => onChange({ ...watermark, text: event.target.value })}
            className="mt-2 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal bg-white"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Opacity
          <input
            type="range"
            min="5"
            max="40"
            value={watermark.opacity}
            onChange={(event) => onChange({ ...watermark, opacity: Number(event.target.value) })}
            className="mt-3 w-full"
          />
          <span className="text-xs text-slate-500">{watermark.opacity}%</span>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Size
          <input
            type="range"
            min="18"
            max="64"
            value={watermark.size}
            onChange={(event) => onChange({ ...watermark, size: Number(event.target.value) })}
            className="mt-3 w-full"
          />
          <span className="text-xs text-slate-500">{watermark.size}px</span>
        </label>
      </div>
    </div>
  )
}

function AdminDetail({ view }: { view: AdminView }) {
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
            {documents.map((doc) => <option key={doc.id}>{doc.name}</option>)}
          </select>
          <select className="border border-slate-300 rounded-lg px-3 py-2">
            {picUsers.map((pic) => <option key={pic.id}>{pic.name} - {pic.department}</option>)}
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2">Assign Distribution</button>
        </div>
      </div>
    )
  }

  if (view === 'users') {
    return <TeamPanel isAdmin people={people} />
  }

  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
      <h4 className="font-bold text-slate-900 mb-4">Analytics by PIC</h4>
      <div className="space-y-3">
        {picUsers.map((pic) => {
          const picDocs = documents.filter((doc) => doc.picId === pic.id)
          const total = picDocs.reduce((sum, doc) => sum + doc.assigneeIds.length, 0)
          const signed = picDocs.reduce((sum, doc) => sum + doc.signedIds.length, 0)
          const rate = total ? Math.round((signed / total) * 100) : 0

          return (
            <div key={pic.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{pic.name}</p>
                  <p className="text-xs text-slate-500">{pic.department}</p>
                </div>
                <p className="font-bold text-blue-700">{rate}%</p>
              </div>
              <div className="bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${rate}%` }} />
              </div>
            </div>
          )
        })}
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
