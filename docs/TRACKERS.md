# Trackers Feature

The Trackers feature in Kimmy allows users to create and manage activity trackers for monitoring time, progress, and cumulative activities.

## Overview

Trackers are flexible tools that can be used to:

- **Time Tracking**: Start/stop timers for activities like reading, exercise, or work
- **Cumulative Logging**: Track multiple entries that sum up over time (e.g., pages read, miles run)

## Features

### 1. Time Tracking

- Start and stop timers for activities
- Real-time elapsed time display
- Automatic duration calculation
- Notes and tags for each session

### 2. Cumulative Logging

- Quick entry logging with custom values
- Support for various units (minutes, hours, count, pages, miles, etc.)
- Batch entry management

### 3. Flexible Configuration

- Custom icons and colors
- Configurable units (minutes, hours, count, custom)
- Optional descriptions and tags
- Household-based organization

### 4. History & Analytics

- Comprehensive entry history
- Filtering by date range and search terms
- Sorting by various criteria
- Statistics and summaries

## Usage

### Creating a Tracker

1. Navigate to the Trackers page for a household member
2. Click "New Tracker"
3. Fill in the required information:
   - **Name**: Descriptive name for the tracker
   - **Description**: Optional details about what it tracks
   - **Type**: Choose between "Time Tracking" or "Cumulative Log"
   - **Unit**: Select or create custom units
   - **Icon**: Choose from predefined icons
   - **Color**: Pick a color theme

### Time Tracking

1. **Start Tracking**:
   - Click "Start Tracking" on a time-based tracker
   - The timer will begin counting elapsed time
   - Add optional notes when starting

2. **Stop Tracking**:
   - Click "Stop" to end the session
   - Duration is automatically calculated
   - Add final notes if desired

### Quick Logging

1. **For Cumulative Trackers**:
   - Click "Quick Log"
   - Enter the value to log
   - Add optional notes and tags
   - Submit to record the entry

### Managing Entries

- **View History**: Click "View Details" on any tracker
- **Filter & Search**: Use the search bar and filters to find specific entries
- **Delete Entries**: Remove individual entries as needed
- **Edit Trackers**: Modify tracker settings and appearance

## Technical Implementation

### Database Schema

The feature uses two main tables:

#### `trackers`

- Basic tracker information (name, description, type, unit)
- Visual customization (icon, color)
- Household association and metadata

#### `tracker_entries`

- Individual time logs or cumulative entries
- Start/end times for time tracking
- Values, notes, and tags
- Active status for ongoing sessions

### API Endpoints

- **`/api/trackers`**: CRUD operations for trackers
- **`/api/tracker-entries`**: Entry management and time tracking

### Components

- **`TrackerCard`**: Individual tracker display with actions
- **`CreateTrackerForm`**: Form for creating/editing trackers
- **`TrackerHistory`**: Comprehensive history view with filters
- **`TrackerDetailPage`**: Detailed view of a single tracker

## Best Practices

### Time Tracking

- Use descriptive names for easy identification
- Add notes to track context and progress
- Stop timers when switching activities
- Review history regularly to identify patterns

### Cumulative Logging

- Choose appropriate units for your activity
- Use tags to categorize different types of entries
- Log entries promptly for accurate tracking
- Set realistic goals based on historical data

### Organization

- Group related trackers by category or purpose
- Use consistent naming conventions
- Leverage colors and icons for visual organization
- Archive or delete unused trackers

## Examples

### Reading Tracker

- **Type**: Cumulative Log
- **Unit**: Pages
- **Icon**: 📚
- **Use Case**: Track daily reading progress

### Exercise Tracker

- **Type**: Time Tracking
- **Unit**: Minutes
- **Icon**: 💪
- **Use Case**: Monitor workout duration

### Work Hours Tracker

- **Type**: Time Tracking
- **Unit**: Hours
- **Icon**: ⏰
- **Use Case**: Track billable hours

### Water Intake Tracker

- **Type**: Cumulative Log
- **Unit**: Glasses
- **Icon**: 💧
- **Use Case**: Monitor daily hydration

## Mobile Optimization

The tracker interface is fully responsive and mobile-friendly:

- Touch-friendly buttons and controls
- Optimized layouts for small screens
- Easy navigation between views
- Quick actions for common tasks

## Future Enhancements

Potential improvements for future versions:

- Goal setting and progress tracking
- Data export and reporting
- Integration with external services
- Advanced analytics and insights
- Reminder and notification systems
- Collaborative tracking for household activities
