// Простой webhook сервер для автоматического деплоя
// Запускается на Windows сервере и слушает запросы от GitHub

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');

// Конфигурация
const CONFIG = {
  port: 3001,  // Порт для webhook сервера
  secret: process.env.WEBHOOK_SECRET || 'your-webhook-secret-change-this',
  projectPath: process.env.PROJECT_PATH || 'C:\\juyaShop',
  deployScript: path.join(__dirname, 'deploy.ps1'),
};

// Функция для проверки подписи GitHub
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', CONFIG.secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// Функция для выполнения деплоя
function deploy() {
  console.log(`[${new Date().toISOString()}] Запуск деплоя...`);
  
  return new Promise((resolve, reject) => {
    const deployCommand = `powershell -ExecutionPolicy Bypass -File "${CONFIG.deployScript}" -SkipPull`;
    
    exec(deployCommand, {
      cwd: CONFIG.projectPath,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[${new Date().toISOString()}] Ошибка деплоя:`, error);
        reject(error);
        return;
      }
      
      console.log(`[${new Date().toISOString()}] Деплой завершен успешно`);
      console.log('STDOUT:', stdout);
      if (stderr) {
        console.error('STDERR:', stderr);
      }
      
      resolve({ stdout, stderr });
    });
  });
}

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const signature = req.headers['x-hub-signature-256'];
        const event = req.headers['x-github-event'];
        
        // Проверяем подпись (если настроен секрет)
        if (CONFIG.secret && CONFIG.secret !== 'your-webhook-secret-change-this') {
          if (!signature || !verifySignature(body, signature)) {
            console.error(`[${new Date().toISOString()}] Неверная подпись webhook`);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
          }
        }
        
        const payload = JSON.parse(body);
        
        // Обрабатываем только push события в main ветку
        if (event === 'push' && payload.ref === 'refs/heads/main') {
          console.log(`[${new Date().toISOString()}] Получен push в main ветку`);
          console.log(`[${new Date().toISOString()}] Коммит: ${payload.head_commit?.id}`);
          console.log(`[${new Date().toISOString()}] Автор: ${payload.head_commit?.author?.name}`);
          
          // Отправляем ответ сразу (GitHub ожидает ответ в течение 10 секунд)
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            status: 'accepted',
            message: 'Deployment started'
          }));
          
          // Запускаем деплой асинхронно
          deploy().catch(err => {
            console.error(`[${new Date().toISOString()}] Критическая ошибка деплоя:`, err);
          });
        } else {
          console.log(`[${new Date().toISOString()}] Игнорируем событие: ${event}, ветка: ${payload.ref}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            status: 'ignored',
            message: 'Event ignored'
          }));
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Ошибка обработки webhook:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Запускаем сервер
server.listen(CONFIG.port, () => {
  console.log(`[${new Date().toISOString()}] Webhook сервер запущен на порту ${CONFIG.port}`);
  console.log(`[${new Date().toISOString()}] Ожидание webhook от GitHub...`);
  console.log(`[${new Date().toISOString()}] Health check: http://localhost:${CONFIG.port}/health`);
});

// Обработка ошибок
server.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] Ошибка сервера:`, error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Получен SIGTERM, завершение работы...`);
  server.close(() => {
    console.log(`[${new Date().toISOString()}] Сервер остановлен`);
    process.exit(0);
  });
});

