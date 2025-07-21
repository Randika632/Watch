# SafeTrack Backend

This is the backend server for the SafeTrack application, built with Node.js, Express, MongoDB, and Firebase.

## Prerequisites
- Node.js (v14 or higher)
- MongoDB database (local or cloud, e.g., MongoDB Atlas)
- Firebase project (for real-time database features)

## Environment Variables
Create a `.env` file in the `backend` directory based on `.env.example`:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_DATABASE_URL=your_firebase_database_url
```

## Firebase Service Account
1. Go to your Firebase Console > Project Settings > Service Accounts.
2. Generate a new private key and download the `serviceAccountKey.json` file.
3. Place `serviceAccountKey.json` in the `backend` directory (do **not** commit this file to GitHub).

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000` by default.

## Deploying to Railway
1. Push your code to GitHub.
2. Create a new project on [Railway](https://railway.app/).
3. Connect your GitHub repo and select the `backend` folder as the root.
4. Add the required environment variables in the Railway dashboard.
5. Upload your `serviceAccountKey.json` using Railway's file storage or set its contents as an environment variable if needed.
6. Deploy! Railway will use the `start` script from `package.json`.

## Notes
- Never commit secrets or `serviceAccountKey.json` to your repository.
- For any issues, check the Railway build logs or open an issue. 