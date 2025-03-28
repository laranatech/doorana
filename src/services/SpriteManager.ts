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
    findSpriteNear(position: Vector3, maxDistance: number = 1): Sprite | null {
        let closestSprite: Sprite | null = null;
        let minDistance = maxDistance;
        
        for (const sprite of this.sprites) {
            const distance = Math.sqrt(
                Math.pow(sprite.position.x - position.x, 2) +
                Math.pow(sprite.position.z - position.z, 2)
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
} 