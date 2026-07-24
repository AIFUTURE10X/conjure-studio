const fs = require('fs')
const path = require('path')

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

const checks = [
  {
    name: 'upload panel shows subject and reference status counts',
    pass: () => /selectedSubjectCount/.test(read('app/image-studio/components/UploadPanel/UploadPanel.tsx')) &&
      /ReferenceStatus/.test(read('app/image-studio/components/UploadPanel/UploadPanel.tsx')),
  },
  {
    name: 'subject empty state is compact and direct',
    pass: () => /min-h-\[150px\]/.test(read('app/image-studio/components/UploadPanel/SubjectImageGrid.tsx')) &&
      /Drop subjects here/.test(read('app/image-studio/components/UploadPanel/SubjectImageGrid.tsx')),
  },
  {
    name: 'scene and style upload zones use compact drop targets',
    pass: () => /min-h-\[120px\]/.test(read('app/image-studio/components/UploadPanel/ImageUploadZone.tsx')) &&
      /Browse/.test(read('app/image-studio/components/UploadPanel/ImageUploadZone.tsx')),
  },
  {
    name: 'reference cards use container-query columns that stack when the panel is narrow',
    pass: () => {
      const panel = read('app/image-studio/components/UploadPanel/UploadPanel.tsx')
      return /@container/.test(panel) &&
        /@4xl:grid-cols-\[minmax\(0,1\.25fr\)_minmax\(0,1fr\)_minmax\(0,1fr\)\]/.test(panel) &&
        !/lg:grid-cols-\[/.test(panel) &&
        !/grid md:grid-cols-2 gap-4/.test(panel)
    },
  },
  {
    // Anchored to the visible subtitle <p>, so a stray "likeness" in the tooltip
    // or a comment can't keep this green if the rendered copy is removed.
    name: 'subject panel subtitle (rendered) frames an uploaded person as a likeness reference',
    pass: () => {
      const panel = read('app/image-studio/components/UploadPanel/UploadPanel.tsx')
      return /<p className="text-sm text-zinc-500">People, products, or objects to include — an uploaded person is used as a likeness reference<\/p>/.test(panel)
    },
  },
  {
    // Distinctive copy that lives only in the always-visible hint paragraph — not a
    // bare /Advanced/ that could match anywhere in the file.
    name: 'subject panel shows an always-visible stylize-me hint that points away from Advanced',
    pass: () => {
      const panel = read('app/image-studio/components/UploadPanel/UploadPanel.tsx')
      return /a stylized version of me/i.test(panel) && /No need to\s+open Advanced settings/i.test(panel)
    },
  },
  {
    // Extract the actual <label> element so a fragment elsewhere can't satisfy it,
    // and enforce honest copy: a likeness reference, never an "exact"/"lock" promise.
    name: 'reference image <label> frames a likeness reference without overpromising an exact lock',
    pass: () => {
      const ref = read('app/image-studio/components/GeneratePanel/ReferenceImageUpload.tsx')
      const match = ref.match(/<label[^>]*>([\s\S]*?)<\/label>/)
      const label = match ? match[1] : ''
      return /likeness/i.test(label) &&
        !/optional - for image-to-image generation/.test(label) &&
        !/lock/i.test(label) &&
        !/exact/i.test(label)
    },
  },
]

const failures = checks.filter((check) => {
  try {
    return !check.pass()
  } catch {
    return true
  }
})

if (failures.length > 0) {
  console.error('Image references UI checks failed:')
  for (const failure of failures) {
    console.error(`- ${failure.name}`)
  }
  process.exit(1)
}

console.log('Image references UI checks passed')
