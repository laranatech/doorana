import { CanvasRenderer } from '@laranatech/colorana'
import { RenderCommand, RenderQueue } from '@laranatech/lareq'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

export class Game {
	renderer: CanvasRenderer

	x = 0
	y = 0
	size = 10

	constructor(renderer: CanvasRenderer) {
		this.renderer = renderer

		window.addEventListener('keydown', (e) => {
			this.move(e.key)
		})
	}

	move(key: string) {
		const dX = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0
		const dY = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0
		
		this.x = clamp(this.x + this.size * dX, 0, this.renderer.canvas!.width || 0)
		this.y = clamp(this.y + this.size * dY, 0, this.renderer.canvas!.height || 0)

		this.update()
	}

	update() {
		const lareq = new RenderQueue()

		lareq.command.clearRect({ x: 0, y: 0, w: this.renderer.canvas!.width, h: this.renderer.canvas!.height })
		lareq.command.beginPath()
		lareq.command.rect({ x: this.x, y: this.y, w: this.size, h: this.size })
		lareq.command.fill()

		this.draw(lareq.commands)
	}

	draw(queue: RenderCommand[]) {
		this.renderer.prepare(queue)
		this.renderer.render(queue)
	}
}
