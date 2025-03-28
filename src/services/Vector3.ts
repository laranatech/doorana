export class Vector3 {
    constructor(
        public x: number,
        public y: number,
        public z: number
    ) {}

    rotateY(angle: number): Vector3 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        return new Vector3(
            this.x * cos + this.z * sin,
            this.y,
            -this.x * sin + this.z * cos
        );
    }

    projectTo2D(fov: number = 90): { x: number, y: number } {
        // Простая проекция на 2D плоскость
        // Предполагаем, что камера находится в точке (0,0,0) и смотрит вдоль оси Z
        const scale = fov / (this.z + 1);
        return {
            x: this.x * scale,
            y: this.y * scale
        };
    }
} 