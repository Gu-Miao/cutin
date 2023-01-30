const loadingDiv = document.querySelector('.loading') as HTMLDivElement
const progressDiv = loadingDiv.querySelector('.progress') as HTMLDivElement
const boxDiv = document.querySelector('.box') as HTMLDivElement
const backgroundInput = document.getElementById('background') as HTMLInputElement
const fpsInput = document.getElementById('fps') as HTMLInputElement
const canvasWidthInput = document.getElementById('canvas-width') as HTMLInputElement
const canvasHeightInput = document.getElementById('canvas-height') as HTMLInputElement
const cutinSelect = document.getElementById('cutin') as HTMLSelectElement
const cleanrAfterFramesInput = document.getElementById('clean-after-frames') as HTMLInputElement
const fullscreenBtn = document.getElementById('fullscreen') as HTMLButtonElement
const toggleBtn = document.getElementById('toggle') as HTMLButtonElement
const canvas = document.querySelector('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const data = {
  images: [] as HTMLImageElement[],
  total: 0,
  current: 0,
  loading: false,
}

setBackgrounds()
setMaxSize()
loadImages()

backgroundInput.addEventListener('change', setBackgrounds)

cutinSelect.addEventListener('change', loadImages)

toggleBtn.addEventListener('click', toggleBox)
fullscreenBtn.addEventListener('click', fullscreen)

fpsInput.addEventListener('input', handleInput)
canvasWidthInput.addEventListener('input', handleInput)
canvasHeightInput.addEventListener('input', handleInput)

window.addEventListener('resize', setMaxSize)

/** Handle input event of input numbers */
function handleInput(e: Event) {
  const el = e.target as HTMLInputElement
  if (+el.value > +el.max) {
    el.value = el.max
  } else if (+el.value < +el.min) {
    el.value = el.min
  }
}

/** Fullscreen mode */
function fullscreen() {
  document.documentElement.requestFullscreen()
}

/** Show or hide box */
function toggleBox() {
  if (boxDiv.classList.contains('hide')) {
    boxDiv.classList.remove('hide')
    toggleBtn.innerHTML = 'Hide'
  } else {
    boxDiv.classList.add('hide')
    toggleBtn.innerHTML = 'Show'
  }
}

/** Set max size of canvas */
function setMaxSize() {
  const mw = document.documentElement.clientWidth
  const mh = document.documentElement.clientHeight
  canvasWidthInput.value = mw.toString()
  canvasWidthInput.max = mw.toString()
  canvasHeightInput.value = mh.toString()
  canvasHeightInput.max = mh.toString()
}

/** Set backgrounds */
function setBackgrounds() {
  document.body.style.backgroundColor = backgroundInput.value
  canvas.style.backgroundColor = backgroundInput.value
}

/** Set size of canvas */
function setCanvasSize() {
  canvas.width = clamp(+canvasWidthInput.value, +canvasWidthInput.min, +canvasWidthInput.max)
  canvas.height = clamp(+canvasHeightInput.value, +canvasHeightInput.min, +canvasHeightInput.max)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/** Loading images */
function loadImages() {
  loadingDiv.style.display = ''

  const [path, maxIndex] = cutinSelect.value.split('-')

  cleanCanvas()
  data.images = []
  data.total = +maxIndex + 1
  data.current = 0
  data.loading = true
  progressDiv.innerHTML = `0/${data.total}`

  for (let i = 0; i <= +maxIndex; i++) {
    const img = new Image()
    img.src = `/${path}/${i}.png`
    img.onload = () => {
      data.current++
      progressDiv.innerHTML = `${data.current}/${data.total}`

      if (data.current === data.total) {
        const timer = setTimeout(() => {
          clearTimeout(timer)
          loadingDiv.style.display = 'none'
          data.loading = false
          play()
        }, 500)
      }
    }
    data.images.push(img)
  }
}

/** Play cutin animation */
function play() {
  setCanvasSize()

  let last = Date.now()
  let i = 0
  let frames = 0

  function render() {
    if (data.loading) return

    const diff = (1 / +fpsInput.value) * 1000
    const now = Date.now()
    const img = data.images[i % data.total]

    if (last + diff <= now) {
      last = now
      if (frames === +cleanrAfterFramesInput.value) {
        cleanCanvas()
        frames = 0
      }
      ctx.drawImage(img, 0, 0, img.width, img.height, ...getDestinationSizes(img))
      frames++
      i++
    }

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

/** Clean canvas */
function cleanCanvas() {
  setCanvasSize()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

/**
 * Get destination sizes
 * @param img Image element
 * @returns A tuple includes dx, dy, dw, dh that can be used in drawImage()
 */
function getDestinationSizes(img: HTMLImageElement): [number, number, number, number] {
  const { width, height } = img
  const canvasWidth = +canvasWidthInput.value
  const canvasHeight = +canvasHeightInput.value
  const r = canvasWidth / canvasHeight
  const c = width / height

  if (c >= r) {
    const dw = canvasWidth
    const dh = height * (canvasWidth / width)
    const dx = 0
    const dy = (canvasHeight - dh) / 2

    return [dx, dy, dw, dh]
  } else {
    const dw = width * (canvasHeight / height)
    const dh = canvasHeight
    const dx = (canvasWidth - dw) / 2
    const dy = 0

    return [dx, dy, dw, dh]
  }
}
