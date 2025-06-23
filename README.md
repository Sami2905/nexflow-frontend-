# NexFlow

NexFlow is a modern, full-stack bug and project management platform designed for teams to track issues, manage projects, and collaborate efficiently.

## Features
- User authentication (register, login, password reset)
- Project and bug tracking
- Dashboard with activity and statistics
- Real-time notifications
- Role-based access control
- Responsive design for desktop and mobile
- Dark mode and accessibility options

## Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express, MongoDB
- **Authentication:** JWT-based
- **Other:** Cypress (testing), Netlify (deployment)

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### Setup
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd NexFlow
   ```
2. **Install dependencies:**
   - For frontend:
     ```bash
     cd client
     npm install
     ```
   - For backend:
     ```bash
     cd ../server
     npm install
     ```
3. **Configure environment variables:**
   - Frontend: Create a `.env` file in `client/` and set `VITE_API_URL` to your backend URL.
   - Backend: Create a `.env` file in `server/` and set `MONGO_URI`, `JWT_SECRET`, etc.
4. **Run the app:**
   - Start backend:
     ```bash
     cd server
     npm start
     ```
   - Start frontend:
     ```bash
     cd ../client
     npm run dev
     ```

## Running Tests
- Frontend: `cd client && npm run test`
- Backend: `cd server && npm test`

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
