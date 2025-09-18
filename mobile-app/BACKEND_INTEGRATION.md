# Backend Integration Guide

This guide explains how to connect the Jal Drishti mobile app to your MERN backend so all data appears on the website dashboard.

## 🔧 Setup Instructions

### 1. Configure Backend URL

Edit `src/config/config.js` and update the BASE_URL:

```javascript
export const API_CONFIG = {
  // For local development
  BASE_URL: 'http://YOUR_COMPUTER_IP:5000/api',
  
  // For production
  // BASE_URL: 'https://your-domain.com/api',
};
```

**Finding your computer's IP address:**
- **Windows:** Open Command Prompt → `ipconfig` → Look for IPv4 Address
- **macOS/Linux:** Open Terminal → `ifconfig` → Look for inet address
- **Example:** `http://192.168.1.100:5000/api`

### 2. Ensure Backend is Running

Make sure your backend server is running:

```bash
cd backend
npm start
```

The server should be accessible at `http://localhost:5000`

### 3. Test API Connection

You can test if the API is accessible from your mobile device:

1. Open browser on your phone
2. Navigate to `http://YOUR_COMPUTER_IP:5000/api/health`
3. You should see: `{"status":"OK","message":"Water Health Surveillance System API is running"}`

## 📱 Data Flow

### Water Quality Reports
- **Mobile App** → `POST /api/reports/water` → **Backend Database**
- **Website Dashboard** → `GET /api/reports/water` → **Display Reports**

### Patient Reports
- **Mobile App** → `POST /api/reports/patient` → **Backend Database**
- **Website Dashboard** → `GET /api/reports/patient` → **Display Reports**
- **Alert System** → Triggers health alerts for severe cases

### User Queries
- **Mobile App** → `POST /api/queries` → **Backend Database**
- **Admin Dashboard** → `GET /api/queries` → **Manage Queries**

### File Uploads
- **Mobile App** → `POST /api/files/upload` → **File Storage**
- **Images** → Stored and accessible via web dashboard

## 🔍 Data Structure

### Water Quality Report
```javascript
{
  location: {
    coordinates: [longitude, latitude],
    address: "Full address",
    district: "District name",
    waterSource: "River/Well/Tap/Pond"
  },
  testingParameters: {
    pH: 7.2,
    turbidity: 5.5,
    temperature: 25.0,
    dissolvedOxygen: 8.2
  },
  visualInspection: {
    color: "Clear",
    odor: "None",
    clarity: "Clear"
  },
  sampleCollection: {
    collectorName: "John Doe",
    collectorContact: "+1234567890",
    collectionDate: "2024-01-15",
    collectionTime: "14:30:00"
  },
  images: ["url1", "url2"],
  additionalNotes: "Additional observations",
  reportType: "water_quality",
  status: "pending",
  submittedVia: "mobile_app"
}
```

### Patient Report
```javascript
{
  patientInfo: {
    name: "Jane Doe",
    age: 35,
    gender: "female",
    contactNumber: "+1234567890"
  },
  location: {
    coordinates: [longitude, latitude],
    address: "Full address",
    district: "District name"
  },
  healthInfo: {
    symptoms: ["Diarrhea", "Fever", "Nausea"],
    suspectedDisease: "Cholera",
    severity: "moderate",
    onsetDate: "2024-01-14"
  },
  waterExposure: {
    waterSource: "Well water",
    exposureDate: "2024-01-13",
    otherExposed: 3
  },
  additionalNotes: "Patient details",
  reportType: "patient",
  status: "pending",
  submittedVia: "mobile_app"
}
```

## 🌐 Network Configuration

### For Physical Device Testing

1. **Ensure same WiFi network:** Both your computer (running backend) and mobile device must be on the same WiFi network

2. **Firewall settings:** Make sure your computer's firewall allows connections on port 5000

3. **Backend CORS:** Ensure your backend allows requests from mobile devices (should already be configured)

### For Production Deployment

1. **Deploy backend** to a cloud service (Heroku, AWS, etc.)
2. **Update BASE_URL** in `src/config/config.js` to your production URL
3. **Build mobile app** for app stores

## 🔧 Troubleshooting

### Common Issues

1. **"Network Error" or "Connection refused"**
   - Check if backend is running
   - Verify IP address in config
   - Ensure devices are on same network

2. **"CORS Error"**
   - Backend should have CORS enabled (already configured)
   - Check browser console for details

3. **"Timeout Error"**
   - Increase timeout in `src/services/api.js`
   - Check network connectivity

4. **Data not appearing on dashboard**
   - Check backend logs for errors
   - Verify database connection
   - Refresh dashboard page

### Debug Mode

Enable debug logging in the mobile app:

1. Open browser developer tools
2. Look for console logs starting with "API Request:" and "API Response:"
3. Check for error messages

## 📊 Dashboard Integration

Once connected, you'll see:

### On Website Dashboard
- **Reports Section:** All mobile submissions
- **Analytics:** Data from mobile reports
- **Alerts:** Health alerts triggered by patient reports
- **Maps:** Location markers from mobile GPS data
- **Admin Panel:** Query management

### Real-time Updates
- Reports appear immediately after mobile submission
- Statistics update automatically
- Health alerts trigger for severe patient cases
- All images uploaded via mobile are accessible

## 🚀 Production Checklist

- [ ] Backend deployed to production server
- [ ] Mobile app BASE_URL updated to production URL
- [ ] Database properly configured
- [ ] File upload storage configured
- [ ] HTTPS enabled for production
- [ ] Mobile app tested with production backend
- [ ] Dashboard tested with mobile data

## 📞 Support

If you encounter issues:
1. Check backend server logs
2. Verify network connectivity
3. Test API endpoints manually
4. Check mobile app console logs

The integration is complete and ready to use! All mobile data will automatically appear on your website dashboard! 🎉