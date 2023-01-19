const canvas = document.querySelector('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

canvas.width = 1060
canvas.height = 600

const data = {
  maxIndex: 0,
  loaded: 0,
  currentFrame: 0,
  fps: 60,
}

const images: HTMLImageElement[] = []
const url = 'fighter_nenmaster_neo.img'
let c = 0
let d = 0

for (let i = 0; i <= 20; i++) {
  const img = new Image()
  img.src = `/${url}/${i}.png`
  img.onload = () => c++
  images.push(img)
}

function draw() {
  let timer = setTimeout(() => {
    if (d % 10 === 0) canvas.width = 1060
    const i = d % 21
    ctx.drawImage(
      images[i],
      0,
      0,
      images[i].width,
      images[i].height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    d++
    requestAnimationFrame(draw)
    clearTimeout(timer)
  }, 70)
}

function waitLoop() {
  if (c === 21) requestAnimationFrame(draw)
  else requestIdleCallback(waitLoop)
}

requestIdleCallback(waitLoop)

// function getImages(base: string, maxIndex: number, ext: string): HTMLElement[] {
//   return new Array(maxIndex).map((_, i) => {
//     const img = new Image()
//     img.src = `${base}/${i}.${ext}`
//     img.onload = () => data.loaded++
//     return img
//   })
// }
