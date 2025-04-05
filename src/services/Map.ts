import level from '../data/maps'
import { Vector3 } from './Vector3'
import { Sprite } from './SpriteManager'

// Состояние двери
interface Door {
    x: number;
    y: number;
    locked: boolean; // Требуется ли ключ
    isOpen: boolean; // Открыта ли дверь
}

export class Map {
    private map: string[][]
    private playerPosition: { x: number, y: number }
    private items: Sprite[] = []
    private doors: Door[] = [] // Список дверей на карте
    private playerKeys: number = 0 // Количество ключей у игрока

    constructor() {
        this.map = level.trim().split('\n').map(row => row.split(''))
        this.playerPosition = this.findPlayer()
        this.parseItems()
        this.parseDoors()
    }

    private findPlayer(): { x: number, y: number } {
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 'P') {
                    // Очищаем позицию игрока в карте, чтобы она не считалась стеной
                    this.map[y][x] = ' '
                    return { x, y }
                }
            }
        }
        throw new Error('Player not found in map')
    }
    
    // Парсим карту и находим все предметы (например, оружие, здоровье и т.д.)
    private parseItems() {
        const symbolMap: Record<string, string> = {
            'A': 'ammo',      // Боеприпасы
            'H': 'health',    // Здоровье
            'W': 'weapon',    // Оружие
            'E': 'enemy',     // Враг
            'K': 'key'        // Ключ
        }
        
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const symbol = this.map[y][x]
                
                if (symbol in symbolMap) {
                    // Создаем спрайт для этого предмета
                    this.items.push({
                        position: new Vector3(x, 0, y),
                        texture: symbolMap[symbol],
                        type: symbol === 'E' ? 'enemy' : 'item'
                    })
                    
                    // Очищаем позицию в карте, чтобы она не считалась стеной
                    this.map[y][x] = ' '
                }
            }
        }
    }

    // Парсим карту и находим все двери
    private parseDoors() {
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const symbol = this.map[y][x]
                
                if (symbol === 'D') { // Обычная дверь
                    this.doors.push({
                        x,
                        y,
                        locked: false,
                        isOpen: false
                    });
                    // Заменяем символ двери на 'D', чтобы отличать от обычных стен
                    this.map[y][x] = 'D';
                } else if (symbol === 'L') { // Запертая дверь (нужен ключ)
                    this.doors.push({
                        x,
                        y,
                        locked: true,
                        isOpen: false
                    });
                    // Заменяем символ запертой двери на 'L'
                    this.map[y][x] = 'L';
                }
            }
        }
    }

    isWall(x: number, y: number): boolean {
        if (x < 0 || y < 0 || x >= this.map[0].length || y >= this.map.length) {
            return true
        }
        // Стена или закрытая дверь
        return this.map[y][x] === '#' || this.map[y][x] === 'D' || this.map[y][x] === 'L'
    }

    // Проверяет, есть ли дверь в указанной позиции
    isDoor(x: number, y: number): boolean {
        return this.doors.some(door => door.x === x && door.y === y && !door.isOpen);
    }
    
    // Открывает дверь, если это возможно. Возвращает true, если дверь открылась
    tryOpenDoor(x: number, y: number): boolean {
        const door = this.doors.find(door => door.x === x && door.y === y && !door.isOpen);
        
        if (!door) return false;
        
        // Если дверь заперта, проверяем наличие ключа
        if (door.locked && this.playerKeys <= 0) {
            console.log('Для открытия этой двери требуется ключ!');
            return false;
        }
        
        // Если дверь заперта и у игрока есть ключ, используем ключ
        if (door.locked) {
            this.playerKeys--;
            console.log(`Дверь открыта ключом! Осталось ключей: ${this.playerKeys}`);
        }
        
        // Открываем дверь, меняя карту
        door.isOpen = true;
        this.map[door.y][door.x] = ' '; // Дверь больше не препятствие
        
        // Удаляем спрайт двери, если он есть
        const doorSprite = this.items.findIndex(sprite => 
            sprite.position.x === door.x && 
            sprite.position.z === door.y && 
            sprite.texture === 'door'
        );
        
        if (doorSprite !== -1) {
            this.items.splice(doorSprite, 1);
        }
        
        return true;
    }
    
    // Добавляет ключ игроку
    addKey(): void {
        this.playerKeys++;
        console.log(`Ключ подобран! Теперь у вас: ${this.playerKeys} ключей`);
    }
    
    // Возвращает количество ключей у игрока
    getKeyCount(): number {
        return this.playerKeys;
    }

    getPlayerPosition(): { x: number, y: number } {
        return this.playerPosition
    }
    
    getItems(): Sprite[] {
        return this.items
    }

    // Проверка на тип стены - обычная, дверь или запертая дверь
    getWallType(x: number, y: number): string {
        if (x < 0 || y < 0 || x >= this.map[0].length || y >= this.map.length) {
            return '#'; // За пределами карты - обычная стена
        }
        return this.map[y][x];
    }
} 