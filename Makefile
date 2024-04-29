.PHONY: test lint format

# Запуск тестов с использованием Jest
test:
	@echo "Running tests..."
	npm run test

# Проверка кода с помощью ESLint
lint:
	@echo "Linting code..."
	npm run lint

# Форматирование кода с помощью Prettier
format:
	@echo "Formatting code..."
	npm run format

# Сочетание тестирования, линтинга и форматирования
all: test lint format
	@echo "All tasks done!"
