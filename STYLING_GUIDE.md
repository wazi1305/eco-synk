# EcoSynk Styling & Design Guidelines

## 🎨 Design System

### Color Palette

#### Primary Colors
```
Green-50:    #f0fdf4  (Lightest - backgrounds)
Green-100:   #dcfce7
Green-200:   #bbf7d0
Green-300:   #86efac
Green-400:   #4ade80
Green-500:   #22c55e  (Gradient start)
Green-600:   #16a34a  (Primary action)
Green-700:   #15803d
Green-800:   #166534
```

#### Secondary Colors
```
Emerald-500: #10b981
Emerald-600: #059669  (Gradient end)
Emerald-700: #047857

Cyan-600:    #0891b2  (Accents)
Blue-600:    #2563eb  (Map page)

Teal-600:    #0d9488
```

#### Status Colors
```
Red-100:     #fee2e2  (High priority background)
Red-600:     #dc2626  (High priority text)

Yellow-100:  #fef3c7  (Medium priority background)
Yellow-600:  #d97706  (Medium priority text)

Green-100:   #dcfce7  (Low priority background)
Green-600:   #16a34a  (Low priority text)
```

#### Neutral Colors
```
Gray-50:     #f9fafb
Gray-100:    #f3f4f6
Gray-200:    #e5e7eb
Gray-300:    #d1d5db
Gray-500:    #6b7280
Gray-600:    #4b5563
Gray-700:    #374151
Gray-900:    #111827
```

#### Special Colors
```
White:       #ffffff
Black:       #000000
Orange-500:  #f97316  (Streak/fire color)
```

---

## 📏 Typography System

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Text Styles

#### Headings
```tailwind
text-3xl font-bold      /* H1: Page titles */
text-2xl font-bold      /* H2: Section headers */
text-lg font-bold       /* H3: Card titles */
text-base font-semibold /* Emphasis text */
```

#### Body Text
```tailwind
text-sm text-gray-600   /* Secondary text */
text-xs text-gray-500   /* Tertiary text */
text-base text-gray-900 /* Main body */
```

#### Special
```tailwind
font-bold text-green-600    /* Highlights */
opacity-90 text-white       /* Subtle overtext */
```

---

## 📐 Spacing System

### Base Unit: 4px (Tailwind rem unit = 1)

```tailwind
px-0   0px       py-0   0px
px-1   4px       py-1   4px
px-2   8px       py-2   8px
px-3   12px      py-3   12px
px-4   16px      py-4   16px
px-6   24px      py-6   24px
px-8   32px      py-8   32px
```

### Common Spacing Patterns

**Headers:**
```tailwind
px-4 py-4              /* Compact header */
px-4 pt-4 pb-6         /* With stats */
safe-area-inset-top    /* Notch support */
```

**Cards:**
```tailwind
px-4 py-3              /* Standard card */
rounded-lg             /* Corner radius */
shadow-sm              /* Subtle shadow */
border border-gray-100 /* Subtle border */
```

**Buttons:**
```tailwind
px-4 py-3              /* Standard */
px-6 py-4              /* Large */
rounded-lg             /* Rounded corners */
min-h-12               /* 44px minimum */
min-w-44 (if needed)   /* Touch target */
```

**Gaps:**
```tailwind
gap-2    8px   (tight)
gap-3    12px  (normal)
gap-4    16px  (loose)
gap-6    24px  (very loose)
```

---

## 🎯 Component Styling Patterns

### Headers (All Pages)

**Basic:**
```jsx
<div className="bg-green-600 text-white px-4 py-4 safe-area-inset-top">
  <h1 className="text-2xl font-bold">Title</h1>
</div>
```

**With Gradient:**
```jsx
<div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 pt-4 pb-6 safe-area-inset-top">
  {/* Content */}
</div>
```

**With Stats:**
```jsx
<div className="grid grid-cols-2 gap-2 mt-4">
  <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
    <div className="text-2xl font-bold">24</div>
    <div className="text-xs opacity-90">Label</div>
  </div>
</div>
```

### Activity Cards

```jsx
<div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden border border-gray-100">
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b border-gray-100">
    {/* Content */}
  </div>
  
  {/* Body */}
  <div className="px-4 py-3">
    {/* Content */}
  </div>
  
  {/* Footer */}
  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
    {/* Buttons */}
  </div>
</div>
```

### Buttons

**Primary Action:**
```jsx
<button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 min-h-12">
  Action
</button>
```

**Secondary Action:**
```jsx
<button className="bg-white border-2 border-green-600 text-green-600 px-6 py-4 rounded-lg font-bold hover:bg-green-50 transition-colors duration-200 min-h-12">
  Action
</button>
```

**Icon Button:**
```jsx
<button className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors duration-200">
  <span className="text-xl">❤️</span>
  <span className="text-sm font-medium">124</span>
</button>
```

### Progress Bars

**Simple:**
```jsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
    style={{ width: `${percentage}%` }}
  ></div>
</div>
```

### Status Badges

**High Priority:**
```jsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
  HIGH PRIORITY
</span>
```

**Medium Priority:**
```jsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
  MEDIUM PRIORITY
</span>
```

