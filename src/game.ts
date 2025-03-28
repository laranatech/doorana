import { CanvasRenderer } from '@laranatech/colorana'
import { RenderCommand, RenderQueue } from '@laranatech/lareq'
import { Camera } from './services/Camera'
import { Vector3 } from './services/Vector3'
import { Map } from './services/Map'

export class Game {
	renderer: CanvasRenderer
	camera: Camera
	map: Map
	private readonly RAY_COUNT = 480
	private readonly MAX_DEPTH = 24
	private readonly WALL_HEIGHT = 1

	constructor(renderer: CanvasRenderer) {
		this.renderer = renderer

		this.map = new Map()
		const playerPos = this.map.getPlayerPosition()
		this.camera = new Camera(playerPos.x, 0, playerPos.y)

		window.addEventListener('keydown', (e) => {
			this.handleInput(e.key)
		})
	}

	handleInput(key: string) {
		switch (key) {
			case 'ArrowLeft':
				this.camera.rotate(-1)
				break
			case 'ArrowRight':
				this.camera.rotate(1)
				break
			case 'w':
				this.camera.moveForward()
				break
			case 's':
				this.camera.moveBackward()
				break
			case 'a':
				this.camera.moveLeft()
				break
			case 'd':
				this.camera.moveRight()
				break
		}
		this.update()
	}

	private castRay(angle: number): { distance: number, hitWall: boolean } {
		let ray = new Vector3(0, 0, 0)
		let distance = 0
		const step = 0.1

		while (distance < this.MAX_DEPTH) {
			ray = new Vector3(
				Math.sin(angle) * distance,
				0,
				Math.cos(angle) * distance
			)
			const worldPos = new Vector3(
				this.camera.getPosition().x + ray.x,
				this.camera.getPosition().y + ray.y,
				this.camera.getPosition().z + ray.z
			)
			
			if (this.map.isWall(Math.floor(worldPos.x), Math.floor(worldPos.z))) {
				return { distance, hitWall: true }
			}
			distance += step
		}
		return { distance: this.MAX_DEPTH, hitWall: false }
	}

	update() {
		this.renderer.canvas!.width = window.innerWidth
		this.renderer.canvas!.height = window.innerHeight
		
		const lareq = new RenderQueue()
		const width = this.renderer.canvas!.width
		const height = this.renderer.canvas!.height

		// Очищаем экран
		lareq.command.clearRect({ x: 0, y: 0, w: width, h: height })

		// Рисуем пол
		lareq.command.setCtx({
			fillStyle: '#878787'
		})
		lareq.command.beginPath()
		lareq.command.moveTo({ x: 0, y: height/2 })
		lareq.command.lineTo({ x: width, y: height/2 })
		lareq.command.lineTo({ x: width, y: height })
		lareq.command.lineTo({ x: 0, y: height })
		lareq.command.closePath()
		lareq.command.fill()

		// Рисуем потолок
		lareq.command.setCtx({
			fillStyle: '#444444'
		})
		lareq.command.beginPath()
		lareq.command.moveTo({ x: 0, y: 0 })
		lareq.command.lineTo({ x: width, y: 0 })
		lareq.command.lineTo({ x: width, y: height/2 })
		lareq.command.lineTo({ x: 0, y: height/2 })
		lareq.command.closePath()
		lareq.command.fill()


		lareq.command.setCtx({
			fillStyle: '#000000'
		})
		// Рисуем стены
		const fov = Math.PI / 3
		const rayStep = fov / this.RAY_COUNT
		const startAngle = this.camera.getRotation() - fov / 2

		for (let i = 0; i < this.RAY_COUNT; i++) {
			const rayAngle = startAngle + rayStep * i
			const { distance, hitWall } = this.castRay(rayAngle)

			if (hitWall) {
				// Вычисляем высоту стены
				const wallHeight = (height / distance) * this.WALL_HEIGHT
				const wallTop = (height - wallHeight) / 2
				const wallBottom = wallTop + wallHeight

				// Рисуем стену

				// lareq.complex.sprite({
				// 	img: '/textures.webp',
				// 	source: {
				// 		x: 0,
				// 		y: 0,
				// 		w: 64,
				// 		h: 128,
				// 	},
				// 	destination: {
				// 		x: 100,
				// 		y: 100,
				// 		w: 600,
				// 		h: 450,
				// 	},
				// 	customShape: (q, _opts) => {
				// 		lareq.command.beginPath()
				// 		lareq.command.moveTo({ x: (width * i) / this.RAY_COUNT, y: wallTop })
				// 		lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallTop })
				// 		lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallBottom })
				// 		lareq.command.lineTo({ x: (width * i) / this.RAY_COUNT, y: wallBottom })
				// 		lareq.command.closePath()
				// 	}
				// })
				lareq.command.beginPath()
				lareq.command.moveTo({ x: (width * i) / this.RAY_COUNT, y: wallTop })
				lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallTop })
				lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallBottom })
				lareq.command.lineTo({ x: (width * i) / this.RAY_COUNT, y: wallBottom })
				lareq.command.closePath()
				lareq.command.fill()
			}
		}

		this.draw(lareq.commands)
	}

	draw(queue: RenderCommand[]) {
		this.renderer.prepare(queue)
		this.renderer.render(queue)
	}
}
