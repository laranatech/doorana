import { Vector3 } from './Vector3'
import { Map } from './Map'

export class CollisionService {
    private map: Map
    private collisionMargin: number = 0.3 // Расстояние от центра до стены для коллизии
    
    constructor(map: Map) {
        this.map = map
    }
    
    // Проверяет, может ли игрок переместиться в указанную позицию
    canMoveTo(position: Vector3): boolean {
        // Проверяем коллизии с 4-мя точками вокруг игрока
        const checkPoints = [
            { x: position.x + this.collisionMargin, z: position.z + this.collisionMargin },
            { x: position.x - this.collisionMargin, z: position.z + this.collisionMargin },
            { x: position.x + this.collisionMargin, z: position.z - this.collisionMargin },
            { x: position.x - this.collisionMargin, z: position.z - this.collisionMargin }
        ]
        
        // Если хотя бы одна из точек находится в стене - движение невозможно
        for (const point of checkPoints) {
            if (this.map.isWall(Math.floor(point.x), Math.floor(point.z))) {
                return false
            }
        }
        
        return true
    }
    
    // Находит безопасную позицию при скольжении вдоль стены
    slideAlongWall(currentPosition: Vector3, targetPosition: Vector3): Vector3 {
        // Если можем двигаться в целевую позицию - возвращаем её
        if (this.canMoveTo(targetPosition)) {
            return targetPosition
        }
        
        // Пробуем скользить по X
        const slideX = new Vector3(
            targetPosition.x,
            targetPosition.y,
            currentPosition.z
        )
        
        if (this.canMoveTo(slideX)) {
            return slideX
        }
        
        // Пробуем скользить по Z
        const slideZ = new Vector3(
            currentPosition.x,
            targetPosition.y,
            targetPosition.z
        )
        
        if (this.canMoveTo(slideZ)) {
            return slideZ
        }
        
        // Если скользить не получается - остаемся на месте
        return currentPosition
    }
} 