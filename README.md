# Acdnsys - Enhanced Vehicle Detection & License Plate Recognition System

A comprehensive, production-ready vehicle detection and license plate recognition system built with modern web technologies. This system provides real-time vehicle detection, intelligent database matching, SMS notifications, and comprehensive management capabilities.

## 🚀 Features

### Core Functionality
- **Advanced License Plate Detection**: Multi-provider recognition with Roboflow integration
- **Intelligent Matching**: Fuzzy matching algorithms for improved accuracy
- **Real-time SMS Notifications**: Instant alerts when registered vehicles are detected
- **Comprehensive Management**: Full CRUD operations for users and vehicles
- **Analytics Dashboard**: Detailed system performance and usage analytics

### Technical Highlights
- **Enhanced Detection Service**: Retry logic, caching, and fallback providers
- **Input Validation**: Comprehensive sanitization and security measures
- **Responsive Design**: Mobile-first approach with beautiful UI components
- **Performance Optimization**: Caching, batch processing, and efficient algorithms
- **Error Handling**: Robust error management with detailed logging

## 🛠 Technology Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - Modern React with latest features
- **TypeScript 5** - Type safety and developer experience
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **DaisyUI 5.1.13** - Beautiful component library
- **Lucide React** - Modern icon library
- **Recharts** - Data visualization and analytics

### Backend
- **FastAPI** - High-performance Python web framework
- **TinyDB** - Lightweight JSON database for development
- **Pydantic** - Data validation and serialization
- **Python 3.8+** - Modern Python with async support

### External Services
- **Roboflow API** - License plate detection and recognition
- **Arkesel SMS** - SMS notification service for Ghana
- **Email Validation** - Comprehensive email verification

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18.0.0+** and **npm 8.0.0+**
- **Python 3.8+** and **pip**
- **Git** for version control