**Low Priority:**
```jsx
<span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">
  LOW PRIORITY
</span>
```

### Tabs

**Tab Navigation:**
```jsx
<div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-200 overflow-x-auto">
  <button
    className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap text-sm transition-all duration-200 min-h-10 ${
      isActive
        ? 'bg-green-600 text-white shadow-md'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    Tab Label
  </button>
</div>
```

---

## 🎬 Animations & Transitions

### Durations
```tailwind
duration-150  /* Quick feedback */
duration-200  /* Standard transition */
duration-300  /* Smooth animation */
```

### Common Animations

**Button Hover:**
```tailwind
hover:bg-green-700 transition-colors duration-200
```

**Scale Effect:**
```tailwind
hover:scale-110 active:scale-95 transition-transform duration-200
```

**Fade In:**
```tailwind
opacity-0 hover:opacity-100 transition-opacity duration-200
```

**Spin (Loading):**
```tailwind
<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
```

**Bounce:**
```tailwind
<div className="animate-bounce"></div>
```

**Pulse:**
```tailwind
<div className="animate-pulse"></div>
```

---

## 🌐 Responsive Design

### Breakpoints
```tailwind
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Common Patterns

**Grid Responsive:**
```tailwind
grid-cols-1        /* Mobile */
sm:grid-cols-2     /* Tablet */
md:grid-cols-3     /* Desktop */
lg:grid-cols-4     /* Large */
```

**Text Responsive:**
```tailwind
text-sm              /* Mobile */
sm:text-base         /* Tablet */
md:text-lg           /* Desktop */
```

---

## 📱 Mobile-First Guidelines

### Viewport
```css
/* In index.css */
html, body {
  height: 100%;
  overflow: hidden;
}

#root {
  height: 100%;
}

.app-container {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height */
}
```

### Safe Areas
```tailwind
safe-area-inset             /* All sides */
safe-area-inset-top         /* Notch top */
safe-area-inset-bottom      /* Home indicator */
safe-area-inset-left        /* Side notch */
safe-area-inset-right       /* Side notch */
```

### Touch Targets
```tailwind
min-h-12  /* 44px minimum height */
min-w-12  /* 44px minimum width */

/* Use on all buttons/clickable elements */
```

---

## 🎨 Dark Mode (Future)

### Setup Pattern
```jsx
// Would use Tailwind dark: prefix
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
```

---

## 📋 Design Checklist

- [ ] All headers use gradient backgrounds
- [ ] All buttons have min 44px height
- [ ] Safe area classes applied to fixed elements
- [ ] Consistent spacing (px-4, gap-3, etc.)
- [ ] Status colors match (Red/Yellow/Green)
- [ ] Hover states on interactive elements
- [ ] Transitions smooth (200ms)
- [ ] Mobile layout tested
- [ ] No horizontal scrolling (except tabs)
- [ ] Notch support active
- [ ] Contrast meets WCAG standards

---

## 🎯 Brand Voice

### Colors Mean:
- **Green:** Growth, environmental action, positive impact
- **Blue:** Trust, information, calmness (Map)
- **Red:** Urgency, high priority
- **Yellow:** Caution, medium priority
- **Gray:** Neutral, secondary information

### Tone:
- Encouraging and positive
- Action-oriented
- Clear and direct
- Friendly and approachable
- Gamified and fun

---

## 🔄 Reusable Patterns

### Card Container
```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
  {/* Content */}
</div>
```

### Stat Block
```jsx
<div className="text-center">
  <div className="text-2xl font-bold text-green-600">120</div>
  <div className="text-xs text-gray-600">Label</div>
</div>
```

### Action Row
```jsx
<div className="flex items-center justify-between space-x-2">
  <button>{/* Left action */}</button>
  <button>{/* Right action */}</button>
</div>
```

### List Item
```jsx
<div className="flex items-center justify-between p-4 border-b border-gray-100">
  <div className="flex-1 min-w-0">
    {/* Primary content */}
  </div>
  <div className="ml-4 flex-shrink-0">
    {/* Secondary content/icon */}
  </div>
</div>
```

---

## 🎓 Tailwind Tips

### Class Organization Order
```
1. Display/Layout     (flex, grid, block)
2. Sizing             (w-, h-, min-, max-)
3. Spacing            (p-, m-, gap-)
4. Colors             (bg-, text-, border-)
5. Typography         (font-, text-transform)
6. Effects            (shadow, opacity, filter)
7. Transitions        (hover:, active:, transition-)
8. Responsive         (sm:, md:, lg:)
9. Dark mode          (dark:)
10. Pseudo-classes    (:first-child, :last-child)
```

### Performance
- Only used classes are bundled
- Avoid arbitrary values when possible
- Use theme tokens consistently
- Remove unused custom CSS

---

## 📞 Design System Support

For questions about:
- **Colors:** Check color palette above
- **Spacing:** Use 4px multiples (Tailwind default)
- **Typography:** Follow heading/body styles
- **Components:** Reference component patterns
- **Animations:** Use standard transitions (200ms)

---

**Last Updated:** November 15, 2025  
**Tailwind Version:** 3.4.18  
**React Version:** 19.2.0
