# Analytics Components

This directory contains the analytics components for the Water Quality and Health Surveillance System.

## Components

### AnalyticsHub
The main analytics component that provides:
- Date and location filters
- Export functionality (CSV/Excel)
- Tab navigation between Data Explorer and Trend Analysis
- Filter management and state

### DataExplorer
Provides tabular data display with:
- Sortable columns
- Pagination
- Real-time filtering
- Summary statistics
- Case details display

### TrendAnalysis
Provides data visualization with:
- Line charts for case trends
- Doughnut charts for severity distribution
- Bar charts for age group analysis
- Water quality trend analysis
- Key insights summary

## Features

### Filtering
- Date range selection
- Location (district) filtering
- Severity level filtering
- Age group filtering
- Symptoms filtering
- Water source filtering

### Data Export
- CSV export with current filters applied
- Excel export with formatting
- Automatic file download with timestamp

### Visualizations
- Daily case trends over time
- Severity distribution pie chart
- Age group distribution bar chart
- Water quality parameter trends
- Multi-axis charts for correlation analysis

## API Integration

The components integrate with the following backend endpoints:
- `/api/analytics/cases` - Get filtered case data
- `/api/analytics/trends` - Get trend analysis data
- `/api/analytics/summary` - Get summary statistics
- `/api/analytics/water-quality` - Get water quality analytics
- `/api/analytics/export/csv` - Export data as CSV
- `/api/analytics/export/excel` - Export data as Excel

## Dependencies

- Chart.js and react-chartjs-2 for data visualization
- Axios for API calls
- React hooks for state management
- Tailwind CSS for styling

## Usage

The analytics components are automatically loaded when navigating to `/analytics` in the application. All filtering and export functionality is handled internally by the components.