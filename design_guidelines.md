# Construction Safety Platform - Reports Section Design Guidelines

## Design Approach
**Framework**: Enterprise Design System with Dark Theme Specialization
- Drawing from Linear's clean data presentation + Stripe's professional restraint + modern dark UI patterns
- Existing platform patterns: gradient cards, subtle animations, professional typography
- Dark foundation (slate-900/blue-900) with strategic blue/cyan gradient accents

## Core Visual Language

### Typography Hierarchy
- **Headings**: Inter or DM Sans - Bold weights (700-800)
  - H1: 2.5rem desktop, 1.875rem mobile
  - H2: 1.875rem desktop, 1.5rem mobile  
  - H3: 1.5rem desktop, 1.25rem mobile
- **Body**: Inter Regular (400), 1rem with 1.6 line-height
- **Labels/Meta**: Inter Medium (500), 0.875rem tracking-wide uppercase for section labels
- **Data**: Tabular numbers for statistics, JetBrains Mono for technical IDs

### Layout System
**Spacing Units**: Tailwind 4, 6, 8, 12, 16, 24 for consistent rhythm
- Section padding: py-16 md:py-24 for breathing room
- Card spacing: gap-6 for grid layouts
- Content max-width: max-w-7xl for wide layouts, max-w-4xl for report content
- Touch targets: min-h-11 (44px) for all interactive elements on mobile

## Reports Listing Page

### Hero Section (No Traditional Hero)
**Skip standard hero** - lead immediately with purpose-driven header bar:
- Full-width gradient bar (slate-900 to blue-900/20) with subtle border-b border-blue-500/10
- Left: "Safety Analysis Reports" heading + breadcrumb navigation
- Right: Primary CTA "Generate New Report" button with blue-500 to cyan-500 gradient background, white text
- Height: h-20 md:h-24 - compact and functional
- Include small shield/safety icon next to heading

### Reports Grid Section
**Multi-column card layout**:
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Each card: Dark background (slate-800/90) with blue-500/10 border, rounded-xl
- Gradient overlay top: linear blue-500/5 to transparent
- Hover state: Lift transform (translate-y-[-4px]) with enhanced blue glow border
- Card padding: p-6

**Card Content Structure** (top to bottom):
1. **Header row**: 
   - Report icon (document with sparkle) + Report Type badge (rounded-full bg-blue-500/20 text-blue-300 px-3 py-1)
   - Date (text-slate-400 text-sm) aligned right
2. **Title**: Report name/site - text-xl font-semibold text-white mb-2
3. **Metadata row**: Small chips showing Site Name, Inspector, Status (each with appropriate icons)
4. **Key metrics**: 2-column grid showing Issues Found, Risk Level with large numbers (gradient text blue to cyan) and labels
5. **Preview text**: 2 lines of executive summary (text-slate-300 text-sm line-clamp-2)
6. **Action row**: "View Full Report" link (text-blue-400 hover:text-blue-300) with arrow icon

**Filtering/Sorting Bar** (above grid):
- Horizontal layout: Filter chips (All, Critical, High Priority, Reviewed) + Sort dropdown + Search input
- Sticky position on scroll (sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 py-4)

### Empty State (when no reports)
- Centered illustration area with construction/clipboard icon (large, blue/cyan gradient)
- "No Reports Yet" heading
- Descriptive text encouraging first report generation
- Prominent "Generate Your First Report" CTA button

## Individual Report View Page

### Report Header
- Full-width gradient banner (slate-900 to blue-900) with h-32 md:h-40
- Back navigation arrow + "Back to Reports" link (top-left)
- Report title (center): Large heading with site name and date
- Action buttons (top-right): Download PDF, Share, Archive - each with icon + text on desktop, icon-only on mobile

### Report Content Layout
**Single column, max-w-4xl centered**:

1. **Executive Summary Card**:
   - Prominent gradient card (blue-500/10 to cyan-500/5 background)
   - Large "Executive Summary" label
   - Risk level indicator: Large circular badge with gradient ring showing severity
   - Key statistics: 3-4 metric cards in horizontal scroll on mobile, grid on desktop
   - Summary text: Well-spaced paragraphs with generous line-height

2. **Agent Analysis Cards**:
   - Stack of expandable cards (gap-6)
   - Each collapsed state: Agent name + icon, key finding preview, expand arrow
   - Expanded state: Full analysis content, findings list with checkmarks/alerts, recommendations
   - Expand/collapse: Smooth height transition (duration-300) with rotate animation on arrow
   - Alternate gradient accents per card (blue-500/5, cyan-500/5, indigo-500/5)

3. **Recommendations Section**:
   - Tabbed interface: Priority, Category, Timeline
   - Each recommendation: Card with priority badge, title, description, assigned owner, due date
   - Action checkboxes (if actionable)

4. **Data Visualizations** (if applicable):
   - Dark-themed charts with blue/cyan gradient fills
   - Clear axis labels (text-slate-400)
   - Interactive tooltips on hover

### Mobile Optimizations
- Stack all multi-column layouts to single column
- Sticky header with condensed actions (hamburger menu for secondary actions)
- Bottom action bar: Primary CTA fixed at bottom with safe area padding
- Swipe gestures for card navigation
- Collapsible sections default to collapsed on mobile

## Component Specifications

### Gradient Buttons
- Primary: bg-gradient-to-r from-blue-500 to-cyan-500, white text, rounded-lg, px-6 py-3
- Secondary: bg-slate-800 border border-blue-500/30, text-blue-300, hover enhances border opacity
- Glass-effect buttons on images: backdrop-blur-md bg-white/10 border border-white/20

### Status Badges
- Success: bg-emerald-500/20 text-emerald-300 border-emerald-500/30
- Warning: bg-amber-500/20 text-amber-300 border-amber-500/30
- Critical: bg-red-500/20 text-red-300 border-red-500/30
- Info: bg-blue-500/20 text-blue-300 border-blue-500/30
- All with rounded-full, px-3 py-1, text-xs font-medium

### Animation Strategy
- **Minimal and purposeful**: Subtle fade-ins on card appearance (duration-200)
- Page transitions: Fade + slight slide (16px)
- No distracting scroll animations
- Hover states: Transform scale (1.02) or translateY only, no complex sequences

## Images

### Hero Alternative Image
**Location**: Reports listing page, optional hero treatment if desired
**Description**: Wide abstract visualization of construction site safety data - geometric patterns, blueprint-style lines, with blue/cyan gradient overlay creating depth. Dark navy background with floating holographic safety elements (hard hats, caution symbols) rendered in translucent blue
**Placement**: If used, full-width h-64 md:h-80 with gradient overlay, content overlaid at bottom-third
**Treatment**: 50% opacity with heavy blue-900/70 overlay to maintain text readability

### Report Illustrations
**Location**: Throughout individual report cards
**Description**: Small isometric safety icons - construction worker silhouettes, site diagrams, equipment illustrations - all in monochromatic blue/cyan gradient style
**Placement**: Top-right corner of major section cards as decorative accents
**Size**: 80x80px to 120x120px, subtle opacity (30-40%)

### Data Visualization Backgrounds
**Location**: Behind chart sections
**Description**: Subtle grid patterns, topographic map lines, or mesh gradients in dark blue
**Treatment**: Very low opacity (5-10%) to add texture without distraction