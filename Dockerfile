FROM oven/bun:1.2.22

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 5173

ENV HOST=0.0.0.0
ENV PORT=5173

CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "5173"]
