import { CanvasRenderer } from '@laranatech/colorana'
import { RenderCommand, RenderQueue } from '@laranatech/lareq'
import { Camera } from './Camera'
import { Vector3 } from './Vector3'
import { Map } from './Map'
import { RendererUtils } from './RendererUtils'
import { RendererDoomPanel } from './RendererDoomPanel'
import { DoorAnimationService } from './DoorAnimationService'

interface PreparedSprite {
    position: Vector3;
    texture: string;
    distance: number;
    correctedDistance: number;
    angle: number;
    rotatedX: number;
    rotatedZ: number;
    visible: boolean;
}

const invisibleSprite: PreparedSprite = {
    position: new Vector3(0, 0, 0),
    texture: '',
    distance: 0,
    correctedDistance: 0,
    angle: 0,
    rotatedX: 0,
    rotatedZ: 0,
    visible: false
}

export class Renderer {
    private renderer: CanvasRenderer
    private readonly RAY_COUNT: number
    private readonly WALL_HEIGHT: number
    private debugEnabled: boolean = false // Флаг для включения/выключения отладки
    private utils: RendererUtils = new RendererUtils()
    private doomPanel: RendererDoomPanel = new RendererDoomPanel()
    private doorAnimationService: DoorAnimationService

    constructor(renderer: CanvasRenderer, rayCount: number = 480, wallHeight: number = 1, doorAnimationService: DoorAnimationService) {
        this.renderer = renderer
        this.RAY_COUNT = rayCount
        this.WALL_HEIGHT = wallHeight
        this.doorAnimationService = doorAnimationService
    }
    
    // Включить/выключить отладочный режим
    toggleDebug(enabled: boolean = true) {
        this.debugEnabled = enabled;
    }
    
    // Функция для вывода отладочной информации
    private debug(...args: any[]) {
        if (this.debugEnabled) {
            console.log('[Renderer Debug]', ...args);
        }
    }
    
    render(camera: Camera, map: Map, sprites: {position: Vector3, texture: string}[] = [], message: string = '', playerHealth: number = 100, ammo: number = 50) {
        const lareq = new RenderQueue()
        const width = this.renderer.canvas!.width
        const height = this.renderer.canvas!.height
        
        // Очищаем экран
        lareq.command.clearRect({ x: 0, y: 0, w: width, h: height })
        
        // Определим высоту нижней панели
        const panelHeight = 60;
        const viewportHeight = height - panelHeight;

        this.renderFloor(lareq, width, height, panelHeight)
        this.renderCeiling(lareq, width, height, panelHeight)
        
        // Массив для хранения расстояний до стен для каждого луча
        // Нам это понадобится для правильного рендеринга спрайтов
        const zBuffer: number[] = new Array(this.RAY_COUNT).fill(Infinity)
        
        this.renderWalls(lareq, width, viewportHeight, camera, map, zBuffer)

        this.renderSprites(lareq, width, viewportHeight, sprites, camera, zBuffer)
        
        // Отображаем сообщение, если оно есть
        if (message) {
            this.renderMessage(lareq, width, viewportHeight, message)
        }
        
        // Рисуем нижнюю панель в стиле DOOM
        this.doomPanel.drawDoomPanel(lareq, width, height, viewportHeight, playerHealth, ammo);
        
        this.renderer.prepare(lareq.commands);
        this.renderer.render(lareq.commands);
    }

