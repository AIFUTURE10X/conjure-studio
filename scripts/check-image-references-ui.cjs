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
    name: 'subject panel tells users an uploaded person is used for likeness',
    pass: () => /likeness/i.test(read('app/image-studio/components/UploadPanel/UploadPanel.tsx')),
  },
  {
    name: 'subject panel surfaces the stylize-me capability without opening Advanced',
    pass: () => {
      const panel = read('app/image-studio/components/UploadPanel/UploadPanel.tsx')
      return /stylized version/i.test(panel) && /Advanced/i.test(panel)
    },
  },
  {
    name: 'reference image control no longer reads as a rarely-needed optional extra',
    pass: () => {
      const ref = read('app/image-studio/components/GeneratePanel/ReferenceImageUpload.tsx')
      return !/optional - for image-to-image generation/.test(ref) && /lock a specific/i.test(ref)
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
