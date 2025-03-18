# Dashboard

## 🚀 **Установка и запуск**

1. **Клонируйте репозиторий:**

   ```bash
   git clone https://github.com/shakhbanov/dashboard_rest.git
   cd project-directory
   ```

2. **Настройка переменных окружения:**

   В файле `.env` укажите параметры подключения к базе данных. Чтобы открыть файл `.env` для редактирования:

   ```bash
   nano backend/.env
   ```

   Пример содержимого `.env`:

   ```text
   POSTGRESQL_HOST=your_host
   POSTGRESQL_PORT=5432
   POSTGRESQL_USER=your_user
   POSTGRESQL_PASSWORD=your_password
   POSTGRESQL_DBNAME=your_dbname
   ```

3. **Запуск Docker контейнеров:**

   Соберите и запустите проект:

   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Доступ к приложению:**

   После запуска, веб-интерфейс доступен по адресу:

   ```
   http://localhost:8080
   ```

   API работает по адресам:
   - `/fact` — Получение данных по фактическим продажам.
   - `/forecast` — Получение данных прогнозов.

## 📂 **Логи**

Логи работы бэкенда и запросов сохраняются в файл `logs/app.log`. Чтобы просмотреть логи:

1. **Логи в контейнере:**

   Выполните команду для доступа к контейнеру бэкенда:

   ```bash
   docker exec -it dash-backend-1 sh
   cat app.log
   ```

2. **Логи на сервере:**

   Логи также сохраняются в папке `./backend/logs/app.log` на хосте.

   Для просмотра логов:

   ```bash
   cat ./backend/logs/app.log
   ```

## 🛠 **Как изменить название таблицы**

Если необходимо изменить имя таблицы в запросах:

1. Открой файл, который содержит SQL-запросы. Например, файл с запросами может находиться в **`app/services/database.py`**.
   
   Чтобы найти и открыть этот файл:
   
   ```bash
   nano backend/app/services/database.py
   ```

2. После того как все изменения внесены, сохраните файл и перезапустите Docker контейнеры:

   ```bash
   docker-compose down
   docker-compose up -d
   ```

---
<img src="https://s3.shakhbanov.org/blog/gif" alt="GIF анимация">




