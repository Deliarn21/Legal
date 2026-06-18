import React, { useEffect, useState } from 'react'

export type UiLanguage = 'id' | 'en'

const languageStorageKey = 'digitalPdfSignoff.language'

const translations: Array<{ id: string; en: string }> = [
  { id: 'Bahasa', en: 'Language' },
  { id: 'Login User', en: 'User Login' },
  { id: 'Silakan login untuk melanjutkan', en: 'Please log in to continue' },
  { id: 'Login SSO Hasnur Group', en: 'Login with Hasnur Group SSO' },
  { id: 'atau', en: 'or' },
  { id: 'Login dengan NRP / Email', en: 'Login with NRP / Email' },
  { id: 'Masuk', en: 'Sign In' },
  { id: 'Memproses...', en: 'Processing...' },
  { id: 'Gunakan credential testing dari catatan terpisah project.', en: 'Use testing credentials from the separate project note.' },
  { id: 'Login gagal. Silakan coba lagi.', en: 'Login failed. Please try again.' },
  { id: 'Callback SSO tidak lengkap. Silakan login ulang.', en: 'SSO callback is incomplete. Please log in again.' },
  { id: 'Konfigurasi SSO lokal belum lengkap.', en: 'Local SSO configuration is incomplete.' },
  { id: 'Token SSO tidak valid atau sudah kedaluwarsa.', en: 'SSO token is invalid or expired.' },
  { id: 'Verifikasi SSO gagal. Silakan coba lagi.', en: 'SSO verification failed. Please try again.' },
  { id: 'Session SSO tidak ditemukan. Silakan login ulang.', en: 'SSO session was not found. Please log in again.' },
  { id: 'Login SSO gagal. Silakan coba lagi.', en: 'SSO login failed. Please try again.' },
  { id: 'Digital PDF Signoff', en: 'Digital PDF Signoff' },
  { id: 'Keluar', en: 'Logout' },
  { id: 'Memuat session login...', en: 'Loading login session...' },
  { id: 'Dokumen Signoff Saya', en: 'My Signoff Documents' },
  { id: 'Pusat Kontrol Admin', en: 'Admin Control Center' },
  { id: 'Unduh file PDF yang ditugaskan dan unggah salinan yang sudah ditandatangani.', en: 'Download assigned PDF files and upload your signed copies.' },
  { id: 'Pantau user dan dokumen yang ditugaskan untuk departemen Anda.', en: 'Monitor assigned users and documents for your department.' },
  { id: 'Pantau semua tim PIC, penugasan, dan progres distribusi.', en: 'Monitor all PIC teams, assignments, and distribution progress.' },
  { id: 'Anda dapat meninjau seluruh PIC, penerima, dokumen, dan distribusi.', en: 'You can review every PIC, recipient, document, and distribution.' },
  { id: 'Anda dapat meninjau seluruh tim PIC dan mengelola distribusi dokumen.', en: 'You can review all PIC teams and manage document distribution.' },
  { id: 'Anda hanya dapat meninjau user dan dokumen yang ditugaskan ke area PIC Anda.', en: 'You can only review users and documents assigned to your PIC area.' },
  { id: 'Anda hanya dapat mengakses dokumen yang ditugaskan untuk diunduh dan diunggah setelah ditandatangani.', en: 'You can only access documents assigned to you for download and signed upload.' },
  { id: 'Ikhtisar', en: 'Overview' },
  { id: 'Dokumen', en: 'Documents' },
  { id: 'Dokumen', en: 'Document' },
  { id: 'Notifikasi', en: 'Notifications' },
  { id: 'Tim PIC', en: 'PIC Teams' },
  { id: 'User Ditugaskan', en: 'Assigned Users' },
  { id: 'Admin', en: 'Admin' },
  { id: 'Panel Admin', en: 'Admin Panel' },
  { id: 'Tindakan Diperlukan', en: 'Required Actions' },
  { id: 'Dokumen Terbaru', en: 'Recent Documents' },
  { id: 'Dokumen Aktif', en: 'Active Documents' },
  { id: 'Item Pending', en: 'Pending Items' },
  { id: 'Selesai', en: 'Completed' },
  { id: 'Rasio Kepatuhan', en: 'Compliance Rate' },
  { id: 'Belum Signoff', en: 'Not Signed Yet' },
  { id: 'Status', en: 'Status' },
  { id: 'Progres', en: 'Progress' },
  { id: 'Tenggat', en: 'Deadline' },
  { id: 'Aksi', en: 'Action' },
  { id: 'Sembunyikan Detail', en: 'Hide Detail' },
  { id: 'Lihat Detail', en: 'View Detail' },
  { id: 'Lihat', en: 'View' },
  { id: 'Buka', en: 'Open' },
  { id: 'Pratinjau', en: 'Preview' },
  { id: 'Unduh Lagi', en: 'Download Again' },
  { id: 'Unduh PDF', en: 'Download PDF' },
  { id: 'Unduh PDF Signed', en: 'Download Signed PDF' },
  { id: 'Unggah PDF Signed', en: 'Upload Signed PDF' },
  { id: 'Signoff Langsung', en: 'Signoff Directly' },
  { id: 'Sudah Signoff', en: 'Signed Off' },
  { id: 'Dokumen ini sudah selesai ditandatangani.', en: 'This document has already been signed.' },
  { id: 'Dokumen sudah di-download. Upload PDF yang sudah ditandatangani untuk menyelesaikan proses.', en: 'The document has been downloaded. Upload the signed PDF to complete the process.' },
  { id: 'Pilih download-upload manual atau signoff langsung dari preview ini.', en: 'Choose manual download-upload or sign off directly from this preview.' },
  { id: 'PDF Signed Terunggah', en: 'Signed PDF Uploaded' },
  { id: 'Detail Signoff', en: 'Signoff Detail' },
  { id: 'Status Sekarang', en: 'Current Status' },
  { id: 'Nama / Email', en: 'Name / Email' },
  { id: 'Pemilik PIC', en: 'PIC Owner' },
  { id: 'Pemilik PIC:', en: 'PIC Owner:' },
  { id: 'Belum ada user signoff yang ditugaskan.', en: 'No signoff users assigned.' },
  { id: 'File Signed', en: 'Signed Files' },
  { id: 'Unduh PDF signed satu per satu, berdasarkan user terpilih, atau sekaligus.', en: 'Download signed PDFs individually, by selected users, or in bulk.' },
  { id: 'Belum ada PDF signed yang tersedia untuk dokumen ini.', en: 'No signed PDF is available yet for this document.' },
  { id: 'Pilih Semua', en: 'Select All' },
  { id: 'Bersihkan', en: 'Clear' },
  { id: 'Rollback / Reset Akses Signoff', en: 'Rollback / Reset Signoff Access' },
  { id: 'Pilih user yang sudah download atau signoff untuk dimunculkan kembali pilihan Download PDF dan Signoff Directly secara bulk.', en: 'Select users who have downloaded or signed off to show Download PDF and Signoff Directly again in bulk.' },
  { id: 'Reset Terpilih', en: 'Reset Selected' },
  { id: 'Unduh PDF Terpilih', en: 'Download Selected PDFs' },
  { id: 'Unduh Semua PDF', en: 'Download All PDFs' },
  { id: 'Unduh', en: 'Download' },
  { id: 'User', en: 'User' },
  { id: 'File', en: 'File' },
  { id: 'Metode', en: 'Method' },
  { id: 'Kategori', en: 'Category' },
  { id: 'Tetapkan', en: 'Assign' },
  { id: 'Signoff langsung', en: 'Direct signoff' },
  { id: 'PDF unggahan', en: 'Uploaded PDF' },
  { id: 'Kepatuhan', en: 'Compliance' },
  { id: 'Kebijakan', en: 'Policy' },
  { id: 'SDM', en: 'HR' },
  { id: 'AKTIF', en: 'ACTIVE' },
  { id: 'SELESAI', en: 'COMPLETED' },
  { id: 'PENDING', en: 'PENDING' },
  { id: 'TERLAMBAT', en: 'OVERDUE' },
  { id: 'Ditandatangani', en: 'Signed' },
  { id: 'Diunduh', en: 'Downloaded' },
  { id: 'Pending', en: 'Pending' },
  { id: 'Belum ditugaskan', en: 'Unassigned' },
  { id: 'Unggah Dokumen Baru', en: 'Upload New Document' },
  { id: 'Siapkan template Word baru untuk distribusi.', en: 'Prepare a new Word template for distribution.' },
  { id: 'Buat Distribusi', en: 'Create Distribution' },
  { id: 'Tugaskan dokumen ke tim PIC dan penerima.', en: 'Assign documents to PIC teams and recipients.' },
  { id: 'Lihat Analitik', en: 'View Analytics' },
  { id: 'Tinjau progres di seluruh area kepemilikan PIC.', en: 'Review progress across all PIC ownership areas.' },
  { id: 'Kelola User', en: 'Manage Users' },
  { id: 'Kelola kepemilikan PIC dan penugasan penerima.', en: 'Maintain PIC ownership and recipient assignments.' },
  { id: 'Placement Template Dokumen', en: 'Document Template Placement' },
  { id: 'Placement dibuat fix berdasarkan nama dokumen/template Word, lalu dipakai semua user signer dokumen tersebut.', en: 'Placement dibuat fix berdasarkan nama dokumen/template Word, lalu dipakai semua user signer dokumen tersebut.' },
  { id: 'Template Terdeteksi', en: 'Template Terdeteksi' },
  { id: 'Informasi Pengisi', en: 'Informasi Pengisi' },
  { id: 'Tanda Tangan', en: 'Tanda Tangan' },
  { id: 'Autofill ESS', en: 'Autofill ESS' },
  { id: 'Pengaturan Watermark Preview', en: 'Preview Watermark Settings' },
  { id: 'Hanya diterapkan pada preview dokumen. File yang diunduh tetap asli dan bersih.', en: 'Applied only to document preview. Downloaded files remain original and clean.' },
  { id: 'Teks Watermark', en: 'Watermark Text' },
  { id: 'Judul dokumen', en: 'Document title' },
  { id: 'Pilih Word', en: 'Choose Word' },
  { id: 'Pilih PDF Preview', en: 'Choose PDF Preview' },
  { id: 'Belum ada Word dipilih', en: 'No Word selected' },
  { id: 'PDF preview siap', en: 'PDF preview ready' },
  { id: 'Opsional jika auto-convert Word gagal', en: 'Optional jika auto-convert Word gagal' },
  { id: 'PIC Tujuan', en: 'PIC Tujuan' },
  { id: 'Opsional saat upload. Bisa diassign setelah dokumen tersimpan.', en: 'Optional saat upload. Bisa diassign setelah dokumen tersimpan.' },
  { id: 'User Signoff', en: 'User Signoff' },
  { id: 'Opsional saat upload', en: 'Optional saat upload' },
  { id: 'Pilih PIC terlebih dahulu.', en: 'Select PIC first.' },
  { id: 'Simpan Mapping Dokumen', en: 'Save Document Mapping' },
  { id: 'Tetapkan Distribusi', en: 'Assign Distribution' },
  { id: 'Dokumen Terupload', en: 'Uploaded Documents' },
  { id: 'Template Word tersedia', en: 'Word template available' },
  { id: 'Belum ada file', en: 'No file' },
  { id: 'Belum ada template Word terupload.', en: 'No uploaded Word templates yet.' },
  { id: 'Progress Approval Dokumen', en: 'Document Approval Progress' },
  { id: 'Kelola User dan Kepemilikan PIC', en: 'Manage Users and PIC Ownership' },
  { id: 'Template Upload PIC', en: 'Template Upload PIC' },
  { id: 'Download Template', en: 'Download Template' },
  { id: 'Upload CSV', en: 'Upload CSV' },
  { id: 'Edit User', en: 'Edit User' },
  { id: 'Buat User', en: 'Create User' },
  { id: 'Simpan Perubahan', en: 'Save Changes' },
  { id: 'Tambah User', en: 'Add User' },
  { id: 'Batal', en: 'Cancel' },
  { id: 'Edit', en: 'Edit' },
  { id: 'Hapus', en: 'Remove' },
  { id: 'Hapus', en: 'Delete' },
  { id: 'Tidak ada user yang ditugaskan ke entitas ini.', en: 'No users assigned to this entity.' },
  { id: 'Panduan singkat', en: 'Short guide' },
  { id: 'Gunakan satu goresan halus di dalam kotak kosong. Di mobile, putar ke landscape jika perlu ruang lebih luas.', en: 'Use one smooth stroke inside the blank box. On mobile, rotate to landscape if you need more space.' },
  { id: 'Area tanda tangan', en: 'Signature area' },
  { id: 'Saya mengonfirmasi telah meninjau dokumen dan menyetujui signoff ini secara elektronik.', en: 'I confirm that I have reviewed the document and approve this signoff electronically.' },
  { id: 'Submit Tanda Tangan', en: 'Submit Signature' },
  { id: 'Tutup', en: 'Close' },
  { id: 'Gambar Tanda Tangan', en: 'Draw Signature' },
  { id: 'Pratinjau Dokumen Signed', en: 'Signed Document Preview' },
  { id: 'Pratinjau PDF Signed', en: 'Signed PDF Preview' },
  { id: 'Pratinjau PDF Asli', en: 'Original PDF Preview' },
  { id: 'Preview disembunyikan untuk perlindungan dokumen', en: 'Preview hidden for document protection' },
  { id: 'Kembalikan fokus untuk melanjutkan melihat.', en: 'Return focus to continue viewing.' },
  { id: 'Tidak ada dokumen yang ditugaskan kepada Anda saat ini.', en: 'No document is assigned to you right now.' },
  { id: 'Dokumen Ditugaskan Saya', en: 'My Assigned Documents' },
  { id: 'Pilih download-upload manual atau signoff langsung dari preview ini.', en: 'Choose manual download-upload or sign off directly from this preview.' },
  { id: 'Tanda tangan dan nama', en: 'Signature and name' },
  { id: 'Rollback Signoff', en: 'Rollback Signoff' },
  { id: 'Pilih user yang sudah signoff untuk diminta tanda tangan ulang secara bulk.', en: 'Select signed users to request a bulk re-sign.' },
  { id: 'Rollback Terpilih', en: 'Rollback Selected' },
  { id: 'Inggris', en: 'English' },
  { id: 'Indonesia', en: 'Indonesian' }
]

