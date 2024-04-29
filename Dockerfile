# Используйте официальный образ Node.js с нужной версией
FROM node:18-buster

# Установка Python, node-gyp и apt-utils одной командой
RUN apt-get update && \
    apt-get install -y python3 python3-pip apt-utils && \
    npm install -g node-gyp npm@10.6.0

# Установите рабочую директорию в контейнере
WORKDIR /usr/src/app

# Сначала копируйте файлы package.json и package-lock.json
COPY package*.json ./

# Установите зависимости проекта
RUN npm cache clean --force && npm install

# Теперь копируйте остальные файлы проекта
COPY . .

# Команда для запуска приложения
CMD ["sh", "-c", "cd src/core && node -r dotenv/config bot.js"]
