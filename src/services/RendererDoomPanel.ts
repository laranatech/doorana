import { Box, point, RenderQueue, Point } from "@laranatech/lareq";

export type BfgOpts = {
    lareq: RenderQueue;
    bfgTick: number;
    width: number;
    height: number;
    viewportHeight: number;
}

const drawBfg = ({
    lareq,
    bfgTick,
    width,
    height,
    viewportHeight,
}: BfgOpts) => {
    lareq.command.setCtx({
        fillStyle: '#888',
    })

    const center = width / 2

    const w = 50
    const l = 120

    const halfW = w / 2
    const triW = w / 3

    if (bfgTick === 0) {
        lareq.command.beginPath()
        lareq.command.moveTo(point(center - halfW, viewportHeight))
        lareq.command.lineTo(point(center - triW, viewportHeight - l))
        lareq.command.lineTo(point(center + triW, viewportHeight - l))
        lareq.command.lineTo(point(center + halfW, viewportHeight))
        lareq.command.closePath()
        lareq.command.fill()
    } else {
        lareq.command.beginPath()
        lareq.command.moveTo(point(center - w * 0.75, viewportHeight))
        lareq.command.lineTo(point(center - triW, viewportHeight - l * 0.8))
        lareq.command.lineTo(point(center + triW, viewportHeight - l * 0.8))
        lareq.command.lineTo(point(center + halfW * 0.75, viewportHeight))
        lareq.command.closePath()
        lareq.command.fill()
    }

    const drawFrog = ({ lareq, x, y, scale }: { lareq: RenderQueue, x: number, y: number, scale: number }) => {
        lareq.command.setCtx({ fillStyle: '#3caa3c', strokeStyle: '#3caa3c' })

        lareq.command.beginPath()
        lareq.command.moveTo(point(x - 20 * scale, y))
        lareq.command.lineTo(point(x + 20 * scale, y))
        lareq.command.lineTo(point(x + 10 * scale, y - 10 * scale))
        lareq.command.lineTo(point(x + 15 * scale, y - 15 * scale))
        lareq.command.lineTo(point(x, y - 20 * scale))
        lareq.command.lineTo(point(x - 15 * scale, y - 15 * scale))
        lareq.command.lineTo(point(x - 10 * scale, y - 10 * scale))
        lareq.command.closePath()
        lareq.command.fill()

        lareq.command.beginPath()
        lareq.command.moveTo(point(x - 15 * scale, y - 5 * scale))
        lareq.command.lineTo(point(x - 25 * scale, y - 2 * scale))
        lareq.command.lineTo(point(x - 15 * scale, y + 15 * scale))
        lareq.command.stroke()

        lareq.command.beginPath()
        lareq.command.moveTo(point(x + 15 * scale, y - 5 * scale))
        lareq.command.lineTo(point(x + 25 * scale, y - 2 * scale))
        lareq.command.lineTo(point(x + 15 * scale, y + 15 * scale))
        lareq.command.stroke()
    }

    drawFrog({ lareq, x: center, y: viewportHeight - l * [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6][bfgTick], scale: [1, 0.9, 0.8, 0.7, 0.6, 0.5][bfgTick] })
}

export type HudBarOpts = {
    lareq: RenderQueue,
    box: Box,
    colors: string[],
    total: number,
    value: number,
    text: string
}
const hudBar = ({
    lareq, box, colors, total, value, text
}: HudBarOpts) => {
    // Фон
    lareq.command.setCtx({
        fillStyle: '#3A3A3A',
        strokeStyle: '#777777',
        lineWidth: 2
    });
    lareq.command.beginPath();
    lareq.command.rect(box)
    lareq.command.fill();
    lareq.command.stroke();

    // Цвет зависит от количества здоровья
    let color;
    if (value > 60) color = colors[0]; // Зеленый
    else if (value > 30) color = colors[1]; // Желтый
    else color = colors[2]; // Красный

    lareq.command.setCtx({
        fillStyle: color,
    });
    lareq.command.beginPath();
    lareq.command.rect({ ...box, w: value / total * box.w, })
    lareq.command.fill();

    // Текст "HEALTH"
    lareq.command.setCtx({
        font: '20px Arial',
        fillStyle: '#FFFFFF',
        textAlign: 'center',
        textBaseline: 'middle'
    });
    lareq.command.fillText({
        text,
        x: box.x + box.w / 2,
        y: box.y + box.h / 2,
        maxWidth: box.w
    });
}

