import level from '../data/maps'
import { Vector3 } from './Vector3'
import { Sprite } from './SpriteManager'

export class Map {
    private map: string[][]
    private playerPosition: { x: number, y: number }
    private items: Sprite[] = []

    constructor() {
        this.map = level.trim().split('\n').map(row => row.split(''))
        this.playerPosition = this.findPlayer()
        this.parseItems()
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

    isWall(x: number, y: number): boolean {
        if (x < 0 || y < 0 || x >= this.map[0].length || y >= this.map.length) {
            return true
        }
        return this.map[y][x] === '#'
    }

    getPlayerPosition(): { x: number, y: number } {
        return this.playerPosition
    }
    
    getItems(): Sprite[] {
        return this.items
    }
} 