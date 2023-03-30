const loadingDiv = document.querySelector('.loading') as HTMLDivElement
const progressDiv = loadingDiv.querySelector('.progress') as HTMLDivElement
const boxDiv = document.querySelector('.box') as HTMLDivElement
const backgroundInput = document.getElementById('background') as HTMLInputElement
const fpsInput = document.getElementById('fps') as HTMLInputElement
const canvasWidthInput = document.getElementById('canvas-width') as HTMLInputElement
const canvasHeightInput = document.getElementById('canvas-height') as HTMLInputElement
const cutinSelect = document.getElementById('cutin') as HTMLSelectElement
const cleanrAfterFramesInput = document.getElementById('clean-after-frames') as HTMLInputElement
const mirrorImageInput = document.getElementById('mirror-image') as HTMLInputElement
const fullscreenBtn = document.getElementById('fullscreen') as HTMLButtonElement
const toggleBtn = document.getElementById('toggle') as HTMLButtonElement
const canvas = document.querySelector('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

type ImageJson = {
  area: [number, number]
  maxIndex: number
  positions: [number, number][]
}

let focusing = false
const cutinData = new Map<string, ImageJson>()
const data = {
  name: '',
  images: [] as HTMLImageElement[],
  ratio: 1,
  total: 0,
  current: 0,
  loading: false,
}

setBackgrounds()
setCanvasSize()
loadImages()

backgroundInput.addEventListener('change', setBackgrounds)

cutinSelect.addEventListener('change', loadImages)

mirrorImageInput.addEventListener('change', setMirrorImage)

toggleBtn.addEventListener('click', toggleBox)
fullscreenBtn.addEventListener('click', fullscreen)

fpsInput.addEventListener('input', handleInput)
canvasWidthInput.addEventListener('input', handleInput)
canvasHeightInput.addEventListener('input', handleInput)

window.addEventListener('resize', setCanvasSize)

backgroundInput.addEventListener('focus', () => (focusing = true))
fpsInput.addEventListener('focus', () => (focusing = true))
canvasWidthInput.addEventListener('focus', () => (focusing = true))
canvasHeightInput.addEventListener('focus', () => (focusing = true))
cleanrAfterFramesInput.addEventListener('focus', () => (focusing = true))

backgroundInput.addEventListener('blur', () => (focusing = false))
fpsInput.addEventListener('blur', () => (focusing = false))
canvasWidthInput.addEventListener('blur', () => (focusing = false))
canvasHeightInput.addEventListener('blur', () => (focusing = false))
cleanrAfterFramesInput.addEventListener('blur', () => (focusing = false))

/** Set mirror image effect */
function setMirrorImage() {
  canvas.style.transform = mirrorImageInput.checked ? 'scale(-1, 1)' : ''
}

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

/** Set backgrounds */
function setBackgrounds() {
  document.body.style.backgroundColor = backgroundInput.value
  canvas.style.backgroundColor = backgroundInput.value
}

/** Set size of canvas */
function setCanvasSize() {
  if (!focusing) {
    const mw = document.documentElement.clientWidth
    const mh = document.documentElement.clientHeight
    canvasWidthInput.value = mw.toString()
    canvasWidthInput.max = mw.toString()
    canvasHeightInput.value = mh.toString()
    canvasHeightInput.max = mh.toString()
  }

  canvas.width = clamp(+canvasWidthInput.value, +canvasWidthInput.min, +canvasWidthInput.max)
  canvas.height = clamp(+canvasHeightInput.value, +canvasHeightInput.min, +canvasHeightInput.max)
  setRatio()
}

/** Set area and positions data according to the size of canvas */
function setRatio() {
  if (!cutinData.get(data.name)) return
  const { area } = cutinData.get(data.name) as ImageJson

  const [width, height] = area
  const ir = width / height
  const cr = canvas.width / canvas.height

  data.ratio = cr >= ir ? canvas.height / height : canvas.width / width
}

/** Loading images */
async function loadImages() {
  loadingDiv.style.display = ''
  progressDiv.innerHTML = '-/-'

  const name = cutinSelect.value

  if (!cutinData.get(name)) {
    cutinData.set(name, await get<ImageJson>(`/${name}/images.json`))
  }

  const { maxIndex } = cutinData.get(name) as ImageJson

  cleanCanvas()

  data.name = name
  data.images = []
  setRatio()
  data.total = maxIndex + 1
  data.current = 0
  data.loading = true
  progressDiv.innerHTML = `0/${data.total}`

  for (let i = 0; i <= maxIndex; i++) {
    const img = new Image()
    img.src = `/${name}/${i}.png`
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
  cleanCanvas()

  let last = Date.now()
  let i = 0
  let frames = 0
  const { area, positions } = cutinData.get(data.name) as ImageJson
  const [mw, mh] = area
  let { width, height } = canvas
  let dsArr = [] as [number, number, number, number][]

  function render() {
    if (data.loading) return

    const diff = (1 / +fpsInput.value) * 1000
    const now = Date.now()

    if (last + diff <= now) {
      last = now
      if (frames === +cleanrAfterFramesInput.value) {
        cleanCanvas()
        frames = 0
      }

      if (width !== canvas.width || height !== canvas.height) {
        dsArr = []
        width = canvas.width
        height = canvas.height
      }

      const index = i % data.total
      const img = data.images[index]

      if (!dsArr[index]) {
        let [dx, dy] = positions[index]
        const r = data.ratio
        dx *= r
        dy *= r
        dx += (canvas.width - mw * r) / 2
        dy += (canvas.height - mh * r) / 2

        dsArr[index] = [dx, dy, img.width * r, img.height * r]
      }

      ctx.drawImage(img, 0, 0, img.width, img.height, ...dsArr[index])

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

/** Keep number in the area */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/** Get */
function get<T>(path: string): Promise<T> {
  return new Promise(reslove => {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'json'
    xhr.open('GET', path, true)
    xhr.onload = () => reslove(xhr.response)
    xhr.onerror = e => console.error(e)
    xhr.send()
  })
}
