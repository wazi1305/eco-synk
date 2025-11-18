# EcoSynk Component Architecture

## 📊 Component Hierarchy

```
App.jsx (Main Container)
│
├── State Management
│   ├── activeTab: 'feed' | 'camera' | 'map' | 'profile'
│   ├── windowHeight: calculated 100dvh
│   └── Event Listeners: resize, orientationchange
│
├── Viewport Handler
│   └── Updates --app-height on dimension changes
│
└── Layout Structure
    ├── Main Content Area (flex-1)
    │   ├── [activeTab === 'feed'] → FeedPage
    │   ├── [activeTab === 'camera'] → CameraPage
    │   ├── [activeTab === 'map'] → MapPage
    │   └── [activeTab === 'profile'] → ProfilePage
    │
    └── Bottom Navigation (fixed)
        ├── Feed Button (🏠)
        ├── Report Button (📸)
        ├── Map Button (🗺️)
        └── Profile Button (👤)
```

---

## 🏠 FeedPage Component Structure

```
FeedPage
├── State
│   ├── activities: Activity[]
│   └── isLoading: boolean
│
├── Methods
│   ├── loadMoreActivities()
│   └── toggleLike(id)
│
└── JSX Structure
    ├── Gradient Header
    │   ├── Title: "EcoSynk"
    │   └── Today's Impact Stats
    │       ├── Cleanups Count (12)
    │       ├── Items Collected (156)
    │       └── Volunteers (45)
    │
    ├── Section Label: "Recent Activity"
    │
    ├── Activity Cards Container
    │   └── For each activity:
    │       ├── Card Header
    │       │   ├── Avatar (emoji)
    │       │   ├── User Name
    │       │   └── Timestamp
    │       │
    │       ├── Card Body
    │       │   ├── Activity Description
    │       │   └── Stats Grid
    │       │       ├── Items/Points
    │       │       └── Volunteers/Points
    │       │
    │       └── Card Footer (Engagement)
    │           ├── Like Button (❤️/🤍)
    │           ├── Comment Button (💬)
    │           └── Share Button (📤)
    │
    └── Load More Button
        └── Displays loading state when pressed
```

---

## 👤 ProfilePage Component Structure

```
ProfilePage
├── State
│   ├── showAllAchievements: boolean
│   └── activeTab: 'overview' | 'achievements'
│
└── JSX Structure
    ├── Gradient Header
    │   ├── User Profile Section
    │   │   ├── Avatar (emoji)
    │   │   ├── Name: "Alex Green"
    │   │   ├── Rank: "Eco Warrior"
    │   │   └── Join Date: "March 2024"
    │   │
    │   └── Stats Grid (2x2)
    │       ├── Total Cleanups (24)
    │       ├── Total Points (420)
    │       ├── Items Collected (156)
    │       └── Streak (7 days) 🔥
    │
    ├── Tab Navigation
    │   ├── Overview Tab
    │   └── Achievements Tab
    │
    ├── Content Area
    │   ├── If activeTab === 'overview':
    │   │   ├── Your Stats Section
    │   │   │   ├── Cleanup Goal Progress (24/30)
    │   │   │   ├── Items Goal Progress (156/500)
    │   │   │   └── Points Goal Progress (420/1000)
    │   │   │
    │   │   ├── Quick Actions Section
    │   │   │   ├── Start Cleanup Button
    │   │   │   └── Leaderboard Button
    │   │   │
    │   │   └── Streak Info Box
    │   │       ├── Current Streak: 7 Days 🔥
    │   │       └── Motivational Message
    │   │
    │   └── If activeTab === 'achievements':
    │       ├── Achievement Summary
    │       │   └── "3 of 6 earned"
    │       │
    │       └── Achievement Grid
    │           └── For each achievement:
    │               ├── Icon
    │               ├── Name
    │               ├── Description
    │               ├── Status (earned/in-progress)
    │               └── Progress (if not earned)
    │
    └── Show All Button (if collapsed)
```

---

## 📸 CameraPage Component Structure

