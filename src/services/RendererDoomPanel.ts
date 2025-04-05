import { RenderQueue } from "@laranatech/lareq";

export class RendererDoomPanel {
  // Метод для отрисовки нижней панели в стиле DOOM
  public drawDoomPanel(lareq: RenderQueue, width: number, height: number, viewportHeight: number, playerHealth: number, ammo: number) {
    // Фон для нижней панели
    lareq.command.setCtx({
        fillStyle: '#2C2C2C'
    });
    lareq.command.beginPath();
    lareq.command.moveTo({ x: 0, y: viewportHeight });
    lareq.command.lineTo({ x: width, y: viewportHeight });
    lareq.command.lineTo({ x: width, y: height });
    lareq.command.lineTo({ x: 0, y: height });
    lareq.command.closePath();
    lareq.command.fill();
    
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
    lareq.command.moveTo({ x: faceX, y: faceY });
    lareq.command.lineTo({ x: faceX + faceSize, y: faceY });
    lareq.command.lineTo({ x: faceX + faceSize, y: faceY + faceSize });
    lareq.command.lineTo({ x: faceX, y: faceY + faceSize });
    lareq.command.closePath();
    lareq.command.fill();
    lareq.command.stroke();
    
    // Рисуем лицо (упрощенно - используем прямоугольники и линии)
    lareq.command.setCtx({
        fillStyle: '#FFC0CB', // Розовый цвет кожи
        strokeStyle: '#000000'
    });
    lareq.command.beginPath();
    lareq.command.moveTo({ x: faceX, y: faceY });
    lareq.command.lineTo({ x: faceX + faceSize, y: faceY });
    lareq.command.lineTo({ x: faceX + faceSize, y: faceY + faceSize });
    lareq.command.lineTo({ x: faceX, y: faceY + faceSize });
    lareq.command.closePath();
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
        lareq.command.moveTo({ x: faceX + 15, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 20, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 20, y: faceY + 23 });
        lareq.command.lineTo({ x: faceX + 15, y: faceY + 23 });
        lareq.command.closePath();
        lareq.command.fill();
        
        // Правый глаз
        lareq.command.beginPath();
        lareq.command.moveTo({ x: faceX + 30, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 35, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 35, y: faceY + 23 });
        lareq.command.lineTo({ x: faceX + 30, y: faceY + 23 });
        lareq.command.closePath();
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
        lareq.command.moveTo({ x: faceX + 15, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 20, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 20, y: faceY + 23 });
        lareq.command.lineTo({ x: faceX + 15, y: faceY + 23 });
        lareq.command.closePath();
        lareq.command.fill();
        
        // Правый глаз
        lareq.command.beginPath();
        lareq.command.moveTo({ x: faceX + 30, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 35, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 35, y: faceY + 23 });
        lareq.command.lineTo({ x: faceX + 30, y: faceY + 23 });
        lareq.command.closePath();
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
        lareq.command.moveTo({ x: faceX + 15, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 20, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 20, y: faceY + 23 });
        lareq.command.lineTo({ x: faceX + 15, y: faceY + 23 });
        lareq.command.closePath();
        lareq.command.fill();
        
        // Правый глаз
        lareq.command.beginPath();
        lareq.command.moveTo({ x: faceX + 30, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 35, y: faceY + 18 });
        lareq.command.lineTo({ x: faceX + 35, y: faceY + 23 });
        lareq.command.lineTo({ x: faceX + 30, y: faceY + 23 });
        lareq.command.closePath();
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
    
    // Полоса здоровья
    const healthBarWidth = width / 3;
    const healthBarHeight = 20;
    const healthBarX = faceX - healthBarWidth - 10;
    const healthBarY = viewportHeight + 20;
    
    // Фон полосы здоровья
    lareq.command.setCtx({
        fillStyle: '#3A3A3A',
        strokeStyle: '#777777',
        lineWidth: 2
    });
    lareq.command.beginPath();
    lareq.command.moveTo({ x: healthBarX, y: healthBarY });
    lareq.command.lineTo({ x: healthBarX + healthBarWidth, y: healthBarY });
    lareq.command.lineTo({ x: healthBarX + healthBarWidth, y: healthBarY + healthBarHeight });
    lareq.command.lineTo({ x: healthBarX, y: healthBarY + healthBarHeight });
    lareq.command.closePath();
    lareq.command.fill();
    lareq.command.stroke();
    
    // Полоса здоровья
    const healthPercent = playerHealth / 100;
    const healthFillWidth = healthBarWidth * healthPercent;
    
    // Цвет зависит от количества здоровья
    let healthColor;
    if (playerHealth > 60) healthColor = '#007F00'; // Зеленый
    else if (playerHealth > 30) healthColor = '#FFFF00'; // Желтый
    else healthColor = '#FF0000'; // Красный
    
    lareq.command.setCtx({
        fillStyle: healthColor
    });
    lareq.command.beginPath();
    lareq.command.moveTo({ x: healthBarX, y: healthBarY });
    lareq.command.lineTo({ x: healthBarX + healthFillWidth, y: healthBarY });
    lareq.command.lineTo({ x: healthBarX + healthFillWidth, y: healthBarY + healthBarHeight });
    lareq.command.lineTo({ x: healthBarX, y: healthBarY + healthBarHeight });
    lareq.command.closePath();
    lareq.command.fill();
    
    // Текст "HEALTH"
    lareq.command.setCtx({
        font: '20px Arial',
        fillStyle: '#FFFFFF',
        textAlign: 'center',
        textBaseline: 'middle'
    });
    lareq.command.fillText({
        text: `ЗДОРОВЬЕ ${playerHealth}%`,
        x: healthBarX + healthBarWidth / 2,
        y: healthBarY + healthBarHeight / 2,
        maxWidth: healthBarWidth
    });
    
    // Полоса боеприпасов
    const ammoBarWidth = width / 3;
    const ammoBarHeight = 20;
    const ammoBarX = faceX + faceSize + 10;
    const ammoBarY = viewportHeight + 20;
    
    // Фон полосы боеприпасов
    lareq.command.setCtx({
        fillStyle: '#3A3A3A',
        strokeStyle: '#777777',
        lineWidth: 2
    });
    lareq.command.beginPath();
    lareq.command.moveTo({ x: ammoBarX, y: ammoBarY });
    lareq.command.lineTo({ x: ammoBarX + ammoBarWidth, y: ammoBarY });
    lareq.command.lineTo({ x: ammoBarX + ammoBarWidth, y: ammoBarY + ammoBarHeight });
    lareq.command.lineTo({ x: ammoBarX, y: ammoBarY + ammoBarHeight });
    lareq.command.closePath();
    lareq.command.fill();
    lareq.command.stroke();
    
    // Полоса боеприпасов
    const maxAmmo = 100; // Максимум боеприпасов
    const ammoPercent = ammo / maxAmmo;
    const ammoFillWidth = ammoBarWidth * ammoPercent;
    
    lareq.command.setCtx({
        fillStyle: '#3D629A' // Синий для боеприпасов
    });
    lareq.command.beginPath();
    lareq.command.moveTo({ x: ammoBarX, y: ammoBarY });
    lareq.command.lineTo({ x: ammoBarX + ammoFillWidth, y: ammoBarY });
    lareq.command.lineTo({ x: ammoBarX + ammoFillWidth, y: ammoBarY + ammoBarHeight });
    lareq.command.lineTo({ x: ammoBarX, y: ammoBarY + ammoBarHeight });
    lareq.command.closePath();
    lareq.command.fill();
    
    // Текст "AMMO"
    lareq.command.setCtx({
        font: '20px Arial',
        fillStyle: '#FFFFFF',
        textAlign: 'center',
        textBaseline: 'middle'
    });
    lareq.command.fillText({
        text: `ПАТРОНЫ ${ammo}`,
        x: ammoBarX + ammoBarWidth / 2,
        y: ammoBarY + ammoBarHeight / 2,
        maxWidth: ammoBarWidth
    });
  }
}