    renderWalls(lareq: RenderQueue, width: number, height: number, camera: Camera, map: Map, zBuffer: number[]) {
        const fov = Math.PI / 3
        const rayStep = fov / this.RAY_COUNT
        const startAngle = camera.getRotation() - fov / 2
        
        for (let i = 0; i < this.RAY_COUNT; i++) {
            const rayAngle = startAngle + rayStep * i
            const { distance, hitWall } = this.utils.castRay(camera, map, rayAngle, this.doorAnimationService)
            
            if (!hitWall) continue;
            zBuffer[i] = hitWall ? distance : Infinity
            
            const correctedDistance = distance * Math.cos(rayAngle - camera.getRotation())
            const wallHeight = (height / correctedDistance) * this.WALL_HEIGHT
            const wallTop = (height - wallHeight) / 2
            const wallBottom = wallTop + wallHeight
            
            const brightness = this.utils.calculateBrightness(correctedDistance)
            
            const worldPosX = camera.getPosition().x + Math.sin(rayAngle) * distance
            const worldPosZ = camera.getPosition().z + Math.cos(rayAngle) * distance
            const xOffset = worldPosX - Math.floor(worldPosX)
            const zOffset = worldPosZ - Math.floor(worldPosZ)
            
            const wallType = map.getWallType(Math.floor(worldPosX), Math.floor(worldPosZ))
            
            let wallSide = ''
            const EPSILON = 0.01
            
            if (xOffset < EPSILON) wallSide = 'west'
            else if (xOffset > 1 - EPSILON) wallSide = 'east'
            else if (zOffset < EPSILON) wallSide = 'north'
            else if (zOffset > 1 - EPSILON) wallSide = 'south'
            
            let baseWallColor
            
            if (wallType === 'D' || wallType === 'L') {
                const doorOffset = this.doorAnimationService.getDoorOffset(
                    Math.floor(worldPosX),
                    Math.floor(worldPosZ)
                )
                
                if (doorOffset < 1) {
                    if (wallType === 'D') {
                        baseWallColor = '#A0522D'
                    } else {
                        baseWallColor = '#8B4513'
                    }
                    
                    const wallColor = this.utils.applyBrightness(baseWallColor, brightness)
                    
                    lareq.command.setCtx({
                        fillStyle: wallColor
                    })
                    lareq.command.beginPath()
                    lareq.command.moveTo({ x: (width * i) / this.RAY_COUNT, y: wallTop })
                    lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallTop })
                    lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallBottom })
                    lareq.command.lineTo({ x: (width * i) / this.RAY_COUNT, y: wallBottom })
                    lareq.command.closePath()
                    lareq.command.fill()
                    continue
                }
            }
            
            // Выбираем цвет стены в зависимости от стороны света и типа стены
            let wallColor;
            
            if (wallType === 'D') { // Обычная дверь
                baseWallColor = '#A0522D'; // Коричневый для дверей
            } else if (wallType === 'L') { // Запертая дверь
                baseWallColor = '#8B4513'; // Темно-коричневый для запертых дверей
            } else { // Обычная стена
                switch(wallSide) {
                    case 'north': baseWallColor = '#7F6A4C'; break; // Коричневатый для северных стен
                    case 'south': baseWallColor = '#736048'; break; // Чуть темнее для южных стен
                    case 'east': baseWallColor = '#8A7254'; break;  // Светлее для восточных стен
                    case 'west': baseWallColor = '#6A5A40'; break;  // Темнее для западных стен
                    default: baseWallColor = '#7A6852'; break;      // Стандартный цвет стен DOOM
                }
            }
            
            wallColor = this.utils.applyBrightness(baseWallColor, brightness);
            
            // Рисуем стену
            lareq.command.setCtx({
                fillStyle: wallColor
            })
            lareq.command.beginPath()
            lareq.command.moveTo({ x: (width * i) / this.RAY_COUNT, y: wallTop })
            lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallTop })
            lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallBottom })
            lareq.command.lineTo({ x: (width * i) / this.RAY_COUNT, y: wallBottom })
            lareq.command.closePath()
            lareq.command.fill()
        }
    }

    renderFloor(lareq: RenderQueue, width: number, height: number, panelHeight: number) {
        const viewportHeight = height - panelHeight;
        
        // Рисуем пол с градиентным эффектом (имитация)
        lareq.command.setCtx({
            fillStyle: '#4A4A4A' // Обновлённый тёмно-серый цвет пола в стиле DOOM
        })
        
        // Добавляем эффект градиента к полу с помощью прямоугольников разного оттенка
        const floorGradientSteps = 8;
        for (let i = 0; i < floorGradientSteps; i++) {
            const t = i / floorGradientSteps;
            const yStart = viewportHeight/2 + t * (viewportHeight/2);
            const yEnd = viewportHeight/2 + (t + 1/floorGradientSteps) * (viewportHeight/2);
            const brightness = 1 * (t + 0.4);
            const floorColor = this.utils.applyBrightness('#4A4A4A', brightness);
            
            lareq.command.setCtx({
                fillStyle: floorColor
            })
            lareq.command.beginPath()
            lareq.command.moveTo({ x: 0, y: yStart })
            lareq.command.lineTo({ x: width, y: yStart })
            lareq.command.lineTo({ x: width, y: yEnd })
            lareq.command.lineTo({ x: 0, y: yEnd })
            lareq.command.closePath()
            lareq.command.fill()
        }
    }

    renderCeiling(lareq: RenderQueue, width: number, height: number, panelHeight: number) {
        const viewportHeight = height - panelHeight;
        
        // Рисуем потолок с градиентом
        lareq.command.setCtx({
            fillStyle: '#222222' // Обновлённый тёмный цвет потолка в стиле DOOM
        })
        
        // Добавляем эффект градиента к потолку с помощью прямоугольников разного оттенка
        const ceilingGradientSteps = 8;
        for (let i = 0; i < ceilingGradientSteps; i++) {
            const t = i / ceilingGradientSteps;
            const yStart = t * (viewportHeight/2);
            const yEnd = (t + 1/ceilingGradientSteps) * (viewportHeight/2);
            const brightness = 1 - 0.7 * t;
            const ceilingColor = this.utils.applyBrightness('#222222', brightness);
            
            lareq.command.setCtx({
                fillStyle: ceilingColor
            })
            lareq.command.beginPath()
            lareq.command.moveTo({ x: 0, y: yStart })
            lareq.command.lineTo({ x: width, y: yStart })
            lareq.command.lineTo({ x: width, y: yEnd })
            lareq.command.lineTo({ x: 0, y: yEnd })
            lareq.command.closePath()
            lareq.command.fill()
        }
    }

    renderMessage(lareq: RenderQueue, width: number, height: number, message: string) {
        const messageX = width / 2;
        const messageY = height - 50; // Внизу экрана с отступом
        
        lareq.command.setCtx({
            font: '30px Arial',
            fillStyle: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle'
        });
        
        lareq.command.fillText({
            text: message,
            x: messageX,
            y: messageY,
            maxWidth: width * 0.8 // Максимальная ширина текста
        });
    }

    renderSprites(lareq: RenderQueue, width: number, height: number, sprites: {position: Vector3, texture: string}[], camera: Camera, zBuffer: number[]) {
        // Координаты игрока и спрайта в мировом пространстве
        const playerPos = camera.getPosition();
        const playerAngle = camera.getRotation();
        const cosAngle = Math.cos(playerAngle);
        const sinAngle = Math.sin(playerAngle);
        const fov = Math.PI / 3;
        
        // Подготавливаем спрайты для рендеринга
        const preparedSprites = sprites.map(sprite => {
            const dx = sprite.position.x + 0.5 - playerPos.x;
            const dz = sprite.position.z + 0.5 - playerPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= 0.2) {
                return invisibleSprite;
            }
            
            const rotatedX = dx * cosAngle - dz * sinAngle;
            const rotatedZ = dx * sinAngle + dz * cosAngle;
            
            // Вычисляем угол до спрайта в мировом пространстве
            // Math.atan2 даёт угол от отрицательной оси Y по часовой стрелке
            // в нашей системе координат ось Z вперед, X вправо
            let spriteAngle = Math.atan2(dx, dz);
            
            let relativeAngle = spriteAngle - playerAngle;
            
            while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
            while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
            
            this.debug(`Sprite angle: ${spriteAngle}, Relative angle: ${relativeAngle}`);
            this.debug(`Rotated coordinates: (${rotatedX}, ${rotatedZ})`);
            
            // Проверяем, находится ли спрайт перед игроком
            if (rotatedZ <= 0) {
                return invisibleSprite;
            }

            if (Math.abs(relativeAngle) > fov / 2 + 0.2) {
                return invisibleSprite;
            }
            
            return {
                ...sprite,
                distance,
                correctedDistance: distance * Math.cos(relativeAngle), // Корректируем расстояние как для стен
                angle: relativeAngle,
                rotatedX,
                rotatedZ,
                // Спрайт видим, если он в поле зрения с небольшим запасом
                visible: true
            } as PreparedSprite;
        }).filter(sprite => sprite.visible).sort((a, b) => b.distance - a.distance);
        
        // Рендерим спрайты от дальних к ближним
        preparedSprites.forEach(sprite => {
            // Размер спрайта пропорционален расстоянию
            const spriteSize = (height / sprite.distance) * this.WALL_HEIGHT * 1;
            const spriteWidth = spriteSize * 0.3;
            const spriteHeight = spriteSize;
            
            // Вычисляем экранную позицию спрайта используя повернутые координаты
            // Преобразуем трехмерные координаты в экранные координаты
            // RotatedX определяет горизонтальное смещение от центра экрана
            // RotatedZ определяет глубину, которая влияет на масштаб
            
            // Проекция X в экранные координаты
            // Используем функцию проекции: screen_x = (width/2) * (1 + rotatedX / (rotatedZ * tan(fov/2)))
            const halfFov = fov / 2;
            const spriteX = width / 2 * (1 + sprite.rotatedX / (sprite.rotatedZ * Math.tan(halfFov)));
            const spriteY = height / 2; // Всегда центрируем по вертикали
            
            // Отладочная информация о позиции спрайта на экране
            this.debug(`Sprite screen position: x=${spriteX}, y=${spriteY}, width=${spriteWidth}, height=${spriteHeight}`);
            
            // Определяем колонки экрана, которые занимает спрайт
            const leftCol = Math.max(0, Math.floor((spriteX - spriteWidth / 2) * this.RAY_COUNT / width));
            const rightCol = Math.min(this.RAY_COUNT - 1, Math.floor((spriteX + spriteWidth / 2) * this.RAY_COUNT / width));
            
            // Проверяем, видим ли спрайт хотя бы частично
            let visibleColumns = 0;
            for (let i = leftCol; i <= rightCol; i++) {
                if (sprite.distance < zBuffer[i]) {
                    visibleColumns++;
                }
            }
            
            // Если спрайт полностью скрыт, не рисуем его
            if (visibleColumns === 0) return;
            
            // Применяем эффект тумана/затемнения к спрайту
            const brightness = this.utils.calculateBrightness(sprite.correctedDistance);
            const spriteColor = this.utils.applyBrightness(this.utils.getSpriteColor(sprite.texture), brightness);
            
            // Устанавливаем цвет для спрайта с учетом расстояния
            lareq.command.setCtx({
                fillStyle: spriteColor
            });
            
            // Рисуем спрайт по вертикальным колонкам с учетом z-буфера
            // Определяем ширину одной колонки спрайта в пикселях
            const columnWidth = width / this.RAY_COUNT;
            
            // Проходим по всем колонкам спрайта
            for (let col = leftCol; col <= rightCol; col++) {
                // Проверяем, видима ли эта колонка (не загорожена ли стеной)
                if (sprite.distance >= zBuffer[col]) continue;
                
                // Вычисляем позицию колонки на экране
                const colX = (col * width) / this.RAY_COUNT;
                
                // Рисуем только эту колонку спрайта
                lareq.command.beginPath();
                lareq.command.moveTo({ x: colX, y: spriteY - spriteHeight / 2 });
                lareq.command.lineTo({ x: colX + columnWidth, y: spriteY - spriteHeight / 2 });
                lareq.command.lineTo({ x: colX + columnWidth, y: spriteY + spriteHeight / 2 });
                lareq.command.lineTo({ x: colX, y: spriteY + spriteHeight / 2 });
                lareq.command.closePath();
                lareq.command.fill();
            }
        });
    }
} 
