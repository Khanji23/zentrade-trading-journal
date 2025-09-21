# ZenTrade Trading Journal

A professional trading journal application with user authentication, trade tracking, strategy management, and comprehensive analytics.

## 🚀 Features

- **User Authentication**: Secure registration and login system
- **Trade Management**: Log, edit, and track all your trades
- **Strategy Tracking**: Organize trades by trading strategies
- **Analytics Dashboard**: Comprehensive performance metrics and equity curve
- **Calendar View**: Visual calendar showing daily P&L performance
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Data**: Live updates and calculations

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS for styling
- Chart.js for data visualization
- Responsive design principles

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- RESTful API design

### Security
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- Input validation and sanitization

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd zentrade-journal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy the environment template
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

### 4. Configure Environment Variables
Edit the `.env` file with your settings:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/zentrade-journal
# For production, use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zentrade-journal

# JWT Secret (generate a strong secret key)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 5. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or start MongoDB as a service (varies by OS)
```

### 6. Run the Application
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

### 7. Access the Application
Open your browser and navigate to:
- **Landing Page**: http://localhost:3000
- **Dashboard**: http://localhost:3000/index.html
- **Authentication**: http://localhost:3000/auth-modal.html

## 📁 Project Structure

```
zentrade-journal/
├── models/                 # Database models
│   ├── User.js            # User schema and methods
│   ├── Trade.js           # Trade schema and methods
│   └── Strategy.js        # Strategy schema and methods
├── routes/                 # API routes
│   ├── auth.js            # Authentication endpoints
│   ├── trades.js          # Trade management endpoints
│   ├── strategies.js      # Strategy management endpoints
│   └── dashboard.js       # Dashboard data endpoints
├── middleware/             # Custom middleware
│   └── auth.js            # Authentication middleware
├── js/                     # Frontend JavaScript
│   └── auth.js            # Authentication and API management
├── *.html                  # Frontend pages
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/logout` - User logout

### Trades
- `GET /api/trades` - Get all trades (with pagination and filters)
- `GET /api/trades/:id` - Get specific trade
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade
- `GET /api/trades/stats/overview` - Get trade statistics

### Strategies
- `GET /api/strategies` - Get all strategies
- `GET /api/strategies/:id` - Get specific strategy
- `POST /api/strategies` - Create new strategy
- `PUT /api/strategies/:id` - Update strategy
- `DELETE /api/strategies/:id` - Delete strategy
- `GET /api/strategies/:id/performance` - Get strategy performance
- `GET /api/strategies/:id/trades` - Get strategy trades

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/equity-curve` - Get equity curve data
- `GET /api/dashboard/performance-by-strategy` - Get performance by strategy
- `GET /api/dashboard/monthly-performance` - Get monthly performance

## 🚀 Deployment

### Option 1: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Option 2: Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Option 3: Heroku
1. Create a Heroku app
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Option 4: DigitalOcean App Platform
1. Create a new app
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

## 🔒 Security Features

- **Password Hashing**: Uses bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Validates all user inputs
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Sets security headers

## 📊 Database Schema

### Users
- Personal information (name, email)
- Subscription details
- User preferences
- Authentication data

### Trades
- Trade details (instrument, side, prices, quantity)
- P&L calculations
- Timestamps and metadata
- Strategy association

### Strategies
- Strategy information and rules
- Performance metrics
- Associated trades
- Categorization

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update CSS variables for color schemes
- Customize component styles in HTML files

### Features
- Add new API endpoints in the `routes/` directory
- Extend database models in the `models/` directory
- Add new frontend functionality in the `js/` directory

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **JWT Token Errors**
   - Check JWT_SECRET in `.env`
   - Ensure token is being sent in Authorization header
   - Verify token expiration

3. **CORS Issues**
   - Check FRONTEND_URL in `.env`
   - Ensure proper CORS configuration
   - Verify request origins

4. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing processes on the port
   - Use a different port number

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the API documentation

## 🔄 Updates

To update the application:
1. Pull the latest changes
2. Run `npm install` to update dependencies
3. Restart the server
4. Check for any breaking changes in the changelog

---

**Happy Trading! 📈**
