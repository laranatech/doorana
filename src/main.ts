import { CanvasRenderer } from '@laranatech/colorana'
import { Game } from './game'

const renderer = new CanvasRenderer({
	preloadImages: [],
})

const game = new Game(renderer)

document.addEventListener('DOMContentLoaded', () => {
	renderer.init()
	game.update()
})
