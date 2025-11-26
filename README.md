# Fellowship Connect

A beautiful, modern Christian university fellowship community platform built with the MERN stack.

## 🌟 Features

- **Authentication & Authorization**: JWT-based auth with role management (Member, Leader, Admin)
- **User Profiles**: Customizable profiles with photo upload
- **Interactive Posts**: Prayer requests, testimonies, and announcements with likes, comments, and prayer tracking
- **Daily Scripture**: Bible verse integration using Bible API
- **Event Management**: Create, view, and RSVP to fellowship events
- **Prayer Wall**: Dedicated space for prayer requests with anonymous posting
- **Admin Dashboard**: User management and content moderation
- **Mobile Responsive**: Beautiful design that works on all devices
- **Testimony Categories & Archive**: Members can share testimonies with categories (Healing, Provision, Breakthrough, Spiritual Growth, Deliverance, Other), optional anonymity, photos, and reactions like “Amen.” Includes search, category filters, sort by date or category, and a dedicated archive page for easy browsing.

## 🚀 Tech Stack

- **Frontend**: React.js + TypeScript, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Deployment**: Vercel (both frontend and backend)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fellowship-connect.git
cd fellowship-connect
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your values:
- MongoDB connection string
- JWT secret key
- Cloudinary credentials (optional)

5. Start the development server:
```bash
npm run dev
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## 🗄️ Database Setup

### Option 1: Local MongoDB (Recommended for Development)

1. **Install MongoDB**:
   - **macOS**: `brew install mongodb-community`
   - **Ubuntu**: Follow [MongoDB Ubuntu Installation Guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)
   - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

2. **Start MongoDB**:
   ```bash
   # macOS/Linux
   brew services start mongodb-community
   # or
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

3. **Verify MongoDB is running**:
   ```bash
   mongosh --eval "db.adminCommand('ismaster')"
   ```

### Option 2: MongoDB Atlas (Cloud Database)

1. **Create a free account** at [MongoDB Atlas](https://www.mongodb.com/atlas)

2. **Create a new cluster**:
   - Choose the free tier (M0)
   - Select your preferred region
   - Create the cluster

3. **Set up database access**:
   - Go to "Database Access" in the left sidebar
   - Add a new database user with read/write permissions
   - Remember the username and password

4. **Set up network access**:
   - Go to "Network Access" in the left sidebar
   - Add IP address (use 0.0.0.0/0 for development, restrict for production)

5. **Get your connection string**:
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `fellowship-connect`

6. **Update your `.env` file**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fellowship-connect?retryWrites=true&w=majority
   ```

## 🚀 Deployment

This app is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy!

The `vercel.json` configuration handles both frontend and backend deployment.

## 📱 Usage

1. **Register**: Create an account with your fellowship role
2. **Dashboard**: View daily scripture and recent activity
3. **Posts**: Share prayer requests, testimonies, and announcements
   - For testimonies, choose a category and optionally post anonymously or add a photo
   - React to testimonies with “Amen,” search and filter by category, or sort
   - Browse all testimonies in the new Testimony Archive (in the navbar or at /testimonies)
4. **Prayer Wall**: Pray for others and share anonymous requests
5. **Events**: Stay updated on fellowship activities
6. **Profile**: Customize your profile and settings

## 🎨 Design

The app features a peaceful, Christ-centered design with:
- Warm color palette (blues, purples, gold accents)
- Clean typography and generous white space
- Smooth animations and micro-interactions
- Mobile-first responsive design

## 🔧 Troubleshooting

### MongoDB Connection Issues

If you see `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`:

1. **Check if MongoDB is running**:
   ```bash
   # Check if MongoDB process is running
   ps aux | grep mongod
   
   # Or check if port 27017 is in use
   lsof -i :27017
   ```

2. **Start MongoDB if not running**:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

3. **Check MongoDB logs**:
   ```bash
   # macOS
   tail -f /usr/local/var/log/mongodb/mongo.log
   
   # Linux
   tail -f /var/log/mongodb/mongod.log
   ```

4. **Verify connection string in `.env`**:
   - Make sure `MONGODB_URI` is correctly set
   - For local: `mongodb://localhost:27017/fellowship-connect`
   - For Atlas: Use the connection string from MongoDB Atlas

### Server Health Check

Visit `http://localhost:5000/api/health` to check server and database status.

## 🙏 Purpose

Fellowship Connect aims to:
- Build spiritual unity among fellowship members
- Facilitate prayer and spiritual growth
- Keep the community connected and informed
- Provide a safe space for sharing testimonies and requests

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.