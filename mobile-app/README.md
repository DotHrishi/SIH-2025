# Jal Drishti Mobile App

A React Native mobile application for water quality monitoring and health surveillance, designed to work with the Jal Drishti MERN backend system.

## Features

- **Home Screen**: Dashboard with map view, statistics, and recent activity
- **Reports**: Submit water quality and patient reports with location tracking
- **Education**: Video tutorials and learning resources about water safety
- **Query System**: FAQ and expert query submission

## Screenshots

The app design matches the provided UI mockups with:
- Clean, modern interface
- Bottom tab navigation
- Form-based reporting
- Interactive maps
- Educational content

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Clone the repository**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   
   Update the `BASE_URL` in `src/services/api.js`:
   ```javascript
   const BASE_URL = 'http://your-backend-server:5000/api';
   ```
   
   For local development:
   - Use `http://localhost:5000/api` for iOS simulator
   - Use `http://10.0.2.2:5000/api` for Android emulator
   - Use your computer's IP address for physical devices

## Running the App

1. **Start the development server**
   ```bash
   npm start
   ```

2. **Run on specific platform**
   ```bash
   # iOS (requires macOS and Xcode)
   npm run ios
   
   # Android (requires Android Studio)
   npm run android
   
   # Web browser
   npm run web
   ```

3. **Using Expo Go app**
   - Install Expo Go on your mobile device
   - Scan the QR code displayed in the terminal
   - The app will load on your device

## Backend Integration

The mobile app integrates with the existing MERN backend through these endpoints:

### Water Quality Reports
- `POST /api/reports/water` - Submit water quality report
- `GET /api/reports/water` - Get water quality reports

### Patient Reports
- `POST /api/reports/patient` - Submit patient report
- `GET /api/reports/patient` - Get patient reports

### Dashboard Data
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity

### Queries
- `POST /api/queries` - Submit user query
- `GET /api/queries/faq` - Get FAQ data

### File Uploads
- `POST /api/files/upload` - Upload images and documents

## App Structure

```
mobile-app/
├── src/
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.js
│   │   ├── ReportsScreen.js
│   │   ├── ReportTypeScreen.js
│   │   ├── WaterQualityFormScreen.js
│   │   ├── PatientReportFormScreen.js
│   │   ├── EducationScreen.js
│   │   ├── QueryScreen.js
│   │   └── FAQScreen.js
│   └── services/          # API services
│       └── api.js
├── App.js                 # Main app component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Key Features Implementation

### 1. Location Services
- Automatic GPS location detection
- Reverse geocoding for addresses
- Map integration with markers

### 2. Form Handling
- Comprehensive water quality testing forms
- Patient report forms with symptom selection
- Image upload capabilities
- Form validation

### 3. Data Synchronization
- Real-time data sync with backend
- Offline capability (can be extended)
- Error handling and retry mechanisms

### 4. User Experience
- Intuitive navigation
- Loading states and error messages
- Pull-to-refresh functionality
- Search and filtering

## Permissions Required

The app requires the following permissions:

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### iOS (ios/YourApp/Info.plist)
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to record report locations</string>
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to take photos for reports</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to attach images to reports</string>
```

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### App Store Deployment
1. Configure app signing in Expo
2. Build the app using Expo's build service
3. Download and submit to respective app stores

## Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_API_URL=http://your-backend-server:5000/api
EXPO_PUBLIC_MAPS_API_KEY=your-google-maps-api-key
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Android build issues**
   - Ensure Android SDK is properly installed
   - Check Java version compatibility

3. **iOS build issues**
   - Ensure Xcode is updated
   - Check iOS simulator version

4. **Network issues**
   - Verify backend server is running
   - Check API endpoint configuration
   - Ensure device/emulator can reach the server

### Debug Mode

Enable debug mode in the app:
1. Shake the device or press Ctrl+M (Android) / Cmd+D (iOS)
2. Select "Debug JS Remotely"
3. Open browser developer tools for debugging

## Contributing

1. Follow React Native and Expo best practices
2. Maintain consistent code style
3. Test on both iOS and Android platforms
4. Update documentation for new features

## Support

For technical support:
- Check Expo documentation: https://docs.expo.dev/
- React Native documentation: https://reactnative.dev/
- Backend API documentation in the main project

## License

This project is part of the Jal Drishti water health surveillance system.