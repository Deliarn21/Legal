import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import { LanguageToggle, useUiLanguage } from '../lib/uiLanguage'

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'PIC' | 'USER'
type AdminView = 'upload' | 'distribution' | 'analytics' | 'users'
type SignaturePlacementOption = 'left' | 'center' | 'right'
type SignaturePlacementSettings = {
  horizontal: SignaturePlacementOption
  pageNumber: number
  xPercent: number
  yPercent: number
  widthPercent: number
}

type IdentityFieldLayout = {
  labelXPercent?: number
  colonXPercent?: number
  valueXPercent: number
  nameTopPercent: number
  rowGapPercent: number
}

type DocumentTemplateSettings = {
  id: string
  label: string
  signaturePlacement: SignaturePlacementSettings
  identityLayout: IdentityFieldLayout
  identityDescription: string
  signatureDescription: string
}

type Person = {
  id: number
  nrp?: string
  name: string
  email: string
  department: string
  entity?: string
  position?: string
  noKtp?: string
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
  picIds?: number[]
  picName: string
  assigneeIds: number[]
  downloadedIds: number[]
  signedIds: number[]
  downloadUrl?: string
  fileName?: string
  sourceUrl?: string
  sourceFileName?: string
  sourceType?: 'WORD' | 'PDF'
  ownerEntity?: string
  previewText?: string[]
  signaturePlacement?: SignaturePlacementSettings
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
  signerNrp: string
  signerPosition?: string
  noKtp: string
  signatureDataUrl: string
  signedPdfUrl?: string
  signedFileName?: string
  signaturePlacement?: SignaturePlacementSettings
  signedPdfVersion?: number
}

type UploadedSignedFile = {
  docId: number
  personId: number
  fileName: string
  url: string
}

type PicEmailMap = Record<string, string>

const defaultWatermark: WatermarkSettings = {
  text: 'CONFIDENTIAL - PREVIEW ONLY',
  opacity: 11,
  size: 25
}

const defaultSignaturePlacement: SignaturePlacementSettings = {
  horizontal: 'left',
  pageNumber: 2,
  xPercent: 6,
  yPercent: 72,
  widthPercent: 34
}
const legacySignaturePlacement: SignaturePlacementSettings = {
  horizontal: 'left',
  pageNumber: 1,
  xPercent: 6,
  yPercent: 69,
  widthPercent: 34
}
const wordTemplateIdentityLayout: IdentityFieldLayout = {
  labelXPercent: 11.8,
  colonXPercent: 23.8,
  valueXPercent: 25.8,
  nameTopPercent: 18.05,
  rowGapPercent: 1.58
}
const defaultDocumentTemplateSettings: DocumentTemplateSettings = {
  id: 'default-word-template',
  label: 'Default Word Template',
  signaturePlacement: defaultSignaturePlacement,
  identityLayout: wordTemplateIdentityLayout,
  identityDescription: 'Nama, No. KTP, NRP, dan Jabatan diisi otomatis setelah titik dua pada halaman pertama.',
  signatureDescription: 'Tanda tangan ditempatkan pada area pernyataan di halaman tanda tangan.'
}
const paktaIntegritasTemplateSettings: DocumentTemplateSettings = {
  id: 'pakta-integritas',
  label: 'Pakta Integritas',
  signaturePlacement: {
    horizontal: 'left',
    pageNumber: 2,
    xPercent: 6,
    yPercent: 72,
    widthPercent: 34
  },
  identityLayout: wordTemplateIdentityLayout,
  identityDescription: 'Nama, No. KTP, NRP, dan Jabatan diisi otomatis setelah titik dua pada template Pakta Integritas.',
  signatureDescription: 'Tanda tangan ditempatkan fix di halaman 2, tepat di area bawah "Yang Menyatakan".'
}
const signedPdfVersion = 16
const documentsStorageKey = 'digitalPdfSignoff.documents'
const peopleStorageKey = 'digitalPdfSignoff.people'
const signaturesStorageKey = 'digitalPdfSignoff.signatures'
const uploadedSignedFilesStorageKey = 'digitalPdfSignoff.uploadedSignedFiles'
const documentWorkspaceResetKey = 'digitalPdfSignoff.documentWorkspaceResetVersion'
const currentDocumentWorkspaceResetVersion = 'word-placeholder-workspace-v1'
const requiredWordTemplatePlaceholders = [
  { label: '[Placeholder Nama]', aliases: ['nama'] },
  { label: '[Placeholder Nomor KTP]', aliases: ['nomor ktp', 'no ktp', 'ktp'] },
  { label: '[Placeholder NRP]', aliases: ['nrp'] },
  { label: '[Placeholder Jabatan]', aliases: ['jabatan'] },
  { label: '[Placeholder Tanggal saat orang melakukan tanda tangan]', aliases: ['tanggal'] },
  { label: '[Placeholder Tanda Tangan]', aliases: ['tanda tangan'] }
]

const entityOptions = [
  'HASNUR JAYA INTERNATIONAL',
  'ENERGI BATUBARA LESTARI',
  'HASNUR GROUP INDONESIA',
  'HASNUR JAYA TAMBANG',
  'HASNUR JAYA UTAMA',
  'BARITO PUTERA',
  'HASNUR INFORMASI TEKNOLOGI',
  'PUTERA BARITO BERBAKTI',
  'HASNUR INTERNASIONAL SHIPPING TBK',
  'HASNUR RESOURCES TERMINAL',
  'HASNUR MITRA SARANA',
  'CIPTA DAYA INOVASI',
  'INSAN PENDIDIKAN INDONESIA',
  'GRAHA NUSA MINERGI',
  'HASNUR CITRA TERPADU',
  'BARITO PUTERA PLANTATION',
  'HASNUR JAYA POWER',
  'BAYANG NYALO HIDRO',
  'HASNUR RIUNG SINERGI',
  'JAYA AGENSI KAPAL INDONESIA',
  'NUR JAYA SAMUDRA',
  'BARITO JAYA SARANA',
  'MITRA SIGRA UTAMA, PT',
  'MAGMA SIGMA UTAMA, PT',
  'SINERGI SIGRA SEJAHTERA, PT',
  'NUSANTARA ALAMRAYA SEJAHTERA',
  'NUR UMMI RABBANI',
  'YAYASAN HASNUR CENTRE'
]

const entityPicUsers: PicUser[] = entityOptions.map((entity, index) => ({
  id: 1000 + index,
  name: entity,
  email: `${entity.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@company.local`,
  department: entity
}))

const defaultPicEmails: PicEmailMap = Object.fromEntries(
  entityOptions.map((entity) => [entity, `${entity.toLowerCase().replace(/[^a-z0-9]+/g, '.')}pic@company.local`])
)

