import { Vector3 } from './Vector3';

export class Camera {
    private position: Vector3;
    private rotation: number = 0;
    private fov: number = 90;
    private moveSpeed: number = 0.1;
    private rotateSpeed: number = 0.1;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.position = new Vector3(x, y, z);
    }

    rotate(angle: number) {
        this.rotation += angle * this.rotateSpeed;
    }

    moveForward() {
        const direction = new Vector3(0, 0, 1).rotateY(this.rotation);
        this.position = new Vector3(
            this.position.x + direction.x * this.moveSpeed,
            this.position.y,
            this.position.z + direction.z * this.moveSpeed
        );
    }

    moveBackward() {
        const direction = new Vector3(0, 0, -1).rotateY(this.rotation);
        this.position = new Vector3(
            this.position.x + direction.x * this.moveSpeed,
            this.position.y,
            this.position.z + direction.z * this.moveSpeed
        );
    }

    moveLeft() {
        const direction = new Vector3(-1, 0, 0).rotateY(this.rotation);
        this.position = new Vector3(
            this.position.x + direction.x * this.moveSpeed,
            this.position.y,
            this.position.z + direction.z * this.moveSpeed
        );
    }

    moveRight() {
        const direction = new Vector3(1, 0, 0).rotateY(this.rotation);
        this.position = new Vector3(
            this.position.x + direction.x * this.moveSpeed,
            this.position.y,
            this.position.z + direction.z * this.moveSpeed
        );
    }

    getPosition(): Vector3 {
        return this.position;
    }

    getRotation(): number {
        return this.rotation;
    }

    projectPoint(point: Vector3): { x: number, y: number } {
        // Сначала перемещаем точку относительно камеры
        const relativePoint = new Vector3(
            point.x - this.position.x,
            point.y - this.position.y,
            point.z - this.position.z
        );

        // Затем поворачиваем точку относительно камеры
        const rotatedPoint = relativePoint.rotateY(-this.rotation);

        // И наконец проецируем на 2D плоскость
        return rotatedPoint.projectTo2D(this.fov);
    }
} 