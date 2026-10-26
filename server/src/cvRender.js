import { createRequire } from 'node:module'
import path from 'node:path'

// Page-1 rasterizer for the gated CV viewer (PK-25). Pure JS, no apt/poppler:
// pdf-to-img drives pdfjs-dist onto an @napi-rs/canvas prebuilt binary
// (linux-x64-gnu ships in the release), so the VPS needs no native build.
//
// pdf-to-img resolves pdfjs' bundled standard_fonts itself, but it does so with
// posix path ops, which breaks on a Windows backslash path (harmless warnings
// locally, correct on the Linux VPS). We pass explicit, normalized font + cmap
// dirs via docInitParams so the fonts load on every platform and a PDF that
// leans on a standard font renders its real glyphs, not a blank fallback.
const require = createRequire(import.meta.url)
const pdfjsDir = path.dirname(require.resolve('pdfjs-dist/package.json'))
const fontDir = (name) => path.resolve(pdfjsDir, name).replaceAll(path.sep, '/') + '/'

const DOC_INIT_PARAMS = {
  standardFontDataUrl: fontDir('standard_fonts'),
  cMapUrl: fontDir('cmaps'),
  cMapPacked: true,
}

// scale 2 ~ 1240px wide for A4, crisp in the viewer without a huge PNG.
const PREVIEW_SCALE = 2

// Rasterize page 1 of the PDF at `pdfPath` to a PNG buffer and count the pages.
// Returns { pngBuffer, pages }. Throws on a corrupt/unreadable PDF; the caller
// (cv.js) catches that and falls back to the ungated behavior so an upload is
// never bricked by a render failure.
export async function renderCvPreview(pdfPath) {
  const { pdf } = await import('pdf-to-img')
  const doc = await pdf(pdfPath, { scale: PREVIEW_SCALE, docInitParams: DOC_INIT_PARAMS })
  const pages = doc.length
  let pngBuffer = null
  for await (const page of doc) { pngBuffer = page; break } // first page only
  if (!pngBuffer) throw new Error('No pages rendered from PDF')
  return { pngBuffer, pages }
}
