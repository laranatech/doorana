import { CanvasRenderer } from '@laranatech/colorana'
import { RenderCommand, RenderQueue } from '@laranatech/lareq'
import { Camera } from './Camera'
import { Vector3 } from './Vector3'
import { Map } from './Map'

export class Renderer {
    private renderer: CanvasRenderer
    private readonly RAY_COUNT: number
    private readonly WALL_HEIGHT: number
    private readonly MAX_DEPTH: number = 24 // Максимальная видимая дистанция
    
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
        
        // Рисуем пол с градиентным эффектом (имитация)
        lareq.command.setCtx({
            fillStyle: '#686868'
        })
        lareq.command.beginPath()
        lareq.command.moveTo({ x: 0, y: height/2 })
        lareq.command.lineTo({ x: width, y: height/2 })
        lareq.command.lineTo({ x: width, y: height })
        lareq.command.lineTo({ x: 0, y: height })
        lareq.command.closePath()
        lareq.command.fill()
        
        // Добавляем эффект градиента к полу с помощью прямоугольников разного оттенка
        const floorGradientSteps = 8;
        for (let i = 0; i < floorGradientSteps; i++) {
            const t = i / floorGradientSteps;
            const yStart = height/2 + t * (height/2);
            const yEnd = height/2 + (t + 1/floorGradientSteps) * (height/2);
            const brightness = 1 - t;
            const floorColor = this.applyBrightness('#686868', brightness);
            
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
        
        // Рисуем потолок с градиентом
        lareq.command.setCtx({
            fillStyle: '#414141'
        })
        lareq.command.beginPath()
        lareq.command.moveTo({ x: 0, y: 0 })
        lareq.command.lineTo({ x: width, y: 0 })
        lareq.command.lineTo({ x: width, y: height/2 })
        lareq.command.lineTo({ x: 0, y: height/2 })
        lareq.command.closePath()
        lareq.command.fill()
        
        // Добавляем эффект градиента к потолку с помощью прямоугольников разного оттенка
        const ceilingGradientSteps = 8;
        for (let i = 0; i < ceilingGradientSteps; i++) {
            const t = i / ceilingGradientSteps;
            const yStart = t * (height/2);
            const yEnd = (t + 1/ceilingGradientSteps) * (height/2);
            const brightness = 0.6 + 0.4 * t;
            const ceilingColor = this.applyBrightness('#414141', brightness);
            
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
        
        // Массив для хранения расстояний до стен для каждого луча
        // Нам это понадобится для правильного рендеринга спрайтов
        const zBuffer: number[] = new Array(this.RAY_COUNT).fill(Infinity)
        
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
                
                // Применяем эффект тумана/затемнения с расстоянием
                const brightness = this.calculateBrightness(correctedDistance);
                
                // Добавляем псевдотекстуру стены с помощью эффекта смены оттенков
                // в зависимости от позиции на стене
                let wallColor;
                
                // Меняем цвет в зависимости от четности клетки для создания эффекта кирпичей
                const worldPosX = camera.getPosition().x + Math.sin(rayAngle) * distance;
                const worldPosZ = camera.getPosition().z + Math.cos(rayAngle) * distance;
                const xOffset = worldPosX - Math.floor(worldPosX);
                const zOffset = worldPosZ - Math.floor(worldPosZ);
                
                // Определяем, по какой стороне клетки был удар (север, юг, восток, запад)
                let wallSide = '';
                const EPSILON = 0.01;
                
                if (xOffset < EPSILON) wallSide = 'west';
                else if (xOffset > 1 - EPSILON) wallSide = 'east';
                else if (zOffset < EPSILON) wallSide = 'north';
                else if (zOffset > 1 - EPSILON) wallSide = 'south';
                
                wallColor = this.applyBrightness('#333333', brightness);
                
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
                
                // // Добавляем эффект швов между кирпичами
                // if (Math.floor(wallTop + i % 15) % 5 === 0) {
                //     lareq.command.setCtx({
                //         fillStyle: this.applyBrightness('#222222', brightness * 0.6)
                //     })
                //     lareq.command.beginPath()
                //     lareq.command.moveTo({ x: (width * i) / this.RAY_COUNT, y: wallTop })
                //     lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallTop })
                //     lareq.command.lineTo({ x: (width * (i + 1)) / this.RAY_COUNT, y: wallBottom })
                //     lareq.command.lineTo({ x: (width * i) / this.RAY_COUNT, y: wallBottom })
                //     lareq.command.closePath()
                //     lareq.command.fill()
                // }
            }
        }

