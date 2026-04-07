FROM node:24-alpine AS frontend

WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY web/ .
RUN npm run build

FROM golang:1.25-alpine AS backend

RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY . .
COPY --from=frontend /app/web/dist ./web/dist
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=backend /app/server .
COPY --from=frontend /app/web/dist ./web/dist

RUN mkdir -p /app/data

EXPOSE 8080

ENV GIN_MODE=release

CMD ["./server"]
