# Деплой на hoster.kz (VPS)

Пошагово: от пустого VPS до работающего сайта с SSL. Виртуальный (shared) хостинг не подойдёт — Next.js нужен постоянный Node-процесс, это только VPS/VDS.

## Что нужно заранее

- VPS на hoster.kz: Ubuntu 24.04, минимального тарифа достаточно (1 vCPU / 1–2 ГБ RAM).
- Домен. В DNS — A-запись на IP сервера (и вторая A-запись для `www`, если нужен).
- Номера счётчиков: Яндекс.Метрика (ID) и GA4 (G-XXXXXXX) — создать заранее.

## 1. Подготовка сервера

Подключиться по SSH из терминала (данные — в письме hoster.kz):

```bash
ssh root@IP_СЕРВЕРА
```

Обновиться и поставить Node 20 + Nginx:

```bash
apt update && apt -y upgrade
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt -y install nodejs nginx
node -v   # должно быть v20.x
```

## 2. Залить проект

Вариант А (проще): с рабочего ПК скопировать папку проекта БЕЗ `node_modules` и `.next`:

```bash
scp -r ./sayahat-v1 root@IP_СЕРВЕРА:/var/www/sayahat
```

Вариант Б: через GitHub — на сервере `git clone` своего репозитория в `/var/www/sayahat`.

## 3. Настроить .env на сервере

```bash
cd /var/www/sayahat
nano .env
```

Содержимое (подставь своё):

```
DATABASE_URL="file:./prod.db"
SITE_URL="https://твой-домен.kz"
NEXT_PUBLIC_YM_ID="12345678"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
SESSION_SECRET="случайная-строка-от-32-символов"
GOOGLE_SITE_VERIFICATION=""   # код из Google Search Console (можно вписать позже)
YANDEX_VERIFICATION=""        # код из Яндекс.Вебмастера (можно вписать позже)
```

`SESSION_SECRET` — любая длинная случайная строка (шифрует сессии кабинетов), сгенерировать: `openssl rand -base64 32`.

## 4. Собрать и создать базу

```bash
npm ci
npx prisma db push
npm run admin:create -- логин надёжный-пароль   # доступ в /admin (демо-пароли из сида на прод не брать)
npm run build
```

Данные: наполняй базу локально через Prisma Studio (см. README), а на сервер просто копируй файл базы:

```bash
scp prisma/dev.db root@IP_СЕРВЕРА:/var/www/sayahat/prisma/prod.db
```

Фото магазинов так же: клади файлы в `public/photos` локально и копируй папку на сервер.

## 5. Запуск через PM2 (автозапуск и рестарты)

```bash
npm i -g pm2
pm2 start npm --name sayahat -- start
pm2 save
pm2 startup   # выполнить команду, которую он выведет
```

Проверка: `curl http://127.0.0.1:3000` — должен вернуться HTML.

## 6. Nginx + SSL

```bash
nano /etc/nginx/sites-available/sayahat
```

```nginx
server {
    listen 80;
    server_name твой-домен.kz www.твой-домен.kz;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/sayahat /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

SSL (бесплатный Let's Encrypt, продлевается сам):

```bash
apt -y install certbot python3-certbot-nginx
certbot --nginx -d твой-домен.kz -d www.твой-домен.kz
```

Сайт открывается по https — готово.

## 7. Бэкап базы (обязательно)

```bash
crontab -e
# добавить строку — копия базы каждую ночь в 03:00:
0 3 * * * cp /var/www/sayahat/prisma/prod.db /root/backup-sayahat-$(date +\%u).db
0 4 * * 0 tar -czf /root/backup-uploads.tar.gz -C /var/www/sayahat uploads
```

Первая строка — 7 ротирующихся копий базы (по дню недели), вторая — еженедельный архив загруженных фото.

## 8. Обновление сайта

```bash
cd /var/www/sayahat
# залить новые файлы (scp/git pull) — папку uploads/ НЕ удалять и не перезаписывать, затем:
npm ci && npm run build && pm2 restart sayahat
```

## После запуска

- Яндекс.Вебмастер и Google Search Console: добавить сайт, подтвердить, скормить `https://домен/sitemap.xml`.
- Проверить, что Метрика и GA4 ловят визиты (зайти на сайт с телефона и посмотреть «онлайн»).
