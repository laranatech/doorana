import level from '../data/maps'

export class Map {
    private map: string[][]
    private playerPosition: { x: number, y: number }

    constructor() {
        this.map = level.trim().split('\n').map(row => row.split(''))
        this.playerPosition = this.findPlayer()
    }

    private findPlayer(): { x: number, y: number } {
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 'P') {
                    return { x, y }
                }
            }
        }
        throw new Error('Player not found in map')
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
} 