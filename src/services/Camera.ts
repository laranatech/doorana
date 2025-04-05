import { Vector3 } from './Vector3';
import { CollisionService } from './CollisionService';

export class Camera {
    private position: Vector3;
    private rotation: number = 0;
    private fov: number = 90;
    private collisionService: CollisionService | null = null;
    
    // Вектор направления движения
    private moveDirection: Vector3 = new Vector3(0, 0, 0);
    private currentRotationSpeed: number = 0;
    
    // Параметры движения
    private maxSpeed: number = 0.075;
    private acceleration: number = 0.075;
    private deceleration: number = 0.01;
    private rotationAcceleration: number = 0.058;
    private rotationDeceleration: number = 0.008;
    private maxRotationSpeed: number = 0.06;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.position = new Vector3(x, y, z);
    }

    setCollisionService(service: CollisionService) {
        this.collisionService = service;
    }

    update(deltaTime: number) {
        // Применяем замедление к вектору движения
        if (this.moveDirection.length() > 0) {
            const currentSpeed = this.moveDirection.length();
            const newSpeed = Math.max(0, currentSpeed - this.deceleration * deltaTime);
            this.moveDirection = this.moveDirection.normalize().multiply(newSpeed);
        }

        // Применяем замедление к повороту
        if (this.currentRotationSpeed > 0) {
            this.currentRotationSpeed = Math.max(0, this.currentRotationSpeed - this.rotationDeceleration * deltaTime);
        } else if (this.currentRotationSpeed < 0) {
            this.currentRotationSpeed = Math.min(0, this.currentRotationSpeed + this.rotationDeceleration * deltaTime);
        }

        // Применяем поворот
        if (this.currentRotationSpeed !== 0) {
            this.rotation += this.currentRotationSpeed * deltaTime;
            if (this.rotation > Math.PI) {
                this.rotation -= Math.PI * 2;
            } else if (this.rotation < -Math.PI) {
                this.rotation += Math.PI * 2;
            }
        }

        // Применяем движение
        if (this.moveDirection.length() > 0) {
            // Поворачиваем вектор движения в соответствии с текущим углом камеры
            const rotatedDirection = this.moveDirection.rotateY(this.rotation);
            const targetPosition = new Vector3(
                this.position.x + rotatedDirection.x * deltaTime,
                this.position.y,
                this.position.z + rotatedDirection.z * deltaTime
            );

            if (this.collisionService) {
                this.position = this.collisionService.slideAlongWall(this.position, targetPosition);
            } else {
                this.position = targetPosition;
            }
        }
    }

    // Методы для управления движением
    startMovingForward() {
        const forwardVector = new Vector3(0, 0, 1);
        this.applyMovementVector(forwardVector);
    }

    startMovingBackward() {
        const backwardVector = new Vector3(0, 0, -1);
        this.applyMovementVector(backwardVector);
    }

    startMovingLeft() {
        const leftVector = new Vector3(-1, 0, 0);
        this.applyMovementVector(leftVector);
    }

    startMovingRight() {
        const rightVector = new Vector3(1, 0, 0);
        this.applyMovementVector(rightVector);
    }

    private applyMovementVector(direction: Vector3) {
        // Добавляем новый вектор к текущему направлению
        const newDirection = new Vector3(
            this.moveDirection.x + direction.x * this.acceleration,
            this.moveDirection.y,
            this.moveDirection.z + direction.z * this.acceleration
        );

        // Нормализуем и ограничиваем длину вектора
        const currentLength = newDirection.length();
        if (currentLength > this.maxSpeed) {
            this.moveDirection = newDirection.normalize().multiply(this.maxSpeed);
        } else {
            this.moveDirection = newDirection;
        }
    }

    startRotatingLeft() {
        this.currentRotationSpeed = Math.max(-this.maxRotationSpeed, this.currentRotationSpeed - this.rotationAcceleration);
    }

    startRotatingRight() {
        this.currentRotationSpeed = Math.min(this.maxRotationSpeed, this.currentRotationSpeed + this.rotationAcceleration);
    }

    getPosition(): Vector3 {
        return this.position;
    }

    getRotation(): number {
        return this.rotation;
    }

    projectPoint(point: Vector3): { x: number, y: number } {
        const relativePoint = new Vector3(
            point.x - this.position.x,
            point.y - this.position.y,
            point.z - this.position.z
        );

        const rotatedPoint = relativePoint.rotateY(-this.rotation);

        return rotatedPoint.projectTo2D(this.fov);
    }
} 