```
CameraPage
├── Refs
│   └── webcamRef: reference to Webcam
│
├── State
│   ├── capturedImage: string | null
│   ├── isAnalyzing: boolean
│   ├── analysisResult: AnalysisData | null
│   ├── submitted: boolean
│   └── windowHeight: calculated height
│
├── Effects
│   └── updateViewportHeight on resize
│
├── Methods
│   ├── capture()
│   ├── retake()
│   ├── submitReport()
│   └── confirmSubmission()
│
└── JSX Structure
    ├── Gradient Header
    │   ├── Title & Description
    │   ├── Points Display (420)
    │   └── Quick Stats
    │       ├── Streak (7 🔥)
    │       └── Cleanups (24 🧹)
    │
    ├── Main Content Area
    │   ├── If NOT capturedImage:
    │   │   ├── Webcam Stream
    │   │   ├── Center Guide Circle
    │   │   └── Floating Capture Button
    │   │       └── Pulsing green circle
    │   │
    │   └── If capturedImage:
    │       ├── Image Preview
    │       │
    │       ├── If isAnalyzing:
    │       │   └── Loading Overlay
    │       │       ├── Spinning loader
    │       │       ├── "AI Analyzing Trash"
    │       │       └── Bouncing dots
    │       │
    │       ├── If submitted && analysisResult:
    │       │   └── Success Modal
    │       │       ├── Success Icon (✅)
    │       │       ├── Title
    │       │       ├── Analysis Results
    │       │       │   ├── Material Type
    │       │       │   ├── Priority Level
    │       │       │   ├── Items Detected
    │       │       │   └── Points Earned
    │       │       └── Capture Another Button
    │       │
    │       └── Action Buttons (if not submitted)
    │           ├── Retake Button
    │           └── Analyze & Submit Button
```

---

## 🗺️ MapPage Component Structure

```
MapPage
├── State
│   ├── selectedFilter: 'all' | 'high' | 'medium' | 'low'
│   └── selectedReport: Report | null
│
├── Constants/Helpers
│   ├── getPriorityColor(priority)
│   ├── getPriorityEmoji(priority)
│   └── getStatusEmoji(status)
│
├── Computed
│   ├── filteredReports: Report[]
│   └── stats: { total, high, medium, low }
│
└── JSX Structure
    ├── Gradient Header (Blue)
    │   ├── Title: "Trash Map"
    │   └── Stats Overview
    │       ├── Total Reports (5)
    │       └── High Priority Count (2)
    │
    ├── Filter Tabs (Horizontal Scroll)
    │   ├── All Tab (5)
    │   ├── High Priority Tab 🔴 (2)
    │   ├── Medium Priority Tab 🟡 (2)
    │   └── Low Priority Tab 🟢 (1)
    │
    ├── Reports List Container
    │   └── If reports exist:
    │       └── For each filtered report:
    │           ├── Report Card (Expandable)
    │           │   ├── Header
    │           │   │   ├── Location (📍)
    │           │   │   ├── Reporter
    │           │   │   ├── Timestamp
    │           │   │   └── Priority Emoji
    │           │   │
    │           │   ├── Stats Row
    │           │   │   ├── Items Count
    │           │   │   ├── Distance (km)
    │           │   │   └── Status
    │           │   │
    │           │   ├── Priority Badge
    │           │   │
    │           │   └── If expanded:
    │           │       ├── Details Box
    │           │       └── Action Buttons
    │           │           ├── Get Directions
    │           │           └── Join Cleanup
    │       │
    │       └── If NO reports:
    │           ├── Empty State Icon (✨)
    │           ├── Message
    │           └── Report Trash Button
    │
    └── Priority Legend (Fixed Footer)
        ├── 🔴 High
        ├── 🟡 Medium
        └── 🟢 Low
```

---

## 🔄 Data Flow

### Navigation Flow
```
App (activeTab)
  ↓ (setState)
  ├── 'feed' → FeedPage component renders
  ├── 'camera' → CameraPage component renders
  ├── 'map' → MapPage component renders
  └── 'profile' → ProfilePage component renders
```

### FeedPage Data Flow
```
Mock MOCK_ACTIVITIES
  ↓
  State: activities
  ↓ (toggleLike)
  Update like count in activity
  ↓
  Re-render with updated data
```

### CameraPage Data Flow
```
Webcam
  ↓ (capture)
  capturedImage state
  ↓ (submit)
  isAnalyzing state
  ↓ (API call - 2s)
  analysisResult state
  ↓ (confirm)
  Reset to initial state
```

### MapPage Data Flow
```
Mock TRASH_REPORTS
  ↓ (filter)
  filteredReports (computed)
  ↓ (select)
  selectedReport state
  ↓ (expand)
  Show details and actions
```

---

## 📦 Props & State Reference

### App.jsx
```javascript
State:
- activeTab: 'feed' | 'camera' | 'map' | 'profile'
- windowHeight: string (calculated px)

Effects:
- Update viewport height on resize/orientation change

No Props
```

### FeedPage.jsx
```javascript
Constants:
- MOCK_ACTIVITIES: Activity[]
- TODAY_IMPACT: { cleanups, itemsCollected, volunteers }

State:
- activities: Activity[]
- isLoading: boolean

Handlers:
- loadMoreActivities(): void
- toggleLike(id: number): void

No Props
```

