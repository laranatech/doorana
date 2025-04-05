import { CanvasRenderer } from '@laranatech/colorana'
import { Camera } from './services/Camera'
import { Map } from './services/Map'
import { Renderer } from './services/Renderer'
import { CollisionService } from './services/CollisionService'
import { SpriteManager, Sprite } from './services/SpriteManager'
import { Vector3 } from './services/Vector3'
import { DoorAnimationService } from './services/DoorAnimationService'
import { CombatService } from './services/CombatService'

export class Game {
	renderer: CanvasRenderer
	camera: Camera
	map: Map
	gameRenderer: Renderer
	collisionService: CollisionService
	spriteManager: SpriteManager
	doorAnimationService: DoorAnimationService
	combatService: CombatService
	playerHealth: number = 100
	showMessage: string = ''
	messageTimeout: number | null = null
	playerAmmo: number = 50 // Базовое количество патронов
	lastTime: number = 0
	keysPressed: Set<string> = new Set()

	constructor(renderer: CanvasRenderer) {
		this.renderer = renderer
		
		// Инициализация служб игры
		this.map = new Map()
		this.spriteManager = new SpriteManager()
		this.doorAnimationService = new DoorAnimationService()
		this.collisionService = new CollisionService(this.map, this.doorAnimationService)
		this.combatService = new CombatService(this.spriteManager)
		
		// Настройка камеры
		const playerPos = this.map.getPlayerPosition()
		this.camera = new Camera(playerPos.x, 0, playerPos.y)
		this.camera.setCollisionService(this.collisionService)
		
		// Настройка рендерера
		this.gameRenderer = new Renderer(renderer, 480, 1, this.doorAnimationService)
		
		// Добавляем предметы из карты в менеджер спрайтов
		this.map.getItems().forEach(item => {
			this.spriteManager.addSprite(item)
			// Если это враг, добавляем его в CombatService
			if (item.texture === 'enemy') {
				this.combatService.addEnemy(item.position)
			}
		})
		
		// Добавляем тестовый спрайт если предметов нет
		if (this.spriteManager.getSprites().length === 0) {
			this.addTestSprite()
		}
		
		// Обработка нажатия клавиш
		window.addEventListener('keydown', (e) => {
			this.keysPressed.add(e.key.toLowerCase())
			this.handleKeyDown(e.key)
		})
		
		// Обработка отпускания клавиш
		window.addEventListener('keyup', (e) => {
			this.keysPressed.delete(e.key.toLowerCase())
		})
		
		// Запускаем игровой цикл
		this.lastTime = performance.now()
		requestAnimationFrame(this.gameLoop.bind(this))
	}
	
	gameLoop(currentTime: number) {
		const deltaTime = currentTime - this.lastTime
		this.lastTime = currentTime
		
		// Обновляем состояние камеры
		this.camera.update(deltaTime)
		
		// Обновляем анимацию дверей
		this.doorAnimationService.update(deltaTime)
		
		// Обрабатываем движение на основе нажатых клавиш
		this.handleMovement()
		
		// Проверяем взаимодействия
		this.checkInteractions()
		
		// Рендерим кадр
		this.render()
		
		// Запрашиваем следующий кадр
		requestAnimationFrame(this.gameLoop.bind(this))
	}

	handleKeyDown(key: string) {
		switch (key.toLowerCase()) {
			case 'e': case 'у':
				this.tryOpenDoor()
				break
			case 'o':
				this.gameRenderer.toggleDebug()
				console.log('Отладка спрайтов включена')
				break
			case 'f': case ' ': // Стрельба
				this.shoot()
				break
		}
	}

	handleMovement() {
		// Обработка движения вперед/назад
		if (this.keysPressed.has('w') || this.keysPressed.has('ц')) {
			this.camera.startMovingForward()
		}
		if (this.keysPressed.has('s') || this.keysPressed.has('ы')) {
			this.camera.startMovingBackward()
		}
		
		// Обработка движения влево/вправо
		if (this.keysPressed.has('a') || this.keysPressed.has('ф')) {
			this.camera.startMovingLeft()
		}
		if (this.keysPressed.has('d') || this.keysPressed.has('в')) {
			this.camera.startMovingRight()
		}
		
		// Обработка поворота
		if (this.keysPressed.has('arrowleft')) {
			this.camera.startRotatingLeft()
		}
		if (this.keysPressed.has('arrowright')) {
			this.camera.startRotatingRight()
		}
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
	
	// Обработка выстрела
	private shoot() {
		if (this.playerAmmo <= 0) {
			this.showMessageOnScreen('Нет патронов!')
			return
		}

		this.playerAmmo--
		const hitEnemy = this.combatService.shoot(
			this.camera.getPosition(),
			this.camera.getRotation()
		)

		if (hitEnemy) {
			this.showMessageOnScreen('Попадание!')
		}
	}
	
	// Попытка открыть дверь перед игроком
	private tryOpenDoor() {
		const playerPos = this.camera.getPosition()
		const playerAngle = this.camera.getRotation()
		
		const doorCheckDistance = 1.2
		const doorX = Math.floor(playerPos.x + Math.sin(playerAngle) * doorCheckDistance)
		const doorZ = Math.floor(playerPos.z + Math.cos(playerAngle) * doorCheckDistance)
		
		if (this.map.isDoor(doorX, doorZ)) {
			const doorOpened = this.map.tryOpenDoor(doorX, doorZ)
			
			if (doorOpened) {
				this.doorAnimationService.addDoor(doorX, doorZ)
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
