# Hotel Booking Platform

Cloud-native microservices backend built with Node.js, Docker, and Nginx.

## Architecture

Three independent microservices behind an Nginx API Gateway:

- **room-service** — manages hotel rooms (port 8081)
- **guest-service** — manages guests (port 8082)
- **reservation-service** — manages bookings, calls room and guest services (port 8083)
- **api-gateway** — Nginx reverse proxy, single entry point (port 8080)

## Getting Started

```bash
docker-compose up --build
```

All services are accessible through the gateway at `http://localhost:8080`.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /rooms | List all rooms |
| POST | /rooms | Create a room |
| PUT | /rooms/:id | Update a room |
| PATCH | /rooms/:id/availability | Toggle availability |
| DELETE | /rooms/:id | Delete a room |
| GET | /guests | List all guests |
| POST | /guests | Register a guest |
| PUT | /guests/:id | Update a guest |
| DELETE | /guests/:id | Delete a guest |
| GET | /reservations | List all reservations |
| POST | /reservations | Create a reservation |
| DELETE | /reservations/:id | Cancel a reservation |
| GET | /gateway/health | Gateway health check |

## Architecture Diagram

![Architecture Diagram](./architecture-diagram.png)

## Cloud Integration

API documentation is hosted on Firebase Hosting:
https://hotel-booking-6247a.web.app

## Tech Stack

- Node.js + Express
- Nginx (API Gateway)
- Docker + Docker Compose
- Firebase Hosting

## Author

Youssef Kazti