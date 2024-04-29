# Базовый образ
FROM node:16-alpine

# Установка рабочей директории в контейнере
WORKDIR /usr/src/app

# Копирование файлов package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копирование всех файлов проекта в рабочую директорию
COPY . .

# Открытие порта 3000 для внешнего доступа
EXPOSE 3000

# Команда для запуска приложения
CMD ["node", "scr/core/bot.js"]
