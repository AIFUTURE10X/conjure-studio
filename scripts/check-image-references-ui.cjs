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
