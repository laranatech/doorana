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
        
        // Подготавливаем спрайты для рендеринга
        const preparedSprites = sprites.map(sprite => {
            // Получаем позицию спрайта относительно камеры
            const playerX = camera.getPosition().x;
            const playerY = camera.getPosition().z; // z в нашей системе это y в 2D
            const spriteX = sprite.position.x;
            const spriteY = sprite.position.z; // z в нашей системе это y в 2D
            
            // Вычисляем дистанцию до спрайта (по прямой)
            const dx = spriteX - playerX;
            const dy = spriteY - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            console.log(distance)
            
            // Преобразуем угол к спрайту относительно абсолютной системы координат
            let spriteAngle = Math.atan2(-dy, -dx); // Угол в абсолютной системе
            console.log('camera', camera.getRotation() * 180 / Math.PI)
            console.log('spriteAngle', spriteAngle * 180 / Math.PI)
            
            // Нормализуем угол относительно направления взгляда игрока
            // Необходимо учесть, что в нашей системе 0 градусов это направление по оси Z
            let relativeAngle = camera.getRotation() - spriteAngle;
            console.log('relativeAngle', relativeAngle * 180 / Math.PI)
            
            // Нормализуем угол в пределах от -Pi до Pi
            while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
            while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
            
            return {
                ...sprite,
                distance,
                angle: relativeAngle,
                visible: Math.abs(relativeAngle) < fov / 2 + 0.2 // Добавляем небольшой запас
            };
        }).filter(sprite => sprite.visible).sort((a, b) => b.distance - a.distance);
        
        // Рендерим спрайты от дальних к ближним
        preparedSprites.forEach(sprite => {
            // Размер спрайта пропорционален расстоянию
            const spriteSize = (height / sprite.distance) * this.WALL_HEIGHT * 1.5;
            const spriteWidth = spriteSize * 0.8;
            const spriteHeight = spriteSize;
            
            // Вычисляем экранную позицию спрайта
            // В DOOM позиция спрайта вычисляется на основе его углового положения
            // относительно поля зрения игрока
            const angleToFov = sprite.angle / fov; // отношение угла к полю зрения
            const spriteX = width * (0.5 - angleToFov);
            const spriteY = height / 2; // Всегда центрируем по вертикали
            
            // Определяем колонки экрана, которые занимает спрайт
            const leftCol = Math.max(0, Math.floor((spriteX - spriteWidth / 2) * this.RAY_COUNT / width));
            const rightCol = Math.min(this.RAY_COUNT - 1, Math.floor((spriteX + spriteWidth / 2) * this.RAY_COUNT / width));
            
            // Проверяем, не загорожен ли спрайт стенами
            let visibleColumns = 0;
            for (let i = leftCol; i <= rightCol; i++) {
                if (sprite.distance < zBuffer[i]) {
                    visibleColumns++;
                }
            }
            
            // Если видно менее 3 колонок, не рисуем спрайт
            if (visibleColumns < 3) return;
            
            // Рисуем спрайт
            lareq.command.setCtx({
                fillStyle: this.getSpriteColor(sprite.texture)
            });
            
            lareq.command.beginPath();
            lareq.command.moveTo({ x: spriteX - spriteWidth / 2, y: spriteY - spriteHeight / 2 });
            lareq.command.lineTo({ x: spriteX + spriteWidth / 2, y: spriteY - spriteHeight / 2 });
            lareq.command.lineTo({ x: spriteX + spriteWidth / 2, y: spriteY + spriteHeight / 2 });
            lareq.command.lineTo({ x: spriteX - spriteWidth / 2, y: spriteY + spriteHeight / 2 });
            lareq.command.closePath();
            lareq.command.fill();
        });
        
        this.renderer.prepare(lareq.commands);
        this.renderer.render(lareq.commands);
    }
    
    // Выбираем цвет для спрайта в зависимости от его типа
    private getSpriteColor(texture: string): string {
        switch (texture) {
            case 'enemy': return '#AA2200'; // Красный для врагов
            case 'health': return '#00AA00'; // Зеленый для здоровья
            case 'ammo': return '#0000AA'; // Синий для боеприпасов
            case 'weapon': return '#AAAA00'; // Желтый для оружия
            case 'key': return '#AA00AA'; // Фиолетовый для ключей
            default: return '#AAAAAA'; // Серый для всего остального
        }
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