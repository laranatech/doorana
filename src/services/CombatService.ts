import { Vector3 } from './Vector3'
import { SpriteManager } from './SpriteManager'

interface Enemy {
    position: Vector3;
    health: number;
    isDead: boolean;
}

export class CombatService {
    private enemies: Map<string, Enemy> = new Map();
    private readonly BULLET_DAMAGE = 25;
    private readonly BULLET_RANGE = 10;
    private readonly ENEMY_HEALTH = 100;

    constructor(private spriteManager: SpriteManager) {}

    // Добавляем врага
    addEnemy(position: Vector3) {
        const key = `${position.x},${position.z}`;
        this.enemies.set(key, {
            position,
            health: this.ENEMY_HEALTH,
            isDead: false
        });
    }

    // Обработка выстрела
    shoot(playerPosition: Vector3, playerAngle: number): boolean {
        let hitEnemy = false;
        
        // Проверяем каждого врага на попадание
        for (const [key, enemy] of this.enemies) {
            if (enemy.isDead) continue;

            // Вычисляем вектор от игрока к врагу
            const dx = enemy.position.x - playerPosition.x;
            const dz = enemy.position.z - playerPosition.z;
            
            // Вычисляем угол между направлением выстрела и направлением к врагу
            const angleToEnemy = Math.atan2(dx, dz);
            const angleDiff = Math.abs(angleToEnemy - playerAngle);
            
            // Проверяем, находится ли враг в пределах угла выстрела и дальности
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance <= this.BULLET_RANGE && angleDiff < 0.1) {
                // Наносим урон врагу
                enemy.health -= this.BULLET_DAMAGE;
                hitEnemy = true;
                
                // Проверяем, убит ли враг
                if (enemy.health <= 0) {
                    console.log('hitEnemy', enemy)
                    enemy.isDead = true;
                    // Удаляем спрайт врага
                    this.spriteManager.removeSprite({
                        position: enemy.position,
                        texture: 'enemy',
                        type: 'enemy'
                    });
                }
            }
        }
        
        return hitEnemy;
    }

    // Получаем состояние врага
    getEnemy(x: number, z: number): Enemy | undefined {
        const key = `${x},${z}`;
        return this.enemies.get(key);
    }

    // Проверяем, жив ли враг
    isEnemyAlive(x: number, z: number): boolean {
        const enemy = this.getEnemy(x, z);
        return enemy ? !enemy.isDead : false;
    }
} 