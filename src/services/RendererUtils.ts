import { Camera } from "./Camera"
import { Vector3 } from "./Vector3"
import { Map } from "./Map"
import { DoorAnimationService } from "./DoorAnimationService"
export class RendererUtils {
  private readonly MAX_DEPTH: number = 24 // Максимальная видимая дистанция
  
  public castRay(camera: Camera, map: Map, angle: number, doorAnimationService: DoorAnimationService): { 
    distance: number, hitWall: boolean
  } {
    let ray = new Vector3(0, 0, 0)
    let distance = 0
    const step = 0.01 // Уменьшаем шаг для более точного определения столкновений
    
    while (distance < this.MAX_DEPTH) {
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
        const coordX = Math.floor(worldPos.x)
        const coordZ = Math.floor(worldPos.z)
        
        if (map.isTransparentWall(coordX, coordZ)) {
            const doorOffset = doorAnimationService.getDoorOffset(coordX, coordZ)
            
            // Если дверь полностью открыта, луч проходит сквозь неё
            if (doorOffset >= 1) {
                distance += step
                continue
            }

            if (doorOffset === 0) {
              return { distance, hitWall: true }
            }
            
            // Если дверь частично открыта, проверяем, проходит ли луч через щель
            const xOffset = worldPos.x - coordX
            const zOffset = worldPos.z - coordZ
            
            // Определяем, с какой стороны мы подходим к двери
            const isHorizontalWall = Math.abs(xOffset) < doorOffset
            const isVerticalWall = Math.abs(zOffset) < doorOffset
            
            if (isHorizontalWall) {
                // Для горизонтальных стен проверяем смещение по X
                if (xOffset < doorOffset) {
                    // Луч проходит через щель
                    distance += step
                    continue
                }
            } else if (isVerticalWall) {
                // Для вертикальных стен проверяем смещение по Z
                if (zOffset < doorOffset) {
                    // Луч проходит через щель
                    distance += step
                    continue
                }
            }
            
            return { distance, hitWall: true }
        }
        
        if (map.isSolid(coordX, coordZ)) {
            return { distance, hitWall: true }
        }
        distance += step
    }
    return { distance: this.MAX_DEPTH, hitWall: false }
  }

  // Расчет яркости в зависимости от дистанции
  public calculateBrightness(distance: number): number {
    // Линейное затухание с расстоянием
    return Math.max(0.1, Math.min(1, 1 - (distance / this.MAX_DEPTH * 0.9)));
  }
  
  // Применение яркости к цвету в формате HEX
  public applyBrightness(hexColor: string, brightness: number): string {
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
  public getSpriteColor(texture: string): string {
      switch (texture) {
          case 'enemy': return '#BE2126'; // Красный для врагов
          case 'health': return '#2FBA3D'; // Зеленый для здоровья
          case 'ammo': return '#3D629A'; // Синий для боеприпасов
          case 'weapon': return '#D9A648'; // Желтый для оружия
          case 'key': return '#D355BA'; // Фиолетовый для ключей
          case 'door': return '#8B572A'; // Коричневый для дверей
          default: return '#B0B0B0'; // Серый для всего остального
      }
  }
}