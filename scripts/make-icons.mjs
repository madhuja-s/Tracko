import sharp from 'sharp'
import fs from 'node:fs'

const SRC = 'public/icons/tracko logo.png'
const OUT = 'public/icons'
const CREAM = { r: 255, g: 247, b: 236, alpha: 1 }
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 }

if (!fs.existsSync(SRC)) {
  console.error(`Cannot find ${SRC}. Check the file name and folder.`)
  process.exit(1)
}

// the logo as it is, resized
async function plain(size, name) {
  await sharp(SRC)
    .resize(size, size, { fit: 'contain', background: CLEAR })
    .png()
    .toFile(`${OUT}/${name}`)
}

// the logo on a cream square with space around it (for round and squircle icons)
async function padded(size, name, ratio) {
  const inner = Math.round(size * ratio)
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: 'contain', background: CLEAR })
    .png()
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: CREAM },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`${OUT}/${name}`)
}

await plain(192, 'icon-192.png')
await plain(512, 'icon-512.png')
await padded(512, 'icon-maskable-512.png', 0.7)
await padded(180, 'apple-touch-icon.png', 0.85)

console.log('Done. Made icon-192, icon-512, icon-maskable-512 and apple-touch-icon.')