import { Vector3 } from './Vector3'

interface AnimatedDoor {
    x: number;
    y: number;
    isOpening: boolean;
    isClosing: boolean;
    currentOffset: number; // Смещение двери от 0 до 1
    targetOffset: number;
    speed: number;
    isOpen: boolean;
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
            currentOffset: 0,
            targetOffset: 1,
            speed: this.ANIMATION_SPEED,
            isOpen: false
        });
    }

    // Обновляем состояние анимации дверей
    update(deltaTime: number) {
        for (const [key, door] of this.animatedDoors) {
            if (door.isOpening) {
                door.currentOffset = Math.min(1, door.currentOffset + door.speed * deltaTime);
                if (door.currentOffset >= 1) {
                    door.isOpening = false;
                    door.isOpen = true;
                }
            } else if (door.isClosing) {
                door.currentOffset = Math.max(0, door.currentOffset - door.speed * deltaTime);
                if (door.currentOffset <= 0) {
                    door.isClosing = false;
                    door.isOpen = false;
                }
            }
        }
    }

    // Получаем текущее смещение двери
    getDoorOffset(x: number, y: number): number {
        const key = `${x},${y}`;
        const door = this.animatedDoors.get(key);
        return door ? door.currentOffset : 0;
    }

    // Проверяем, анимируется ли дверь
    isDoorAnimating(x: number, y: number): boolean {
        const key = `${x},${y}`;
        return this.animatedDoors.has(key);
    }

    // Проверяем, открыта ли дверь
    isDoorOpen(x: number, y: number): boolean {
        const key = `${x},${y}`;
        const door = this.animatedDoors.get(key);
        return door ? door.isOpen : false;
    }
} 