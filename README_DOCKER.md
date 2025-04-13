# Запуск приложения "Семейный бюджет" с помощью Docker Compose

## Предварительные требования

Для успешного запуска приложения вам необходимо установить:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Файлы для Docker

В проекте созданы следующие файлы для Docker:

- `docker-compose.yml` - основной файл конфигурации Docker Compose
- `Dockerfile.backend` - Dockerfile для Django-бэкенда
- `Dockerfile.frontend` - Dockerfile для React-фронтенда
- `.env` - файл с переменными окружения
- `nginx.conf` - конфигурационный файл для Nginx

## Запуск приложения

1. Клонируйте репозиторий (если еще не клонировали):
   ```
   git clone <URL-репозитория>
   cd family_budget_2
   ```

2. Запустите сервисы с помощью Docker Compose:
   ```
   docker-compose up -d
   ```

   Это запустит следующие сервисы:
   - `db` - база данных PostgreSQL
   - `backend` - Django-бэкенд
   - `frontend` - React-фронтенд
   - `nginx` - веб-сервер Nginx для проксирования запросов

3. Приложение будет доступно по адресу: http://localhost

## Остановка приложения

Для остановки всех сервисов выполните:
```
docker-compose down
```

Для остановки и удаления всех данных (включая базу данных):
```
docker-compose down -v
```

## Структура приложения

- **Бэкенд (Django)**:
  - Доступен по адресу: http://localhost/api/
  - Административная панель: http://localhost/admin/

- **Фронтенд (React)**:
  - Основной интерфейс: http://localhost/

## Подключение к базе данных

Для подключения к базе данных используйте следующие параметры:
- **Хост**: localhost
- **Порт**: 5432
- **Имя базы данных**: family_budget
- **Пользователь**: user
- **Пароль**: pass

## Разработка

### Логирование

Для просмотра логов используйте:
```
docker-compose logs -f
```

Для просмотра логов конкретного сервиса (например, backend):
```
docker-compose logs -f backend
```

### Перезапуск сервисов

После внесения изменений в код, вы можете перезапустить отдельные сервисы:
```
docker-compose restart backend
```
```
docker-compose restart frontend
```

### Внесение изменений в модели Django

После внесения изменений в модели Django, вам нужно применить миграции:
```
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
``` 