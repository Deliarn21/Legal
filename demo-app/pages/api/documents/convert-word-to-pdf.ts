import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from 'crypto'
import { execFile } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

type ConvertBody = {
  sourceDataUrl?: string
  replacements?: Record<string, string>
  signatureDataUrl?: string
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const body = req.body as ConvertBody
  if (!body.sourceDataUrl) {
    res.status(400).json({ message: 'sourceDataUrl is required' })
    return
  }

  let workDir = ''
  try {
    workDir = await mkdtemp(path.join(tmpdir(), 'signoff-word-'))
    const sourceDocxPath = path.join(workDir, `${randomUUID()}.docx`)
    const outputPdfPath = path.join(workDir, `${randomUUID()}.pdf`)
    const replacementsPath = path.join(workDir, 'replacements.json')
    const signaturePath = body.signatureDataUrl ? path.join(workDir, 'signature.png') : ''

    await writeFile(sourceDocxPath, dataUrlToBuffer(body.sourceDataUrl))
    await writeFile(replacementsPath, JSON.stringify(body.replacements || {}), 'utf8')
    if (body.signatureDataUrl && signaturePath) {
      await writeFile(signaturePath, dataUrlToBuffer(body.signatureDataUrl))
    }

    await convertWordWithPowerShell({
      sourceDocxPath,
      outputPdfPath,
      replacementsPath,
      signaturePath
    })

    const pdfBuffer = await readFile(outputPdfPath)
    res.status(200).json({
      pdfDataUrl: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`
    })
  } catch (error) {
    res.status(500).json({
      message: 'Word to PDF conversion failed',
      detail: error instanceof Error ? error.message : String(error)
    })
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}

function dataUrlToBuffer(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] || ''
  return Buffer.from(base64, 'base64')
}

async function convertWordWithPowerShell({
  sourceDocxPath,
  outputPdfPath,
  replacementsPath,
  signaturePath
}: {
  sourceDocxPath: string
  outputPdfPath: string
  replacementsPath: string
  signaturePath: string
}) {
  const script = `
$ErrorActionPreference = 'Stop'
$docxPath = $args[0]
$pdfPath = $args[1]
$replacementsPath = $args[2]
$signaturePath = $args[3]
$word = $null
$doc = $null

function Replace-AllText($document, [string] $findText, [string] $replaceText) {
  if ([string]::IsNullOrWhiteSpace($findText)) { return }
  $range = $document.Content
  $find = $range.Find
  $find.ClearFormatting() | Out-Null
  $find.Replacement.ClearFormatting() | Out-Null
  $find.Text = $findText
  $find.Replacement.Text = $replaceText
  $find.Forward = $true
  $find.Wrap = 1
  $find.Format = $false
  $find.MatchCase = $false
  $find.MatchWholeWord = $false
  $find.MatchWildcards = $false
  $find.Execute($findText, $false, $false, $false, $false, $false, $true, 1, $false, $replaceText, 2) | Out-Null
}

try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $doc = $word.Documents.Open($docxPath, $false, $false)

  if (Test-Path $replacementsPath) {
    $json = Get-Content -LiteralPath $replacementsPath -Raw
    if (-not [string]::IsNullOrWhiteSpace($json)) {
      $replacements = $json | ConvertFrom-Json
      foreach ($property in $replacements.PSObject.Properties) {
        Replace-AllText $doc $property.Name ([string] $property.Value)
      }
    }
  }

  if ($signaturePath -and (Test-Path $signaturePath)) {
    $range = $doc.Content
    $find = $range.Find
    $find.ClearFormatting() | Out-Null
    $find.Text = '[Placeholder Tanda Tangan]'
    $find.Forward = $true
    $find.Wrap = 1
    $found = $find.Execute()
    if ($found) {
      $range.Text = ''
      $shape = $doc.InlineShapes.AddPicture($signaturePath, $false, $true, $range)
      $shape.LockAspectRatio = -1
      if ($shape.Width -gt 150) { $shape.Width = 150 }
      if ($shape.Height -gt 55) { $shape.Height = 55 }
    }
  }

  $doc.ExportAsFixedFormat($pdfPath, 17)
} finally {
  if ($doc -ne $null) {
    $doc.Close($false) | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
  }
  if ($word -ne $null) {
    $word.Quit() | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`

  await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    script,
    sourceDocxPath,
    outputPdfPath,
    replacementsPath,
    signaturePath
  ], {
    timeout: 20000,
    maxBuffer: 1024 * 1024 * 4,
    windowsHide: true
  })
}
