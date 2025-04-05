import { Camera } from "./Camera"
import { Vector3 } from "./Vector3"
import { Map } from "./Map"
export class RendererUtils {
  private readonly MAX_DEPTH: number = 24 // Максимальная видимая дистанция
  
  public castRay(camera: Camera, map: Map, angle: number, baseDepth: number = 0,maxDepth: number = this.MAX_DEPTH): { 
    distance: number, hitWall: boolean, transparent?: boolean, depth?: number 
  } {
    let ray = new Vector3(0, 0, 0)
    let distance = baseDepth
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
        if (map.isTransparentWall(Math.floor(worldPos.x), Math.floor(worldPos.z))) {
            return { distance, hitWall: false }
        }
        
        if (map.isSolid(Math.floor(worldPos.x), Math.floor(worldPos.z))) {
          return { distance, hitWall: true }
        }
        distance += step
    }
    return { distance: maxDepth, hitWall: false }
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