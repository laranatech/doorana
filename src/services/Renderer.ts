import { CanvasRenderer } from '@laranatech/colorana'
import { RenderCommand, RenderQueue } from '@laranatech/lareq'
import { Camera } from './Camera'
import { Vector3 } from './Vector3'
import { Map } from './Map'

export class Renderer {
    private renderer: CanvasRenderer
    private readonly RAY_COUNT: number
    private readonly WALL_HEIGHT: number
    
    constructor(renderer: CanvasRenderer, rayCount: number = 480, wallHeight: number = 1) {
        this.renderer = renderer
        this.RAY_COUNT = rayCount
        this.WALL_HEIGHT = wallHeight
    }
    
    render(camera: Camera, map: Map, sprites: {position: Vector3, texture: string}[] = []) {
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
        
        // Массив для хранения расстояний до стен для каждого луча
        // Нам это понадобится для правильного рендеринга спрайтов
        const zBuffer: number[] = new Array(this.RAY_COUNT).fill(Infinity)
        
        // Рисуем стены
        lareq.command.setCtx({
            fillStyle: '#000000'
        })
        
        const fov = Math.PI / 3
        const rayStep = fov / this.RAY_COUNT
        const startAngle = camera.getRotation() - fov / 2
        
        // Рендеринг стен с повышенной точностью
        for (let i = 0; i < this.RAY_COUNT; i++) {
            const rayAngle = startAngle + rayStep * i
            const { distance, hitWall } = this.castRay(camera, map, rayAngle)
            
            // Сохраняем расстояние в Z-буфере
            zBuffer[i] = hitWall ? distance : Infinity
            
            if (hitWall) {
                // Вычисляем высоту стены с учетом эффекта "рыбий глаз"
                // Корректируем проекцию, чтобы избавиться от искажения "рыбий глаз"
                const correctedDistance = distance * Math.cos(rayAngle - camera.getRotation())
                const wallHeight = (height / correctedDistance) * this.WALL_HEIGHT
                const wallTop = (height - wallHeight) / 2
                const wallBottom = wallTop + wallHeight
                
                // Рисуем стену
                lareq.command.beginPath()
                lareq.command.moveTo({ x: (width * i) / this.RAY_COUNT, y: wallTop })
                lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallTop })
                lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallBottom })
                lareq.command.lineTo({ x: (width * i) / this.RAY_COUNT, y: wallBottom })
                lareq.command.closePath()
                lareq.command.fill()
            }
        }
        
        // Рендеринг спрайтов
        sprites.forEach(sprite => {
            // Позиция спрайта относительно камеры
            const relativePosition = new Vector3(
                sprite.position.x - camera.getPosition().x,
                sprite.position.y - camera.getPosition().y,
                sprite.position.z - camera.getPosition().z
            )
            
            // Проверяем, находится ли спрайт спереди камеры
            const rotatedPos = relativePosition.rotateY(-camera.getRotation())
            if (rotatedPos.z <= 0) return // Не рендерим спрайты позади камеры
            
            // Проецируем центр спрайта
            const projected = camera.projectPoint(sprite.position)
            
            // Вычисляем размер спрайта на экране
            const distance = Math.sqrt(
                relativePosition.x * relativePosition.x + 
                relativePosition.z * relativePosition.z
            )
            
            const spriteHeight = (height / distance) * this.WALL_HEIGHT * 1.5 // Немного больше, чем стены
            const spriteWidth = spriteHeight * 0.8 // Соотношение сторон для спрайта
            
            const spriteScreenX = width / 2 + projected.x * width / 2
            const spriteScreenY = height / 2 - projected.y * height / 2
            
            // Определяем видим ли спрайт (не загорожен ли стеной)
            const spriteLeftX = Math.max(0, Math.floor((spriteScreenX - spriteWidth / 2) * this.RAY_COUNT / width))
            const spriteRightX = Math.min(this.RAY_COUNT - 1, Math.floor((spriteScreenX + spriteWidth / 2) * this.RAY_COUNT / width))
            
            let isVisible = false
            for (let i = spriteLeftX; i <= spriteRightX; i++) {
                if (distance < zBuffer[i]) {
                    isVisible = true
                    break
                }
            }
            
            if (isVisible) {
                // Установка цвета для спрайта
                lareq.command.setCtx({
                    fillStyle: '#AA2200'
                })
                
                lareq.command.beginPath()
                lareq.command.moveTo({ x: spriteScreenX - spriteWidth / 2, y: spriteScreenY - spriteHeight / 2 })
                lareq.command.lineTo({ x: spriteScreenX + spriteWidth / 2, y: spriteScreenY - spriteHeight / 2 })
                lareq.command.lineTo({ x: spriteScreenX + spriteWidth / 2, y: spriteScreenY + spriteHeight / 2 })
                lareq.command.lineTo({ x: spriteScreenX - spriteWidth / 2, y: spriteScreenY + spriteHeight / 2 })
                lareq.command.closePath()
                lareq.command.fill()
            }
        })
        
        this.renderer.prepare(lareq.commands)
        this.renderer.render(lareq.commands)
    }
    
    private castRay(camera: Camera, map: Map, angle: number, maxDepth: number = 24): { distance: number, hitWall: boolean } {
        let ray = new Vector3(0, 0, 0)
        let distance = 0
        const step = 0.01 // Уменьшаем шаг для более точного определения столкновений
        
        while (distance < maxDepth) {
            ray = new Vector3(
                Math.sin(angle) * distance,
                0,
                Math.cos(angle) * distance
            )
            const worldPos = new Vector3(
                camera.getPosition().x + ray.x,
                camera.getPosition().y + ray.y,
                camera.getPosition().z + ray.z
            )
            
            if (map.isWall(Math.floor(worldPos.x), Math.floor(worldPos.z))) {
                return { distance, hitWall: true }
            }
            distance += step
        }
        return { distance: maxDepth, hitWall: false }
    }
} 