const textNodeSources = new WeakMap<Text, string>()

export function useUiLanguage() {
  const [language, setLanguageState] = useState<UiLanguage>('id')

  useEffect(() => {
    const saved = window.localStorage.getItem(languageStorageKey)
    if (saved === 'id' || saved === 'en') setLanguageState(saved)
  }, [])

  useEffect(() => {
    applyLanguage(language)
    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(() => applyLanguage(language))
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [language])

  const setLanguage = (nextLanguage: UiLanguage) => {
    setLanguageState(nextLanguage)
    window.localStorage.setItem(languageStorageKey, nextLanguage)
  }

  return { language, setLanguage }
}

export function LanguageToggle({
  language,
  onChange
}: {
  language: UiLanguage
  onChange: (language: UiLanguage) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 text-sm font-bold text-slate-600 shadow-sm">
      <span className="pl-3 pr-1 text-slate-500">Bahasa</span>
      <button
        type="button"
        onClick={() => onChange('id')}
        className={`min-w-12 rounded-full px-4 py-2 transition ${
          language === 'id'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
        }`}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        className={`min-w-12 rounded-full px-4 py-2 transition ${
          language === 'en'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
        }`}
      >
        EN
      </button>
    </div>
  )
}

function applyLanguage(language: UiLanguage) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = language === 'id' ? 'id' : 'en'
  translateTextNodes(document.body, language)
  translatePlaceholders(document.body, language)
}

