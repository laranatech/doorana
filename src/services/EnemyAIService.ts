import { Vector3 } from './Vector3'
import { Map as GameMap } from './Map'
import { CollisionService } from './CollisionService'
import { CombatService } from './CombatService'
import { SpriteManager, Sprite } from './SpriteManager'

interface EnemyState {
    sprite: Sprite;
    position: Vector3;
    targetPosition: Vector3 | null;
    state: 'idle' | 'chasing' | 'attacking';
    lastSeenPlayerTime: number;
    health: number;
    isDead: boolean;
}

export class EnemyAIService {
    private enemies: Map<string, EnemyState> = new Map();
    private readonly VISION_RANGE = 10; // Дальность видимости врага
    private readonly ATTACK_RANGE = 1.5; // Дистанция атаки
    private readonly MOVE_SPEED = 0.05; // Скорость движения врага
    private readonly FORGET_TIME = 5000; // Время, через которое враг забывает о игроке (мс)
    private readonly PATROL_RADIUS = 3; // Радиус патрулирования
    private readonly ATTACK_DAMAGE = 10; // Урон от атаки врага
    private readonly ATTACK_COOLDOWN = 1000; // Время между атаками (мс)
    private lastAttackTime: number = 0;

    constructor(
        private map: GameMap,
        private collisionService: CollisionService,
        private combatService: CombatService,
        private spriteManager: SpriteManager
    ) {}

    // Добавляем врага
    addEnemy(enemy: Sprite) {
        const key = `${enemy.position.x},${enemy.position.z}`;
        this.enemies.set(key, {
            sprite: enemy,
            position: enemy.position,
            targetPosition: null,
            state: 'idle',
            lastSeenPlayerTime: 0,
            health: 100,
            isDead: false
        });
    }

    // Обновляем состояние всех врагов
    update(deltaTime: number, playerPosition: Vector3) {
        for (const [key, enemy] of this.enemies) {
            if (enemy.isDead) continue;

            // Проверяем видимость игрока
            const canSeePlayer = this.canSeePlayer(enemy.position, playerPosition);
            
            if (canSeePlayer) {
                enemy.lastSeenPlayerTime = Date.now();
                enemy.state = 'chasing';
                enemy.targetPosition = playerPosition;
            } else if (enemy.state === 'chasing' && Date.now() - enemy.lastSeenPlayerTime > this.FORGET_TIME) {
                // Если враг долго не видел игрока, возвращаемся к патрулированию
                enemy.state = 'idle';
                enemy.targetPosition = null;
            }

            // Обновляем позицию в зависимости от состояния
            switch (enemy.state) {
                case 'idle':
                    this.updateIdleState(enemy, deltaTime);
                    break;
                case 'chasing':
                    this.updateChasingState(enemy, playerPosition, deltaTime);
                    break;
                case 'attacking':
                    this.updateAttackingState(enemy, playerPosition, deltaTime);
                    break;
            }

            // Обновляем позицию спрайта
            this.updateEnemySprite(key, enemy);
        }
    }

    // Проверяем, видит ли враг игрока
    private canSeePlayer(enemyPos: Vector3, playerPos: Vector3): boolean {
        const distance = Math.sqrt(
            Math.pow(enemyPos.x - playerPos.x, 2) +
            Math.pow(enemyPos.z - playerPos.z, 2)
        );

        if (distance > this.VISION_RANGE) return false;

        // Проверяем, нет ли стен между врагом и игроком
        const dx = playerPos.x - enemyPos.x;
        const dz = playerPos.z - enemyPos.z;
        const angle = Math.atan2(dx, dz);
        
        // Используем рейкастинг для проверки видимости
        let currentPos = new Vector3(enemyPos.x, 0, enemyPos.z);
        const step = 0.1;
        const steps = Math.floor(distance / step);

        for (let i = 0; i < steps; i++) {
            currentPos = new Vector3(
                currentPos.x + Math.sin(angle) * step,
                0,
                currentPos.z + Math.cos(angle) * step
            );

            if (this.map.isSolid(Math.floor(currentPos.x), Math.floor(currentPos.z))) {
                return false;
            }
        }

        return true;
    }

    // Обновление состояния патрулирования
    private updateIdleState(enemy: EnemyState, deltaTime: number) {
        if (!enemy.targetPosition) {
            // Выбираем новую случайную точку для патрулирования
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.PATROL_RADIUS;
            enemy.targetPosition = new Vector3(
                enemy.position.x + Math.sin(angle) * distance,
                0,
                enemy.position.z + Math.cos(angle) * distance
            );
        }

        this.moveTowardsTarget(enemy, deltaTime);
    }

    // Обновление состояния преследования
    private updateChasingState(enemy: EnemyState, playerPos: Vector3, deltaTime: number) {
        const distance = Math.sqrt(
            Math.pow(enemy.position.x - playerPos.x, 2) +
            Math.pow(enemy.position.z - playerPos.z, 2)
        );

        if (distance <= this.ATTACK_RANGE) {
            enemy.state = 'attacking';
        } else {
            enemy.targetPosition = playerPos;
            this.moveTowardsTarget(enemy, deltaTime);
        }
    }

    // Обновление состояния атаки
    private updateAttackingState(enemy: EnemyState, playerPos: Vector3, deltaTime: number) {
        const distance = Math.sqrt(
            Math.pow(enemy.position.x - playerPos.x, 2) +
            Math.pow(enemy.position.z - playerPos.z, 2)
        );

        if (distance > this.ATTACK_RANGE) {
            enemy.state = 'chasing';
        } else {
            // Проверяем, можно ли атаковать
            const currentTime = Date.now();
            if (currentTime - this.lastAttackTime >= this.ATTACK_COOLDOWN) {
                this.attackPlayer(enemy, playerPos);
                this.lastAttackTime = currentTime;
            }
        }
    }

    // Атака игрока
    private attackPlayer(enemy: EnemyState, playerPos: Vector3) {
        // Проверяем, видит ли враг игрока перед атакой
        if (this.canSeePlayer(enemy.position, playerPos)) {
            // TODO: Добавить урон игроку
            console.log('Враг атакует игрока!');
        }
    }

    // Движение к цели
    private moveTowardsTarget(enemy: EnemyState, deltaTime: number) {
        if (!enemy.targetPosition) return;

        const dx = enemy.targetPosition.x - enemy.position.x;
        const dz = enemy.targetPosition.z - enemy.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.1) {
            enemy.targetPosition = null;
            return;
        }

        const moveX = (dx / distance) * this.MOVE_SPEED * deltaTime;
        const moveZ = (dz / distance) * this.MOVE_SPEED * deltaTime;

        const newPosition = new Vector3(
            enemy.position.x + moveX,
            0,
            enemy.position.z + moveZ
        );

        if (this.collisionService.canMoveTo(newPosition)) {
            enemy.position = newPosition;
        }
    }

    // Обновление спрайта врага
    private updateEnemySprite(key: string, enemy: EnemyState) {
        const sprite = this.spriteManager.findSpriteNear(enemy.position, 0.1);
        if (sprite) {
            sprite.position = enemy.position;
        }
    }

    // Получение состояния врага
    getEnemy(x: number, z: number): EnemyState | undefined {
        const key = `${x},${z}`;
        return this.enemies.get(key);
    }

    // Проверка, жив ли враг
    isEnemyAlive(x: number, z: number): boolean {
        const enemy = this.getEnemy(x, z);
        return enemy ? !enemy.isDead : false;
    }
} 