        // Координаты игрока и спрайта в мировом пространстве
        const playerPos = camera.getPosition();
        const playerAngle = camera.getRotation();
        
        // Подготавливаем спрайты для рендеринга
        const preparedSprites = sprites.map(sprite => {
            // Вычисляем вектор от игрока к спрайту в мировом пространстве
            const dx = sprite.position.x - playerPos.x;
            const dz = sprite.position.z - playerPos.z;
            
            // Расстояние до спрайта
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Вычисляем угол до спрайта в мировом пространстве
            // Math.atan2 даёт угол от отрицательной оси Y по часовой стрелке
            // в нашей системе координат ось Z вперед, X вправо
            let spriteAngle = Math.atan2(dx, dz);
            
            // Вычисляем относительный угол (спрайт относительно камеры)
            let relativeAngle = spriteAngle - playerAngle;
            
            // Нормализуем угол в диапазоне [-π, π]
            while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;
            while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
            
            // Проверка, не находится ли спрайт сзади или слишком близко
            if (dz <= 0.1) {
                return {
                    ...sprite,
                    distance,
                    correctedDistance: Infinity,
                    angle: relativeAngle,
                    visible: false
                };
            }
            
            return {
                ...sprite,
                distance,
                correctedDistance: distance * Math.cos(relativeAngle), // Корректируем расстояние как для стен
                angle: relativeAngle,
                // Спрайт видим, если он в поле зрения с небольшим запасом
                visible: Math.abs(relativeAngle) < fov / 2 + 0.2
            };
        }).filter(sprite => sprite.visible).sort((a, b) => b.distance - a.distance);
        
        // Рендерим спрайты от дальних к ближним
        preparedSprites.forEach(sprite => {
            // Размер спрайта пропорционален расстоянию
            const spriteSize = (height / sprite.distance) * this.WALL_HEIGHT * 1;
            const spriteWidth = spriteSize * 0.3;
            const spriteHeight = spriteSize;
            
            // Вычисляем экранную позицию спрайта
            // Используем корректное вычисление аспектного отношения с учетом FOV
            const angleToFov = sprite.angle / fov;
            const spriteX = width * (0.5 - angleToFov);
            const spriteY = height / 2; // Всегда центрируем по вертикали
            
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
            const brightness = this.calculateBrightness(sprite.correctedDistance);
            const spriteColor = this.applyBrightness(this.getSpriteColor(sprite.texture), brightness);
            
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
        
        this.renderer.prepare(lareq.commands);
        this.renderer.render(lareq.commands);
    }
    
    // Расчет яркости в зависимости от дистанции
    private calculateBrightness(distance: number): number {
        // Линейное затухание с расстоянием
        return Math.max(0.1, Math.min(1, 1 - (distance / this.MAX_DEPTH * 0.9)));
    }
    
    // Применение яркости к цвету в формате HEX
    private applyBrightness(hexColor: string, brightness: number): string {
        // Преобразуем цвет из HEX в RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Затемняем цвет в зависимости от расстояния
        const darkenedR = Math.floor(r * brightness);
        const darkenedG = Math.floor(g * brightness);
        const darkenedB = Math.floor(b * brightness);
        
        // Преобразуем обратно в HEX
        return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
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