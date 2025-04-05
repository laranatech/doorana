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
	playerHealth: number = 100
	showMessage: string = ''
	messageTimeout: number | null = null
	playerAmmo: number = 50 // Базовое количество патронов

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
		switch (key.toLowerCase()) {
			case 'arrowleft':
				this.camera.rotate(-1)
				break
			case 'arrowright':
				this.camera.rotate(1)
				break
			case 'w': case 'ц':
				this.camera.moveForward()
				this.checkInteractions()
				break
			case 's': case 'ы':
				this.camera.moveBackward()
				this.checkInteractions()
				break
			case 'a': case 'ф':
				this.camera.moveLeft()
				this.checkInteractions()
				break
			case 'd': case 'в':
				this.camera.moveRight()
				this.checkInteractions()
				break
			// Добавляем взаимодействие с дверьми - клавиша E/space
			case 'e': case 'е': case ' ':
				this.tryOpenDoor()
				break
			// Добавляем управление отладкой - клавиша O включает/выключает отладку
			case 'o':
				this.gameRenderer.toggleDebug()
				console.log('Отладка спрайтов включена')
				break
		}
		this.render()
	}
	
	// Проверка взаимодействий с предметами при движении
	private checkInteractions() {
		const playerPos = this.camera.getPosition()
		
		// Проверяем, есть ли рядом предметы для подбора
		const nearbyItem = this.spriteManager.findSpriteNear(playerPos, 0.7)
		
		if (nearbyItem) {
			// Обрабатываем подбор предмета в зависимости от его типа
			switch (nearbyItem.texture) {
				case 'key': // Подбор ключа
					this.map.addKey()
					this.spriteManager.removeSprite(nearbyItem)
					this.showMessageOnScreen(`Ключ подобран! Ключей: ${this.map.getKeyCount()}`)
					break
					
				case 'health': // Подбор аптечки
					this.addHealth(25) // Добавляем 25 здоровья
					this.spriteManager.removeSprite(nearbyItem)
					this.showMessageOnScreen(`Здоровье восстановлено: ${this.playerHealth}`)
					break
					
				case 'ammo': // Подбор боеприпасов
					this.addAmmo(15) // Добавляем 15 патронов
					this.spriteManager.removeSprite(nearbyItem)
					this.showMessageOnScreen(`Подобраны боеприпасы: ${this.playerAmmo}`)
					break
					
				case 'weapon': // Подбор оружия
					this.addAmmo(25) // Добавляем 25 патронов при подборе оружия
					this.spriteManager.removeSprite(nearbyItem)
					this.showMessageOnScreen('Подобрано оружие')
					break
			}
		}
	}
	
	// Попытка открыть дверь перед игроком
	private tryOpenDoor() {
		const playerPos = this.camera.getPosition()
		const playerAngle = this.camera.getRotation()
		
		// Проверяем позицию непосредственно перед игроком
		const doorCheckDistance = 1.2 // Расстояние для проверки двери
		const doorX = Math.floor(playerPos.x + Math.sin(playerAngle) * doorCheckDistance)
		const doorZ = Math.floor(playerPos.z + Math.cos(playerAngle) * doorCheckDistance)
		
		// Проверяем, есть ли дверь по указанным координатам
		if (this.map.isDoor(doorX, doorZ)) {
			// Пытаемся открыть дверь
			const doorOpened = this.map.tryOpenDoor(doorX, doorZ)
			
			if (doorOpened) {
				this.showMessageOnScreen('Дверь открыта!')
			} else {
				this.showMessageOnScreen('Нужен ключ для открытия этой двери!')
			}
		}
	}
	
	// Добавляет здоровье игроку с ограничением максимума в 100
	private addHealth(amount: number) {
		this.playerHealth = Math.min(100, this.playerHealth + amount)
	}
	
	// Добавляет патроны игроку с ограничением максимума в 100
	private addAmmo(amount: number) {
		this.playerAmmo = Math.min(100, this.playerAmmo + amount)
	}
	
	// Показывает сообщение на экране на несколько секунд
	private showMessageOnScreen(message: string, duration: number = 2000) {
		this.showMessage = message
		
		// Очищаем предыдущий таймер, если был
		if (this.messageTimeout !== null) {
			clearTimeout(this.messageTimeout)
		}
		
		// Устанавливаем новый таймер для скрытия сообщения
		this.messageTimeout = window.setTimeout(() => {
			this.showMessage = ''
			this.messageTimeout = null
			this.render() // Обновляем экран после скрытия сообщения
		}, duration)
	}

	render() {
		// Получаем список спрайтов для отображения
		const sprites = this.spriteManager.getSprites().map(sprite => ({
			position: sprite.position,
			texture: sprite.texture
		}))
		
		// Рендерим сцену с передачей информации о здоровье и патронах
		this.gameRenderer.render(
			this.camera, 
			this.map, 
			sprites, 
			this.showMessage,
			this.playerHealth,
			this.playerAmmo
		)
	}
}
