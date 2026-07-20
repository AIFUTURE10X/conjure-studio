const fs = require('fs')
const path = require('path')

const root = process.cwd()
const editorPath = path.join(root, 'app/image-studio/components/Annotation/ImageAnnotationEditor.tsx')
const cardPath = path.join(root, 'app/image-studio/components/GeneratedImageCard.tsx')
const resultsPath = path.join(root, 'app/image-studio/components/Studio/ResultsCanvas.tsx')
const generationPath = path.join(root, 'app/image-studio/hooks/useImageGeneration.ts')
const routePath = path.join(root, 'app/api/generate-image/route.ts')
const annotationReferencePath = path.join(root, 'app/image-studio/utils/annotation-reference.ts')

const failures = []

const read = (filePath) => {
  if (!fs.existsSync(filePath)) {
    failures.push(`Missing file: ${path.relative(root, filePath)}`)
    return ''
  }

  return fs.readFileSync(filePath, 'utf8')
}

const assertIncludes = (content, needle, label) => {
  if (!content.includes(needle)) {
    failures.push(label)
  }
}

const editor = read(editorPath)
const card = read(cardPath)
const results = read(resultsPath)
const generation = read(generationPath)
const route = read(routePath)
const annotationReference = read(annotationReferencePath)

assertIncludes(editor, 'export function ImageAnnotationEditor', 'Annotation editor must export ImageAnnotationEditor')
assertIncludes(editor, 'react-konva', 'Annotation editor must use react-konva')
assertIncludes(editor, 'Stage', 'Annotation editor must render a Konva Stage')
assertIncludes(editor, 'Arrow', 'Annotation editor must support arrow callouts')
assertIncludes(editor, 'Line', 'Annotation editor must support freehand drawing')
assertIncludes(editor, 'Rect', 'Annotation editor must support rectangle callouts')
assertIncludes(editor, 'Ellipse', 'Annotation editor must support circle/ellipse callouts')
assertIncludes(editor, 'Text', 'Annotation editor must support text labels')
assertIncludes(editor, 'pixelRatio: 2', 'Annotation export must use high-resolution output')
assertIncludes(editor, 'download', 'Annotation editor must download the flattened PNG')
assertIncludes(editor, 'onSaveCopy', 'Annotation editor must expose a save-copy callback')
assertIncludes(editor, 'buildAnnotationMaskDataUrl', 'Annotation editor must build a mask for guided image edits')

assertIncludes(card, "from './Annotation'", 'GeneratedImageCard must import the annotation editor')
assertIncludes(card, 'ImageAnnotationEditor', 'GeneratedImageCard must render the annotation editor')
assertIncludes(card, 'aria-label="Annotate image"', 'GeneratedImageCard must expose an accessible annotate button')
assertIncludes(card, 'onSaveAnnotated', 'GeneratedImageCard must pass annotated exports upstream')

assertIncludes(results, 'onSaveAnnotated', 'ResultsCanvas must save annotated copies into generated images')
assertIncludes(results, 'annotated', 'Annotated copies must be identifiable in the current results list')
assertIncludes(results, 'conjure-source-', 'Annotation generation should use the clean source image as the edit input')
assertIncludes(results, 'conjure-edit-mask-', 'Annotation generation should attach a mask derived from annotations')

assertIncludes(generation, 'maskImage', 'Image generation hook must send annotation masks to the API')
assertIncludes(route, "formData.get('maskImage')", 'Generate-image route must accept annotation masks')
assertIncludes(route, 'maskImageFile', 'Generate-image route must pass annotation masks to the image-edit client')
assertIncludes(annotationReference, 'getAnnotationReferenceInstruction', 'Annotation reference metadata must carry edit instructions')

if (failures.length > 0) {
  console.error('Image annotation contract failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Image annotation contract passed')