const peopleUploadTemplate = `NRP;Nama;Entitas;No KTP;Jabatan;Gunakan nama entitas dibawah ini
100001;Budi Santoso;HASNUR JAYA INTERNATIONAL;3171000000000001;Staff Finance;HASNUR JAYA INTERNATIONAL
100002;Siti Rahma;ENERGI BATUBARA LESTARI;3171000000000002;Staff Operasional;ENERGI BATUBARA LESTARI
100003;Agus Pratama;HASNUR GROUP INDONESIA;3171000000000003;Staff Legal;HASNUR GROUP INDONESIA
;;;;;HASNUR JAYA TAMBANG
;;;;;HASNUR JAYA UTAMA
;;;;;BARITO PUTERA
;;;;;HASNUR INFORMASI TEKNOLOGI
;;;;;PUTERA BARITO BERBAKTI
;;;;;HASNUR INTERNASIONAL SHIPPING TBK
;;;;;HASNUR RESOURCES TERMINAL
;;;;;HASNUR MITRA SARANA
;;;;;CIPTA DAYA INOVASI
;;;;;INSAN PENDIDIKAN INDONESIA
;;;;;GRAHA NUSA MINERGI
;;;;;HASNUR CITRA TERPADU
;;;;;BARITO PUTERA PLANTATION
;;;;;HASNUR JAYA POWER
;;;;;BAYANG NYALO HIDRO
;;;;;HASNUR RIUNG SINERGI
;;;;;JAYA AGENSI KAPAL INDONESIA
;;;;;NUR JAYA SAMUDRA
;;;;;BARITO JAYA SARANA
;;;;;MITRA SIGRA UTAMA, PT
;;;;;MAGMA SIGMA UTAMA, PT
;;;;;SINERGI SIGRA SEJAHTERA, PT
;;;;;NUSANTARA ALAMRAYA SEJAHTERA
;;;;;NUR UMMI RABBANI
;;;;;YAYASAN HASNUR CENTRE
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
  { id: 11, nrp: '100011', name: 'Ari Finance', email: 'ari.finance@company.com', department: 'Finance', entity: 'HASNUR JAYA INTERNATIONAL', position: 'Finance Officer', noKtp: '123456', picId: 3 },
  { id: 12, nrp: '100012', name: 'Maya Finance', email: 'maya.finance@company.com', department: 'Finance', entity: 'HASNUR JAYA INTERNATIONAL', position: 'Finance Officer', noKtp: '6125367521673521', picId: 3 },
  { id: 13, nrp: '100013', name: 'Dimas Finance', email: 'dimas.finance@company.com', department: 'Finance', entity: 'ENERGI BATUBARA LESTARI', position: 'Finance Officer', noKtp: '234567', picId: 3 },
  { id: 21, nrp: '100021', name: 'Nadia Legal', email: 'nadia.legal@company.com', department: 'Legal', entity: 'HASNUR GROUP INDONESIA', position: 'Legal Officer', noKtp: '321456', picId: 5 },
  { id: 22, nrp: '100022', name: 'Bima Legal', email: 'bima.legal@company.com', department: 'Legal', entity: 'BARITO PUTERA', position: 'Legal Officer', noKtp: '654321', picId: 5 },
  { id: 31, nrp: '100031', name: 'Sari HR', email: 'sari.hr@company.com', department: 'Human Resources', entity: 'HASNUR INFORMASI TEKNOLOGI', position: 'HR Officer', noKtp: '789123', picId: 6 },
  { id: 32, nrp: '100032', name: 'Reno HR', email: 'reno.hr@company.com', department: 'Human Resources', entity: 'PUTERA BARITO BERBAKTI', position: 'HR Officer', noKtp: '987321', picId: 6 }
]

const initialPicUsers: PicUser[] = [
  { id: 3, name: 'PIC Finance', email: 'pic@company.com', department: 'Finance' },
  { id: 5, name: 'PIC Legal', email: 'pic.legal@company.com', department: 'Legal' },
  { id: 6, name: 'PIC HR', email: 'pic.hr@company.com', department: 'Human Resources' }
]

const initialDocuments: DocumentItem[] = []

const currentUserPersonId: Record<string, number> = {
  '100011': 11,
  'ari.finance@company.com': 11,
  '100012': 12,
  'user@company.com': 12,
  'maya.finance@company.com': 12,
  'user.signer@hasnurgroup.com': 12,
  '100013': 13,
  'dimas.finance@company.com': 13,
  '100021': 21,
  'nadia.legal@company.com': 21,
  '100022': 22,
  'bima.legal@company.com': 22,
  '100031': 31,
  'sari.hr@company.com': 31,
  '100032': 32,
  'reno.hr@company.com': 32
}

export default function Dashboard({ user, setUser, authLoaded }: any) {
  const router = useRouter()
  const { language, setLanguage } = useUiLanguage()
  const [activeTab, setActiveTab] = useState('overview')
  const [adminView, setAdminView] = useState<AdminView>('analytics')
  const [selectedDocId, setSelectedDocId] = useState(1)
  const [expandedDocId, setExpandedDocId] = useState<number | null>(1)
  const [managedPeople, setManagedPeople] = useState<Person[]>(initialPeople)
  const [managedDocuments, setManagedDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [sessionSignatures, setSessionSignatures] = useState<SignatureRecord[]>([])
  const [uploadedSignedFiles, setUploadedSignedFiles] = useState<UploadedSignedFile[]>([])
  const [watermark, setWatermark] = useState<WatermarkSettings>(defaultWatermark)
  const [signaturePlacement, setSignaturePlacement] = useState<SignaturePlacementSettings>(defaultSignaturePlacement)
  const [picEmails, setPicEmails] = useState<PicEmailMap>(defaultPicEmails)
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)

  const role = user?.role as Role
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isEntityAdmin = role === 'ADMIN'
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN'
  const isPic = role === 'PIC'
  const personId = role === 'USER' ? Number(user?.id || currentUserPersonId[user?.email] || 12) : currentUserPersonId[user?.email] || 12
  const adminEntity = user?.entity || entityOptions[0]
  const nextDocumentId = useMemo(() => Math.max(...managedDocuments.map((doc) => doc.id), 0) + 1, [managedDocuments])
  const signedEvidenceByDoc = useMemo(
    () => buildSignedEvidenceMap(sessionSignatures, uploadedSignedFiles),
    [sessionSignatures, uploadedSignedFiles]
  )

  const visibleDocuments = useMemo(() => {
    const docsWithReliableSignoff = managedDocuments.map((doc) => normalizeDocumentSignoffState(doc, signedEvidenceByDoc))

    if (isSuperAdmin) return docsWithReliableSignoff
    if (isEntityAdmin) {
      const entityPersonIds = new Set(
        managedPeople
          .filter((person) => (person.entity || person.department) === adminEntity)
          .map((person) => person.id)
      )

      return docsWithReliableSignoff
        .map((doc) => ({
          ...doc,
          assigneeIds: doc.assigneeIds.filter((id) => entityPersonIds.has(id)),
          downloadedIds: doc.downloadedIds.filter((id) => entityPersonIds.has(id)),
          signedIds: doc.signedIds.filter((id) => entityPersonIds.has(id))
        }))
        .filter((doc) => doc.assigneeIds.length > 0 || doc.ownerEntity === adminEntity)
    }
    if (isPic) return docsWithReliableSignoff.filter((doc) => (doc.picIds || [doc.picId]).includes(user.id))
    return docsWithReliableSignoff.filter((doc) => doc.assigneeIds.includes(personId))
  }, [adminEntity, isEntityAdmin, isPic, isSuperAdmin, managedDocuments, managedPeople, personId, signedEvidenceByDoc, user?.id])

  const visiblePeople = useMemo(() => {
    if (isSuperAdmin) return managedPeople
    if (isEntityAdmin) return managedPeople.filter((person) => (person.entity || person.department) === adminEntity)
    if (isPic) return managedPeople.filter((person) => person.picId === user.id)
    return managedPeople.filter((person) => person.id === personId)
  }, [adminEntity, isEntityAdmin, isPic, isSuperAdmin, managedPeople, personId, user?.id])

  const selectedDocument = useMemo(() => {
    return visibleDocuments.find((doc) => doc.id === selectedDocId) || visibleDocuments[0]
  }, [selectedDocId, visibleDocuments])

  const currentPerson = useMemo(() => {
    return managedPeople.find((person) => person.id === personId)
  }, [managedPeople, personId])

  useEffect(() => {
    resetDocumentWorkspaceForWordPlaceholderFlow()

    const savedPeople = readStoredValue<Person[]>(peopleStorageKey)
    const savedDocuments = readStoredValue<DocumentItem[]>(documentsStorageKey)
    const savedSignatures = readStoredValue<SignatureRecord[]>(signaturesStorageKey)

    if (Array.isArray(savedPeople) && savedPeople.length) {
      setManagedPeople(mergePeopleWithDefaults(savedPeople))
    }
    if (Array.isArray(savedDocuments)) {
      setManagedDocuments(savedDocuments.map(migrateDocumentTemplateSettings))
    }
    if (Array.isArray(savedSignatures)) {
      setSessionSignatures(savedSignatures)
    }
    const savedUploadedSignedFiles = readStoredValue<UploadedSignedFile[]>(uploadedSignedFilesStorageKey)
    if (Array.isArray(savedUploadedSignedFiles)) {
      setUploadedSignedFiles(savedUploadedSignedFiles)
    }
    setWorkspaceLoaded(true)
  }, [])

  useEffect(() => {
    if (!workspaceLoaded) return
    writeStoredValue(peopleStorageKey, managedPeople)
  }, [managedPeople, workspaceLoaded])

  useEffect(() => {
    if (!workspaceLoaded) return
    writeStoredValue(documentsStorageKey, documentsForStorage(managedDocuments))
  }, [managedDocuments, workspaceLoaded])

  useEffect(() => {
    if (!workspaceLoaded) return
    writeStoredValue(signaturesStorageKey, sessionSignatures)
  }, [sessionSignatures, workspaceLoaded])

  useEffect(() => {
    if (!workspaceLoaded) return
    writeStoredValue(uploadedSignedFilesStorageKey, uploadedSignedFiles)
  }, [uploadedSignedFiles, workspaceLoaded])

  useEffect(() => {
    if (!workspaceLoaded) return
    const docsNeedingWordText = managedDocuments.filter((doc) => (
      doc.sourceType === 'WORD' &&
      doc.sourceUrl?.startsWith('data:') &&
      (!doc.previewText?.length || sameStringArray(doc.previewText, integrityPreview) || hasWordXmlLeak(doc.previewText))
    ))
    if (!docsNeedingWordText.length) return

    let cancelled = false
    const repairWordPreviewText = async () => {
      const extractedByDocId = new Map<number, string[]>()
      await Promise.all(docsNeedingWordText.map(async (doc) => {
        const previewText = await extractWordPreviewText(doc.sourceUrl || '')
        if (previewText.length) extractedByDocId.set(doc.id, previewText)
      }))
      if (cancelled || !extractedByDocId.size) return

      setManagedDocuments((current) => {
        let changed = false
        const nextDocuments = current.map((doc) => {
          const previewText = extractedByDocId.get(doc.id)
          if (!previewText || sameStringArray(doc.previewText || [], previewText)) return doc
          changed = true
          return { ...doc, previewText }
        })
        if (changed) writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
        return changed ? nextDocuments : current
      })
    }

    repairWordPreviewText()
    return () => {
      cancelled = true
    }
  }, [managedDocuments, workspaceLoaded])

  useEffect(() => {
    if (!workspaceLoaded) return
    const docsNeedingPdfPreview = managedDocuments.filter((doc) => (
      doc.sourceType === 'WORD' &&
      doc.sourceUrl?.startsWith('data:') &&
      !doc.downloadUrl
    ))
    if (!docsNeedingPdfPreview.length) return

    let cancelled = false
    const repairWordPdfPreviews = async () => {
      const pdfByDocId = new Map<number, string>()
      await Promise.all(docsNeedingPdfPreview.map(async (doc) => {
        const pdfUrl = await convertWordTemplateToPdf(doc.sourceUrl || '')
        if (pdfUrl) pdfByDocId.set(doc.id, pdfUrl)
      }))
      if (cancelled || !pdfByDocId.size) return

      setManagedDocuments((current) => {
        let changed = false
        const nextDocuments = current.map((doc) => {
          const pdfUrl = pdfByDocId.get(doc.id)
          if (!pdfUrl || doc.downloadUrl) return doc
          changed = true
          return {
            ...doc,
            downloadUrl: pdfUrl,
            fileName: pdfFileNameFromSource(doc.sourceFileName || doc.fileName || doc.name)
          }
        })
        if (changed) writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
        return changed ? nextDocuments : current
      })
    }

    repairWordPdfPreviews()
    return () => {
      cancelled = true
    }
  }, [managedDocuments, workspaceLoaded])

  useEffect(() => {
    if (!workspaceLoaded) return

    setManagedDocuments((current) => {
      let changed = false
      const nextDocuments = current.map((doc) => {
        const normalizedDoc = normalizeDocumentSignoffState(doc, signedEvidenceByDoc)
        if (sameNumberArray(doc.signedIds, normalizedDoc.signedIds) && doc.status === normalizedDoc.status) return doc
        changed = true
        return normalizedDoc
      })

      if (changed) writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      return changed ? nextDocuments : current
    })
  }, [signedEvidenceByDoc, workspaceLoaded])

  useEffect(() => {
    if (!workspaceLoaded) return
    const repairableSignatures = sessionSignatures.filter((signature) => {
      if (!signature.signatureDataUrl) return false
      const doc = managedDocuments.find((item) => item.id === signature.docId)
      if (!doc) return false
      const placement = getDocumentSignaturePlacement(doc, signaturePlacement)
      return (
        !signature.signedPdfUrl ||
        signature.signedPdfVersion !== signedPdfVersion ||
        !sameSignaturePlacement(signature.signaturePlacement || defaultSignaturePlacement, placement) ||
        !signature.signerPosition
      )
    })
    if (!repairableSignatures.length) return

    let cancelled = false
    const repairSignedPdfs = async () => {
      const repairedSignatures: Array<SignatureRecord | null> = await Promise.all(
        repairableSignatures.map(async (signature): Promise<SignatureRecord | null> => {
          const doc = managedDocuments.find((item) => item.id === signature.docId)
          if (!doc) return null
          const person = managedPeople.find((item) => item.id === signature.personId)
          const placement = getDocumentSignaturePlacement(doc, signaturePlacement)
          const enrichedSignature = {
            ...signature,
            signerName: signature.signerName || person?.name || 'Signed User',
            signerNrp: signature.signerNrp || person?.nrp || '-',
            signerPosition: signature.signerPosition || getPersonPosition(person)
          }

          const signedPdfUrl = await createSignedPdfUrl(
            doc,
            enrichedSignature,
            placement
          )
          if (!signedPdfUrl) return null

          return {
            ...enrichedSignature,
            signedPdfUrl,
            signedFileName: signedPdfFileName(doc),
            signaturePlacement: placement,
            signedPdfVersion
          }
        })
      )

      if (cancelled) return
      const repairedByKey = new Map(
        repairedSignatures
          .filter((signature): signature is SignatureRecord => Boolean(signature))
          .map((signature) => [signatureRecordKey(signature), signature])
      )
      if (!repairedByKey.size) return

      setSessionSignatures((current) => {
        let changed = false
        const nextSignatures = current.map((signature) => {
          const repairedSignature = repairedByKey.get(signatureRecordKey(signature))
          if (!repairedSignature) return signature
          changed = true
          return repairedSignature
        })

        if (changed) writeStoredValue(signaturesStorageKey, nextSignatures)
        return changed ? nextSignatures : current
      })
    }

    repairSignedPdfs()
    return () => {
      cancelled = true
    }
  }, [managedDocuments, managedPeople, sessionSignatures, signaturePlacement, workspaceLoaded])

  useEffect(() => {
    const saved = localStorage.getItem('watermarkSettings')
    const savedPlacement = localStorage.getItem('signaturePlacement')
    if (savedPlacement) {
      setSignaturePlacement(migrateSignaturePlacement(parseSignaturePlacementSettings(savedPlacement)))
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

  const saveDirectSignature = (signature: SignatureRecord) => {
    if (!signature.signedPdfUrl) return

    setSessionSignatures((current) => {
      const nextSignatures = [
        ...current.filter((item) => !(item.docId === signature.docId && item.personId === signature.personId)),
        signature
      ]
      writeStoredValue(signaturesStorageKey, nextSignatures)
      return nextSignatures
    })
    setManagedDocuments((current) => {
      const nextDocuments = current.map((doc) => {
        if (doc.id !== signature.docId || doc.signedIds.includes(signature.personId)) return doc
        return { ...doc, signedIds: [...doc.signedIds, signature.personId] }
      })
      writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      return nextDocuments
    })
  }

  const markDocumentDownloaded = (docId: number, downloadPersonId: number) => {
    setManagedDocuments((current) => {
      const nextDocuments = current.map((doc) => {
        if (
          doc.id !== docId ||
          doc.downloadedIds.includes(downloadPersonId) ||
          doc.signedIds.includes(downloadPersonId)
        ) {
          return doc
        }

        return {
          ...doc,
          downloadedIds: [...doc.downloadedIds, downloadPersonId]
        }
      })
      writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      return nextDocuments
    })
  }

  const saveUploadedSignedFile = (file: UploadedSignedFile) => {
    setUploadedSignedFiles((current) => {
      return [
        ...current.filter((item) => !(item.docId === file.docId && item.personId === file.personId)),
        file
      ]
    })
    setManagedDocuments((current) => {
      const nextDocuments = current.map((doc) => {
        if (doc.id !== file.docId) return doc
        const signedIds = doc.signedIds.includes(file.personId)
          ? doc.signedIds
          : [...doc.signedIds, file.personId]
        const downloadedIds = doc.downloadedIds.includes(file.personId)
          ? doc.downloadedIds
          : [...doc.downloadedIds, file.personId]
        return { ...doc, signedIds, downloadedIds }
      })
      writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      return nextDocuments
    })
  }

  const createAdminDocument = (doc: DocumentItem) => {
    const normalizedDoc = migrateDocumentTemplateSettings(doc)
    setManagedDocuments((current) => {
      const nextDocuments = [...current, normalizedDoc]
      writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      return nextDocuments
    })
    setSelectedDocId(normalizedDoc.id)
    setExpandedDocId(normalizedDoc.id)
  }

  const updateAdminDocument = (doc: DocumentItem) => {
    const normalizedDoc = migrateDocumentTemplateSettings(doc)
    setManagedDocuments((current) => {
      const nextDocuments = current.map((item) => item.id === normalizedDoc.id ? normalizedDoc : item)
      writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      return nextDocuments
    })
    setSelectedDocId(normalizedDoc.id)
    setExpandedDocId(normalizedDoc.id)
  }

  const deleteAdminDocument = (docId: number) => {
    setSessionSignatures((current) => {
      const nextSignatures = current.filter((signature) => signature.docId !== docId)
      writeStoredValue(signaturesStorageKey, nextSignatures)
      return nextSignatures
    })

    setUploadedSignedFiles((current) => {
      const nextUploadedSignedFiles = current.filter((file) => file.docId !== docId)
      writeStoredValue(uploadedSignedFilesStorageKey, nextUploadedSignedFiles)
      return nextUploadedSignedFiles
    })

    setManagedDocuments((current) => {
      const nextDocuments = current.filter((doc) => doc.id !== docId)
      writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      const fallbackDocId = nextDocuments[0]?.id || 0
      if (selectedDocId === docId) setSelectedDocId(fallbackDocId)
      if (expandedDocId === docId) setExpandedDocId(null)
      return nextDocuments
    })
  }

  const rollbackSignoffs = (docId: number, personIds: number[]) => {
    if (!personIds.length) return
    const rollbackPersonIds = new Set(personIds)

    setSessionSignatures((current) => {
      const nextSignatures = current.filter((signature) => !(
        signature.docId === docId && rollbackPersonIds.has(signature.personId)
      ))
      writeStoredValue(signaturesStorageKey, nextSignatures)
      return nextSignatures
    })

    setUploadedSignedFiles((current) => {
      const nextUploadedSignedFiles = current.filter((file) => !(
        file.docId === docId && rollbackPersonIds.has(file.personId)
      ))
      writeStoredValue(uploadedSignedFilesStorageKey, nextUploadedSignedFiles)
      return nextUploadedSignedFiles
    })

    setManagedDocuments((current) => {
      const nextDocuments = current.map((doc) => {
        if (doc.id !== docId) return doc

        return {
          ...doc,
          signedIds: doc.signedIds.filter((personId) => !rollbackPersonIds.has(personId)),
          downloadedIds: doc.downloadedIds.filter((personId) => !rollbackPersonIds.has(personId)),
          status: doc.status === 'COMPLETED' ? 'ACTIVE' : doc.status
        }
      })
      writeStoredValue(documentsStorageKey, documentsForStorage(nextDocuments))
      return nextDocuments
    })
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

  useEffect(() => {
    if (authLoaded && !user) router.replace('/')
  }, [authLoaded, router, user])

  if (!authLoaded || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-sm font-semibold text-slate-600">
        Memuat session login...
      </div>
    )
  }

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
          <div className="flex flex-wrap items-center justify-end gap-3">
            <LanguageToggle language={language} onChange={setLanguage} />
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
                    currentPerson={currentPerson}
                    watermark={watermark}
                    signaturePlacement={getDocumentSignaturePlacement(selectedDocument, signaturePlacement)}
                    signature={sessionSignatures.find((signature) => signature.docId === selectedDocument?.id && signature.personId === personId)}
                    uploadedFile={uploadedSignedFiles.find((file) => file.docId === selectedDocument?.id && file.personId === personId)}
                    onSelectDoc={setSelectedDocId}
                    onMarkDownloaded={markDocumentDownloaded}
                    onDirectSignoff={saveDirectSignature}
                    onUploadSignedFile={saveUploadedSignedFile}
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
                signatures={sessionSignatures}
                uploadedSignedFiles={uploadedSignedFiles}
                onRollbackSignoffs={isSuperAdmin ? rollbackSignoffs : undefined}
                onMarkDownloaded={role === 'USER' ? markDocumentDownloaded : undefined}
                onUploadSignedFile={role === 'USER' ? saveUploadedSignedFile : undefined}
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
                isSuperAdmin={isSuperAdmin}
                adminEntity={adminEntity}
                watermark={watermark}
                onWatermarkChange={saveWatermark}
                signaturePlacement={signaturePlacement}
                people={managedPeople}
                onPeopleChange={setManagedPeople}
                docs={visibleDocuments}
                nextDocumentId={nextDocumentId}
                onDocumentCreate={createAdminDocument}
                onDocumentUpdate={updateAdminDocument}
                onDocumentDelete={deleteAdminDocument}
                picEmails={picEmails}
                onPicEmailsChange={setPicEmails}
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
  if (!docs.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Belum ada dokumen. Upload dokumen baru melalui Admin Panel.
      </div>
    )
  }

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
  currentPerson,
  watermark,
  signaturePlacement,
  signature,
  uploadedFile,
  onSelectDoc,
  onMarkDownloaded,
  onDirectSignoff,
  onUploadSignedFile
}: {
  docs: DocumentItem[]
  selectedDoc?: DocumentItem
  personId: number
  currentPerson?: Person
  watermark: WatermarkSettings
  signaturePlacement: SignaturePlacementSettings
  signature?: SignatureRecord
  uploadedFile?: UploadedSignedFile
  onSelectDoc: (docId: number) => void
  onMarkDownloaded: (docId: number, personId: number) => void
  onDirectSignoff: (signature: SignatureRecord) => void
  onUploadSignedFile: (file: UploadedSignedFile) => void
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
          const downloaded = doc.downloadedIds.includes(personId)
          const statusLabel = signed ? 'Signed Off' : downloaded ? 'Downloaded' : 'Action Required'

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
              <span className={`inline-block mt-3 px-2 py-1 rounded-full text-xs font-semibold ${signoffStatusClass(signed ? 'Signed' : downloaded ? 'Downloaded' : 'Pending')}`}>
                {statusLabel}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900">{selectedDoc.name}</h4>
            <p className="text-sm text-slate-600">
              {selectedDoc.signedIds.includes(personId)
                ? 'Dokumen ini sudah selesai ditandatangani.'
                : selectedDoc.downloadedIds.includes(personId)
                  ? 'Dokumen sudah di-download. Upload PDF yang sudah ditandatangani untuk menyelesaikan proses.'
                  : 'Pilih download-upload manual atau signoff langsung dari preview ini.'}
            </p>
          </div>
          <DocumentActions
            doc={selectedDoc}
            role="USER"
            personId={personId}
            signature={signature}
            uploadedFile={uploadedFile}
            watermark={watermark}
            signaturePlacement={signaturePlacement}
            onMarkDownloaded={onMarkDownloaded}
            onUploadSignedFile={(file) => onUploadSignedFile(file)}
            onStartDirectSignoff={() => setSignoffDocId(selectedDoc.id)}
          />
        </div>
        {signoffDocId === selectedDoc.id && (
          <SignatureSignoffModal
            doc={selectedDoc}
            signer={currentPerson}
            onCancel={() => setSignoffDocId(null)}
            onConfirm={async (signatureDataUrl, noKtp) => {
              const signatureRecord: SignatureRecord = {
                docId: selectedDoc.id,
                personId,
                signerName: currentPerson?.name || 'Signed User',
                signerNrp: currentPerson?.nrp || '-',
                signerPosition: getPersonPosition(currentPerson),
                noKtp,
                signatureDataUrl,
                signaturePlacement,
                signedPdfVersion
              }
              const signedPdfUrl = await createSignedPdfUrl(selectedDoc, signatureRecord, signaturePlacement)
              if (!signedPdfUrl) throw new Error('signed_pdf_failed')

              onDirectSignoff({
                ...signatureRecord,
                signedPdfUrl,
                signedFileName: signedPdfFileName(selectedDoc),
                signaturePlacement,
                signedPdfVersion
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
            showWatermark
            signature={signature}
            uploadedFile={uploadedFile}
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
  showWatermark = false,
  signature,
  uploadedFile,
  signaturePlacement
}: {
  doc: DocumentItem
  watermark: WatermarkSettings
  showWatermark?: boolean
  signature?: SignatureRecord
  uploadedFile?: UploadedSignedFile
  signaturePlacement: SignaturePlacementSettings
}) {
  if (signature?.signedPdfUrl) {
    const signedPreviewPlacement = signature.signaturePlacement || signaturePlacement

    return (
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 protected-preview">
        <div className="mb-3 flex flex-col gap-1">
          <p className="font-semibold text-slate-900">Signed Document Preview</p>
          <p className="text-sm text-slate-600 break-all">{signature.signedFileName || signedPdfFileName(doc)}</p>
        </div>
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Dokumen sudah ditandatangani oleh {signature.signerName}. Watermark hanya tampil di preview dan tidak ikut saat download.
        </div>
        <PdfPreviewFrame
          url={signature.signedPdfUrl}
          title={signature.signedFileName || signedPdfFileName(doc)}
          watermark={watermark}
          showWatermark={showWatermark}
          signaturePlacement={signedPreviewPlacement}
        />
      </div>
    )
  }

  if (uploadedFile) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 protected-preview">
        <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Signed PDF Preview</p>
            <p className="text-sm text-slate-600 break-all">{uploadedFile.fileName}</p>
          </div>
        </div>
        <PdfPreviewFrame
          url={uploadedFile.url}
          title={uploadedFile.fileName}
          watermark={watermark}
          showWatermark={showWatermark}
        />
      </div>
    )
  }

  if (doc.downloadUrl) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 protected-preview">
        <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Original PDF Preview</p>
            <p className="text-sm text-slate-600 break-all">{doc.fileName || doc.name}</p>
          </div>
        </div>
        <PdfPreviewFrame
          url={doc.downloadUrl}
          title={doc.fileName || doc.name}
          watermark={watermark}
          showWatermark={showWatermark}
          signaturePlacement={signaturePlacement}
        />
      </div>
    )
  }

  return (
    <div
      className="bg-slate-100 border border-slate-200 rounded-lg p-4 protected-preview"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
        <div>
          <p className="font-semibold text-slate-900">PDF preview sedang disiapkan.</p>
          <p className="mt-2 text-sm">
            Upload ulang file Word jika preview PDF belum muncul setelah beberapa detik.
          </p>
        </div>
      </div>
    </div>
  )
}

function PdfPreviewFrame({
  url,
  title,
  watermark,
  showWatermark,
  signaturePlacement = defaultSignaturePlacement
}: {
  url: string
  title: string
  watermark: WatermarkSettings
  showWatermark: boolean
  signaturePlacement?: SignaturePlacementSettings
}) {
  const previewUrl = pdfPreviewUrl(url, signaturePlacement?.pageNumber || 1)

  return (
    <div
      className="relative h-[720px] overflow-hidden rounded-lg border border-slate-200 bg-white"
      onContextMenu={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
      onCut={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <object
        data={previewUrl}
        type="application/pdf"
        className="h-full w-full bg-white"
      >
        <iframe
          src={previewUrl}
          title={title}
          className="h-full w-full bg-white"
        />
      </object>
      {showWatermark && <PreviewWatermarkOverlay watermark={watermark} />}
    </div>
  )
}

function PreviewWatermarkOverlay({ watermark }: { watermark: WatermarkSettings }) {
  const watermarkPositions = [
    { top: '12%', left: '-2%' },
    { top: '12%', left: '44%' },
    { top: '34%', left: '17%' },
    { top: '36%', left: '63%' },
    { top: '58%', left: '-2%' },
    { top: '60%', left: '46%' },
    { top: '82%', left: '18%' },
    { top: '84%', left: '64%' }
  ]

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden" aria-hidden="true">
      {watermarkPositions.map((position, item) => (
        <div
          key={item}
          className="absolute w-[420px] whitespace-nowrap text-center font-bold uppercase text-slate-500"
          style={{
            opacity: Math.min(watermark.opacity, 18) / 100,
            fontSize: Math.min(watermark.size, 32),
            transform: 'rotate(-32deg)',
            ...position
          }}
        >
          {watermark.text}
        </div>
      ))}
    </div>
  )
}

function isIdentityLine(line: string) {
  return ['Nama:', 'No. KTP:', 'NRP:'].includes(line)
}

function IdentityLine({ line, signature }: { line: string; signature?: SignatureRecord }) {
  const value = line === 'Nama:'
    ? signature?.signerName
    : line === 'No. KTP:'
      ? signature?.noKtp
      : signature?.signerNrp

  return (
    <p className="grid grid-cols-[92px_1fr] gap-3">
      <span>{line}</span>
      <span className="border-b border-slate-300 min-h-[28px] font-semibold">
        {value || ''}
      </span>
    </p>
  )
}

function DocumentsTable({
  docs,
  role,
  personId,
  people,
  signatures,
  uploadedSignedFiles,
  onRollbackSignoffs,
  onMarkDownloaded,
  onUploadSignedFile,
  onPreview,
  expandedDocId,
  onToggleDetails
}: {
  docs: DocumentItem[]
  role: Role
  personId: number
  people: Person[]
  signatures: SignatureRecord[]
  uploadedSignedFiles: UploadedSignedFile[]
  onRollbackSignoffs?: (docId: number, personIds: number[]) => void
  onMarkDownloaded?: (docId: number, personId: number) => void
  onUploadSignedFile?: (file: UploadedSignedFile) => void
  onPreview?: (docId: number) => void
  expandedDocId: number | null
  onToggleDetails: (docId: number) => void
}) {
  return (
    <div>
      <SectionHeader title={role === 'USER' ? 'My Assigned Documents' : 'Documents'} />
      {!docs.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Belum ada dokumen yang tersedia.
        </div>
      ) : (
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
            {docs.map((doc) => {
              const userSigned = doc.signedIds.includes(personId)
              const userDownloaded = doc.downloadedIds.includes(personId)
              const userStatus = userSigned ? 'Signed' : userDownloaded ? 'Downloaded' : 'Pending'
              const userSignature = signatures.find((signature) => signature.docId === doc.id && signature.personId === personId)
              const userUploadedFile = uploadedSignedFiles.find((file) => file.docId === doc.id && file.personId === personId)

              return (
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${role === 'USER' ? signoffStatusClass(userStatus) : statusClass(doc.status)}`}>
                      {role === 'USER' ? userStatus : doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="w-28 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${getApprovalRate(doc)}%` }}
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
                        signature={role === 'USER' ? userSignature : undefined}
                        uploadedFile={role === 'USER' ? userUploadedFile : undefined}
                        compact
                        onMarkDownloaded={onMarkDownloaded}
                        onUploadSignedFile={onUploadSignedFile}
                        onPreview={onPreview ? () => onPreview(doc.id) : undefined}
                      />
                    </div>
                  </td>
                </tr>
                {expandedDocId === doc.id && (
                  <tr>
                    <td colSpan={6} className="px-4 pb-5">
                      <DocumentSignoffDetail
                        doc={doc}
                        people={people}
                        signatures={signatures}
                        uploadedSignedFiles={uploadedSignedFiles}
                        onRollbackSignoffs={onRollbackSignoffs}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      )}
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

function DocumentSignoffDetail({
  doc,
  people,
  signatures,
  uploadedSignedFiles,
  onRollbackSignoffs,
  showDownloadPanel = true
}: {
  doc: DocumentItem
  people: Person[]
  signatures: SignatureRecord[]
  uploadedSignedFiles: UploadedSignedFile[]
  onRollbackSignoffs?: (docId: number, personIds: number[]) => void
  showDownloadPanel?: boolean
}) {
  const assignees = doc.assigneeIds
    .map((id) => people.find((person) => person.id === id))
    .filter(Boolean) as Person[]
  const totalCount = doc.assigneeIds.length
  const signedCount = doc.signedIds.length
  const pendingCount = totalCount - signedCount
  const signedDownloadItems = buildSignedDownloadItems(doc, assignees, signatures, uploadedSignedFiles)
  const canRollbackSignoff = Boolean(onRollbackSignoffs)
  const resettableAssigneeIds = assignees
    .filter((person) => doc.signedIds.includes(person.id) || doc.downloadedIds.includes(person.id))
    .map((person) => person.id)
  const resettableAssigneeKey = resettableAssigneeIds.join(':')
  const [selectedRollbackIds, setSelectedRollbackIds] = useState<number[]>([])
  const selectedRollbackCount = selectedRollbackIds.length
  const allResettableSelected = resettableAssigneeIds.length > 0 && selectedRollbackIds.length === resettableAssigneeIds.length

  useEffect(() => {
    const validResettableIds = new Set(resettableAssigneeKey ? resettableAssigneeKey.split(':').map(Number) : [])
    setSelectedRollbackIds((current) => {
      const nextSelected = current.filter((personId) => validResettableIds.has(personId))
      return sameNumberArray(current, nextSelected) ? current : nextSelected
    })
  }, [resettableAssigneeKey])

  const toggleRollbackPerson = (personId: number) => {
    if (!resettableAssigneeIds.includes(personId)) return

    setSelectedRollbackIds((current) => (
      current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId]
    ))
  }

  const toggleAllRollbackPeople = () => {
    setSelectedRollbackIds(allResettableSelected ? [] : resettableAssigneeIds)
  }

  const submitRollback = () => {
    if (!onRollbackSignoffs || !selectedRollbackIds.length) return
    const confirmed = window.confirm(
      `Reset ${selectedRollbackIds.length} user? Status download, upload, dan signoff user terpilih akan dihapus agar pilihan Download PDF atau Signoff Directly muncul kembali.`
    )
    if (!confirmed) return

    onRollbackSignoffs(doc.id, selectedRollbackIds)
    setSelectedRollbackIds([])
  }

  return (
    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h4 className="font-bold text-slate-900">Signoff Detail</h4>
          <p className="text-sm text-slate-600">
            {signedCount} signed, {doc.downloadedIds.length} downloaded, {pendingCount} pending approval.
          </p>
        </div>
        <span className="text-sm font-semibold text-blue-700">PIC Owner: {doc.picName}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-4 items-start">
        <DocumentProgressPie signed={signedCount} total={totalCount} />
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[520px]">
            <thead className="bg-slate-100">
              <tr>
                {canRollbackSignoff && (
                  <th className="w-12 px-4 py-2 text-left text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={allResettableSelected}
                      disabled={!resettableAssigneeIds.length}
                      onChange={toggleAllRollbackPeople}
                      aria-label="Pilih semua user untuk reset akses signoff"
                    />
                  </th>
                )}
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Nama / Email</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Status Sekarang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {assignees.map((person) => {
                const signed = doc.signedIds.includes(person.id)
                const downloaded = doc.downloadedIds.includes(person.id)
                const status = signed ? 'Signed' : downloaded ? 'Downloaded' : 'Pending'

                return (
                  <tr key={person.id} className="hover:bg-slate-50">
                    {canRollbackSignoff && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRollbackIds.includes(person.id)}
                          disabled={!signed && !downloaded}
                          onChange={() => toggleRollbackPerson(person.id)}
                          aria-label={`Reset akses signoff ${person.name}`}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm">
                      <p className="font-semibold text-slate-900">{person.name}</p>
                      <p className="text-xs text-slate-500">{person.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${signoffStatusClass(status)}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!assignees.length && <p className="p-4 text-sm text-slate-500">No signoff users assigned.</p>}
        </div>
      </div>
      {canRollbackSignoff && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h5 className="font-bold text-slate-900">Rollback / Reset Akses Signoff</h5>
              <p className="text-sm text-slate-700">
                Pilih user yang sudah download atau signoff untuk dimunculkan kembali pilihan Download PDF dan Signoff Directly secara bulk.
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-800">
                {selectedRollbackCount} dipilih dari {resettableAssigneeIds.length} user yang bisa di-reset.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleAllRollbackPeople}
                disabled={!resettableAssigneeIds.length}
                className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {allResettableSelected ? 'Clear' : 'Select All'}
              </button>
              <button
                type="button"
                onClick={submitRollback}
                disabled={!selectedRollbackIds.length}
                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Reset Terpilih
              </button>
            </div>
          </div>
        </div>
      )}
      {showDownloadPanel && <SignedFilesDownloadPanel items={signedDownloadItems} />}
    </div>
  )
}

function DocumentProgressPie({ signed, total }: { signed: number; total: number }) {
  const rate = total ? Math.round((signed / total) * 100) : 0
  const signedDegrees = total ? (signed / total) * 360 : 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
      <div
        className="mx-auto flex h-28 w-28 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#2563eb 0deg ${signedDegrees}deg, #e2e8f0 ${signedDegrees}deg 360deg)` }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white">
          <span className="text-xl font-bold text-slate-900">{rate}%</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{signed}/{total} signed</p>
      <p className="text-xs text-slate-500">{Math.max(total - signed, 0)} remaining</p>
    </div>
  )
}

type SignedDownloadItem = {
  key: string
  person: Person
  fileName: string
  url: string
  method: 'Direct signoff' | 'Uploaded PDF'
}

function SignedFilesDownloadPanel({ items }: { items: SignedDownloadItem[] }) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const selectedItems = items.filter((item) => selectedKeys.includes(item.key))
  const allSelected = items.length > 0 && selectedKeys.length === items.length

  useEffect(() => {
    setSelectedKeys((current) => current.filter((key) => items.some((item) => item.key === key)))
  }, [items])

  const toggleItem = (key: string) => {
    setSelectedKeys((current) => (
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    ))
  }

  const selectAll = () => setSelectedKeys(items.map((item) => item.key))
  const clearSelection = () => setSelectedKeys([])

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h5 className="font-bold text-slate-900">Signed Files</h5>
          <p className="text-sm text-slate-600">
            Download signed PDFs individually, by selected users, or in bulk.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={allSelected ? clearSelection : selectAll}
            disabled={!items.length}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {allSelected ? 'Clear' : 'Select All'}
          </button>
          <button
            type="button"
            onClick={() => downloadSignedItems(selectedItems)}
            disabled={!selectedItems.length}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download Selected PDFs
          </button>
          <button
            type="button"
            onClick={() => downloadSignedItems(items)}
            disabled={!items.length}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Download All PDFs
          </button>
        </div>
      </div>

      {!items.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No signed PDF is available yet for this document.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (allSelected ? clearSelection() : selectAll())}
                    aria-label="Select all signed files"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">User</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">File</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Method</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr key={item.key} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedKeys.includes(item.key)}
                      onChange={() => toggleItem(item.key)}
                      aria-label={`Select ${item.person.name}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-900">{item.person.name}</p>
                    <p className="text-xs text-slate-500">{item.person.email}</p>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600 break-all">{item.fileName}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{item.method}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => downloadSignedItems([item])}
                      className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SignatureSignoffModal({
  doc,
  signer,
  onCancel,
  onConfirm
}: {
  doc: DocumentItem
  signer?: Person
  onCancel: () => void
  onConfirm: (signatureDataUrl: string, noKtp: string) => void | Promise<void>
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [noKtp, setNoKtp] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)
  const signerPosition = getPersonPosition(signer)
  const signoffAgreementText = 'Dengan ini saya telah membaca, memahami, dan menyetujui semua ketentuan yang tercantum dalam Pakta Integritas tanpa ada paksaan dari pihak manapun.'

  useEffect(() => {
    setNoKtp('')
  }, [signer?.id])

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
    if (!canvasRef.current || !noKtp.trim() || !accepted || !hasSignature || submitting) return
    setSubmitError('')
    setShowSubmitConfirmation(true)
  }

  const confirmSubmitSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas || submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      await onConfirm(trimSignatureCanvas(canvas), noKtp.trim())
    } catch {
      setSubmitError('Gagal membuat PDF signed. Coba ulangi setelah memastikan dokumen PDF masih tersedia.')
    } finally {
      setSubmitting(false)
      setShowSubmitConfirmation(false)
    }
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">Nama</p>
              <p className="font-semibold text-slate-900">{signer?.name || 'Signed User'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">NRP</p>
              <p className="font-semibold text-slate-900">{signer?.nrp || '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">Jabatan</p>
              <p className="font-semibold text-slate-900">{signerPosition}</p>
            </div>
            <label className="text-sm font-semibold text-slate-700">
              No. KTP
              <input
                value={noKtp}
                onChange={(event) => setNoKtp(event.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white font-normal"
                placeholder="Masukkan No. KTP"
              />
            </label>
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

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onCancel}
              className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={submitSignature}
              disabled={!noKtp.trim() || !accepted || !hasSignature || submitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {submitting ? 'Membuat PDF...' : 'Submit Signature'}
            </button>
          </div>
        </div>
      </div>

      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signoff-confirmation-title"
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10"
          >
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl font-black text-green-700 ring-8 ring-green-100">
                !
              </div>
              <h5 id="signoff-confirmation-title" className="text-xl font-bold text-slate-950">
                Konfirmasi Tanda Tangan
              </h5>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {signoffAgreementText}
              </p>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dokumen</p>
                <p className="mt-1 font-semibold text-slate-900">{doc.name}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Penanda tangan</p>
                <p className="mt-1 font-semibold text-slate-900">{signer?.name || 'Signed User'}</p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmation(false)}
                disabled={submitting}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSubmitSignature}
                disabled={submitting}
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? 'Memproses...' : 'Setuju & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function trimSignatureCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context) return canvas.toDataURL('image/png')

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = imageData
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[((y * width + x) * 4) + 3]
      if (alpha <= 8) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (minX > maxX || minY > maxY) return canvas.toDataURL('image/png')

  const padding = 18
  const cropX = Math.max(0, minX - padding)
  const cropY = Math.max(0, minY - padding)
  const cropWidth = Math.min(width - cropX, maxX - minX + (padding * 2))
  const cropHeight = Math.min(height - cropY, maxY - minY + (padding * 2))
  const trimmedCanvas = document.createElement('canvas')
  trimmedCanvas.width = cropWidth
  trimmedCanvas.height = cropHeight

  const trimmedContext = trimmedCanvas.getContext('2d')
  if (!trimmedContext) return canvas.toDataURL('image/png')

  trimmedContext.drawImage(
    canvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  )
  return trimmedCanvas.toDataURL('image/png')
}

function DocumentActions({
  doc,
  role,
  personId,
  signature,
  uploadedFile,
  watermark = defaultWatermark,
  signaturePlacement = defaultSignaturePlacement,
  compact = false,
  onPreview,
  onMarkDownloaded,
  onUploadSignedFile,
  onStartDirectSignoff
}: {
  doc: DocumentItem
  role: Role
  personId: number
  signature?: SignatureRecord
  uploadedFile?: UploadedSignedFile
  watermark?: WatermarkSettings
  signaturePlacement?: SignaturePlacementSettings
  compact?: boolean
  onPreview?: () => void
  onMarkDownloaded?: (docId: number, personId: number) => void
  onUploadSignedFile?: (file: UploadedSignedFile) => void
  onStartDirectSignoff?: () => void
}) {
  if (role === 'USER') {
    const downloaded = doc.downloadedIds.includes(personId)
    const signed = doc.signedIds.includes(personId)
    const generatedPdfUrl = createPreviewPdfUrl(doc, signature, undefined, signaturePlacement)
    const downloadPdfUrl = signature?.signedPdfUrl || uploadedFile?.url || doc.downloadUrl || generatedPdfUrl
    const downloadName = signature?.signedFileName || uploadedFile?.fileName || pdfFileNameFromSource(doc.sourceFileName || doc.fileName || doc.name)
    const markManualDownload = () => {
      onMarkDownloaded?.(doc.id, personId)
    }

    const handleUploadSignedPdf = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !onUploadSignedFile) return
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        event.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const url = typeof reader.result === 'string' ? reader.result : ''
        if (!url) return

        onUploadSignedFile({
          docId: doc.id,
          personId,
          fileName: file.name,
          url
        })
      }
      reader.readAsDataURL(file)
      event.target.value = ''
    }

    if (downloaded && !signed) {
      return (
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-end">
          {onPreview && (
            <button
              onClick={onPreview}
              className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg transition text-center sm:whitespace-nowrap"
            >
              Preview
            </button>
          )}
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm font-semibold text-amber-800 sm:whitespace-nowrap">
            Downloaded
          </span>
          {onUploadSignedFile && (
            <label className="bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition cursor-pointer text-center sm:whitespace-nowrap">
              Upload Signed PDF
              <input type="file" accept="application/pdf,.pdf" onChange={handleUploadSignedPdf} className="hidden" />
            </label>
          )}
        </div>
      )
    }

    if (signed && uploadedFile) {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
          <span className="text-sm font-semibold text-green-700 sm:whitespace-nowrap">Signed PDF Uploaded</span>
          <a
            href={uploadedFile.url}
            download={uploadedFile.fileName}
            className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg transition text-center sm:whitespace-nowrap"
          >
            Download Signed PDF
          </a>
        </div>
      )
    }

    if (signed) {
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end">
          <span className="text-sm font-semibold text-green-700 sm:whitespace-nowrap">Signed Off</span>
          <a
            href={downloadPdfUrl}
            download={downloadName}
            className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg transition text-center sm:whitespace-nowrap"
          >
            {signature?.signedPdfUrl || uploadedFile ? 'Download Signed PDF' : 'Download PDF'}
          </a>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-end">
        {onPreview && (
          <button
            onClick={onPreview}
            className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg transition text-center sm:whitespace-nowrap"
          >
            Preview
          </button>
        )}
        <a
          href={downloadPdfUrl}
          download={downloadName}
          onClick={markManualDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition text-center sm:whitespace-nowrap"
        >
          Download PDF
        </a>
        {onStartDirectSignoff && (
          <button
            onClick={onStartDirectSignoff}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition text-center sm:whitespace-nowrap"
          >
            Signoff Directly
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={compact ? 'text-sm text-slate-700' : 'text-right'}>
      <p className="font-semibold text-slate-900">
        {doc.assigneeIds.length ? `${doc.signedIds.length}/${doc.assigneeIds.length} signed` : 'Unassigned'}
      </p>
      <p className="text-xs text-slate-500">Deadline {formatDate(doc.deadline)}</p>
    </div>
  )
}

function createPreviewPdfUrl(
  doc: DocumentItem,
  signature?: SignatureRecord,
  watermark?: WatermarkSettings,
  signaturePlacement: SignaturePlacementSettings = defaultSignaturePlacement
) {
  if (typeof window === 'undefined') return doc.downloadUrl || '/documents/Draft_Pakta_Integritas.pdf'

  const lines = getDocumentPdfLines(doc, signature)
  const { stream, boldUsed } = buildPdfContentStream(lines, watermark, signaturePlacement.horizontal)

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R${boldUsed ? ' /F2 6 0 R' : ''} >> >> >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ...(boldUsed ? ['<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'] : [])
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return `data:application/pdf;base64,${window.btoa(pdf)}`
}

function pdfPreviewUrl(url: string, pageNumber = 1) {
  if (!url) return url
  return `${url}${url.includes('#') ? '&' : '#'}page=${pageNumber}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`
}

async function convertWordTemplateToPdf(sourceDataUrl: string, signature?: SignatureRecord) {
  if (!isWordPdfConversionEnabled()) return ''

  try {
    const replacements = signature ? {
      '[Placeholder Nama]': signature.signerName,
      '[Placeholder Nomor KTP]': signature.noKtp,
      '[Placeholder NRP]': signature.signerNrp,
      '[Placeholder Jabatan]': signature.signerPosition || '-',
      '[Placeholder Tanggal saat orang melakukan tanda tangan]': formatSignatureDate(new Date())
    } : undefined

    const response = await fetch('/api/documents/convert-word-to-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceDataUrl,
        replacements,
        signatureDataUrl: signature?.signatureDataUrl
      })
    })

    const data = await response.json()
    if (!response.ok || !data.pdfDataUrl) return ''
    return String(data.pdfDataUrl)
  } catch {
    return ''
  }
}

function isWordPdfConversionEnabled() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('digitalPdfSignoff.enableWordPdfConversion') === 'true'
}

async function createSignedPdfUrl(
  doc: DocumentItem,
  signature: SignatureRecord,
  placement: SignaturePlacementSettings
) {
  if (doc.sourceType === 'WORD' && doc.sourceUrl?.startsWith('data:')) {
    const signedFromWord = await convertWordTemplateToPdf(doc.sourceUrl, signature)
    if (signedFromWord) return signedFromWord
  }

  if (!doc.downloadUrl) return createSignedTemplatePdfUrl(doc, signature, placement)

  try {
    const pdfBytes = await fetch(doc.downloadUrl).then((response) => response.arrayBuffer())
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const normalizedPlacement = getDocumentSignaturePlacement({ ...doc, signaturePlacement: placement }, defaultSignaturePlacement)
    const page = pages[Math.max(0, Math.min(pages.length - 1, normalizedPlacement.pageNumber - 1))]
    const { width, height } = page.getSize()
    const signatureImage = await pdfDoc.embedPng(signature.signatureDataUrl)
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    if (pages[0]) drawSignerIdentityFields(pages[0], signature, regularFont, getDocumentIdentityLayout(doc))

    drawSignatureStamp(
      page,
      signature,
      normalizedPlacement,
      signatureImage,
      regularFont,
      boldFont,
      getKnownPdfSignatureAnchor(doc, page)
    )

    const signedBytes = await pdfDoc.save()
    return bytesToDataUrl(signedBytes)
  } catch {
    return createSignedTemplatePdfUrl(doc, signature, placement)
  }
}

async function createSignedTemplatePdfUrl(
  doc: DocumentItem,
  signature: SignatureRecord,
  placement: SignaturePlacementSettings
) {
  try {
    const pdfDoc = await PDFDocument.create()
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const signatureImage = await pdfDoc.embedPng(signature.signatureDataUrl)
    const normalizedPlacement = getDocumentSignaturePlacement({ ...doc, signaturePlacement: placement }, defaultSignaturePlacement)
    const templateResult = drawSignedTemplatePages(pdfDoc, doc, signature, regularFont, boldFont)
    const pages = templateResult.pages.length ? templateResult.pages : [pdfDoc.addPage([612, 792])]
    const signaturePage = templateResult.signatureAnchor?.page ||
      pages[Math.max(0, Math.min(pages.length - 1, normalizedPlacement.pageNumber - 1))]
    drawSignatureStamp(
      signaturePage,
      signature,
      normalizedPlacement,
      signatureImage,
      regularFont,
      boldFont,
      templateResult.signatureAnchor
    )

    const signedBytes = await pdfDoc.save()
    return bytesToDataUrl(signedBytes)
  } catch {
    return ''
  }
}

type SignatureAnchor = {
  page: PDFPage
  x: number
  y: number
  width: number
}

function drawSignedTemplatePages(
  pdfDoc: PDFDocument,
  doc: DocumentItem,
  signature: SignatureRecord,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  const pages: PDFPage[] = []
  const marginX = 72
  const pageWidth = 612
  const pageHeight = 792
  const maxWidth = pageWidth - (marginX * 2)
  const lineHeight = 13
  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - 74
  let signatureAnchor: SignatureAnchor | undefined
  let pendingSignatureAnchor: SignatureAnchor | undefined
  pages.push(page)

  const addPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    pages.push(page)
    y = pageHeight - 74
  }

  const drawWrapped = (text: string, options: { font: PDFFont; size: number; gapAfter: number; indent?: number }) => {
    const x = marginX + (options.indent || 0)
    const availableWidth = maxWidth - (options.indent || 0)
    const lines = wrapPdfText(sanitizePdfText(text), options.font, options.size, availableWidth)
    lines.forEach((line) => {
      if (y < 56) addPage()
      page.drawText(line, {
        x,
        y,
        size: options.size,
        font: options.font,
        color: rgb(0.05, 0.09, 0.16)
      })
      y -= lineHeight
    })
    y -= options.gapAfter
  }

  const drawIdentityLine = (label: string, value: string) => {
    if (y < 56) addPage()
    const labelX = marginX
    const colonX = pageWidth * (getDocumentIdentityLayout(doc).valueXPercent / 100) - 14
    const valueX = colonX + 18
    const valueSize = fitPdfFontSize(value, regularFont, 9.5, 7, pageWidth - valueX - marginX)
    page.drawText(sanitizePdfText(label), {
      x: labelX,
      y,
      size: 9.5,
      font: regularFont,
      color: rgb(0.05, 0.09, 0.16)
    })
    page.drawText(':', {
      x: colonX,
      y,
      size: 9.5,
      font: regularFont,
      color: rgb(0.05, 0.09, 0.16)
    })
    page.drawText(sanitizePdfText(value), {
      x: valueX,
      y,
      size: valueSize,
      font: regularFont,
      color: rgb(0.05, 0.09, 0.16)
    })
    y -= lineHeight + 3
  }

  const drawTemplateValueLine = (value: string) => {
    if (y < 56) addPage()
    page.drawText(sanitizePdfText(value), {
      x: marginX,
      y,
      size: 9.5,
      font: regularFont,
      color: rgb(0.05, 0.09, 0.16)
    })
    y -= lineHeight + 3
  }

  buildSignedTemplateLines(doc, signature).forEach((rawLine, index) => {
    const originalLine = rawLine.trim()
    const placeholderLine = getTemplatePlaceholderLine(originalLine, signature)
    if (placeholderLine?.type === 'signature' || hasTemplatePlaceholder(originalLine, 'tanda tangan')) {
      if (y < 120) addPage()
      signatureAnchor = {
        page,
        x: marginX,
        y: y - 16,
        width: 210
      }
      y -= 64
      return
    }
    const line = replaceInlineTemplatePlaceholders(originalLine, signature).trim()
    if (!line) {
      y -= lineHeight
      return
    }

    const normalizedLine = line.toLowerCase()
    if (placeholderLine?.type === 'value') {
      drawTemplateValueLine(placeholderLine.value)
      return
    }

    const identityLine = getIdentityTemplateLine(originalLine, signature)
    if (identityLine) {
      drawIdentityLine(identityLine.label, identityLine.value)
      return
    }

    const isTitle = index === 0 || (
      line.length <= 42 &&
      line === line.toUpperCase() &&
      !/^\d+[\).\s]/.test(line)
    )
    const isSignatureMarker = normalizedLine.includes('yang menyatakan')

    if (isSignatureMarker) {
      drawWrapped(line, { font: boldFont, size: 10.5, gapAfter: 2 })
      if (y < 150) addPage()
      pendingSignatureAnchor = {
        page,
        x: marginX,
        y: y - 58,
        width: 210
      }
      y -= 52
      return
    }

    if (/^_+$/.test(line.replace(/\s/g, ''))) {
      const lineX = pendingSignatureAnchor?.x || marginX
      const lineWidth = pendingSignatureAnchor?.width || 210
      const lineY = y + 4
      page.drawLine({
        start: { x: lineX, y: lineY },
        end: { x: lineX + lineWidth, y: lineY },
        thickness: 1,
        color: rgb(0.05, 0.09, 0.16)
      })
      if (!signatureAnchor) {
        signatureAnchor = { page, x: lineX, y: lineY, width: lineWidth }
      }
      pendingSignatureAnchor = undefined
      y -= 34
      return
    }

    if (isTitle) {
      drawWrapped(line, { font: boldFont, size: 14, gapAfter: 18 })
      return
    }

    const isNumbered = /^\d+[\).\s]/.test(line)
    drawWrapped(line, {
      font: regularFont,
      size: 9.5,
      gapAfter: isNumbered ? 10 : 12,
      indent: isNumbered ? 18 : 0
    })
  })

  if (!signatureAnchor && pendingSignatureAnchor) {
    signatureAnchor = pendingSignatureAnchor
  }

  if (!signatureAnchor) {
    const fallbackPlacement = getDocumentSignaturePlacement(doc, defaultSignaturePlacement)
    const fallbackPage = pages[Math.max(0, Math.min(pages.length - 1, fallbackPlacement.pageNumber - 1))]
    signatureAnchor = {
      page: fallbackPage,
      x: pageWidth * (fallbackPlacement.xPercent / 100),
      y: pageHeight - (pageHeight * (fallbackPlacement.yPercent / 100)),
      width: pageWidth * (fallbackPlacement.widthPercent / 100)
    }
  }

  return { pages, signatureAnchor }
}

type IdentityFieldKey = 'name' | 'ktp' | 'nrp' | 'position'
type TemplatePlaceholderKey = IdentityFieldKey | 'date' | 'signature'

function buildSignedTemplateLines(doc: DocumentItem, signature: SignatureRecord) {
  return normalizeWordTemplateLines(doc.previewText || integrityPreview, signature)
}

function normalizeWordTemplateLines(lines: string[], signature?: SignatureRecord) {
  const flattenedLines = flattenTemplateLines(lines)
  const normalizedLines: string[] = []

  for (let index = 0; index < flattenedLines.length; index += 1) {
    const line = cleanupTemplateLine(flattenedLines[index] || '')
    if (!line) {
      normalizedLines.push('')
      continue
    }

    const identity = getIdentityFieldFromLine(line)
    if (identity) {
      const continuation = consumeIdentityContinuation(flattenedLines, index, identity.key)
      index = continuation.nextIndex
      normalizedLines.push(`${identity.label}: ${getIdentityFieldValue(identity.key, signature)}`.trimEnd())
      continue
    }

    const standalonePlaceholder = getStandaloneTemplatePlaceholderKey(line)
    if (standalonePlaceholder) {
      if (standalonePlaceholder === 'signature') {
        normalizedLines.push('[Placeholder Tanda Tangan]')
        continue
      }

      if (standalonePlaceholder === 'date') {
        const dateValue = signature ? formatSignatureDate(new Date()) : ''
        if (dateValue) normalizedLines.push(dateValue)
        continue
      }

      continue
    }

    const replacedLine = replaceInlineTemplatePlaceholders(line, signature).trim()
    if (!replacedLine || /^:?\s*$/.test(replacedLine)) continue
    normalizedLines.push(replacedLine)
  }

  return collapseExcessBlankTemplateLines(normalizedLines)
}

function flattenTemplateLines(lines: string[]) {
  return lines.flatMap((line) => String(line || '').split(/\r?\n/))
}

function cleanupTemplateLine(line: string) {
  return line
    .replace(/\u00a0/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function collapseExcessBlankTemplateLines(lines: string[]) {
  const collapsed: string[] = []
  lines.forEach((line) => {
    if (!line && !collapsed[collapsed.length - 1]) return
    collapsed.push(line)
  })
  while (collapsed[0] === '') collapsed.shift()
  while (collapsed[collapsed.length - 1] === '') collapsed.pop()
  return collapsed
}

function getIdentityFieldFromLine(line: string): { key: IdentityFieldKey; label: string } | null {
  const normalized = cleanupTemplateLine(line)
  const match = normalized.match(/^(nama|no\.?\s*ktp|nrp|jabatan)\b(.*)$/i)
  if (!match) return null

  const rawLabel = match[1].toLowerCase().replace(/\s+/g, ' ')
  const rest = (match[2] || '').trim()
  const hasAllowedRest = !rest || rest.startsWith(':') || /\[placeholder\s+/i.test(rest)
  if (!hasAllowedRest) return null

  if (rawLabel === 'nama') return { key: 'name', label: 'Nama' }
  if (rawLabel === 'nrp') return { key: 'nrp', label: 'NRP' }
  if (rawLabel === 'jabatan') return { key: 'position', label: 'Jabatan' }
  return { key: 'ktp', label: 'No. KTP' }
}

function consumeIdentityContinuation(lines: string[], currentIndex: number, key: IdentityFieldKey) {
  let nextIndex = currentIndex

  for (let index = currentIndex + 1; index < Math.min(lines.length, currentIndex + 4); index += 1) {
    const line = cleanupTemplateLine(lines[index] || '')
    if (!line || line === ':') {
      nextIndex = index
      continue
    }

    const placeholderKey = getStandaloneTemplatePlaceholderKey(line)
    if (placeholderKey === key) {
      nextIndex = index
      break
    }

    break
  }

  return { nextIndex }
}

function getIdentityFieldValue(key: IdentityFieldKey, signature?: SignatureRecord) {
  if (!signature) return ''
  if (key === 'name') return signature.signerName
  if (key === 'ktp') return signature.noKtp
  if (key === 'nrp') return signature.signerNrp
  return signature.signerPosition || '-'
}

function getStandaloneTemplatePlaceholderKey(line: string): TemplatePlaceholderKey | null {
  const match = cleanupTemplateLine(line).match(/^:?\s*\[placeholder\s+(.+?)\]$/i)
  if (!match) return null

  const key = normalizePlaceholderKey(match[1] || '')
  if (key.includes('tanda tangan')) return 'signature'
  if (key.includes('tanggal')) return 'date'
  if (key.includes('nomor ktp') || key.includes('no ktp') || key.includes('ktp')) return 'ktp'
  if (key.includes('nrp')) return 'nrp'
  if (key.includes('jabatan')) return 'position'
  if (key.includes('nama')) return 'name'
  return null
}

function getIdentityTemplateLine(line: string, signature: SignatureRecord) {
  const identity = getIdentityFieldFromLine(line)
  return identity ? { label: identity.label, value: getIdentityFieldValue(identity.key, signature) } : null
}

function getTemplatePlaceholderLine(line: string, signature: SignatureRecord) {
  const normalized = line.replace(/\s+/g, ' ').trim()
  const placeholderMatch = normalized.match(/^\[placeholder\s+(.+?)\]$/i)
  if (!placeholderMatch) return null

  const key = placeholderMatch[1].toLowerCase()
  if (key.includes('tanda tangan')) return { type: 'signature' as const, value: '' }
  if (key.includes('nomor ktp') || key.includes('no. ktp') || key.includes('ktp')) {
    return { type: 'value' as const, value: signature.noKtp }
  }
  if (key.includes('nrp')) return { type: 'value' as const, value: signature.signerNrp }
  if (key.includes('jabatan')) return { type: 'value' as const, value: signature.signerPosition || '-' }
  if (key.includes('tanggal')) return { type: 'value' as const, value: formatSignatureDate(new Date()) }
  if (key.includes('nama')) return { type: 'value' as const, value: signature.signerName }
  return null
}

function replaceInlineTemplatePlaceholders(line: string, signature?: SignatureRecord) {
  return line.replace(/\[placeholder\s+([^\]]+)\]/gi, (_, rawKey) => {
    const key = normalizePlaceholderKey(String(rawKey || ''))
    if (key.includes('tanda tangan')) return ''
    if (key.includes('nomor ktp') || key.includes('no ktp') || key.includes('ktp')) return signature?.noKtp || ''
    if (key.includes('nrp')) return signature?.signerNrp || ''
    if (key.includes('jabatan')) return signature?.signerPosition || ''
    if (key.includes('tanggal')) return signature ? formatSignatureDate(new Date()) : ''
    if (key.includes('nama')) return signature?.signerName || ''
    return ''
  }).replace(/\s{2,}/g, ' ')
}

function hasTemplatePlaceholder(line: string, alias: string) {
  const normalizedAlias = normalizePlaceholderKey(alias)
  return extractWordTemplatePlaceholderKeys([line]).some((key) => key.includes(normalizedAlias))
}

function removeTemplatePlaceholders(line: string) {
  return line
    .replace(/\[placeholder\s+nama\]/gi, '')
    .replace(/\[placeholder\s+(nomor ktp|no\.?\s*ktp|ktp)\]/gi, '')
    .replace(/\[placeholder\s+nrp\]/gi, '')
    .replace(/\[placeholder\s+jabatan\]/gi, '')
    .replace(/\[placeholder\s+tanggal[^\]]*\]/gi, '')
    .replace(/\[placeholder\s+tanda tangan\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function formatSignatureDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

function wrapPdfText(text: string, font: PDFFont, size: number, maxWidth: number) {
  if (!text) return ['']
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !currentLine) {
      currentLine = candidate
      return
    }

    lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) lines.push(currentLine)
  return lines
}

function fitPdfFontSize(text: string, font: PDFFont, maxSize: number, minSize: number, maxWidth: number) {
  const safeText = sanitizePdfText(text)
  if (!safeText || maxWidth <= 0) return maxSize
  let size = maxSize

  while (size > minSize && font.widthOfTextAtSize(safeText, size) > maxWidth) {
    size -= 0.5
  }

  return Math.max(minSize, Number(size.toFixed(1)))
}

function drawWordTemplatePageOne(
  page: PDFPage,
  doc: DocumentItem,
  signature: SignatureRecord,
  regularFont: PDFFont,
  boldFont: PDFFont
) {
  const { width, height } = page.getSize()
  const identityLayout = getDocumentIdentityLayout(doc)
  page.drawText(sanitizePdfText(doc.name || 'Dokumen Signoff'), {
    x: 72,
    y: height - 76,
    size: 14,
    font: boldFont,
    color: rgb(0.05, 0.09, 0.16)
  })
  page.drawText('Saya yang bertanda tangan dibawah ini:', {
    x: 72,
    y: height - 118,
    size: 10.5,
    font: regularFont,
    color: rgb(0.05, 0.09, 0.16)
  })

  const labelX = 104
  const colonX = width * (identityLayout.valueXPercent / 100) - 12
  const firstY = height * (1 - (identityLayout.nameTopPercent / 100))
  const rowGap = Math.max(13, height * (identityLayout.rowGapPercent / 100))
  const labels = ['Nama', 'No. KTP', 'NRP', 'Jabatan']
  labels.forEach((label, index) => {
    const y = firstY - (rowGap * index)
    page.drawText(label, { x: labelX, y, size: 10, font: regularFont, color: rgb(0.05, 0.09, 0.16) })
    page.drawText(':', { x: colonX, y, size: 10, font: regularFont, color: rgb(0.05, 0.09, 0.16) })
  })
  drawSignerIdentityFields(page, signature, regularFont, identityLayout)

  const paragraphs = [
    'Secara sukarela dengan ini menyatakan, berkomitmen dan menjamin kepada Perusahaan, bahwa:',
    '1. Saya akan bersikap transparan, jujur, obyektif, dan akuntabel dalam melaksanakan tugas.',
    '2. Saya tidak akan melakukan perbuatan yang melanggar peraturan perusahaan dan perundang-undangan.',
    '3. Saya akan menjaga kerahasiaan dan integritas seluruh informasi terkait pekerjaan.'
  ]
  let y = firstY - (rowGap * 5.2)
  paragraphs.forEach((paragraph) => {
    page.drawText(sanitizePdfText(paragraph), {
      x: 72,
      y,
      size: 9,
      font: regularFont,
      color: rgb(0.05, 0.09, 0.16),
      maxWidth: width - 144,
      lineHeight: 13
    })
    y -= 42
  })
}

function drawWordTemplateSignaturePage(page: PDFPage, regularFont: PDFFont, boldFont: PDFFont) {
  const { height } = page.getSize()
  page.drawText('Jakarta,', {
    x: 72,
    y: height - 160,
    size: 11,
    font: regularFont,
    color: rgb(0.05, 0.09, 0.16)
  })
  page.drawText('Yang Menyatakan,', {
    x: 72,
    y: height - 180,
    size: 11,
    font: boldFont,
    color: rgb(0.05, 0.09, 0.16)
  })
  page.drawLine({
    start: { x: 72, y: height - 302 },
    end: { x: 270, y: height - 302 },
    thickness: 1,
    color: rgb(0.05, 0.09, 0.16)
  })
}

function drawSignatureStamp(
  page: PDFPage,
  signature: SignatureRecord,
  placement: SignaturePlacementSettings,
  signatureImage: PDFImage,
  regularFont: PDFFont,
  boldFont: PDFFont,
  anchor?: SignatureAnchor
) {
  const { width, height } = page.getSize()
  if (anchor) {
    const lineX = Math.max(18, Math.min(width - anchor.width - 18, anchor.x))
    const lineY = Math.max(48, Math.min(height - 80, anchor.y))
    const imageWidth = anchor.width * 0.62
    const imageAspect = signatureImage.height / Math.max(1, signatureImage.width)
    const imageHeight = Math.max(14, Math.min(42, imageWidth * imageAspect))
    const imageX = lineX + ((anchor.width - imageWidth) / 2)
    const nameText = sanitizePdfText(signature.signerName)
    const nameSize = fitPdfFontSize(nameText, boldFont, Math.max(9, Math.min(11, anchor.width / 20)), 7.5, anchor.width)
    const nameWidth = boldFont.widthOfTextAtSize(nameText, nameSize)

    page.drawImage(signatureImage, {
      x: imageX,
      y: lineY + 4,
      width: imageWidth,
      height: imageHeight
    })
    page.drawText(nameText, {
      x: lineX + Math.max(0, (anchor.width - nameWidth) / 2),
      y: lineY - 18,
      size: nameSize,
      font: boldFont,
      color: rgb(0.05, 0.09, 0.16)
    })
    return
  }

  const stampWidth = anchor?.width || width * (placement.widthPercent / 100)
  const stampHeight = Math.max(42, Math.min(height * 0.12, stampWidth * 0.3))
  const stampX = width * (placement.xPercent / 100)
  const stampY = height - (height * (placement.yPercent / 100)) - stampHeight
  const safeX = Math.max(18, Math.min(width - stampWidth - 18, stampX))
  const safeY = Math.max(18, Math.min(height - stampHeight - 18, stampY))

  page.drawImage(signatureImage, {
    x: safeX + stampWidth * 0.08,
    y: safeY + stampHeight * 0.42,
    width: stampWidth * 0.48,
    height: stampHeight * 0.34
  })
  const fallbackName = sanitizePdfText(signature.signerName)
  const fallbackNameSize = fitPdfFontSize(fallbackName, boldFont, Math.max(9, Math.min(12, stampWidth / 20)), 7.5, stampWidth - 8)
  page.drawText(fallbackName, {
    x: safeX + 4,
    y: safeY + stampHeight * 0.12,
    size: fallbackNameSize,
    font: boldFont,
    color: rgb(0.05, 0.09, 0.16)
  })
}

function getKnownPdfSignatureAnchor(doc: DocumentItem, page: PDFPage): SignatureAnchor | undefined {
  if (getDocumentTemplateSettings(doc).id !== 'pakta-integritas') return undefined

  const { width, height } = page.getSize()
  return {
    page,
    x: width * 0.12,
    y: height * 0.31,
    width: width * 0.3
  }
}

function drawSignerIdentityFields(
  page: PDFPage,
  signature: SignatureRecord,
  font: PDFFont,
  layout: IdentityFieldLayout = wordTemplateIdentityLayout
) {
  const { width, height } = page.getSize()
  const labelX = width * ((layout.labelXPercent || 11.8) / 100)
  const colonX = width * ((layout.colonXPercent || Math.max(0, layout.valueXPercent - 2)) / 100)
  const valueX = width * (layout.valueXPercent / 100)
  const nameY = height * (1 - (layout.nameTopPercent / 100))
  const rowGap = Math.max(13, height * (layout.rowGapPercent / 100))
  const size = Math.max(8.8, Math.min(10.2, width / 60))
  const color = rgb(0.05, 0.09, 0.16)
  const rows = [
    { label: 'Nama', value: sanitizePdfText(signature.signerName) },
    { label: 'No. KTP', value: sanitizePdfText(signature.noKtp) },
    { label: 'NRP', value: sanitizePdfText(signature.signerNrp) },
    { label: 'Jabatan', value: sanitizePdfText(signature.signerPosition || '-') }
  ]

  const clearX = Math.max(0, labelX - 4)
  const clearY = nameY - (rowGap * 3) - 4
  page.drawRectangle({
    x: clearX,
    y: clearY,
    width: Math.min(width - clearX - 24, Math.max(260, width * 0.5)),
    height: (rowGap * 3) + size + 10,
    color: rgb(1, 1, 1)
  })

  rows.forEach((row, index) => {
    const y = nameY - (rowGap * index)
    page.drawText(row.label, {
      x: labelX,
      y,
      size,
      font,
      color
    })
    page.drawText(':', {
      x: colonX,
      y,
      size,
      font,
      color
    })
    if (!row.value) return
    const textSize = fitPdfFontSize(row.value, font, size, 7, width - valueX - 40)
    page.drawText(row.value, {
      x: valueX,
      y,
      size: textSize,
      font,
      color
    })
  })
}

function bytesToDataUrl(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return `data:application/pdf;base64,${window.btoa(binary)}`
}

function signedPdfFileName(doc: DocumentItem) {
  const baseName = (doc.sourceFileName || doc.fileName || doc.name || 'document.pdf').replace(/\.(pdf|docx?)$/i, '')
  return `${baseName}-signed.pdf`
}

function pdfFileNameFromSource(fileName: string) {
  const baseName = (fileName || 'document').replace(/\.(pdf|docx?)$/i, '')
  return `${baseName}.pdf`
}

function getDocumentPreviewLines(doc: DocumentItem, signature?: SignatureRecord) {
  return normalizeWordTemplateLines(doc.previewText || [
    doc.name,
    'Preview text is not available for this demo document.'
  ], signature)
    .map((line) => {
      const cleanLine = line.trim()
      if (!cleanLine) return ''
      if (cleanLine === 'Nama:' || cleanLine === 'No. KTP:' || cleanLine === 'NRP:') return cleanLine
      if (cleanLine === 'Jabatan:') return 'Jabatan:'
      if (cleanLine.includes('____') && signature) return `Tanda tangan elektronik: ${signature.signerName}`
      return cleanLine
    })
    .filter(Boolean)
}

function getDocumentPdfLines(doc: DocumentItem, signature?: SignatureRecord) {
  return normalizeWordTemplateLines(doc.previewText || [
    doc.name,
    'Preview text is not available for this demo document.'
  ], signature).map((line) => {
    const cleanLine = line.trim()
    if (cleanLine === 'Nama:') return `Nama: ${signature?.signerName || ''}`
    if (cleanLine === 'No. KTP:') return `No. KTP: ${signature?.noKtp || ''}`
    if (cleanLine === 'NRP:') return `NRP: ${signature?.signerNrp || ''}`
    if (cleanLine === 'Jabatan:') return `Jabatan: ${signature?.signerPosition || ''}`
    if (cleanLine === '[Placeholder Tanda Tangan]') return 'SIGNATURE_LINE'
    if (cleanLine.includes('____')) return signature ? `Tanda tangan elektronik: ${signature.signerName}` : 'SIGNATURE_LINE'
    return cleanLine
  }).filter(Boolean)
}

type PdfLineKind = 'title' | 'identity' | 'signature' | 'electronic-signature' | 'paragraph'

type PdfLine = {
  kind: PdfLineKind
  label?: string
  value?: string
  text?: string
}

function buildPdfContentStream(
  lines: string[],
  watermark?: WatermarkSettings,
  signaturePlacement: SignaturePlacementOption = defaultSignaturePlacement.horizontal
) {
  const instructions: string[] = []
  const watermarkText = sanitizePdfText(watermark?.text?.toUpperCase() || '')

  if (watermark && watermarkText) {
    const watermarkOpacity = Math.max(0.05, Math.min(watermark.opacity / 100, 0.18))
    const watermarkSize = Math.max(18, Math.min(watermark.size, 30))
    const watermarkPositions = [
      [84, 640],
      [356, 645],
      [168, 430],
      [422, 434],
      [96, 230],
      [360, 238],
      [190, 88],
      [454, 94]
    ]

    watermarkPositions.forEach(([x, y]) => {
      instructions.push(
        'q',
        `${watermarkOpacity.toFixed(2)} g`,
        'BT',
        `/F2 ${watermarkSize} Tf`,
        `0.848 -0.53 0.53 0.848 ${x} ${y} Tm`,
        `${escapePdfText(watermarkText)} Tj`,
        'ET',
        'Q'
      )
    })
  }

  const pdfLines = normalizePdfLines(lines)
  let cursorY = 724
  let boldUsed = watermarkText.length > 0

  pdfLines.forEach((line) => {
    if (cursorY < 56) return

    if (line.kind === 'title') {
      boldUsed = true
      cursorY = drawPdfText(instructions, line.text || '', {
        x: 72,
        y: cursorY,
        maxChars: 48,
        font: '/F2',
        fontSize: 14,
        leading: 17,
        align: 'center'
      }) - 24
      return
    }

    if (line.kind === 'identity') {
      drawPdfText(instructions, line.label || '', {
        x: 72,
        y: cursorY,
        maxChars: 14,
        font: '/F1',
        fontSize: 10,
        leading: 12
      })
      if (line.value) {
        drawPdfText(instructions, line.value, {
          x: 142,
          y: cursorY,
          maxChars: 84,
          font: '/F1',
          fontSize: 10,
          leading: 12
        })
      }
      instructions.push(
        '0.65 G',
        '0.45 w',
        `142 ${(cursorY - 4).toFixed(2)} m`,
        `540 ${(cursorY - 4).toFixed(2)} l`,
        'S',
        '0 G'
      )
      cursorY -= 22
      return
    }

    if (line.kind === 'signature') {
      const lineWidth = 176
      const x = getSignatureLineX(signaturePlacement, lineWidth)
      const y = Math.max(cursorY - 28, 62)
      instructions.push(
        '0 G',
        '0.8 w',
        `${x.toFixed(2)} ${y.toFixed(2)} m`,
        `${(x + lineWidth).toFixed(2)} ${y.toFixed(2)} l`,
        'S'
      )
      cursorY = y - 22
      return
    }

    if (line.kind === 'electronic-signature') {
      boldUsed = true
      cursorY = drawPdfText(instructions, line.text || '', {
        x: getSignatureLineX(signaturePlacement, 176),
        y: cursorY - 18,
        maxChars: 38,
        font: '/F2',
        fontSize: 9.5,
        leading: 11,
        align: signaturePlacement
      }) - 12
      return
    }

    cursorY = drawPdfText(instructions, line.text || '', {
      x: 72,
      y: cursorY,
      maxChars: 110,
      font: '/F1',
      fontSize: 8.3,
      leading: 10.6
    }) - 8
  })

  return {
    stream: instructions.join('\n'),
    boldUsed
  }
}

function normalizePdfLines(lines: string[]): PdfLine[] {
  return lines.map((line, index) => {
    if (index === 0) return { kind: 'title', text: line }
    if (line.startsWith('Nama:')) return splitIdentityPdfLine('Nama:', line)
    if (line.startsWith('No. KTP:')) return splitIdentityPdfLine('No. KTP:', line)
    if (line.startsWith('NRP:')) return splitIdentityPdfLine('NRP:', line)
    if (line.startsWith('Jabatan:')) return splitIdentityPdfLine('Jabatan:', line)
    if (line === 'SIGNATURE_LINE') return { kind: 'signature' }
    if (line.startsWith('Tanda tangan elektronik:')) return { kind: 'electronic-signature', text: line }
    return { kind: 'paragraph', text: line }
  })
}

function splitIdentityPdfLine(label: string, line: string): PdfLine {
  return {
    kind: 'identity',
    label,
    value: line.slice(label.length).trim()
  }
}

function drawPdfText(
  instructions: string[],
  text: string,
  options: {
    x: number
    y: number
    maxChars: number
    font: '/F1' | '/F2'
    fontSize: number
    leading: number
    align?: 'left' | 'center' | 'right'
  }
) {
  let cursorY = options.y
  const segments = wrapPdfLine(text, options.maxChars)

  segments.forEach((segment) => {
    if (cursorY < 56) return
    const safeSegment = sanitizePdfText(segment)
    const estimatedWidth = safeSegment.length * (options.fontSize * 0.52)
    const x = options.align === 'center'
      ? Math.max(72, (612 - estimatedWidth) / 2)
      : options.align === 'right'
        ? Math.max(72, options.x + 176 - estimatedWidth)
        : options.x

    instructions.push(
      'BT',
      `${options.font} ${options.fontSize} Tf`,
      `${x.toFixed(2)} ${cursorY.toFixed(2)} Td`,
      `${escapePdfText(safeSegment)} Tj`,
      'ET'
    )
    cursorY -= options.leading
  })

  return cursorY
}

function getSignatureLineX(placement: SignaturePlacementOption, lineWidth: number) {
  if (placement === 'left') return 72
  if (placement === 'right') return 612 - 72 - lineWidth
  return (612 - lineWidth) / 2
}

function wrapPdfLine(line: string, maxLength: number) {
  const words = line.split(' ')
  const wrapped: string[] = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength) {
      if (current) wrapped.push(current)
      current = word
    } else {
      current = next
    }
  })

  if (current) wrapped.push(current)
  return wrapped.length ? wrapped : ['']
}

function escapePdfText(value: string) {
  const ascii = sanitizePdfText(value)
  return `(${ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')})`
}

function sanitizePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, ' ')
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
  adminEntity,
  watermark,
  onWatermarkChange,
  signaturePlacement,
  people,
  onPeopleChange,
  docs,
  nextDocumentId,
  onDocumentCreate,
  onDocumentUpdate,
  onDocumentDelete,
  picEmails,
  onPicEmailsChange
}: {
  adminView: AdminView
  setAdminView: (view: AdminView) => void
  isSuperAdmin: boolean
  adminEntity: string
  watermark: WatermarkSettings
  onWatermarkChange: (settings: WatermarkSettings) => void
  signaturePlacement: SignaturePlacementSettings
  people: Person[]
  onPeopleChange: (people: Person[]) => void
  docs: DocumentItem[]
  nextDocumentId: number
  onDocumentCreate: (doc: DocumentItem) => void
  onDocumentUpdate: (doc: DocumentItem) => void
  onDocumentDelete: (docId: number) => void
  picEmails: PicEmailMap
  onPicEmailsChange: (emails: PicEmailMap) => void
}) {
  const actions: { id: AdminView; label: string; description: string }[] = [
    { id: 'upload', label: 'Upload New Document', description: 'Prepare a new Word template for distribution.' },
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
            docs={docs}
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
      <AdminDetail
        view={adminView}
        people={people}
        onPeopleChange={onPeopleChange}
        docs={docs}
        nextDocumentId={nextDocumentId}
        onDocumentCreate={onDocumentCreate}
        onDocumentUpdate={onDocumentUpdate}
        onDocumentDelete={onDocumentDelete}
        isSuperAdmin={isSuperAdmin}
        adminEntity={adminEntity}
        picEmails={picEmails}
        onPicEmailsChange={onPicEmailsChange}
      />
    </div>
  )
}

