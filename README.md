
# SupportDesk – Support Ticket Management System

A web-based support ticket management application where customers can create and track tickets, and support agents can manage and resolve them.

## Live Application

- **Frontend:** https://support-ticket-system-dun.vercel.app/
- **Backend API:** https://support-ticket-backend-i2vj.onrender.com

## GitHub Repository

https://github.com/Alekhya-004/support-ticket-system

## Tech Stack

- Frontend: React, Vite, JavaScript, HTML, CSS
- Backend: Node.js, Express.js
- Database: MySQL
- Authentication: JWT and bcrypt

## Features

- Customer and agent authentication
- Create and view support tickets
- Add comments to tickets
- Update ticket status
- Role-based access control

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Alekhya-004/support-ticket-system.git
cd support-ticket-system
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder with the following variables:

```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=support_tickets
DB_PORT=3306
JWT_SECRET=your_secret_key
```

Start the backend:

```bash
npm start
```

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown in your terminal.

## Database

The application uses MySQL to store users, tickets, and ticket comments.

Database schema and seed scripts will be provided in the database folder.

## Deployment

- Frontend deployed on Vercel.
- Backend deployed on Render.
- MySQL hosted on Aiven.

## Testing

Backend API tests are written using Jest and Supertest.

Run the tests from the backend folder:

```bash
npm test
```

## Author

Alekhya Chinthala