### Required API Keys
1. **Roboflow API Key**: Sign up at [roboflow.com](https://roboflow.com) for license plate detection
2. **Arkesel SMS API Key**: Register at [sms.arkesel.com](https://sms.arkesel.com) for SMS services

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd acdnsys-enhanced
```

### 2. Automated Setup (Recommended)
Run the automated setup script that handles everything:

```bash
# For Unix/Linux/macOS
python setup.py

# For Windows
python setup.py
```

This script will:
- Create Python virtual environment
- Install all Python dependencies
- Install Node.js dependencies
- Create environment configuration file
- Initialize the database

### 3. Manual Setup (Alternative)

If you prefer manual setup:

#### Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Unix/Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

#### Frontend Setup
```bash
# Install Node.js dependencies
npm install
```

#### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your API keys
nano .env  # or use your preferred editor
```

### 4. Configure Environment Variables

Edit the `.env` file and add your API keys:

```env
# Required: Roboflow API Key
ROBOFLOW_API_KEY=your_roboflow_api_key_here

# Required: SMS Service API Key
ARKESEL_API_KEY=your_arkesel_api_key_here

# Optional: Adjust detection settings
SIMILARITY_THRESHOLD=0.75
CONFIDENCE_THRESHOLD=0.6
MAX_DETECTION_RETRIES=3
```

### 5. Start the Application

#### Option A: Using the Run Script (Recommended)
```bash
python run.py
```

This starts both backend and frontend servers automatically.

#### Option B: Manual Start
Start both servers in separate terminals:

```bash
# Terminal 1: Backend (FastAPI)
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn api.main:app --reload --port 8000

# Terminal 2: Frontend (Next.js)
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **System Health**: http://localhost:8000/health

## 📖 Usage Guide

### 1. User Management
- Navigate to the **Enhanced Management** page
- Add users with phone numbers, emails, and addresses
- Real-time validation ensures data quality
- Support for Ghana phone number formats

### 2. Vehicle Registration
- Register license plates for users
- Add vehicle details (make, model, color, year)
- Designate primary vehicles for notifications
- Support for Ghana license plate formats (GR-1234-21)

### 3. Camera Detection
- Use the **Camera** page to capture vehicle images
- System automatically detects license plates
- Matches against registered vehicles
- Sends SMS notifications for matches

### 4. Analytics Dashboard
- View comprehensive system statistics
- Monitor detection performance and accuracy
- Track user engagement and activity
- Export data for external analysis

## 🏗 Project Structure

```
acdnsys-enhanced/
├── api/                          # Backend API
│   ├── db/                       # Database models and connections
│   ├── models/                   # Pydantic data models
│   ├── routes/                   # API route handlers
│   ├── services/                 # Business logic services
│   └── main.py                   # FastAPI application
├── app/                          # Next.js frontend
│   ├── api/                      # API route proxies
│   ├── camera/                   # Camera capture page
│   ├── detection/                # Detection history page
│   ├── enhanced-management/      # Management dashboard
│   └── analytics/                # Analytics dashboard
├── components/                   # Reusable React components
│   ├── forms/                    # Enhanced form components
│   ├── ui/                       # UI utility components
│   └── navigations/              # Navigation components
├── utils/                        # Utility functions
├── setup.py                      # Automated setup script
├── run.py                        # Application runner
└── requirements.txt              # Python dependencies
```

## 🔧 Configuration

### Detection Settings
Adjust detection sensitivity and performance in `.env`:

```env
SIMILARITY_THRESHOLD=0.75          # Fuzzy matching threshold (0.0-1.0)
CONFIDENCE_THRESHOLD=0.6           # Minimum detection confidence
MAX_DETECTION_RETRIES=3            # Retry attempts for failed detections
CACHE_DURATION_MINUTES=30          # Detection result cache duration
```

### Performance Settings
```env
MAX_CONCURRENT_DETECTIONS=5        # Concurrent detection limit
REQUEST_TIMEOUT_SECONDS=30         # API request timeout
SMS_RETRY_ATTEMPTS=2               # SMS delivery retry attempts
```

## 📊 API Documentation

The system provides comprehensive API documentation:

- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: http://localhost:8000/openapi.json

### Key Endpoints

#### User Management
- `POST /users` - Create new user
- `GET /users` - List users with filtering
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete/deactivate user

#### License Plate Management
- `POST /plates` - Register new vehicle
- `GET /plates` - List plates with filtering
- `PUT /plates/{id}` - Update plate information
- `DELETE /plates/{id}` - Delete/deactivate plate

#### Enhanced Detection
- `POST /detection/process` - Process single image
- `POST /detection/batch` - Batch process multiple images
- `GET /detection/history` - Get detection history
- `GET /detection/metrics` - Performance metrics

#### Analytics
- `GET /analytics/dashboard` - Dashboard analytics
- `GET /analytics/trends` - Detection trends
- `GET /analytics/user-engagement` - User engagement metrics
- `GET /analytics/system-performance` - System performance

## 🔒 Security Features

### Input Validation
- **Phone Number Validation**: International format support with Ghana-specific validation
- **Email Validation**: Domain checking and format verification
- **License Plate Validation**: Ghana format validation with flexible patterns
- **XSS Protection**: Input sanitization to prevent injection attacks

### Data Security
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Error Handling**: Secure error messages without sensitive information

## 🚀 Deployment

### Development Deployment
The system is ready for development use with the provided setup.

### Production Deployment

#### Backend (FastAPI)
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn api.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend (Next.js)
```bash
# Build for production
npm run build

# Start production server
npm start
```

#### Environment Variables for Production
```env
DEBUG=false
LOG_LEVEL=warning
ALLOWED_ORIGINS=https://yourdomain.com
SECRET_KEY=your_production_secret_key
```

### Docker Deployment (Optional)
Create `Dockerfile` for containerized deployment:

```dockerfile
# Backend Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY api/ ./api/
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🧪 Testing

### Backend Testing
```bash
# Activate virtual environment
source venv/bin/activate

# Run tests
pytest

# Run with coverage
pytest --cov=api
```

### Frontend Testing
```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## 📈 Performance Optimization

### Backend Optimizations
- **Caching**: Detection results cached for improved performance
- **Async Processing**: Non-blocking operations for better throughput
- **Connection Pooling**: Efficient database connections
- **Batch Processing**: Support for bulk operations

### Frontend Optimizations
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js automatic image optimization
- **Static Generation**: Pre-rendered pages where possible
- **Bundle Analysis**: Optimized bundle sizes

## 🐛 Troubleshooting

### Common Issues

#### 1. API Key Errors
```
Error: Detection API error: Unauthorized
```
**Solution**: Verify your Roboflow API key in `.env` file

#### 2. SMS Delivery Failures
```
Error: SMS failed after 2 attempts
```
**Solution**: Check Arkesel API key and account balance

#### 3. Database Connection Issues
```
Error: Failed to fetch users
```
**Solution**: Ensure the database file has proper permissions

#### 4. Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: Kill existing processes or use different ports:
```bash
# Kill process on port 3000
npx kill-port 3000

# Or start on different port
npm run dev -- -p 3001
```

### Debug Mode
Enable debug mode for detailed logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Commit Changes**: `git commit -m 'Add amazing feature'`
4. **Push to Branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow TypeScript/Python type hints
- Add comprehensive comments for complex logic
- Include tests for new features
- Update documentation for API changes
- Follow existing code style and conventions

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- **API Docs**: http://localhost:8000/docs
- **System Health**: http://localhost:8000/health
- **Performance Metrics**: http://localhost:8000/detection/metrics

### Contact
- **Email**: support@acdnsys.com
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions

### System Requirements
- **Minimum**: 2GB RAM, 1 CPU core, 5GB storage
- **Recommended**: 4GB RAM, 2 CPU cores, 10GB storage
- **Network**: Stable internet connection for API services

## 🎯 Roadmap

### Version 2.2.0 (Planned)
- [ ] Real-time WebSocket notifications
- [ ] Advanced analytics with machine learning
- [ ] Multi-language support
- [ ] Mobile app integration
- [ ] Advanced user roles and permissions

### Version 2.3.0 (Future)
- [ ] Cloud deployment templates
- [ ] Integration with more SMS providers
- [ ] Advanced reporting and exports
- [ ] API rate limiting and quotas
- [ ] Audit logging and compliance features

---

**Built with ❤️ for vehicle security and management**

For the latest updates and releases, visit our [GitHub repository](https://github.com/your-org/acdnsys-enhanced).