function translateTextNodes(root: Node, language: UiLanguage) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent) return NodeFilter.FILTER_REJECT
      if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CANVAS', 'OBJECT', 'IFRAME'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT
      }
      return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    }
  })

  const textNodes: Text[] = []
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text)

  textNodes.forEach((node) => {
    const text = node.textContent || ''
    const leading = text.match(/^\s*/)?.[0] || ''
    const trailing = text.match(/\s*$/)?.[0] || ''
    const trimmed = text.trim()
    const source = textSourceForNode(node, trimmed)
    const translated = translateLiteral(source, language)
    if (translated && translated !== trimmed) node.textContent = `${leading}${translated}${trailing}`
  })
}

function translatePlaceholders(root: HTMLElement, language: UiLanguage) {
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]').forEach((element) => {
    const placeholder = element.getAttribute('placeholder') || ''
    const source = placeholderSourceForElement(element, placeholder)
    const translated = translateLiteral(source, language)
    if (translated && translated !== placeholder) element.setAttribute('placeholder', translated)
  })
}

function textSourceForNode(node: Text, trimmed: string) {
  const source = textNodeSources.get(node)
  if (!source) {
    textNodeSources.set(node, trimmed)
    return trimmed
  }

  if (trimmed !== translateLiteral(source, 'id') && trimmed !== translateLiteral(source, 'en')) {
    textNodeSources.set(node, trimmed)
    return trimmed
  }

  return source
}

