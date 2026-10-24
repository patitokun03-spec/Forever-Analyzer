FROM python:3.12-alpine

WORKDIR /app

COPY . .

# Initialize SQLite database from schema and seed data
RUN python database/seed.py

EXPOSE 3000

CMD ["python", "server.py"]
