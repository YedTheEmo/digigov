# DigiGov Design Guide

> A comprehensive design system guide for the DigiGov government procurement application

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Library](#component-library)
6. [Animation & Motion](#animation--motion)
7. [Accessibility Standards](#accessibility-standards)
8. [Dark Mode](#dark-mode)
9. [Design Patterns](#design-patterns)
10. [Best Practices](#best-practices)

---

## Design Philosophy

### Core Principles

**1. Dual Design Directions: Legacy Government + Modern SaaS**
- Two first-class visual themes:
  - **Legacy Gov** – current gov.uk-inspired aesthetic, more austere, higher contrast, flag header.
  - **Modern Hub** – HubSpot-inspired SaaS look: softer neutrals, rounded surfaces, elevated cards, and more white space.
- Both themes share the same information architecture, accessibility standards, and component library.
- Users can switch between themes at runtime via the **Appearance / Settings** panel.

**2. Accessibility First**
- WCAG 2.1 AA compliance minimum
- Keyboard navigation support
- Screen reader optimization
- High contrast modes
- Clear focus indicators

**3. Progressive Disclosure**
- Information revealed as needed
- Minimize cognitive load
- Clear hierarchy and structure
- Contextual actions

**4. Responsive & Adaptive**
- Mobile-first approach
- Fluid layouts
- Touch-friendly targets (min 48px)
- Graceful degradation

**5. Performance-Optimized**
- Fast load times
- Smooth animations (60fps)
- Optimistic UI updates
- Progressive enhancement

### HubSpot-Inspired SaaS Experience (Modern Hub Theme)

- **Layout:** Compact sidebar with icon-first navigation, slim header, and generous content canvas.
- **Cards & surfaces:** Light, elevated cards with subtle shadows and soft border radii.
- **Navigation:** Clear hierarchy with grouped flyout menus, powerful global search, and an AI assistant entry point.
- **Tone:** Product-like and approachable, while still appropriate for government/enterprise workflows.
- **Motion:** Subtle micro-interactions for hover, focus, and transitions that reinforce hierarchy without being flashy.

---

## Color System

### Primary Brand Colors

The application uses a **gov.uk inspired green** as its primary brand color, conveying trust, authority, and environmental responsibility.

#### Light Mode
```css
/* Primary Brand - Government Green */
--color-primary: #00703c          /* Main brand color */
--color-primary-hover: #005a30    /* Hover/pressed state */
--color-primary-light: #f0fdf4    /* Light tint for backgrounds */

/* Background Colors */
--color-bg-primary: #ffffff       /* Main background */
--color-bg-secondary: #f9fafb     /* Secondary background */
--color-bg-tertiary: #f3f4f6      /* Tertiary background */
--color-bg-hover: #f9fafb         /* Hover state */
--color-bg-accent: #f0fdf4        /* Accent background */

/* Text Colors */
--color-text-primary: #1f2937     /* Primary text */
--color-text-secondary: #4b5563   /* Secondary text */
--color-text-tertiary: #6b7280    /* Tertiary/disabled text */
--color-text-inverse: #ffffff     /* Text on dark backgrounds */

/* Border Colors */
--color-border-primary: #e5e7eb   /* Default borders */
--color-border-secondary: #d1d5db /* Emphasized borders */
--color-border-focus: #00703c     /* Focus ring */
```

#### Dark Mode
```css
/* Primary Brand - Lighter Green for Dark Mode */
--color-primary: #5cb85c
--color-primary-hover: #6fcf6f
--color-primary-light: #1a3a2e

/* Background Colors */
--color-bg-primary: #1a1d23       /* Main background */
--color-bg-secondary: #111318     /* Darker background */
--color-bg-tertiary: #242830      /* Card/elevated surfaces */
--color-bg-hover: #2a2e38         /* Hover state */
--color-bg-accent: #1a3a2e        /* Accent background */

/* Text Colors */
--color-text-primary: #f9fafb     /* Primary text */
--color-text-secondary: #d1d5db   /* Secondary text */
--color-text-tertiary: #9ca3af    /* Tertiary/disabled text */
--color-text-inverse: #1a1d23     /* Text on light backgrounds */

/* Border Colors */
--color-border-primary: #374151
--color-border-secondary: #4b5563
--color-border-focus: #5cb85c
```

### Semantic Colors

#### Success States
```css
--color-success: #00703c (light) / #5cb85c (dark)
--color-success-light: #f0fdf4 (light) / #1a3a2e (dark)
```
**Usage:** Completed actions, successful validations, positive feedback

#### Warning States
```css
--color-warning: #f59e0b (light) / #fbbf24 (dark)
--color-warning-light: #fffbeb (light) / #3d2817 (dark)
```
**Usage:** Cautionary messages, pending approvals, important notices

#### Error States
```css
--color-error: #d4351c (light) / #f87171 (dark)
--color-error-light: #fef2f2 (light) / #3d1a1a (dark)
```
**Usage:** Validation errors, failed operations, destructive actions

#### Info States
```css
--color-info: #1d70b8 (light) / #60a5fa (dark)
--color-info-light: #eff6ff (light) / #1a2d3d (dark)
```
**Usage:** Informational messages, tips, neutral notifications

### Color Usage Guidelines

1. **Primary Green:** Use for primary CTAs, active states, focus rings
2. **Grays:** Use for text hierarchy, borders, backgrounds
3. **Semantic Colors:** Always use contextually (success=green, error=red, etc.)
4. **Contrast Ratios:**
   - Normal text: 4.5:1 minimum
   - Large text (18pt+): 3:1 minimum
   - UI components: 3:1 minimum

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

**Rationale:** System fonts ensure optimal performance, familiarity, and native OS integration.

### Type Scale

```css
/* Font Sizes */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px (18px root) */
--font-size-lg: 1.125rem;   /* 18px (20.25px) */
--font-size-xl: 1.25rem;    /* 20px (22.5px) */
--font-size-2xl: 1.5rem;    /* 24px (27px) */
--font-size-3xl: 2rem;      /* 32px (36px) */
--font-size-4xl: 3rem;      /* 48px (54px) */

/* Line Heights */
--line-height-tight: 1.25;    /* Headings */
--line-height-normal: 1.5;    /* Body text */
--line-height-relaxed: 1.75;  /* Long-form content */
```

### Base Font Size
**Root: 18px** - Larger than typical web default (16px) to enhance readability for all users, especially on government/enterprise applications where longer reading sessions are common.

### Type Hierarchy

#### Heading Styles
```css
.text-heading-1 { 
  font-size: 3rem;        /* 54px */
  line-height: 1.25;
  font-weight: 700;
}

.text-heading-2 { 
  font-size: 2rem;        /* 36px */
  line-height: 1.25;
  font-weight: 600;
}

.text-heading-3 { 
  font-size: 1.5rem;      /* 27px */
  line-height: 1.5;
  font-weight: 600;
}
```

#### Body Styles
```css
.text-body-lg {
  font-size: 1.125rem;    /* 20.25px */
  line-height: 1.5;
}

.text-body {
  font-size: 1rem;        /* 18px */
  line-height: 1.5;
}

.text-small {
  font-size: 0.875rem;    /* 15.75px */
  line-height: 1.5;
}
```

### Typography Best Practices

1. **Heading Usage:**
   - H1: Page titles (one per page)
   - H2: Major section headings
   - H3: Subsections
   - Maintain semantic hierarchy

2. **Body Text:**
   - Use `text-body` (18px) for primary content
   - Maximum line length: 75 characters for optimal readability
   - Paragraph spacing: 1.5rem (27px)

3. **Font Weights:**
   - 400 (Regular): Body text
   - 500 (Medium): UI labels, emphasis
   - 600 (Semibold): Section titles, card headers
   - 700 (Bold): Page headings

4. **Text Colors:**
   - Primary text: Maximum contrast
   - Secondary text: Metadata, labels
   - Tertiary text: Placeholder, disabled states

---

## Spacing & Layout

### Spacing Scale

```css
--spacing-1: 0.5rem;   /* 8px */
--spacing-2: 1rem;     /* 16px */
--spacing-3: 1.5rem;   /* 24px */
--spacing-4: 2rem;     /* 32px */
--spacing-5: 2.5rem;   /* 40px */
--spacing-6: 3rem;     /* 48px */
--spacing-8: 4rem;     /* 64px */
```

**System:** 8px base grid - all spacing multiples of 8px for visual rhythm.

### Container Padding (Responsive)

```css
/* Mobile: 320px+ */
--container-padding-mobile: 1rem;     /* 16px */

/* Tablet: 768px+ */
--container-padding-tablet: 1.5rem;   /* 24px */

/* Desktop: 1024px+ */
--container-padding-desktop: 2rem;    /* 32px */

/* Ultra-wide: 1920px+ */
--container-padding-ultra: 3rem;      /* 48px */
```

### Layout Structure

#### Dashboard Layout
```
┌──────────────────────────────────────────────────────┐
│  Sidebar (72px / 224px) │  Header (72–88px height)  │
│                        ├────────────────────────────┤
│  - Icon-first nav      │                            │
│  - Hover flyout menus  │  Main Content Area         │
│  - Role-based          │  (max-width: 1920px)       │
│                        │  (padding: responsive)     │
│                        │                            │
│                        │                            │
└──────────────────────────────────────────────────────┘
```

**Sidebar (Modern Hub default):**
- Default width: **72px collapsed** (icon-only), **224px expanded** (icon + label).
- Icon-first, text labels revealed on hover or in expanded state.
- Flyout menus group related destinations per icon (e.g. Procurement, Finance, Reports).
- Fixed position, smooth width transition.
- Role-based navigation visibility.

**Header:**
- Height: 72–88px (significantly smaller than the Legacy Gov flag header).
- Content: breadcrumbs, workspace context, **program-wide search**, **AI assistant trigger**, settings, and user menu.
- Background: solid or subtly tinted surface that works across both Legacy Gov and Modern Hub themes (no requirement for a large image banner).

**Main Content:**
- Max-width: 1920px, centered with auto margins.
- Responsive padding (16px → 48px).
- Uses cards, tables, and tabs that adapt to density settings (comfortable vs compact).

### Breakpoints

```css
/* Mobile First Approach */
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1920px  /* Ultra-wide */
```

### Grid System

**Fluid Grid:** Uses CSS Grid and Flexbox
- No fixed column system
- Content-first layouts
- Responsive by default

---

## Component Library

### Button Component

#### Variants

**1. Primary (Call-to-Action)**
```tsx
<Button variant="primary">Create Case</Button>
```
- Green background (#00703c)
- White text
- Shadow elevation
- Use for main actions

**2. Default (Standard)**
```tsx
<Button variant="default">Save</Button>
```
- Dark gray background
- White text
- Use for standard actions

**3. Secondary (Alternative)**
```tsx
<Button variant="secondary">Cancel</Button>
```
- Light gray background
- Dark text with border
- Use for secondary actions

**4. Outline (Ghost Border)**
```tsx
<Button variant="outline">View Details</Button>
```
- Transparent background
- Bordered with hover effect
- Use for tertiary actions

**5. Ghost (Subtle)**
```tsx
<Button variant="ghost">Edit</Button>
```
- Transparent background
- Subtle hover state
- Use for inline/contextual actions

**6. Destructive (Danger)**
```tsx
<Button variant="destructive">Delete</Button>
```
- Red background
- White text
- Use for destructive actions

**7. Link (Text Link)**
```tsx
<Button variant="link">Learn more</Button>
```
- No background/border
- Underline on hover
- Use for navigation links

#### Sizes
```tsx
<Button size="sm">Small</Button>    /* min-height: 48px */
<Button size="md">Medium</Button>   /* min-height: 52px (default) */
<Button size="lg">Large</Button>    /* min-height: 56px */
```

**Accessibility:** All buttons meet 48px touch target minimum (except link variant).

#### States
```tsx
<Button loading={true}>Processing...</Button>
<Button disabled={true}>Disabled</Button>
<Button leftIcon={<Icon />}>With Icon</Button>
```

### Card Component

```tsx
<Card hover={true} onClick={handleClick}>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    Main card content
  </CardContent>
  <CardFooter>
    Footer actions
  </CardFooter>
</Card>
```

**Anatomy:**
- Background: White (light) / #242830 (dark)
- Border: 1px solid with dark mode support
- Border radius: 0.5rem (8px)
- Shadow: Subtle elevation
- Padding: 32px (2rem) per section

**Usage:**
- Container for related information
- Hover effect for interactive cards
- Consistent spacing and hierarchy

### Input Component

```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="Enter email"
  error="Invalid email"
  helperText="We'll never share your email"
  leftIcon={<IconMail />}
  rightIcon={<IconCheck />}
  required
/>
```

**Features:**
- Floating labels
- Inline validation
- Helper text support
- Icon support (left/right)
- Accessible error messages
- Min-height: 48px
- Focus ring: 2px green

### Select Component

```tsx
<Select label="Choose option" error="Required">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

**Styling:** Consistent with Input component

### Badge Component

```tsx
<Badge variant="success" size="md" dot={true}>
  Completed
</Badge>
```

**Variants:**
- default, primary, success, warning, error, info
- pending, completed, cancelled (workflow states)

**Styles:**
- solid (default): Filled background
- outline: Bordered, transparent

**Sizes:**
- sm: Small (10px padding)
- md: Medium (12px padding)
- lg: Large (14px padding)

### Modal Component

```tsx
<Modal open={isOpen} onClose={handleClose} size="lg">
  <ModalHeader onClose={handleClose}>
    Modal Title
  </ModalHeader>
  <ModalBody>
    Modal content
  </ModalBody>
  <ModalFooter>
    <Button onClick={handleClose}>Cancel</Button>
    <Button variant="primary">Confirm</Button>
  </ModalFooter>
</Modal>
```

**Sizes:**
- sm: 448px (28rem)
- md: 512px (32rem) - default
- lg: 672px (42rem)
- xl: 896px (56rem)
- full: 90vw

**Features:**
- Backdrop overlay (50% black)
- ESC key to close
- Click outside to close (configurable)
- Body scroll lock
- Fade-in animation
- Slide-up animation
- Accessible (role="dialog", aria-modal)

### Table Component

```tsx
<Table striped={true}>
  <THead>
    <TR>
      <TH sortable onSort={handleSort}>Name</TH>
      <TH>Status</TH>
    </TR>
  </THead>
  <TBody>
    <TR hover onClick={handleRowClick}>
      <TD>John Doe</TD>
      <TD>Active</TD>
    </TR>
  </TBody>
</Table>
```

**Features:**
- Responsive with horizontal scroll
- Striped rows (optional)
- Hover states
- Sortable columns
- Dark mode support
- Consistent padding (24px)

### Tabs Component

```tsx
<Tabs defaultValue="tab1" onChange={handleChange}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

**Styling:**
- Pill-style tabs
- Gray background container
- White active tab with shadow
- Smooth transitions
- Fade-in animation for content

### Alert Component

```tsx
<Alert 
  variant="warning" 
  title="Warning" 
  dismissible 
  onDismiss={handleDismiss}
>
  Alert message content
</Alert>
```

**Variants:** info, success, warning, error
**Features:** Title, dismissible, icon indicators

### Dropdown Component

```tsx
<Dropdown trigger={<Button>Menu</Button>} align="end">
  <DropdownLabel title="User" subtitle="email@example.com" />
  <DropdownDivider />
  <DropdownItem icon={<Icon />} onClick={handleAction}>
    Action
  </DropdownItem>
  <DropdownItem destructive>Delete</DropdownItem>
</Dropdown>
```

**Features:**
- Click outside to close
- ESC key to close
- Left/right alignment
- Icon support
- Destructive variant
- Smooth slide-down animation

### Progress Component

```tsx
<Progress 
  value={60} 
  max={100} 
  size="md" 
  variant="success" 
  showLabel 
/>
```

**Variants:** default, success, warning, error
**Sizes:** sm (4px), md (8px), lg (12px)

### Spinner Component

```tsx
<Spinner size="md" />
```

**Sizes:** sm (16px), md (32px), lg (48px)
**Animation:** Smooth rotation with motion-reduce support

### Empty State Component

```tsx
<EmptyState
  title="No items found"
  description="Get started by creating your first item"
  icon={<Icon />}
  action={<Button>Create Item</Button>}
/>
```

**Usage:** Placeholder for empty lists, search results, etc.

### Tooltip Component

```tsx
<Tooltip content="Helpful text" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

**Positions:** top, bottom, left, right
**Features:** 300ms delay, fade-in animation

### Skeleton Component

```tsx
<Skeleton variant="rectangular" width={200} height={40} />
<SkeletonText lines={3} />
```

**Variants:** text, circular, rectangular
**Usage:** Loading states

---

## Animation & Motion

### Design Principles

1. **Purposeful:** Every animation serves a function
2. **Subtle:** Enhance, don't distract
3. **Performant:** 60fps, GPU-accelerated
4. **Respectful:** Honor prefers-reduced-motion

### Timing Functions

```css
/* Easing Curves */
--transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 180ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 260ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Standard Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` - "ease-in-out" for natural motion

### Keyframe Animations

```css
/* Fade In */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Slide Down */
@keyframes slide-down {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Pulse (Loading) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Spin */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Shake (Error) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
```

### Usage Classes

```css
.animate-fade-in { animation: fade-in var(--transition-base); }
.animate-slide-up { animation: slide-up var(--transition-base); }
.animate-slide-down { animation: slide-down var(--transition-base); }
.animate-pulse { animation: pulse 2s infinite; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-shake { animation: shake 0.5s; }
```

### Motion Patterns

#### Page Transitions
- New content: Fade in (180ms)
- List items: Staggered slide-up (50ms delay per item)

#### Hover Effects
- Buttons: Color transition (120ms)
- Cards: Shadow + background (200ms)
- Links: Color + underline (120ms)

#### Focus States
- Ring appearance: Instant (no animation)
- Ensures visibility for keyboard navigation

#### Loading States
- Spinners: Continuous rotation
- Skeletons: Pulse animation (2s)
- Progress bars: Smooth fill (300ms)

### Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Respect user preferences** - Users with vestibular disorders may disable animations

---

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

#### Color Contrast
- **Text:** 4.5:1 minimum (normal), 3:1 (large 18pt+)
- **UI Components:** 3:1 minimum
- **Focus Indicators:** 3:1 minimum

All colors in the design system meet these requirements.

#### Focus Management

```css
*:focus-visible {
  outline: 3px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

**Features:**
- Visible focus rings (3px solid)
- Green color (#00703c light, #5cb85c dark)
- 2px offset for visibility
- Applied consistently across all interactive elements

#### Keyboard Navigation

**Required Support:**
- Tab/Shift+Tab: Navigate between focusable elements
- Enter/Space: Activate buttons and links
- Escape: Close modals and dropdowns
- Arrow keys: Navigate within components (tabs, dropdowns)

**Interactive Elements:**
- All clickable elements keyboard accessible
- Logical tab order
- Skip links for main content
- Trapped focus in modals

#### Screen Reader Support

**Semantic HTML:**
```html
<nav aria-label="Main navigation">
<button aria-label="Close modal" aria-expanded="true">
<div role="dialog" aria-modal="true" aria-labelledby="title">
<input aria-invalid="true" aria-describedby="error-message">
```

**ARIA Labels:**
- Meaningful button labels
- Expanded/collapsed states
- Live regions for dynamic content
- Error associations

#### Skip Links

```tsx
<a href="#main-content" className="skip-to-main">
  Skip to main content
</a>
```

**Features:**
- Hidden by default
- Visible on focus
- Positioned at document top
- Links to main content area

#### Touch Targets

**Minimum Size:** 48x48px
- Buttons: min-height 48px (sm), 52px (md), 56px (lg)
- Interactive elements: 48px minimum
- Adequate spacing between targets

#### Form Accessibility

**Labels:**
- Every input has associated label
- Required field indicators
- Clear error messages
- Helper text support

**Validation:**
```tsx
<Input
  label="Email"
  error="Please enter a valid email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
```

#### Motion & Animation

**Respect Preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  /* Minimal animation */
}
```

---

## Dark Mode

### Implementation Strategy

**1. CSS Variables Approach**
- All colors defined as CSS variables
- Variables switch based on `.dark` class
- Applied to `<html>` element

**2. Toggle Mechanism**
```tsx
// ThemeContext provides theme state
const { theme, toggleTheme } = useTheme();
```

**3. Persistence**
- Saved to localStorage
- Respects system preference (`prefers-color-scheme`)
- No flash of unstyled content (FOUC)

### Dark Mode Colors

**Principles:**
1. **Not Inverted:** Not pure black/white reversal
2. **Reduced Contrast:** Softer on eyes in dark environments
3. **Elevated Surfaces:** Lighter surfaces appear "closer"
4. **Adjusted Primaries:** Green becomes lighter (#5cb85c) for better visibility

**Background Hierarchy:**
```
Darkest (#0d0f12) → Base (#1a1d23) → Elevated (#242830) → Hover (#2a2e38)
```

**Border Contrast:**
- Borders are more prominent in dark mode
- Ensures component boundaries remain clear

### Component Dark Mode Support

**All components support dark mode:**
- Automatic color switching via CSS variables
- Tailwind dark: variants
- No component-level theme logic needed

**Example:**
```tsx
<div className="bg-white dark:bg-[#242830] text-gray-900 dark:text-gray-100">
```

---

## Design Patterns

### Navigation Patterns

#### Sidebar Navigation (Modern Hub Default)
- **Icon-first:** Compact vertical rail using minimalist icons for top-level sections.
- **Hover Flyouts:** On hover/focus, show a flyout menu that groups related destinations under each icon (e.g. Procurement, Supply, Finance, Admin).
- **Collapsed vs Expanded:** Users can pin the sidebar open (icon + label) or keep it collapsed (icon-only) with smooth transitions.
- **Role-Based:** Show/hide groups and items based on user permissions.
- **Active State:** High-contrast indicator on the active icon and active flyout item.
- **Keyboard Support:** Arrow keys to move between icons and flyout items; ESC closes flyout.

#### Sidebar Navigation (Legacy Gov Theme)
- **Persistent:** Wider rail with text labels always visible.
- **Hierarchical:** Flat structure for government workflow.
- **Role-Based:** Same visibility rules as Modern Hub.
- **Active State:** Green indicator bar + background (existing pattern).

#### Breadcrumb Navigation
- **Location Indicator:** Shows current page hierarchy for the active workspace/case.
- **Clickable Path:** Navigate back through hierarchy.
- **Conditional Display:** Hidden on single-level pages where the top-level context is already obvious from the page header.

#### Top Navigation (Header)
- **Branding & Context:** Application name/workspace, current module, and breadcrumb trail.
- **Program-Wide Search:** Prominent search affordance that queries across modules, entities, and settings (distinct from in-page/case search).
- **AI Assistant Entry:** Dedicated button that opens an assistant panel for “how do I…” workflows, explanations, and shortcuts.
- **User & Settings:** Profile menu, appearance settings (theme, density, sidebar behavior), and session actions (sign out).

### List/Grid Patterns

#### Empty States
- **Icon:** Visual representation (large, subtle)
- **Title:** Clear explanation
- **Description:** What to do next
- **Action:** Primary CTA to resolve empty state

#### Loading States
- **Skeleton:** Show structure while loading
- **Spinner:** For indeterminate waits
- **Progress:** For determinate operations

#### List Items
- **Hover Effects:** Visual feedback
- **Staggered Animation:** Sequential entrance
- **Click Targets:** Full row clickable
- **Metadata:** Secondary information clearly differentiated

### Form Patterns

#### Form Layout
- **Vertical Stacking:** Labels above inputs
- **Logical Grouping:** Related fields together
- **Progressive Disclosure:** Show fields as needed
- **Required Indicators:** Asterisk (*) with aria-label

#### Validation
- **Inline Validation:** Immediate feedback
- **Error Messages:** Specific, actionable
- **Success States:** Confirm successful input
- **Disabled State:** Clear visual difference

#### Multi-Step Forms
- **Progress Indicator:** Show current step
- **Save Draft:** Allow partial completion
- **Navigation:** Previous/Next, Skip optional sections

### Workflow Patterns

#### Progress Stages
```tsx
<ProgressStages stages={[
  { label: 'Draft', completed: true },
  { label: 'Review', completed: false },
  { label: 'Approved', completed: false },
]} />
```

**Features:**
- Visual checkmarks for completed stages
- Linear progression
- Clear current position

#### Status Badges
- **Color-Coded:** Semantic colors for states
- **Dot Indicator:** Optional status dot
- **Consistent Placement:** Always in same location

#### Action Patterns
- **Primary Action:** One clear main action
- **Secondary Actions:** Supporting actions
- **Destructive Actions:** Confirm before executing
- **Bulk Actions:** Select → Action pattern

### Data Display Patterns

#### Cards
- **Consistent Structure:** Header, Body, Footer
- **Hover Effects:** Interactive cards elevate
- **Density Options:** Comfortable, compact views

#### Tables
- **Sortable Columns:** Click headers to sort
- **Filterable:** Search and filter controls
- **Pagination:** For large datasets
- **Row Actions:** Contextual menu or buttons

#### Detail Views
- **Tabs:** Organize related information
- **Quick Actions:** Prominent action buttons
- **Related Data:** Show connections

### Notification Patterns

#### Toast Notifications
- **react-hot-toast:** Library used
- **Positioning:** Top-center
- **Auto-Dismiss:** 3-5 seconds
- **Action Support:** Undo, dismiss, view more

#### Alerts
- **Inline:** Contextual to content
- **Persistent:** Until dismissed
- **Variants:** Info, success, warning, error

---

## Best Practices

### Design Best Practices

1. **Consistency Over Creativity**
   - Use established patterns
   - Maintain visual rhythm
   - Consistent spacing/sizing

2. **Content First**
   - Design around real content
   - Avoid lorem ipsum in final designs
   - Consider content extremes (very long/short)

3. **Hierarchy Through Typography**
   - Size, weight, color for emphasis
   - Limit font sizes (use scale)
   - Consistent heading levels

4. **White Space is Important**
   - Don't fear empty space
   - Group related items
   - Separate distinct sections

5. **Mobile Considerations**
   - Touch targets (48px minimum)
   - Thumb-friendly zones
   - Simplified navigation
   - Larger text for readability

### Development Best Practices

1. **Use Design Tokens (CSS Variables)**
   ```css
   /* Good */
   color: var(--color-text-primary);
   
   /* Avoid */
   color: #1f2937;
   ```

2. **Component Composition**
   ```tsx
   /* Good - Composable */
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
     </CardHeader>
   </Card>
   
   /* Avoid - Monolithic */
   <Card title="Title" header={...} />
   ```

3. **Semantic HTML**
   - Use proper elements (`<button>`, `<nav>`, `<main>`)
   - Maintain document outline
   - ARIA when semantic HTML insufficient

4. **Accessible Forms**
   - Always associate labels with inputs
   - Provide validation feedback
   - Use appropriate input types
   - Include autocomplete attributes

5. **Performance**
   - Lazy load below the fold
   - Optimize images
   - Use CSS transforms for animations
   - Debounce search inputs

6. **Dark Mode Support**
   - Use CSS variables for colors
   - Test both modes
   - Consider images/graphics
   - Provide manual toggle

### Testing Guidelines

1. **Accessibility Testing**
   - Keyboard navigation
   - Screen reader testing (NVDA, JAWS, VoiceOver)
   - Color contrast validation
   - Form validation messages

2. **Visual Testing**
   - Test both light and dark modes
   - Responsive breakpoints
   - Content extremes (overflow, empty states)
   - Browser compatibility

3. **User Testing**
   - Task completion rates
   - Time on task
   - Error rates
   - User satisfaction

---

## Component Usage Examples

### Complete Form Example

```tsx
<Card>
  <CardHeader>
    <CardTitle>Create Procurement Case</CardTitle>
    <CardDescription>
      Start a new procurement process
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Case Title"
        name="title"
        placeholder="Enter case title"
        required
        error={errors.title}
      />
      
      <Select
        label="Procurement Method"
        name="method"
        required
      >
        <option value="">Select method...</option>
        <option value="RFQ">Small Value (RFQ)</option>
        <option value="BIDDING">Public Bidding</option>
      </Select>
      
      <Input
        label="Budget Amount"
        name="amount"
        type="number"
        leftIcon={<DollarIcon />}
        helperText="Enter total budget allocation"
      />
      
      <div className="flex gap-3 justify-end">
        <Button 
          type="button" 
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          loading={isSubmitting}
        >
          Create Case
        </Button>
      </div>
    </form>
  </CardContent>
</Card>
```

### Data List Example

```tsx
<Card>
  <CardHeader>
    <CardTitle>Procurement Cases</CardTitle>
    <CardDescription>
      {cases.length} active cases
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    {cases.length === 0 ? (
      <EmptyState
        title="No cases found"
        description="Create your first case to get started"
        icon={<FolderIcon />}
        action={
          <Button variant="primary" onClick={onCreate}>
            Create Case
          </Button>
        }
      />
    ) : (
      <div className="divide-y divide-gray-200 dark:divide-[#2d3139]">
        {cases.map((case) => (
          <Link
            key={case.id}
            href={`/cases/${case.id}`}
            className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-[#242830] transition-colors"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                {case.title}
              </h3>
              <div className="flex gap-3 items-center text-sm text-gray-600 dark:text-gray-400">
                <Badge variant={getStatusVariant(case.status)} size="sm">
                  {case.status}
                </Badge>
                <span>•</span>
                <span>{formatDate(case.createdAt)}</span>
              </div>
            </div>
            <ChevronRightIcon className="text-gray-400" />
          </Link>
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

### Modal Example

```tsx
<Modal open={isOpen} onClose={onClose} size="lg">
  <ModalHeader onClose={onClose}>
    Confirm Action
  </ModalHeader>
  <ModalBody>
    <Alert variant="warning" title="Warning">
      This action cannot be undone. Are you sure you want to proceed?
    </Alert>
    <p className="mt-4 text-gray-600 dark:text-gray-400">
      Additional details about the action...
    </p>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>
      Cancel
    </Button>
    <Button 
      variant="destructive" 
      onClick={handleConfirm}
      loading={isProcessing}
    >
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

---

## Technical Stack

### Frontend Framework
- **Next.js 15.5.6:** React framework with App Router
- **React 19.1.0:** UI library
- **TypeScript 5:** Type safety

### Styling
- **Tailwind CSS v4:** Utility-first CSS
- **CSS Variables:** Design tokens
- **PostCSS:** CSS processing

### Component Library
- **Custom Components:** Built in-house
- **React Hot Toast:** Notification system
- **Next Auth:** Authentication

### Development Tools
- **ESLint:** Code linting
- **Playwright:** E2E testing
- **Prisma:** Database ORM

---

## Design File Organization

### Recommended Structure
```
/design
  /tokens
    - colors.json
    - typography.json
    - spacing.json
  /components
    - button.fig
    - card.fig
    - input.fig
  /patterns
    - forms.fig
    - tables.fig
    - navigation.fig
  /templates
    - dashboard.fig
    - detail-page.fig
```

---

## Changelog & Versioning

### Version 1.0.0 (Current)
- Initial design system
- Component library v1
- Dark mode support
- Accessibility standards
- Gov.uk inspired theming

### Future Considerations
- Component playground/Storybook
- Design token automation
- Additional color themes
- Enhanced animations library
- Mobile-specific patterns

---

## Resources & References

### Design Inspiration
- **GOV.UK Design System:** https://design-system.service.gov.uk/
- **U.S. Web Design System:** https://designsystem.digital.gov/
- **Material Design:** https://m3.material.io/
- **HubSpot UI / CRM:** Public-facing CRM/app UI for navigation, layout density, and SaaS interaction patterns

### Accessibility
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM:** https://webaim.org/
- **a11y Project:** https://www.a11yproject.com/

### Tools
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **WAVE:** https://wave.webaim.org/
- **axe DevTools:** Browser extension for accessibility testing

---

## Contact & Contributions

For questions, suggestions, or contributions to this design guide:
- Review component source code in `/src/components/ui`
- Check global styles in `/src/app/globals.css`
- Reference component usage in page files

---

**Last Updated:** November 2025  
**Design System Version:** 1.0.0  
**Application:** DigiGov Procurement Management System