function placeholderSourceForElement(element: HTMLInputElement | HTMLTextAreaElement, placeholder: string) {
  const source = element.dataset.i18nPlaceholderSource
  if (!source) {
    element.dataset.i18nPlaceholderSource = placeholder
    return placeholder
  }

  if (placeholder !== translateLiteral(source, 'id') && placeholder !== translateLiteral(source, 'en')) {
    element.dataset.i18nPlaceholderSource = placeholder
    return placeholder
  }

  return source
}

function translateLiteral(text: string, language: UiLanguage) {
  if (!text) return ''
  const entry = language === 'id'
    ? translations.find((item) => item.en === text) || translations.find((item) => item.id === text)
    : translations.find((item) => item.id === text) || translations.find((item) => item.en === text)
  if (!entry) return translateDynamicLiteral(text, language)
  return language === 'id' ? entry.id : entry.en
}

function translateDynamicLiteral(text: string, language: UiLanguage) {
  if (language === 'en') {
    const englishDynamicPatterns: Array<[RegExp, (...matches: string[]) => string]> = [
      [/^(\d+) dipilih dari (\d+) user signed\.$/i, (selected, total) => `${selected} selected from ${total} signed users.`]
    ]

    for (const [pattern, translate] of englishDynamicPatterns) {
      const match = text.match(pattern)
      if (match) return translate(...match.slice(1))
    }

    return text
  }

  const dynamicPatterns: Array<[RegExp, (...matches: string[]) => string]> = [
    [/^Deadline (.+)$/i, (date) => `Tenggat ${date}`],
    [/^(\d+)\/(\d+) signed$/i, (signed, total) => `${signed}/${total} ditandatangani`],
    [/^(\d+) signed$/i, (count) => `${count} ditandatangani`],
    [/^(\d+) downloaded$/i, (count) => `${count} diunduh`],
    [/^(\d+) pending approval\.$/i, (count) => `${count} menunggu approval.`],
    [/^(\d+) signed, (\d+) downloaded, (\d+) pending approval\.$/i, (signed, downloaded, pending) => (
      `${signed} ditandatangani, ${downloaded} diunduh, ${pending} menunggu approval.`
    )],
    [/^(\d+) remaining$/i, (count) => `${count} tersisa`],
    [/^(\d+) user\(s\)$/i, (count) => `${count} user`],
    [/^(\d+) assigned user\(s\)$/i, (count) => `${count} user ditugaskan`],
    [/^(\d+) Word template\(s\) available$/i, (count) => `${count} template Word tersedia`],
    [/^(\d+)\/(\d+) selected$/i, (selected, total) => `${selected}/${total} dipilih`],
    [/^(\d+)\/(\d+) signed \((\d+)%\)$/i, (signed, total, rate) => `${signed}/${total} ditandatangani (${rate}%)`],
    [/^(.+) Workspace$/i, (name) => `Workspace ${name}`],
    [/^Pending at (.+)$/i, (picName) => `Pending di ${picName}`],
    [/^(.+) needs your signed PDF upload\.$/i, (docName) => `${docName} membutuhkan upload PDF signed Anda.`],
    [/^(.+) needs your download confirmation\.$/i, (docName) => `${docName} membutuhkan konfirmasi download Anda.`],
    [/^(\d+) assignee\(s\) still need to sign (.+)\.$/i, (count, docName) => `${count} penerima masih perlu menandatangani ${docName}.`],
    [/^PIC Owner: (.+)$/i, (picName) => `Pemilik PIC: ${picName}`],
    [/^Based on (.+)\.$/i, (fileName) => `Berdasarkan ${fileName}.`],
    [/^Page (\d+)$/i, (page) => `Halaman ${page}`],
    [/^Preview: (.+)$/i, (title) => `Pratinjau: ${title}`],
    [/^Select (.+)$/i, (name) => `Pilih ${name}`],
    [/^(\d+) dipilih dari (\d+) user signed\.$/i, (selected, total) => `${selected} dipilih dari ${total} user signed.`]
  ]

  for (const [pattern, translate] of dynamicPatterns) {
    const match = text.match(pattern)
    if (match) return translate(...match.slice(1))
  }

  return text
}