### CameraPage.jsx
```javascript
Constants:
- USER_STATS: { points, streak, cleanups }

Refs:
- webcamRef: Webcam

State:
- capturedImage: string | null
- isAnalyzing: boolean
- analysisResult: AnalysisData | null
- submitted: boolean
- windowHeight: string

Effects:
- Update viewport height on resize

Handlers:
- capture(): void
- retake(): void
- submitReport(): Promise<void>
- confirmSubmission(): void

No Props
```

### MapPage.jsx
```javascript
Constants:
- TRASH_REPORTS: Report[]

Helpers:
- getPriorityColor(priority): string
- getPriorityEmoji(priority): string
- getStatusEmoji(status): string

State:
- selectedFilter: 'all' | 'high' | 'medium' | 'low'
- selectedReport: Report | null

Computed:
- filteredReports: Report[]
- stats: { total, high, medium, low }

Handlers:
- setSelectedFilter(filter): void
- setSelectedReport(report): void

No Props
```

### ProfilePage.jsx
```javascript
Constants:
- USER_DATA: UserProfile
- ACHIEVEMENTS: Achievement[]

State:
- showAllAchievements: boolean
- activeTab: 'overview' | 'achievements'

Computed:
- earnedCount: number
- displayedAchievements: Achievement[]

Handlers:
- setShowAllAchievements(bool): void
- setActiveTab(tab): void

No Props
```

---

## 🎨 Reusable Component Patterns

### Pattern 1: Card Container
```jsx
<div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden border border-gray-100">
  {/* Card Header */}
  <div className="p-4 border-b border-gray-100">{/* ... */}</div>
  
  {/* Card Body */}
  <div className="px-4 py-3">{/* ... */}</div>
  
  {/* Card Footer */}
  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">{/* ... */}</div>
</div>
```

### Pattern 2: Stat Block
```jsx
<div className="text-center">
  <div className="text-3xl font-bold text-green-600">{value}</div>
  <div className="text-xs text-gray-600">Label</div>
</div>
```

### Pattern 3: Progress Bar
```jsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
    style={{ width: `${percentage}%` }}
  ></div>
</div>
```

### Pattern 4: List Item
```jsx
<div className="flex items-center justify-between p-4 border-b border-gray-100">
  <div className="flex items-center space-x-3 flex-1">
    {/* Left content */}
  </div>
  <div className="flex-shrink-0">
    {/* Right content */}
  </div>
</div>
```

### Pattern 5: Button Grid
```jsx
<div className="grid grid-cols-2 gap-3">
  <button className="...">Action 1</button>
  <button className="...">Action 2</button>
</div>
```

---

## 📱 Mobile Considerations in Each Component

### FeedPage
- Scrollable container with bottom padding
- Touch-friendly activity cards
- Large tap targets for engagement buttons
- Optimized for portrait mode

### CameraPage
- Full screen video capture
- Bottom-fixed capture button
- Proper notch handling
- Landscape orientation support

### MapPage
- Horizontal scroll for filter tabs
- Expandable cards (no overflow)
- Bottom legend with padding
- Mobile-optimized list

### ProfilePage
- Tab navigation at top
- Scrollable content area
- Bottom safe area padding
- Portrait-optimized layout

---

## 🔐 Error Handling

### Current Implementation
```javascript
try {
  // Operation
} catch (error) {
  console.error('Error message:', error);
  // Fallback or retry
}
```

### Ready for Backend
- Error boundaries (React)
- Network error handling
- Retry logic
- User feedback

---

## 🎯 Performance Optimizations

1. **Component Rendering**
   - Only active tab renders
   - No unnecessary re-renders

2. **CSS Performance**
   - Tailwind utility classes (cached)
   - GPU-accelerated transforms
   - Smooth 200ms transitions

3. **Image Handling**
   - Emojis (no image files)
   - No large image processing

4. **State Management**
   - Minimal state per component
   - No deep nesting
   - Local state preferred

---

## 🧪 Testing Structure

```
App Tests
├── Navigation between tabs
├── Active tab highlighting
└── Viewport height handling

FeedPage Tests
├── Activity rendering
├── Like toggle
└── Load more

CameraPage Tests
├── Image capture
├── Analysis flow
└── Success display

MapPage Tests
├── Filter functionality
├── Report expansion
└── Action buttons

ProfilePage Tests
├── Tab switching
├── Progress display
└── Achievement list
```

---

**Architecture Design:** React Functional Components  
**State Management:** React Hooks (useState)  
**Styling System:** Tailwind CSS Utilities  
**Responsive:** Mobile-first design  
**Accessibility:** Semantic HTML + ARIA labels
