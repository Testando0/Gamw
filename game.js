// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configurações do Jogo ---
const PLAYER_SIZE = 20;
const PLAYER_SPEED = 3;
const ENEMY_SIZE = 20;
const ENEMY_SPEED = 1.5;
const BULLET_SPEED = 8;
const BULLET_RADIUS = 3;

// --- Estado do Jogo ---
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    health: 100
};
let enemies = [];
let bullets = [];
let keys = {};
let score = 0;

// --- Input (Movimento e Rotação) ---
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

window.addEventListener('mousemove', (e) => {
    // Calcula o ângulo do jogador em direção ao mouse
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);
});

window.addEventListener('mousedown', () => {
    shootBullet();
});

// --- Funções de Jogabilidade ---

function shootBullet() {
    // Cria um tiro na direção atual do jogador
    const bullet = {
        x: player.x,
        y: player.y,
        vx: Math.cos(player.angle) * BULLET_SPEED,
        vy: Math.sin(player.angle) * BULLET_SPEED,
    };
    bullets.push(bullet);
}

function spawnEnemy() {
    // Gera inimigos aleatoriamente na borda do mapa
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 : canvas.width;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 : canvas.height;
    }

    enemies.push({ x, y, health: 30 });
}

// --- Atualização do Jogo ---

function update() {
    // 1. Movimento do Jogador
    if (keys['w']) player.y -= PLAYER_SPEED;
    if (keys['s']) player.y += PLAYER_SPEED;
    if (keys['a']) player.x -= PLAYER_SPEED;
    if (keys['d']) player.x += PLAYER_SPEED;

    // 2. Movimento e IA dos Inimigos
    enemies.forEach(enemy => {
        // IA: Move em direção ao jogador
        const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angleToPlayer) * ENEMY_SPEED;
        enemy.y += Math.sin(angleToPlayer) * ENEMY_SPEED;

        // Verifica colisão com o jogador (dano)
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        if (Math.sqrt(dx * dx + dy * dy) < PLAYER_SIZE / 2 + ENEMY_SIZE / 2) {
            player.health -= 0.5; // Dano contínuo
        }
    });

    // 3. Movimento dos Tiros
    bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    });

    // 4. Detecção de Colisão (Tiro vs. Inimigo)
    bullets = bullets.filter(bullet => {
        let hit = false;
        enemies = enemies.filter(enemy => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            if (Math.sqrt(dx * dx + dy * dy) < BULLET_RADIUS + ENEMY_SIZE / 2) {
                enemy.health -= 10;
                hit = true;
                if (enemy.health <= 0) {
                    score += 10;
                    return false; // Remove o inimigo
                }
            }
            return true; // Mantém o inimigo
        });

        // Remove o tiro se atingir um inimigo ou sair da tela
        return !hit && bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height;
    });

    // 5. Game Over
    if (player.health <= 0) {
        alert(`Game Over! Pontuação final: ${score}`);
        document.location.reload();
    }

    // Mantém o jogador dentro das bordas
    player.x = Math.max(PLAYER_SIZE / 2, Math.min(canvas.width - PLAYER_SIZE / 2, player.x));
    player.y = Math.max(PLAYER_SIZE / 2, Math.min(canvas.height - PLAYER_SIZE / 2, player.y));
}

// --- Renderização (Gráficos) ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha o Jogador
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = 'blue';
    ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE);
    
    // Desenha o cano da arma
    ctx.fillStyle = 'black';
    ctx.fillRect(5, -2, 15, 4);
    ctx.restore();
    
    // 2. Desenha os Inimigos
    enemies.forEach(enemy => {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, ENEMY_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        // Barra de vida (simplificada)
        ctx.fillStyle = 'lime';
        ctx.fillRect(enemy.x - ENEMY_SIZE / 2, enemy.y - ENEMY_SIZE / 2 - 5, ENEMY_SIZE * (enemy.health / 30), 3);
    });
    
    // 3. Desenha os Tiros
    bullets.forEach(bullet => {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });

    // 4. Desenha HUD (Saúde e Pontuação)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Saúde: ${Math.round(player.health)}`, 10, 30);
    ctx.fillText(`Pontuação: ${score}`, 10, 60);
}

// --- Loop Principal do Jogo ---
let lastSpawn = 0;
const SPAWN_INTERVAL = 3000; // Gera um inimigo a cada 3 segundos

function gameLoop(timestamp) {
    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
        spawnEnemy();
        lastSpawn = timestamp;
    }
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
spawnEnemy();
requestAnimationFrame(gameLoop);
