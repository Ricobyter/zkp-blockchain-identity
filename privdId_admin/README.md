# PrivdId Admin

Full-stack MERN application for managing students with Poseidon-only hashing.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- API: Axios
- Uploads: Multer + xlsx
- Email: Nodemailer
- Hashing: circomlibjs Poseidon only

## Folder Structure

- `frontend/`
- `backend/`

## Setup

1. Create environment files.
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

2. Install dependencies.
   - `cd backend && npm install`
   - `cd ../frontend && npm install`

3. Run the backend.
   - `cd backend && npm run dev`

4. Run the frontend.
   - `cd frontend && npm run dev`

## Environment Variables

### Backend

- `MONGO_URI=`
- `EMAIL_USER=`
- `EMAIL_PASS=`
- `JWT_SECRET=`
- `EMAIL_HOST=`
- `EMAIL_PORT=`
- `PORT=`

### Frontend

- `VITE_API_BASE_URL=http://localhost:5000/api`

## Excel Upload Format

Use columns with these headers:

- `name`
- `email`
- `rollNo`
- `programme`
- `contactNo`

The backend also accepts common variants like `roll number` and `contact number`.

## Notes

- Poseidon hashing is initialized asynchronously with `circomlibjs`.
- Student fields are converted to BigInt before hashing.
- The backend hashes `[name, email, rollNo, programme, contactNo]` as a single Poseidon input array.
- The password is generated without bcrypt or crypto hashing and stored after Poseidon hashing.