export class RendererDoomPanel {
    private drawFace(lareq: RenderQueue, width: number, viewportHeight: number, playerHealth: number) {

        // Рамка лица в стиле DOOM
        const faceSize = 50;
        const faceX = width / 2 - faceSize / 2;
        const faceY = viewportHeight + 5;

        // Рамка для лица
        lareq.command.setCtx({
            fillStyle: '#3A3A3A',
            strokeStyle: '#777777',
            lineWidth: 2
        });
        lareq.command.beginPath();
        lareq.command.rect({ x: faceX, y: faceY, w: faceSize, h: faceSize });
        lareq.command.fill();
        lareq.command.stroke();

        // Рисуем лицо (упрощенно - используем прямоугольники и линии)
        lareq.command.setCtx({
            fillStyle: '#FFC0CB', // Розовый цвет кожи
            strokeStyle: '#000000'
        });
        lareq.command.beginPath();
        lareq.command.rect({ x: faceX, y: faceY, w: faceSize, h: faceSize })
        lareq.command.fill();

        // Простое выражение лица в зависимости от здоровья
        if (playerHealth > 60) {
            // Счастливое лицо
            // Глаза (прямоугольники)
            lareq.command.setCtx({
                fillStyle: '#000000'
            });
            // Левый глаз
            lareq.command.beginPath();
            lareq.command.rect({ x: faceX + 15, y: faceY + 18, w: 5, h: 5 });
            lareq.command.fill();
            
            // Правый глаз
            lareq.command.beginPath();
            lareq.command.rect({ x: faceX + 30, y: faceY + 18, w: 5, h: 5 });
            lareq.command.fill();
            // Улыбка (квадратная)
            lareq.command.setCtx({
                strokeStyle: '#000000',
                lineWidth: 2
            });
            lareq.command.beginPath();
            lareq.command.moveTo({ x: faceX + 15, y: faceY + 32 });
            lareq.command.lineTo({ x: faceX + 17, y: faceY + 38 });
            lareq.command.lineTo({ x: faceX + 33, y: faceY + 38 });
            lareq.command.lineTo({ x: faceX + 35, y: faceY + 32 });
            lareq.command.stroke();
        } else if (playerHealth > 20) {
            // Нейтральное лицо
            // Глаза (прямоугольники)
            lareq.command.setCtx({
                fillStyle: '#000000'
            });
            // Левый глаз
            lareq.command.beginPath();
            lareq.command.rect({ x: faceX + 15, y: faceY + 18, w: 5, h: 5 });
            lareq.command.fill();
            
            // Правый глаз
            lareq.command.beginPath();
            lareq.command.rect({ x: faceX + 15, y: faceY + 18, w: 5, h: 5 });
            lareq.command.fill();
            
            // Прямой рот
            lareq.command.setCtx({
                strokeStyle: '#000000',
                lineWidth: 2
            });
            lareq.command.beginPath();
            lareq.command.moveTo({ x: faceX + 15, y: faceY + 35 });
            lareq.command.lineTo({ x: faceX + 35, y: faceY + 35 });
            lareq.command.stroke();
        } else {
            // Грустное лицо
            // Глаза (прямоугольники)
            lareq.command.setCtx({
                fillStyle: '#000000'
            });
            // Левый глаз
            lareq.command.beginPath();
            lareq.command.rect({ x: faceX + 15, y: faceY + 18, w: 5, h: 5 });
            lareq.command.fill();
            
            // Правый глаз
            lareq.command.beginPath();
            lareq.command.rect({ x: faceX + 15, y: faceY + 18, w: 5, h: 5 });
            lareq.command.fill();
            
            // Грустный рот (перевернутая дуга)
            lareq.command.setCtx({
                strokeStyle: '#000000',
                lineWidth: 2
            });
            lareq.command.beginPath();
            lareq.command.moveTo({ x: faceX + 15, y: faceY + 35 });
            lareq.command.lineTo({ x: faceX + 20, y: faceY + 30 });
            lareq.command.lineTo({ x: faceX + 30, y: faceY + 30 });
            lareq.command.lineTo({ x: faceX + 35, y: faceY + 35 });
            lareq.command.stroke();
        }
    }
  // Метод для отрисовки нижней панели в стиле DOOM

  public drawDoomPanel(lareq: RenderQueue, width: number, height: number, viewportHeight: number, playerHealth: number, ammo: number, bfgTick: number = 0) {
    // Фон для нижней панели
    lareq.command.setCtx({
        fillStyle: '#2C2C2C'
    });
    lareq.command.beginPath();
    lareq.command.rect({ x: 0, y: viewportHeight, w: width, h: height });
    lareq.command.fill();

    this.drawFace(lareq, width, viewportHeight, playerHealth)

    const faceSize = 50;
    const faceX = width / 2 - faceSize / 2;

    const barWidth = width / 3;
    const barHeight = 20;

    hudBar({
        lareq,
        box: {
            x: faceX - barWidth - 10,
            y: viewportHeight + barHeight,
            h: barHeight,
            w: barWidth,
        },
        colors: ['#3caa3c', '#FFFF00', '#FF0000'],
        value: playerHealth,
        total: 100,
        text: `ЗДОРОВЬЕ ${playerHealth}%`
    })

    hudBar({
        lareq,
        box: {
            x: faceX + faceSize + 10,
            y: viewportHeight + barHeight,
            h: barHeight,
            w: barWidth,
        },
        colors: ['#3D629A', '#3D629A', '#3D629A'],
        value: ammo,
        total: 100,
        text: `ПАТРОНЫ ${ammo}`,
    })

    drawBfg({
        lareq,
        bfgTick,
        width,
        height,
        viewportHeight,
    })
  }
}

