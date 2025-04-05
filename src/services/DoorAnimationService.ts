import { Vector3 } from './Vector3'

interface AnimatedDoor {
    x: number;
    y: number;
    isOpening: boolean;
    isClosing: boolean;
    currentHeight: number;
    targetHeight: number;
    speed: number;
}

export class DoorAnimationService {
    animatedDoors: Map<string, AnimatedDoor> = new Map();
    private readonly ANIMATION_SPEED = 0.001; // Скорость анимации дверей

    // Добавляем дверь в список анимируемых
    addDoor(x: number, y: number) {
        const key = `${x},${y}`;
        this.animatedDoors.set(key, {
            x,
            y,
            isOpening: true,
            isClosing: false,
            currentHeight: 1,
            targetHeight: 0,
            speed: this.ANIMATION_SPEED
        });
    }

    // Обновляем состояние анимации дверей
    update(deltaTime: number) {
        for (const [key, door] of this.animatedDoors) {
            if (door.isOpening) {
                door.currentHeight = Math.max(0, door.currentHeight - door.speed * deltaTime);
                if (door.currentHeight <= 0) {
                    door.isOpening = false;
                    this.animatedDoors.delete(key);
                }
            } else if (door.isClosing) {
                door.currentHeight = Math.min(1, door.currentHeight + door.speed * deltaTime);
                if (door.currentHeight >= 1) {
                    door.isClosing = false;
                    this.animatedDoors.delete(key);
                }
            }
        }
    }

    // Получаем текущую высоту двери
    getDoorHeight(x: number, y: number): number {
        const key = `${x},${y}`;
        const door = this.animatedDoors.get(key);
        if (this.animatedDoors.size > 0) {
            console.log(door)
        }
        return door ? door.currentHeight : 1;
    }

    // Проверяем, анимируется ли дверь
    isDoorAnimating(x: number, y: number): boolean {
        const key = `${x},${y}`;
        return this.animatedDoors.has(key);
    }
} 