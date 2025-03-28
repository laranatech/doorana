import { CanvasRenderer } from '@laranatech/colorana'
import { Camera } from './services/Camera'
import { Map } from './services/Map'
import { Renderer } from './services/Renderer'
import { CollisionService } from './services/CollisionService'
import { SpriteManager, Sprite } from './services/SpriteManager'
import { Vector3 } from './services/Vector3'

export class Game {
	renderer: CanvasRenderer
	camera: Camera
	map: Map
	gameRenderer: Renderer
	collisionService: CollisionService
	spriteManager: SpriteManager

	constructor(renderer: CanvasRenderer) {
		this.renderer = renderer
		
		// Инициализация служб игры
		this.map = new Map()
		this.spriteManager = new SpriteManager()
		this.collisionService = new CollisionService(this.map)
		
		// Настройка камеры
		const playerPos = this.map.getPlayerPosition()
		this.camera = new Camera(playerPos.x, 0, playerPos.y)
		this.camera.setCollisionService(this.collisionService)
		
		// Настройка рендерера
		this.gameRenderer = new Renderer(renderer)
		
		// Добавляем предметы из карты в менеджер спрайтов
		this.map.getItems().forEach(item => {
			this.spriteManager.addSprite(item)
		})
		
		// Добавляем тестовый спрайт если предметов нет
		if (this.spriteManager.getSprites().length === 0) {
			this.addTestSprite()
		}
		
		// Настройка обработчика клавиш
		window.addEventListener('keydown', (e) => {
			this.handleInput(e.key)
		})
	}
	
	// Добавление тестового спрайта для проверки отображения
	private addTestSprite() {
		const playerPos = this.map.getPlayerPosition()
		// Добавляем спрайт противника перед игроком
		const enemyPos = new Vector3(playerPos.x + 2, 0, playerPos.y + 2)
		this.spriteManager.addSprite({
			position: enemyPos,
			texture: 'enemy',
			type: 'enemy'
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

	update() {
		// Получаем список спрайтов для отображения
		const sprites = this.spriteManager.getSprites().map(sprite => ({
			position: sprite.position,
			texture: sprite.texture
		}))
		
		// Рендерим сцену
		this.gameRenderer.render(this.camera, this.map, sprites)
	}
}
