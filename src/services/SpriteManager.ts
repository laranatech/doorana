import { Vector3 } from './Vector3';

export interface Sprite {
    position: Vector3;
    texture: string;
    type: 'enemy' | 'item' | 'decoration';
}

export class SpriteManager {
    private sprites: Sprite[] = [];
    
    constructor() {
        // Инициализация пустого списка спрайтов
    }
    
    // Добавить спрайт
    addSprite(sprite: Sprite): void {
        this.sprites.push(sprite);
    }
    
    // Получить все спрайты
    getSprites(): Sprite[] {
        return this.sprites;
    }
    
    // Найти спрайт рядом с позицией
    findSpriteNear(position: Vector3, maxDistance: number = 1, type: 'enemy' | 'item' | 'decoration' | null = null): Sprite | null {
        let closestSprite: Sprite | null = null;
        let minDistance = maxDistance;
        
        for (const sprite of this.sprites) {
            if (type && sprite.type !== type) {
                continue;
            }

            const distance = Math.sqrt(
                Math.pow(sprite.position.x + 0.5 - position.x, 2) +
                Math.pow(sprite.position.z + 0.5 - position.z, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestSprite = sprite;
            }
        }
        
        return closestSprite;
    }
    
    // Удалить спрайт
    removeSprite(sprite: Sprite): void {
        const index = this.sprites.indexOf(sprite);
        if (index !== -1) {
            this.sprites.splice(index, 1);
        }
    }
    
    // Удалить спрайт по позиции
    removeSpriteAt(position: Vector3, threshold: number = 0.5): boolean {
        const sprite = this.findSpriteNear(position, threshold);
        if (sprite) {
            this.removeSprite(sprite);
            return true;
        }
        return false;
    }

  static getSpriteColor(texture: string): string {
    switch (texture) {
      case 'enemy': return '#BE2126'; // Красный для врагов
      case 'health': return '#2FBA3D'; // Зеленый для здоровья
      case 'ammo': return '#3D629A'; // Синий для боеприпасов
      case 'weapon': return '#FFA500'; // Оранжевый для оружия
      case 'key': return '#D9A648'; // Фиолетовый для ключей
      case 'door': return '#8B572A'; // Коричневый для дверей
      default: return '#B0B0B0'; // Серый для всего остального
    }
  }

  // [height, width, Y-offset]
  static getSpriteSize(texture: string): [number, number, number] {
    switch (texture) {
      case 'enemy': return [0.9, 0.4, 0.1];
      case 'health': return [0.3, 0.3, 0.2];
      case 'ammo': return [0.3, 0.3, 0.2];
      case 'weapon': return [0.3, 0.6, 0.2];
      case 'key': return [0.2, 0.4, 0.2];
      case 'door': return [1, 1, 0];
      default: return [0.5, 0.5, 0.1];
    }
  }
} 