function SignaturePlacementSettingsPanel({
  placement,
  docs
}: {
  placement: SignaturePlacementSettings
  docs: DocumentItem[]
}) {
  const [selectedDocId, setSelectedDocId] = useState<number>(docs[0]?.id || 0)
  const selectedDoc = docs.find((doc) => doc.id === selectedDocId) || docs[0]
  const templateSettings = getDocumentTemplateSettings(selectedDoc)
  const fixedPlacement = getDocumentSignaturePlacement(selectedDoc, placement)

  useEffect(() => {
    if (selectedDocId && docs.some((doc) => doc.id === selectedDocId)) return
    setSelectedDocId(docs[0]?.id || 0)
  }, [docs, selectedDocId])

  return (
    <div className="border border-green-100 rounded-lg p-5 bg-green-50">
      <div className="mb-4 flex flex-col gap-1">
        <h4 className="font-bold text-slate-900">Document Template Placement</h4>
        <p className="text-sm text-slate-600">
          Placement dibuat fix berdasarkan nama dokumen/template Word, lalu dipakai semua user signer dokumen tersebut.
        </p>
      </div>

      <label className="mb-4 block text-sm font-semibold text-slate-700">
        Dokumen
        <select
          value={selectedDoc?.id || 0}
          onChange={(event) => setSelectedDocId(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-green-100 bg-white px-3 py-2 font-normal text-slate-900"
          disabled={!docs.length}
        >
          {!docs.length && <option value={0}>Belum ada dokumen</option>}
          {docs.map((doc) => (
            <option key={doc.id} value={doc.id}>{doc.name}</option>
          ))}
        </select>
      </label>

      {!selectedDoc ? (
        <div className="rounded-lg border border-green-100 bg-white p-4 text-sm text-slate-600">
          Upload dokumen Word terlebih dahulu. Setelah dokumen masuk, sistem akan memilih placement template secara otomatis.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <TemplatePlacementCard
            title="Template Terdeteksi"
            value={templateSettings.label}
            description={`Berdasarkan ${selectedDoc.sourceFileName || selectedDoc.fileName || selectedDoc.name}.`}
          />
          <TemplatePlacementCard
            title="Informasi Pengisi"
            value="Autofill ESS"
            description={templateSettings.identityDescription}
          />
          <TemplatePlacementCard
            title="Tanda Tangan"
            value={`Halaman ${fixedPlacement.pageNumber}`}
            description={`${templateSettings.signatureDescription} Koordinat: X ${fixedPlacement.xPercent}%, Y ${fixedPlacement.yPercent}%, lebar ${fixedPlacement.widthPercent}%.`}
          />
        </div>
      )}
    </div>
  )
}

function TemplatePlacementCard({
  title,
  value,
  description
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-green-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{title}</p>
      <p className="mt-2 font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
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
  onPeopleChange,
  docs,
  nextDocumentId,
  onDocumentCreate,
  onDocumentUpdate,
  onDocumentDelete,
  isSuperAdmin,
  adminEntity,
  picEmails,
  onPicEmailsChange
}: {
  view: AdminView
  people: Person[]
  onPeopleChange: (people: Person[]) => void
  docs: DocumentItem[]
  nextDocumentId: number
  onDocumentCreate: (doc: DocumentItem) => void
  onDocumentUpdate: (doc: DocumentItem) => void
  onDocumentDelete: (docId: number) => void
  isSuperAdmin: boolean
  adminEntity: string
  picEmails: PicEmailMap
  onPicEmailsChange: (emails: PicEmailMap) => void
}) {
  const scopedUploadPeople = useMemo(() => (
    people.filter((person) => isSuperAdmin || (person.entity || person.department) === adminEntity)
  ), [adminEntity, isSuperAdmin, people])
  const availableUploadPics = useMemo(() => (
    initialPicUsers.filter((pic) => scopedUploadPeople.some((person) => person.picId === pic.id))
  ), [scopedUploadPeople])
  const defaultUploadPicIds = useMemo(() => [] as number[], [])
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Policy',
    deadline: getDefaultDeadline(),
    selectedPicIds: defaultUploadPicIds,
    selectedAssigneeIds: [] as number[],
    fileName: '',
    fileUrl: '',
    pdfUrl: '',
    previewText: integrityPreview,
    message: '',
    error: ''
  })
  const buildDistributionForm = (doc?: DocumentItem) => {
    const allowedPicIds = new Set(availableUploadPics.map((pic) => pic.id))
    const docPicIds = doc ? (doc.picIds || [doc.picId]) : []
    const validPicIds = docPicIds.filter((id) => allowedPicIds.has(id))
    const selectedPicIds = validPicIds.length ? validPicIds : defaultUploadPicIds
    const allowedPersonIds = new Set(
      scopedUploadPeople
        .filter((person) => selectedPicIds.includes(person.picId))
        .map((person) => person.id)
    )

    return {
      docId: doc?.id || 0,
      selectedPicIds,
      selectedAssigneeIds: (doc?.assigneeIds || []).filter((id) => allowedPersonIds.has(id)),
      message: '',
      error: ''
    }
  }
  const [distributionForm, setDistributionForm] = useState(() => buildDistributionForm(docs[0]))

  useEffect(() => {
    setUploadForm((current) => {
      const allowedPicIds = new Set(availableUploadPics.map((pic) => pic.id))
      const validPicIds = current.selectedPicIds.filter((id) => allowedPicIds.has(id))
      const selectedPicIds = validPicIds.length ? validPicIds : defaultUploadPicIds
      const allowedPersonIds = new Set(
        scopedUploadPeople
          .filter((person) => selectedPicIds.includes(person.picId))
          .map((person) => person.id)
      )
      const selectedAssigneeIds = current.selectedAssigneeIds.filter((id) => allowedPersonIds.has(id))

      if (
        sameNumberArray(current.selectedPicIds, selectedPicIds) &&
        sameNumberArray(current.selectedAssigneeIds, selectedAssigneeIds)
      ) {
        return current
      }

      return { ...current, selectedPicIds, selectedAssigneeIds }
    })
  }, [availableUploadPics, defaultUploadPicIds, scopedUploadPeople])

  useEffect(() => {
    const selectedDoc = docs.find((doc) => doc.id === distributionForm.docId) || docs[0]
    if (!selectedDoc) return

    setDistributionForm((current) => {
      if (current.docId !== selectedDoc.id) return buildDistributionForm(selectedDoc)

      const normalized = buildDistributionForm({
        ...selectedDoc,
        picIds: current.selectedPicIds,
        assigneeIds: current.selectedAssigneeIds
      })

      if (
        sameNumberArray(current.selectedPicIds, normalized.selectedPicIds) &&
        sameNumberArray(current.selectedAssigneeIds, normalized.selectedAssigneeIds)
      ) {
        return current
      }

      return {
        ...current,
        selectedPicIds: normalized.selectedPicIds,
        selectedAssigneeIds: normalized.selectedAssigneeIds
      }
    })
  }, [availableUploadPics, defaultUploadPicIds, distributionForm.docId, docs, scopedUploadPeople])

  const selectedUploadPicIds = uploadForm.selectedPicIds
  const assignableUploadPeople = scopedUploadPeople.filter((person) => selectedUploadPicIds.includes(person.picId))
  const selectedAssigneeIds = new Set(uploadForm.selectedAssigneeIds)
  const assignableDistributionPeople = scopedUploadPeople.filter((person) => distributionForm.selectedPicIds.includes(person.picId))
  const selectedDistributionAssigneeIds = new Set(distributionForm.selectedAssigneeIds)

  const handleUploadWord = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isWordTemplateFile(file)) {
      setUploadForm((current) => ({ ...current, error: 'File harus berformat Word .docx agar placeholder dapat dibaca.', message: '' }))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const fileUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!fileUrl) {
        setUploadForm((current) => ({ ...current, error: 'File Word gagal dibaca.', message: '' }))
        return
      }
      const extractedPreviewText = await extractWordPreviewText(fileUrl)
      const missingPlaceholders = findMissingWordTemplatePlaceholders(extractedPreviewText)

      if (missingPlaceholders.length) {
        setUploadForm((current) => ({
          ...current,
          fileName: '',
          fileUrl: '',
          pdfUrl: '',
          previewText: integrityPreview,
          error: `Template Word harus memiliki placeholder berikut: ${missingPlaceholders.join(', ')}.`,
          message: ''
        }))
        return
      }

      setUploadForm((current) => ({ ...current, message: 'Mengonversi Word menjadi PDF preview...', error: '' }))
      const pdfUrl = await convertWordTemplateToPdf(fileUrl)
      if (!pdfUrl) {
        setUploadForm((current) => ({
          ...current,
          fileName: file.name,
          fileUrl,
          pdfUrl: '',
          previewText: extractedPreviewText.length ? extractedPreviewText : integrityPreview,
          error: 'Konversi otomatis Word ke PDF gagal di lokal ini. Upload PDF preview hasil export dari Word agar tampilan user tetap presisi.',
          message: ''
        }))
        return
      }

      setUploadForm((current) => ({
        ...current,
        fileName: file.name,
        fileUrl,
        pdfUrl,
        previewText: extractedPreviewText.length ? extractedPreviewText : integrityPreview,
        error: '',
        message: 'Word berhasil dikonversi menjadi PDF preview.'
      }))
    }
    reader.onerror = () => {
      setUploadForm((current) => ({ ...current, error: 'File Word gagal dibaca.', message: '' }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleUploadPreviewPdf = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadForm((current) => ({ ...current, error: 'File preview harus berformat PDF.', message: '' }))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const pdfUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!pdfUrl) {
        setUploadForm((current) => ({ ...current, error: 'File PDF preview gagal dibaca.', message: '' }))
        return
      }

      setUploadForm((current) => ({
        ...current,
        pdfUrl,
        error: '',
        message: 'PDF preview berhasil dipasang. Dokumen siap disimpan.'
      }))
    }
    reader.onerror = () => {
      setUploadForm((current) => ({ ...current, error: 'File PDF preview gagal dibaca.', message: '' }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const toggleUploadPic = (picId: number) => {
    setUploadForm((current) => {
      const selectedPicIds = current.selectedPicIds.includes(picId)
        ? current.selectedPicIds.filter((id) => id !== picId)
        : [...current.selectedPicIds, picId]
      const allowedPersonIds = new Set(
        scopedUploadPeople
          .filter((person) => selectedPicIds.includes(person.picId))
          .map((person) => person.id)
      )

      return {
        ...current,
        selectedPicIds,
        selectedAssigneeIds: current.selectedAssigneeIds.filter((id) => allowedPersonIds.has(id)),
        error: '',
        message: ''
      }
    })
  }

  const toggleUploadAssignee = (personId: number) => {
    setUploadForm((current) => ({
      ...current,
      selectedAssigneeIds: current.selectedAssigneeIds.includes(personId)
        ? current.selectedAssigneeIds.filter((id) => id !== personId)
        : [...current.selectedAssigneeIds, personId],
      error: '',
      message: ''
    }))
  }

  const selectAllUploadAssignees = () => {
    setUploadForm((current) => ({
      ...current,
      selectedAssigneeIds: assignableUploadPeople.map((person) => person.id),
      error: '',
      message: ''
    }))
  }

  const clearUploadAssignees = () => {
    setUploadForm((current) => ({ ...current, selectedAssigneeIds: [], error: '', message: '' }))
  }

  const saveUploadedDocument = () => {
    const title = uploadForm.title.trim()
    const selectedPics = availableUploadPics.filter((pic) => uploadForm.selectedPicIds.includes(pic.id))
    const assignableIds = new Set(assignableUploadPeople.map((person) => person.id))
    const selectedAssigneeIds = uploadForm.selectedAssigneeIds.filter((id) => assignableIds.has(id))

    if (!title) {
      setUploadForm((current) => ({ ...current, error: 'Judul dokumen wajib diisi.', message: '' }))
      return
    }
    if (!uploadForm.fileUrl) {
      setUploadForm((current) => ({ ...current, error: 'Pilih file Word terlebih dahulu.', message: '' }))
      return
    }
    if (!uploadForm.pdfUrl) {
      setUploadForm((current) => ({ ...current, error: 'PDF preview belum tersedia. Upload ulang file Word agar sistem membuat preview PDF.', message: '' }))
      return
    }
    const templateSettings = getDocumentTemplateSettings({
      name: title,
      fileName: uploadForm.fileName,
      sourceFileName: uploadForm.fileName,
      sourceType: 'WORD'
    })
    const nextDocument: DocumentItem = {
      id: nextDocumentId,
      name: title,
      status: selectedAssigneeIds.length ? 'ACTIVE' : 'PENDING',
      category: uploadForm.category,
      deadline: uploadForm.deadline || getDefaultDeadline(),
      picId: selectedPics[0]?.id || 0,
      picIds: selectedPics.map((pic) => pic.id),
      picName: selectedPics.length ? selectedPics.map((pic) => pic.name).join(', ') : 'Unassigned',
      assigneeIds: selectedAssigneeIds,
      downloadedIds: [],
      signedIds: [],
      downloadUrl: uploadForm.pdfUrl,
      fileName: pdfFileNameFromSource(uploadForm.fileName),
      sourceUrl: uploadForm.fileUrl,
      sourceFileName: uploadForm.fileName,
      sourceType: 'WORD',
      ownerEntity: adminEntity,
      signaturePlacement: templateSettings.signaturePlacement,
      previewText: uploadForm.previewText
    }

    onDocumentCreate(nextDocument)
    setDistributionForm(buildDistributionForm(nextDocument))
    setUploadForm({
      title: '',
      category: 'Policy',
      deadline: getDefaultDeadline(),
      selectedPicIds: defaultUploadPicIds,
      selectedAssigneeIds: [],
      fileName: '',
      fileUrl: '',
      pdfUrl: '',
      previewText: integrityPreview,
      message: selectedAssigneeIds.length
        ? `${title} berhasil diupload sebagai template Word dan dimapping ke ${selectedPics.length} PIC dan ${selectedAssigneeIds.length} user.`
        : `${title} berhasil diupload sebagai template Word pending. Assign PIC dan user melalui Create Distribution.`,
      error: ''
    })
  }

  const selectDistributionDocument = (docId: number) => {
    const doc = docs.find((item) => item.id === docId)
    setDistributionForm(buildDistributionForm(doc))
  }

  const toggleDistributionPic = (picId: number) => {
    setDistributionForm((current) => {
      const selectedPicIds = current.selectedPicIds.includes(picId)
        ? current.selectedPicIds.filter((id) => id !== picId)
        : [...current.selectedPicIds, picId]
      const allowedPersonIds = new Set(
        scopedUploadPeople
          .filter((person) => selectedPicIds.includes(person.picId))
          .map((person) => person.id)
      )

      return {
        ...current,
        selectedPicIds,
        selectedAssigneeIds: current.selectedAssigneeIds.filter((id) => allowedPersonIds.has(id)),
        error: '',
        message: ''
      }
    })
  }

  const toggleDistributionAssignee = (personId: number) => {
    setDistributionForm((current) => ({
      ...current,
      selectedAssigneeIds: current.selectedAssigneeIds.includes(personId)
        ? current.selectedAssigneeIds.filter((id) => id !== personId)
        : [...current.selectedAssigneeIds, personId],
      error: '',
      message: ''
    }))
  }

  const selectAllDistributionAssignees = () => {
    setDistributionForm((current) => ({
      ...current,
      selectedAssigneeIds: assignableDistributionPeople.map((person) => person.id),
      error: '',
      message: ''
    }))
  }

  const clearDistributionAssignees = () => {
    setDistributionForm((current) => ({ ...current, selectedAssigneeIds: [], error: '', message: '' }))
  }

  const saveDistributionMapping = () => {
    const doc = docs.find((item) => item.id === distributionForm.docId)
    const selectedPics = availableUploadPics.filter((pic) => distributionForm.selectedPicIds.includes(pic.id))
    const assignableIds = new Set(assignableDistributionPeople.map((person) => person.id))
    const selectedAssigneeIds = distributionForm.selectedAssigneeIds.filter((id) => assignableIds.has(id))

    if (!doc) {
      setDistributionForm((current) => ({ ...current, error: 'Pilih dokumen terlebih dahulu.', message: '' }))
      return
    }
    if (!selectedPics.length) {
      setDistributionForm((current) => ({ ...current, error: 'Pilih minimal satu PIC.', message: '' }))
      return
    }
    if (!selectedAssigneeIds.length) {
      setDistributionForm((current) => ({ ...current, error: 'Pilih minimal satu user untuk signoff.', message: '' }))
      return
    }

    onDocumentUpdate({
      ...doc,
      status: 'ACTIVE',
      picId: selectedPics[0].id,
      picIds: selectedPics.map((pic) => pic.id),
      picName: selectedPics.map((pic) => pic.name).join(', '),
      assigneeIds: selectedAssigneeIds,
      downloadedIds: doc.downloadedIds.filter((id) => selectedAssigneeIds.includes(id)),
      signedIds: doc.signedIds.filter((id) => selectedAssigneeIds.includes(id))
    })
    setDistributionForm((current) => ({
      ...current,
      message: `${doc.name} berhasil dimapping ke ${selectedPics.length} PIC dan ${selectedAssigneeIds.length} user.`,
      error: ''
    }))
  }

  if (view === 'upload') {
    return (
      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
        <h4 className="font-bold text-slate-900 mb-4">Upload New Document</h4>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm font-semibold text-slate-700">
              Document title
              <input
                value={uploadForm.title}
                onChange={(event) => setUploadForm({ ...uploadForm, title: event.target.value, error: '', message: '' })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal bg-white"
                placeholder="Document title"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Category
              <select
                value={uploadForm.category}
                onChange={(event) => setUploadForm({ ...uploadForm, category: event.target.value, error: '', message: '' })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal bg-white"
              >
                <option>Policy</option>
                <option>Compliance</option>
                <option>Legal</option>
                <option>HR</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Deadline
              <input
                type="date"
                value={uploadForm.deadline}
                onChange={(event) => setUploadForm({ ...uploadForm, deadline: event.target.value, error: '', message: '' })}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal bg-white"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 text-center cursor-pointer">
              Choose Word
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleUploadWord}
                className="hidden"
              />
            </label>
            <span className="text-sm text-slate-600 break-all">
              {uploadForm.fileName || 'No Word selected'}
            </span>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg px-4 py-2 text-center cursor-pointer">
              Choose PDF Preview
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleUploadPreviewPdf}
                className="hidden"
              />
            </label>
            <span className="text-sm text-slate-600">
              {uploadForm.pdfUrl ? 'PDF preview ready' : 'Optional jika auto-convert Word gagal'}
            </span>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Placeholder wajib di template Word:</p>
            <p className="mt-1 break-words">
              {requiredWordTemplatePlaceholders.map((placeholder) => placeholder.label).join(', ')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900 mb-1">PIC Tujuan</p>
              <p className="mb-3 text-xs text-slate-500">Optional saat upload. Bisa diassign setelah dokumen tersimpan.</p>
              <div className="space-y-2">
                {availableUploadPics.map((pic) => {
                  const memberCount = scopedUploadPeople.filter((person) => person.picId === pic.id).length

                  return (
                    <label key={pic.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={uploadForm.selectedPicIds.includes(pic.id)}
                        onChange={() => toggleUploadPic(pic.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold text-slate-900">{pic.name}</span>
                        <span className="block text-xs text-slate-500">{memberCount} user</span>
                      </span>
                    </label>
                  )
                })}
                {!availableUploadPics.length && <p className="text-sm text-slate-500">No PIC available.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 min-w-0">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">User Signoff</p>
                  <p className="text-xs text-slate-500">Optional saat upload</p>
                  <p className="text-xs text-slate-500">{uploadForm.selectedAssigneeIds.length}/{assignableUploadPeople.length} selected</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllUploadAssignees}
                    className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg"
                    type="button"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearUploadAssignees}
                    className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg"
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">User</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">PIC</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Assign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {assignableUploadPeople.map((person) => {
                      const pic = initialPicUsers.find((item) => item.id === person.picId)

                      return (
                        <tr key={person.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-sm">
                            <p className="font-semibold text-slate-900">{person.name}</p>
                            <p className="text-xs text-slate-500">{person.email}</p>
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-600">{pic?.name || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="checkbox"
                              checked={selectedAssigneeIds.has(person.id)}
                              onChange={() => toggleUploadAssignee(person.id)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {!assignableUploadPeople.length && <p className="text-sm text-slate-500 py-3">Select PIC first.</p>}
              </div>
            </div>
          </div>

          {uploadForm.error && <p className="text-sm font-semibold text-red-700">{uploadForm.error}</p>}
          {uploadForm.message && <p className="text-sm font-semibold text-green-700">{uploadForm.message}</p>}

          <button
            onClick={saveUploadedDocument}
            className="bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-lg px-4 py-2"
            type="button"
          >
            Save Document Mapping
          </button>

          <UploadedDocumentsPanel docs={docs} people={people} onDocumentDelete={onDocumentDelete} />
        </div>
      </div>
    )
  }

  if (view === 'distribution') {
    return (
      <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
        <h4 className="font-bold text-slate-900 mb-4">Create Distribution</h4>
        <div className="space-y-5">
          {!docs.length ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Belum ada dokumen tersimpan. Upload dokumen terlebih dahulu melalui menu Upload New Document.
            </div>
          ) : (
            <label className="text-sm font-semibold text-slate-700">
              Document
              <select
                value={distributionForm.docId}
                onChange={(event) => selectDistributionDocument(Number(event.target.value))}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal bg-white"
              >
                {docs.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
              </select>
            </label>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold text-slate-900 mb-3">PIC Tujuan</p>
              <div className="space-y-2">
                {availableUploadPics.map((pic) => {
                  const memberCount = scopedUploadPeople.filter((person) => person.picId === pic.id).length

                  return (
                    <label key={pic.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={distributionForm.selectedPicIds.includes(pic.id)}
                        onChange={() => toggleDistributionPic(pic.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold text-slate-900">{pic.name}</span>
                        <span className="block text-xs text-slate-500">{memberCount} user</span>
                      </span>
                    </label>
                  )
                })}
                {!availableUploadPics.length && <p className="text-sm text-slate-500">No PIC available.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 min-w-0">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">User Signoff</p>
                  <p className="text-xs text-slate-500">{distributionForm.selectedAssigneeIds.length}/{assignableDistributionPeople.length} selected</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllDistributionAssignees}
                    className="border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-2 rounded-lg"
                    type="button"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearDistributionAssignees}
                    className="border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold px-3 py-2 rounded-lg"
                    type="button"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">User</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">PIC</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Assign</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {assignableDistributionPeople.map((person) => {
                      const pic = initialPicUsers.find((item) => item.id === person.picId)

                      return (
                        <tr key={person.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-sm">
                            <p className="font-semibold text-slate-900">{person.name}</p>
                            <p className="text-xs text-slate-500">{person.email}</p>
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-600">{pic?.name || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="checkbox"
                              checked={selectedDistributionAssigneeIds.has(person.id)}
                              onChange={() => toggleDistributionAssignee(person.id)}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {!assignableDistributionPeople.length && <p className="text-sm text-slate-500 py-3">Select PIC first.</p>}
              </div>
            </div>
          </div>

          {distributionForm.error && <p className="text-sm font-semibold text-red-700">{distributionForm.error}</p>}
          {distributionForm.message && <p className="text-sm font-semibold text-green-700">{distributionForm.message}</p>}

          <button
            onClick={saveDistributionMapping}
            disabled={!docs.length}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2"
            type="button"
          >
            Assign Distribution
          </button>
        </div>
      </div>
    )
  }

  if (view === 'users') {
    return (
      <ManageUsersPanel
        people={people}
        onPeopleChange={onPeopleChange}
        isSuperAdmin={isSuperAdmin}
        adminEntity={adminEntity}
        picEmails={picEmails}
        onPicEmailsChange={onPicEmailsChange}
      />
    )
  }

  return <DocumentAnalyticsPanel docs={docs} people={people} />
}

function UploadedDocumentsPanel({
  docs,
  people,
  onDocumentDelete
}: {
  docs: DocumentItem[]
  people: Person[]
  onDocumentDelete: (docId: number) => void
}) {
  const uploadedDocs = docs.filter((doc) => doc.fileName || doc.downloadUrl || doc.sourceUrl)
  const [previewDocId, setPreviewDocId] = useState<number | null>(null)
  const previewDoc = uploadedDocs.find((doc) => doc.id === previewDocId)

  const deleteDocument = (doc: DocumentItem) => {
    const confirmed = window.confirm(
      `Hapus dokumen "${doc.name}"? Semua assignment, tanda tangan, dan file signed untuk dokumen ini akan ikut dihapus.`
    )
    if (!confirmed) return

    if (previewDocId === doc.id) setPreviewDocId(null)
    onDocumentDelete(doc.id)
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-slate-900">Uploaded Documents</p>
          <p className="text-xs text-slate-500">{uploadedDocs.length} Word template(s) available</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Document</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">PIC</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">User Signoff</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Deadline</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Progress</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Status</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {uploadedDocs.map((doc) => {
              const total = doc.assigneeIds.length
              const rate = total ? Math.round((doc.signedIds.length / total) * 100) : 0
              const assigneeNames = doc.assigneeIds
                .map((id) => people.find((person) => person.id === id)?.name)
                .filter(Boolean)
                .join(', ')

              return (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-sm">
                    <p className="font-semibold text-slate-900">{doc.name}</p>
                    <p className="text-xs text-slate-500 break-all">{doc.sourceFileName || doc.fileName || doc.downloadUrl || 'Word template available'}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">{doc.picName}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">
                    <p>{total} user(s)</p>
                    <p className="max-w-xs truncate text-xs text-slate-500">{assigneeNames || '-'}</p>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">{formatDate(doc.deadline)}</td>
                  <td className="px-3 py-3 text-sm">
                    <div className="w-28 bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${rate}%` }} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{doc.signedIds.length}/{total} signed</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusClass(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => setPreviewDocId(previewDocId === doc.id ? null : doc.id)}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        type="button"
                      >
                        View
                      </button>
                      {doc.sourceUrl || doc.downloadUrl ? (
                        <a
                          href={doc.sourceUrl || doc.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="px-3 py-2 text-xs text-slate-400">No file</span>
                      )}
                      <button
                        onClick={() => deleteDocument(doc)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!uploadedDocs.length && <p className="py-4 text-sm text-slate-500">No uploaded Word templates yet.</p>}
      </div>
      {previewDoc && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Preview: {previewDoc.name}</p>
              <p className="text-xs text-slate-500 break-all">{previewDoc.sourceFileName || previewDoc.fileName || previewDoc.downloadUrl}</p>
            </div>
            <button
              onClick={() => setPreviewDocId(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              type="button"
            >
              Close
            </button>
          </div>
          {previewDoc.downloadUrl ? (
            <object
              data={previewDoc.downloadUrl}
              type="application/pdf"
              className="h-[620px] w-full rounded-lg border border-slate-200 bg-white"
            >
              <iframe
                src={previewDoc.downloadUrl}
                title={previewDoc.fileName || previewDoc.name}
                className="h-[620px] w-full rounded-lg border border-slate-200 bg-white"
              />
            </object>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Template Word sudah tersimpan. Preview PDF final akan dibuat saat user melakukan signoff, dengan data identitas terisi setelah titik dua dan tanda tangan di bawah "Yang Menyatakan".
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DocumentAnalyticsPanel({ docs, people }: { docs: DocumentItem[]; people: Person[] }) {
  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
      <h4 className="font-bold text-slate-900 mb-4">Document Approval Progress</h4>
      {!docs.length && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Belum ada dokumen upload. Progress approval akan muncul setelah Super Admin mengupload dokumen.
        </div>
      )}
      <div className="space-y-4">
        {docs.map((doc) => {
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
              <DocumentSignoffDetail
                doc={doc}
                people={people}
                signatures={[]}
                uploadedSignedFiles={[]}
                showDownloadPanel={false}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ManageUsersPanel({
  people,
  onPeopleChange,
  isSuperAdmin,
  adminEntity,
  picEmails,
  onPicEmailsChange
}: {
  people: Person[]
  onPeopleChange: (people: Person[]) => void
  isSuperAdmin: boolean
  adminEntity: string
  picEmails: PicEmailMap
  onPicEmailsChange: (emails: PicEmailMap) => void
}) {
  const availableEntities = useMemo(() => (
    isSuperAdmin ? entityOptions : [adminEntity]
  ), [adminEntity, isSuperAdmin])
  const emptyForm = {
    id: 0,
    nrp: '',
    name: '',
    email: '',
    department: availableEntities[0],
    entity: availableEntities[0],
    position: '',
    noKtp: '',
    picId: initialPicUsers[0].id
  }
  const [form, setForm] = useState<Person>(emptyForm)
  const [selectedEntity, setSelectedEntity] = useState(availableEntities[0])
  const [entitySearch, setEntitySearch] = useState('')
  const [essLookupStatus, setEssLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'error'>('idle')

  useEffect(() => {
    if (!availableEntities.includes(selectedEntity)) {
      setSelectedEntity(availableEntities[0])
    }
  }, [availableEntities, selectedEntity])

  const filteredEntities = availableEntities.filter((entity) => (
    entity.toLowerCase().includes(entitySearch.toLowerCase())
  ))
  const selectedMembers = people.filter((person) => (person.entity || person.department) === selectedEntity)

  useEffect(() => {
    const nrp = form.nrp?.trim() || ''
    if (form.id || nrp.length < 3) {
      setEssLookupStatus('idle')
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      setEssLookupStatus('loading')

      try {
        const response = await fetch(`/api/ess/employee?nrp=${encodeURIComponent(nrp)}`)
        const data = await response.json()
        if (!active) return

        if (response.ok && data.found && data.employee) {
          const employee = data.employee
          const employeeEntity = resolveEssEntity(employee.entity || employee.department, availableEntities, adminEntity, isSuperAdmin)
          const employeePicId = Number(employee.picId) || inferPicIdForEntity(employeeEntity, people)

          setForm((current) => {
            if ((current.nrp || '').trim() !== nrp) return current

            return {
              ...current,
              name: employee.name || current.name,
              email: employee.email || current.email,
              department: employeeEntity,
              entity: employeeEntity,
              position: employee.position || employee.jabatan || current.position || '',
              noKtp: employee.noKtp || employee.nik || current.noKtp || '',
              picId: employeePicId
            }
          })
          setEssLookupStatus('found')
          return
        }

        setEssLookupStatus('not_found')
      } catch {
        if (active) setEssLookupStatus('error')
      }
    }, 600)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [adminEntity, availableEntities, form.id, form.nrp, isSuperAdmin, people])

  const savePerson = () => {
    if (!form.nrp?.trim() || !form.name.trim() || !form.entity) return

    const allowedEntity = isSuperAdmin ? form.entity : adminEntity
    const nextPerson = {
      ...form,
      email: form.email.trim() || `${form.nrp.trim()}@employee.local`,
      department: allowedEntity,
      entity: allowedEntity,
      position: form.position?.trim() || allowedEntity,
      noKtp: form.noKtp?.trim() || ''
    }

    if (form.id) {
      onPeopleChange(people.map((person) => person.id === form.id ? nextPerson : person))
    } else {
      const nextId = Math.max(...people.map((person) => person.id), 0) + 1
      onPeopleChange([...people, { ...nextPerson, id: nextId }])
    }

    resetUserForm()
  }

  const resetUserForm = () => {
    setForm(emptyForm)
    setEssLookupStatus('idle')
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
        const separator = row.includes(';') ? ';' : ','
        const [nrp = '', name = '', entity = entityOptions[0], noKtp = '', position = ''] = row.split(separator).map((cell) => cell.trim())
        const normalizedEntity = isSuperAdmin
          ? (entityOptions.includes(entity) ? entity : entityOptions[0])
          : adminEntity

        return {
          id: nextStartId + index,
          nrp,
          name,
          email: `${nrp || `imported-${index + 1}`}@employee.local`,
          department: normalizedEntity,
          entity: normalizedEntity,
          position: position || normalizedEntity,
          noKtp,
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
    setEssLookupStatus('idle')
  }

  const removePerson = (personId: number) => {
    onPeopleChange(people.filter((person) => person.id !== personId))
    if (form.id === personId) resetUserForm()
  }

  return (
    <div className="border border-slate-200 rounded-lg p-5 bg-slate-50">
      <h4 className="font-bold text-slate-900 mb-4">Manage Users and PIC Ownership</h4>
      {isSuperAdmin && (
        <div className="mb-5 rounded-lg border border-green-100 bg-green-50 p-4">
          <div className="mb-3">
            <p className="font-semibold text-slate-900">Email PIC Entitas</p>
            <p className="text-sm text-slate-600">Hanya Super Admin yang dapat mengatur email PIC setiap entitas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {entityOptions.map((entity) => (
              <label key={entity} className="text-sm font-semibold text-slate-700">
                <span className="block truncate">{entity}</span>
                <input
                  value={picEmails[entity] || ''}
                  onChange={(event) => onPicEmailsChange({ ...picEmails, [entity]: event.target.value })}
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 font-normal bg-white"
                  placeholder="email.pic@company.com"
                />
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Template Upload PIC</p>
            <p className="text-sm text-slate-600">Format kolom: NRP; Nama; Entitas; No KTP; Jabatan. Referensi entitas tersedia di sisi kanan template.</p>
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
            {essLookupStatus !== 'idle' && (
              <p className={`text-xs font-semibold ${
                essLookupStatus === 'found'
                  ? 'text-green-700'
                  : essLookupStatus === 'not_found'
                    ? 'text-amber-700'
                    : essLookupStatus === 'error'
                      ? 'text-red-700'
                      : 'text-blue-700'
              }`}>
                {essLookupStatus === 'loading' && 'Mencari data ESS...'}
                {essLookupStatus === 'found' && 'Data ESS ditemukan dan field sudah diisi otomatis.'}
                {essLookupStatus === 'not_found' && 'Data ESS tidak ditemukan. Nama dan email bisa diisi manual.'}
                {essLookupStatus === 'error' && 'Lookup ESS gagal. Nama dan email bisa diisi manual.'}
              </p>
            )}
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
            <input
              value={form.noKtp || ''}
              onChange={(event) => setForm({ ...form, noKtp: event.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="No. KTP / NIK"
            />
            <input
              value={form.position || ''}
              onChange={(event) => setForm({ ...form, position: event.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Jabatan"
            />
            <select
              value={form.entity || entityOptions[0]}
              onChange={(event) => {
                setForm({ ...form, entity: event.target.value, department: event.target.value })
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              disabled={!isSuperAdmin}
            >
              {availableEntities.map((entity) => (
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
                  onClick={resetUserForm}
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
                    <p className="text-xs text-slate-500 break-words">KTP {person.noKtp || '-'} - {getPersonPosition(person)}</p>
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

function getApprovalRate(doc: DocumentItem) {
  return doc.assigneeIds.length ? Math.round((doc.signedIds.length / doc.assigneeIds.length) * 100) : 0
}

function resolveEssEntity(value: string | undefined, availableEntities: string[], adminEntity: string, isSuperAdmin: boolean) {
  if (!isSuperAdmin) return adminEntity
  if (!value) return availableEntities[0] || entityOptions[0]

  const normalizedValue = value.toLowerCase()
  return availableEntities.find((entity) => entity.toLowerCase() === normalizedValue)
    || availableEntities.find((entity) => entity.toLowerCase().includes(normalizedValue) || normalizedValue.includes(entity.toLowerCase()))
    || availableEntities[0]
    || entityOptions[0]
}

function inferPicIdForEntity(entity: string, people: Person[]) {
  return people.find((person) => (person.entity || person.department) === entity)?.picId || initialPicUsers[0].id
}

function signoffStatusClass(status: 'Signed' | 'Downloaded' | 'Pending') {
  switch (status) {
    case 'Signed': return 'bg-green-100 text-green-800'
    case 'Downloaded': return 'bg-amber-100 text-amber-800'
    case 'Pending': return 'bg-slate-100 text-slate-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function buildSignedDownloadItems(
  doc: DocumentItem,
  people: Person[],
  signatures: SignatureRecord[],
  uploadedSignedFiles: UploadedSignedFile[]
): SignedDownloadItem[] {
  const peopleById = new Map(people.map((person) => [person.id, person]))
  const directItems = signatures
    .filter((signature) => signature.docId === doc.id && signature.signedPdfUrl && peopleById.has(signature.personId))
    .map((signature): SignedDownloadItem => ({
      key: `direct:${signature.docId}:${signature.personId}`,
      person: peopleById.get(signature.personId) as Person,
      fileName: signature.signedFileName || signedPdfFileName(doc),
      url: signature.signedPdfUrl as string,
      method: 'Direct signoff'
    }))

  const uploadedItems = uploadedSignedFiles
    .filter((file) => file.docId === doc.id && peopleById.has(file.personId))
    .map((file): SignedDownloadItem => ({
      key: `uploaded:${file.docId}:${file.personId}`,
      person: peopleById.get(file.personId) as Person,
      fileName: file.fileName,
      url: file.url,
      method: 'Uploaded PDF'
    }))

  return [...directItems, ...uploadedItems].sort((left, right) => left.person.name.localeCompare(right.person.name))
}

function downloadSignedItems(items: SignedDownloadItem[]) {
  items.forEach((item, index) => {
    window.setTimeout(() => {
      const link = document.createElement('a')
      link.href = item.url
      link.download = item.fileName
      link.rel = 'noopener'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }, index * 250)
  })
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

function getDefaultDeadline() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

function resetDocumentWorkspaceForWordPlaceholderFlow() {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(documentWorkspaceResetKey) === currentDocumentWorkspaceResetVersion) return

  [
    documentsStorageKey,
    signaturesStorageKey,
    uploadedSignedFilesStorageKey
  ].forEach((key) => window.localStorage.removeItem(key))

  window.localStorage.setItem(documentWorkspaceResetKey, currentDocumentWorkspaceResetVersion)
}

function readStoredValue<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) as T : null
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

function writeStoredValue<T>(key: string, value: T) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    if (key === documentsStorageKey) {
      try {
        window.localStorage.setItem(key, JSON.stringify(documentsForStorage(value as DocumentItem[], true)))
      } catch {
        // Keep the in-memory workflow alive even when browser storage quota is full.
      }
    }
  }
}

function documentsForStorage(docs: DocumentItem[], metadataOnly = false) {
  return docs.map((doc) => ({
    ...doc,
    downloadUrl: metadataOnly
      ? ''
      : doc.downloadUrl,
    sourceUrl: metadataOnly
      ? ''
      : doc.sourceUrl
  }))
}

function isWordTemplateFile(file: File) {
  const name = file.name.toLowerCase()
  return (
    name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
}

function findMissingWordTemplatePlaceholders(lines: string[]) {
  const placeholderKeys = extractWordTemplatePlaceholderKeys(lines)

  return requiredWordTemplatePlaceholders
    .filter((required) => !required.aliases.some((alias) => (
      placeholderKeys.some((key) => key.includes(normalizePlaceholderKey(alias)))
    )))
    .map((required) => required.label)
}

function extractWordTemplatePlaceholderKeys(lines: string[]) {
  return lines.flatMap((line) => (
    Array.from(line.matchAll(/\[placeholder\s+([^\]]+)\]/gi))
      .map((match) => normalizePlaceholderKey(match[1] || ''))
      .filter(Boolean)
  ))
}

function normalizePlaceholderKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function extractWordPreviewText(dataUrl: string) {
  try {
    const bytes = dataUrlToBytes(dataUrl)
    const xmlBytes = await extractZipEntry(bytes, 'word/document.xml')
    if (!xmlBytes.length) return []
    const xml = new TextDecoder('utf-8').decode(xmlBytes)
    return extractDocxParagraphs(xml)
  } catch {
    return []
  }
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || ''
  const binary = window.atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function extractZipEntry(bytes: Uint8Array, targetName: string) {
  const eocdOffset = findEndOfCentralDirectory(bytes)
  if (eocdOffset < 0) return new Uint8Array()

  const centralDirectoryOffset = readUInt32(bytes, eocdOffset + 16)
  const entryCount = readUInt16(bytes, eocdOffset + 10)
  let offset = centralDirectoryOffset
  const decoder = new TextDecoder('utf-8')

  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32(bytes, offset) !== 0x02014b50) break
    const compressionMethod = readUInt16(bytes, offset + 10)
    const compressedSize = readUInt32(bytes, offset + 20)
    const fileNameLength = readUInt16(bytes, offset + 28)
    const extraLength = readUInt16(bytes, offset + 30)
    const commentLength = readUInt16(bytes, offset + 32)
    const localHeaderOffset = readUInt32(bytes, offset + 42)
    const fileName = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength))

    if (fileName === targetName) {
      const localFileNameLength = readUInt16(bytes, localHeaderOffset + 26)
      const localExtraLength = readUInt16(bytes, localHeaderOffset + 28)
      const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength
      const compressedData = bytes.slice(dataStart, dataStart + compressedSize)

      if (compressionMethod === 0) return compressedData
      if (compressionMethod === 8) return inflateRawBytes(compressedData)
      return new Uint8Array()
    }

    offset += 46 + fileNameLength + extraLength + commentLength
  }

  return new Uint8Array()
}

function findEndOfCentralDirectory(bytes: Uint8Array) {
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 66000); offset -= 1) {
    if (readUInt32(bytes, offset) === 0x06054b50) return offset
  }
  return -1
}

async function inflateRawBytes(bytes: Uint8Array) {
  const DecompressionStreamCtor = typeof window !== 'undefined'
    ? (window as typeof window & { DecompressionStream?: new (format: string) => DecompressionStream }).DecompressionStream
    : undefined
  if (!DecompressionStreamCtor) return new Uint8Array()

  try {
    const arrayBuffer = bytes.slice().buffer as ArrayBuffer
    const stream = new Blob([arrayBuffer]).stream().pipeThrough(new DecompressionStreamCtor('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return new Uint8Array()
  }
}

function extractDocxParagraphs(xml: string) {
  return xml
    .split(/<\/w:p>/)
    .map((paragraph) => {
      const tokens = Array.from(paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\s*\/>|<w:br\s*\/>/g))
      const text = tokens.map((match) => {
        const token = match[0]
        if (token.startsWith('<w:tab')) return ' '
        if (token.startsWith('<w:br')) return '\n'
        return decodeXmlText(match[1] || '')
      }).join('')
      return cleanupExtractedDocxText(text)
    })
    .filter(Boolean)
}

function cleanupExtractedDocxText(text: string) {
  return text
    .replace(/[\u00A0\t]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim()
}

function hasWordXmlLeak(lines?: string[]) {
  return Boolean(lines?.some((line) => /<\/?w:[a-zA-Z]+|w:[a-zA-Z]+=/i.test(line)))
}

function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function readUInt16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8)
}

function readUInt32(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  ) >>> 0
}

function migrateDocumentTemplateSettings(doc: DocumentItem): DocumentItem {
  const templateSettings = getDocumentTemplateSettings(doc)

  return {
    ...doc,
    sourceType: doc.sourceType || (doc.sourceUrl ? 'WORD' : doc.downloadUrl ? 'PDF' : undefined),
    signaturePlacement: templateSettings.signaturePlacement
  }
}

function mergePeopleWithDefaults(people: Person[]) {
  return people.map((person) => {
    const fallback = initialPeople.find((item) => (
      item.id === person.id ||
      Boolean(person.nrp && item.nrp === person.nrp) ||
      item.email.toLowerCase() === person.email.toLowerCase()
    ))
    if (!fallback) return person

    return {
      ...fallback,
      ...person,
      position: person.position || fallback.position,
      noKtp: person.noKtp || fallback.noKtp
    }
  })
}

function getPersonPosition(person?: Person) {
  return person?.position || person?.department || person?.entity || '-'
}

function buildSignedEvidenceMap(signatures: SignatureRecord[], uploadedFiles: UploadedSignedFile[]) {
  const evidenceByDoc = new Map<number, Set<number>>()
  const addEvidence = (docId: number, personId: number) => {
    const signedIds = evidenceByDoc.get(docId) || new Set<number>()
    signedIds.add(personId)
    evidenceByDoc.set(docId, signedIds)
  }

  signatures.forEach((signature) => {
    if (signature.signedPdfUrl) addEvidence(signature.docId, signature.personId)
  })
  uploadedFiles.forEach((file) => addEvidence(file.docId, file.personId))

  return evidenceByDoc
}

function normalizeDocumentSignoffState(doc: DocumentItem, evidenceByDoc: Map<number, Set<number>>): DocumentItem {
  const evidenceIds = evidenceByDoc.get(doc.id)
  const signedIds = evidenceIds
    ? doc.assigneeIds.filter((personId) => evidenceIds.has(personId))
    : []
  const fullySigned = doc.assigneeIds.length > 0 && signedIds.length >= doc.assigneeIds.length
  const status = fullySigned
    ? 'COMPLETED'
    : doc.status === 'COMPLETED'
      ? 'ACTIVE'
      : doc.status

  if (sameNumberArray(doc.signedIds, signedIds) && doc.status === status) return doc
  return { ...doc, signedIds, status }
}

function signatureRecordKey(signature: Pick<SignatureRecord, 'docId' | 'personId'>) {
  return `${signature.docId}:${signature.personId}`
}

function parseSignaturePlacementSettings(value: string): SignaturePlacementSettings {
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object') {
      const source = parsed as Partial<SignaturePlacementSettings>
      return migrateSignaturePlacement({
        horizontal: normalizeSignatureHorizontal(source.horizontal),
        pageNumber: clampNumber(source.pageNumber, 1, 99, defaultSignaturePlacement.pageNumber),
        xPercent: clampNumber(source.xPercent, 0, 75, defaultSignaturePlacement.xPercent),
        yPercent: clampNumber(source.yPercent, 0, 86, defaultSignaturePlacement.yPercent),
        widthPercent: clampNumber(source.widthPercent, 18, 55, defaultSignaturePlacement.widthPercent)
      })
    }
  } catch {
    if (['left', 'center', 'right'].includes(value)) {
      return migrateSignaturePlacement({ ...defaultSignaturePlacement, horizontal: value as SignaturePlacementOption })
    }
  }

  return defaultSignaturePlacement
}

function getDocumentTemplateSettings(doc?: Partial<Pick<DocumentItem, 'name' | 'fileName' | 'sourceFileName' | 'sourceType'>>): DocumentTemplateSettings {
  const documentName = [
    doc?.name,
    doc?.fileName,
    doc?.sourceFileName
  ].filter(Boolean).join(' ').toLowerCase()

  if (documentName.includes('pakta') || documentName.includes('integritas')) {
    return paktaIntegritasTemplateSettings
  }

  return defaultDocumentTemplateSettings
}

function getDocumentIdentityLayout(doc?: Partial<Pick<DocumentItem, 'name' | 'fileName' | 'sourceFileName' | 'sourceType'>>) {
  return getDocumentTemplateSettings(doc).identityLayout
}

function getDocumentSignaturePlacement(doc: DocumentItem | undefined, fallback: SignaturePlacementSettings = defaultSignaturePlacement) {
  const placement = migrateSignaturePlacement(doc ? getDocumentTemplateSettings(doc).signaturePlacement : fallback)
  return {
    horizontal: normalizeSignatureHorizontal(placement.horizontal),
    pageNumber: clampNumber(placement.pageNumber, 1, 99, fallback.pageNumber),
    xPercent: clampNumber(placement.xPercent, 0, 100 - clampNumber(placement.widthPercent, 18, 55, fallback.widthPercent), fallback.xPercent),
    yPercent: clampNumber(placement.yPercent, 0, 86, fallback.yPercent),
    widthPercent: clampNumber(placement.widthPercent, 18, 55, fallback.widthPercent)
  }
}

function migrateSignaturePlacement(placement: SignaturePlacementSettings) {
  return sameSignaturePlacement(placement, legacySignaturePlacement)
    ? defaultSignaturePlacement
    : placement
}

function sameSignaturePlacement(left: SignaturePlacementSettings, right: SignaturePlacementSettings) {
  return signaturePlacementKey(left) === signaturePlacementKey(right)
}

function signaturePlacementKey(placement: SignaturePlacementSettings) {
  return [
    placement.horizontal,
    placement.pageNumber,
    placement.xPercent,
    placement.yPercent,
    placement.widthPercent
  ].join(':')
}

function normalizeSignatureHorizontal(value: unknown): SignaturePlacementOption {
  return value === 'left' || value === 'center' || value === 'right'
    ? value
    : defaultSignaturePlacement.horizontal
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  return Math.min(max, Math.max(min, Math.round(numberValue)))
}

function sameNumberArray(left: number[], right: number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function sameStringArray(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
