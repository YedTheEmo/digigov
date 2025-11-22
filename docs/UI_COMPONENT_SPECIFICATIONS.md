# DigiGov UI Component Specifications

> Detailed specifications for all UI components in the DigiGov design system

> The system supports **two visual themes** that share the same components and accessibility standards:
> - **Legacy Gov** – gov.uk-inspired, more austere, sharper corners, and the existing green-led palette.
> - **Modern Hub** – HubSpot-inspired SaaS look with softer neutrals, slightly larger radii, and more pronounced card elevation.
>
> Unless stated otherwise, measurements and behavior apply to **both themes**. Theme-specific differences are called out per component where relevant.

## Component Index

- [Button](#button)
- [Input](#input)
- [Select](#select)
- [Card](#card)
- [Badge](#badge)
- [Modal](#modal)
- [Table](#table)
- [Tabs](#tabs)
- [Alert](#alert)
- [Dropdown](#dropdown)
- [Tooltip](#tooltip)
- [Progress](#progress)
- [Spinner](#spinner)
- [Empty State](#empty-state)
- [Skeleton](#skeleton)

---

## Button

### Visual Specifications

#### Variants

| Variant | Background | Text Color | Border | Use Case |
|---------|-----------|------------|--------|----------|
| `primary` | Green #00703c | White | None | Primary actions |
| `default` | Gray #111827 | White | None | Standard actions |
| `secondary` | Light gray #f3f4f6 | Dark gray #1f2937 | 1px gray | Secondary actions |
| `outline` | Transparent | Gray #374151 | 2px gray | Tertiary actions |
| `ghost` | Transparent | Gray #374151 | None | Inline actions |
| `destructive` | Red #dc2626 | White | None | Delete, remove |
| `link` | Transparent | Green #00703c | None | Text links |

#### Sizes

| Size | Min Height | Horizontal Padding | Vertical Padding | Font Size |
|------|-----------|-------------------|------------------|-----------|
| `sm` | 40–44px | 14–16px | 10–12px | 16px (1rem) |
| `md` | 44–48px | 20–24px | 12–14px | 16px (1rem) |
| `lg` | 48–52px | 24–28px | 14–16px | 18px (1.125rem) |

**Theme-specific notes**
- **Legacy Gov:** Uses the higher end of the min-height range (48/52/56px) and slightly squarer corners.
- **Modern Hub:** Uses the more compact heights in the range, slightly tighter padding, and more rounded pill feel.

#### States

**Default**
- Border radius:
  - **Legacy Gov:** 8px (0.5rem)
  - **Modern Hub:** 9999px for primary CTAs, 10–12px for secondary/ghost where a full pill is not appropriate
- Font weight: 500 (medium)
- Transition: all 200ms

**Hover**
- `primary`: Background #005a30 (darker)
- `secondary`: Background #e5e7eb (darker)
- `outline`: Border green, text green
- `ghost`: Background gray-50
- Shadow: Subtle elevation on hover

**Active/Pressed**
- Inner shadow for depth
- Slight scale down (0.98)

**Focus**
- Ring: 2px green
- Ring offset: 2px
- No outline

**Disabled**
- Opacity: 50%
- Cursor: not-allowed
- Pointer events: none

**Loading**
- Shows spinner
- Hides icons
- Disabled state applied

### Accessibility

- Minimum touch target: 48x48px ✓
- Focus visible: Green ring ✓
- ARIA: `aria-disabled`, `aria-busy` (loading)
- Keyboard: Space/Enter to activate

### Code Example

```tsx
<Button 
  variant="primary" 
  size="md"
  loading={false}
  disabled={false}
  leftIcon={<IconPlus />}
  rightIcon={<IconArrow />}
  onClick={handleClick}
>
  Button Text
</Button>
```

### Design Tokens

```css
/* Primary Button */
background: var(--color-primary);
color: var(--color-text-inverse);
padding: var(--spacing-3) var(--spacing-6);
border-radius: var(--radius-lg);
font-weight: 500;
transition: var(--transition-base);

/* Hover */
background: var(--color-primary-hover);
box-shadow: var(--shadow-md);

/* Focus */
outline: 2px solid var(--color-border-focus);
outline-offset: 2px;
```

---

## Input

### Visual Specifications

#### Anatomy
```
┌─────────────────────────────────────┐
│ Label *                             │  ← Label (16px, medium)
├─────────────────────────────────────┤
│ [Icon] Input text...           [IC] │  ← Input (48px height)
├─────────────────────────────────────┤
│ Helper text or error message        │  ← Help text (16px, gray)
└─────────────────────────────────────┘
```

#### Dimensions
- Min height: 48px
- Border: 1px solid
- Border radius: 8px (0.5rem)
- Horizontal padding: 16px (24px with icon)
- Vertical padding: 14px
- Label margin bottom: 16px (1rem)
- Help text margin top: 8px

#### Colors

**Light Mode**
- Background: White #ffffff
- Text: Gray-900 #1f2937
- Border: Gray-300 #d1d5db
- Placeholder: Gray-400 #9ca3af
- Label: Gray-700 #374151

**Dark Mode**
- Background: #242830
- Text: Gray-100 #f9fafb
- Border: #3a3f4a
- Placeholder: Gray-500 #6b7280
- Label: Gray-300 #d1d5db

#### States

**Default**
- Border: 1px solid gray-300
- Background: white

**Hover**
- Border: 1px solid gray-400

**Focus**
- Border: transparent (covered by ring)
- Ring: 2px green
- Ring color: #00703c (light) / #5cb85c (dark)

**Error**
- Border: 1px solid red-500
- Ring: 2px red (on focus)
- Error text: Red-600 (light) / Red-400 (dark)

**Disabled**
- Background: Gray-100 (light) / #1a1d23 (dark)
- Cursor: not-allowed
- Opacity: maintained

### Types Supported

- `text` (default)
- `email`
- `password`
- `number`
- `tel`
- `url`
- `search`
- `date`
- `datetime-local`
- `time`

### Accessibility

- Associated label via `htmlFor`/`id`
- Required indicator: `*` with `aria-label="required"`
- Error message: `aria-invalid`, `aria-describedby`
- Helper text: `aria-describedby`
- Autocomplete attributes supported

### Code Example

```tsx
<Input
  label="Email Address"
  type="email"
  name="email"
  placeholder="you@example.com"
  required
  error={errors.email}
  helperText="We'll never share your email"
  leftIcon={<IconMail />}
  rightIcon={<IconCheck />}
  autoComplete="email"
/>
```

---

## Select

### Visual Specifications

#### Dimensions
- Identical to Input component
- Min height: 48px
- Chevron icon: Right-positioned
- Right padding: 48px (to accommodate chevron)

#### Colors
- Same as Input component

#### States
- Same as Input component
- Native select dropdown styling

### Accessibility

- Same as Input
- Native `<select>` element for best accessibility

### Code Example

```tsx
<Select
  label="Choose an option"
  name="option"
  required
  error={errors.option}
  helperText="Select the best option"
>
  <option value="">Select...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Select>
```

---

## Card

### Visual Specifications

#### Anatomy
```
┌─────────────────────────────────────┐
│ Card Header (32px padding)          │
│  • Card Title (20px, semibold)      │
│  • Card Description (16px, gray)    │
├─────────────────────────────────────┤
│                                     │
│ Card Content (32px padding)         │
│                                     │
├─────────────────────────────────────┤
│ Card Footer (32px padding)          │
└─────────────────────────────────────┘
```

#### Dimensions
- Border: 1px solid
- Border radius: 8px (0.5rem)
- Section padding: 32px (2rem)
- Section borders: 1px solid

#### Colors

**Light Mode**
- Background: White #ffffff
- Border: Gray-200 #e5e7eb
- Section divider: Gray-100 #f3f4f6

**Dark Mode**
- Background: #242830
- Border: #2d3139
- Section divider: #2d3139

#### Variants

**Default**
- Shadow: Subtle (0 1px 2px)

**Hover** (if `hover={true}`)
- Shadow: Medium (0 4px 6px)
- Transition: 200ms

**Interactive** (if `onClick` provided)
- Cursor: pointer
- Hover shadow applied

### Accessibility

- Semantic structure
- Clickable card: Add appropriate role if needed
- Heading hierarchy maintained

### Code Example

```tsx
<Card hover onClick={handleClick}>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>
      This is a description of the card content
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## Badge

### Visual Specifications

#### Sizes

| Size | Padding | Font Size | Icon Size |
|------|---------|-----------|-----------|
| `sm` | 10px 12px | 12px (0.75rem) | 6px |
| `md` | 12px 14px | 14px (0.875rem) | 6px |
| `lg` | 14px 16px | 16px (1rem) | 6px |

#### Variants - Solid Style

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `default` | Gray-100 | Gray-800 | Gray-200 |
| `primary` | Green-50 | Green-800 | Green-200 |
| `success` | Green-50 | Green-800 | Green-200 |
| `warning` | Orange-50 | Orange-800 | Orange-200 |
| `error` | Red-50 | Red-800 | Red-200 |
| `info` | Blue-50 | Blue-800 | Blue-200 |
| `pending` | Orange-50 | Orange-800 | Orange-200 |
| `completed` | Green-50 | Green-800 | Green-200 |
| `cancelled` | Gray-100 | Gray-800 | Gray-200 |

**Dark Mode**: Darker backgrounds, lighter text, darker borders

#### Variants - Outline Style

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| All | Transparent | Variant color | Variant color |

#### Shape
- Border radius: 9999px (fully rounded pill)
- Border width: 1px

#### Dot Indicator
- Size: 6px (1.5 x 1.5)
- Border radius: 50%
- Margin right: 6px
- Colors match variant semantic color

### Code Example

```tsx
<Badge variant="success" size="md" dot>
  Completed
</Badge>

<Badge variant="warning" style="outline">
  Pending
</Badge>
```

---

## Modal

### Visual Specifications

#### Sizes

| Size | Max Width | Description |
|------|-----------|-------------|
| `sm` | 448px (28rem) | Small dialogs |
| `md` | 512px (32rem) | Default |
| `lg` | 672px (42rem) | Forms |
| `xl` | 896px (56rem) | Large content |
| `full` | 90vw | Maximum width |

#### Anatomy
```
┌─────────────────────────────────────┐
│ Modal Header          [X]           │  ← 24px padding
├─────────────────────────────────────┤
│                                     │
│ Modal Body                          │  ← 24px padding
│                                     │
├─────────────────────────────────────┤
│                Right-aligned Actions │  ← 24px padding
└─────────────────────────────────────┘
```

#### Dimensions
- Section padding: 24px
- Section border: 1px solid
- Border radius: 8px (0.5rem)
- Backdrop: Fixed, full screen

#### Colors

**Backdrop**
- Background: rgba(0, 0, 0, 0.5)
- Blur: None

**Modal**
- Background: White (light) / Gray-800 (dark)
- Border dividers: Gray-200 (light) / Gray-700 (dark)

#### Animations
- Backdrop: Fade in (180ms)
- Modal: Slide up + fade in (180ms)

### Behavior

- **Backdrop Click**: Closes modal (configurable)
- **ESC Key**: Closes modal (configurable)
- **Body Scroll**: Locked when open
- **Focus Trap**: First focusable element focused
- **Close Icon**: Top-right corner

### Accessibility

- `role="dialog"`
- `aria-modal="true"`
- Focus management
- ESC key support
- Click outside support

### Code Example

```tsx
<Modal 
  open={isOpen} 
  onClose={handleClose}
  size="lg"
  closeOnOverlayClick
  closeOnEscape
>
  <ModalHeader onClose={handleClose}>
    Modal Title
  </ModalHeader>
  <ModalBody>
    <p>Modal content</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={handleClose}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

---

## Table

### Visual Specifications

#### Structure
```
┌─────────────────────────────────────┐
│ COLUMN 1    COLUMN 2    COLUMN 3    │  ← Header (gray bg)
├─────────────────────────────────────┤
│ Data 1.1    Data 1.2    Data 1.3    │  ← Row
├─────────────────────────────────────┤
│ Data 2.1    Data 2.2    Data 2.3    │  ← Row (striped)
└─────────────────────────────────────┘
```

#### Dimensions
- Cell padding: 24px horizontal, 16px vertical
- Border: 1px solid

#### Colors

**Header (THead)**
- Background: Gray-50 (light) / #1a1d23 (dark)
- Text: Gray-700 (light) / Gray-300 (dark)
- Font: 14px (0.875rem), semibold, uppercase
- Letter spacing: wider

**Body (TBody)**
- Background: White (light) / #242830 (dark)
- Text: Gray-900 (light) / Gray-100 (dark)
- Border: Gray-100 (light) / #2d3139 (dark)

**Hover** (if enabled)
- Background: Gray-100 (light) / Gray-700/50 (dark)

**Striped** (if enabled)
- Odd rows: rgba(0,0,0,0.02) (light) / rgba(255,255,255,0.02) (dark)

#### Features

- **Sortable Columns**: Arrow indicator, clickable header
- **Horizontal Scroll**: Overflow-x auto
- **Row Click**: Full row clickable
- **Hover Effects**: Visual feedback

### Accessibility

- Semantic `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- Sortable: Click to sort, visual indicator
- Hover: Visual feedback
- Row actions: Keyboard accessible

### Code Example

```tsx
<Table striped>
  <THead>
    <TR>
      <TH sortable onSort={handleSort}>Name</TH>
      <TH>Status</TH>
      <TH>Date</TH>
    </TR>
  </THead>
  <TBody>
    <TR hover onClick={handleRowClick}>
      <TD>John Doe</TD>
      <TD><Badge variant="success">Active</Badge></TD>
      <TD>Jan 1, 2025</TD>
    </TR>
  </TBody>
</Table>
```

---

## Tabs

### Visual Specifications

#### Anatomy
```
┌─────────────────────────────────────┐
│ ┌────────┐ ┌────────┐ ┌────────┐   │  ← Tab List
│ │ Tab 1  │ │ Tab 2  │ │ Tab 3  │   │
│ └────────┘ └────────┘ └────────┘   │
├─────────────────────────────────────┤
│                                     │
│ Tab Content                         │
│                                     │
└─────────────────────────────────────┘
```

#### Dimensions
- Tab padding: 16px horizontal, 8px vertical
- Tab list padding: 4px
- Tab list border radius: 8px (0.5rem)
- Tab border radius: 6px (0.375rem)
- Content margin top: 16px

#### Colors

**Tab List**
- Background: Gray-100 (light) / Gray-800 (dark)

**Inactive Tab**
- Background: Transparent
- Text: Gray-600 (light) / Gray-400 (dark)

**Active Tab**
- Background: White (light) / Gray-700 (dark)
- Text: Gray-900 (light) / Gray-100 (dark)
- Shadow: Subtle elevation

**Hover** (inactive)
- Text: Gray-900 (light) / Gray-100 (dark)

#### Animation
- Transition: colors 200ms
- Content: Fade in (180ms)

### Accessibility

- `role="tablist"` on container
- `role="tab"` on triggers
- `aria-selected` on active tab
- `role="tabpanel"` on content
- Keyboard navigation: Arrow keys

### Code Example

```tsx
<Tabs defaultValue="tab1" onChange={handleChange}>
  <TabsList>
    <TabsTrigger value="tab1">Overview</TabsTrigger>
    <TabsTrigger value="tab2">Details</TabsTrigger>
    <TabsTrigger value="tab3" disabled>Disabled</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Overview content
  </TabsContent>
  <TabsContent value="tab2">
    Details content
  </TabsContent>
</Tabs>
```

---

## Alert

### Visual Specifications

#### Anatomy
```
┌─────────────────────────────────────┐
│ [Icon] Title                   [X]  │
│        Message content goes here    │
└─────────────────────────────────────┘
```

#### Dimensions
- Padding: 16px
- Border: 1px solid
- Border radius: 8px (0.5rem)
- Icon size: 18px
- Gap: 12px

#### Variants

| Variant | Background | Border | Text | Icon |
|---------|-----------|--------|------|------|
| `info` | Blue-50 | Blue-200 | Blue-900 | ℹ️ |
| `success` | Green-50 | Green-200 | Green-900 | ✓ |
| `warning` | Yellow-50 | Yellow-200 | Yellow-900 | ⚠️ |
| `error` | Red-50 | Red-200 | Red-900 | ✕ |

**Dark Mode**: Darker backgrounds, darker borders, lighter text

#### Features

- **Title**: Optional, semibold
- **Dismissible**: Optional close button
- **Icon**: Automatic based on variant

### Accessibility

- `role="alert"` on container
- Dismiss button: `aria-label="Dismiss"`
- Proper color contrast

### Code Example

```tsx
<Alert 
  variant="warning" 
  title="Important Notice"
  dismissible
  onDismiss={handleDismiss}
>
  This action requires your attention.
</Alert>
```

---

## Dropdown

### Visual Specifications

#### Anatomy
```
[Trigger Button ▾]

┌─────────────────────────┐
│ User Name               │  ← Label (optional)
│ email@example.com       │
├─────────────────────────┤
│ → Menu Item 1           │
│ → Menu Item 2           │
├─────────────────────────┤
│ → Delete (red)          │
└─────────────────────────┘
```

#### Dimensions
- Min width: 192px (12rem)
- Item padding: 12px
- Border: 1px solid
- Border radius: 6px (0.375rem)
- Margin top: 8px
- z-index: 50

#### Colors

**Container**
- Background: White (light) / Gray-800 (dark)
- Border: Gray-200 (light) / Gray-700 (dark)
- Shadow: Large elevation

**Items**
- Default: Gray-700 (light) / Gray-300 (dark)
- Hover: Gray-100 bg (light) / Gray-700 bg (dark)
- Destructive: Red-600 text, Red-50 hover bg

**Divider**
- Border: Gray-200 (light) / Gray-700 (dark)
- Margin: 4px vertical

#### Animation
- Slide down + fade in (180ms)

### Behavior

- **Click Outside**: Closes dropdown
- **ESC Key**: Closes dropdown
- **Alignment**: Start or End

### Accessibility

- `role="menu"` on container
- `role="menuitem"` on items
- `aria-haspopup="menu"`
- `aria-expanded` state
- Keyboard navigation

### Code Example

```tsx
<Dropdown 
  trigger={<Button>Menu ▾</Button>}
  align="end"
>
  <DropdownLabel 
    title="User Name" 
    subtitle="email@example.com" 
  />
  <DropdownDivider />
  <DropdownItem 
    icon={<IconSettings />}
    onClick={handleSettings}
  >
    Settings
  </DropdownItem>
  <DropdownItem 
    destructive
    icon={<IconTrash />}
    onClick={handleDelete}
  >
    Delete
  </DropdownItem>
</Dropdown>
```

---

## Tooltip

### Visual Specifications

#### Dimensions
- Padding: 8px horizontal, 4px vertical
- Border radius: 4px (0.25rem)
- Font size: 12px (0.75rem)
- Max width: None (whitespace-nowrap)
- z-index: 50

#### Colors
- Background: Gray-900 (light) / Gray-700 (dark)
- Text: White
- No border

#### Positions
- `top`: Above element
- `bottom`: Below element
- `left`: Left of element
- `right`: Right of element

#### Animation
- Delay: 300ms before showing
- Fade in (180ms)

### Behavior

- **Mouse Enter**: Show after delay
- **Mouse Leave**: Hide immediately
- **Focus**: Show after delay
- **Blur**: Hide immediately

### Accessibility

- `role="tooltip"`
- Not focusable (pointer-events: none)
- Descriptive content only

### Code Example

```tsx
<Tooltip content="Helpful information" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

---

## Progress

### Visual Specifications

#### Sizes

| Size | Height |
|------|--------|
| `sm` | 4px |
| `md` | 8px |
| `lg` | 12px |

#### Dimensions
- Border radius: Full (9999px)
- Width: 100%

#### Colors

**Track**
- Background: Gray-200 (light) / Gray-700 (dark)

**Fill (Variants)**
- `default`: Blue-600 (light) / Blue-500 (dark)
- `success`: Green-600 (light) / Green-500 (dark)
- `warning`: Yellow-600 (light) / Yellow-500 (dark)
- `error`: Red-600 (light) / Red-500 (dark)

#### Animation
- Transition: width 300ms ease-out

#### Label
- Optional percentage display
- Font size: 14px
- Margin bottom: 4px

### Accessibility

- `role="progressbar"`
- `aria-valuenow`: Current value
- `aria-valuemin`: 0
- `aria-valuemax`: Max value

### Code Example

```tsx
<Progress 
  value={60} 
  max={100}
  size="md"
  variant="success"
  showLabel
/>
```

---

## Spinner

### Visual Specifications

#### Sizes

| Size | Diameter | Border Width |
|------|----------|--------------|
| `sm` | 16px | 2px |
| `md` | 32px | 2px |
| `lg` | 48px | 3px |

#### Colors
- Border: currentColor
- Border-right: Transparent (creates spinning effect)

#### Animation
- Rotation: 360° continuous
- Duration: 1s linear infinite
- Motion reduce: 1.5s

### Accessibility

- `role="status"`
- `aria-label="Loading"`
- Hidden text: "Loading..." for screen readers

### Code Example

```tsx
<Spinner size="md" className="text-green-600" />
```

---

## Empty State

### Visual Specifications

#### Anatomy
```
┌─────────────────────────────────────┐
│                                     │
│            [Large Icon]             │  ← 60px, 50% opacity
│                                     │
│           No Items Found            │  ← Title (20px, semibold)
│                                     │
│   Create your first item to get     │  ← Description (16px, gray)
│   started with the system           │
│                                     │
│        [Primary Action Button]      │
│                                     │
└─────────────────────────────────────┘
```

#### Dimensions
- Padding: 64px (4rem) all sides
- Icon size: 60px (3.75rem)
- Icon margin bottom: 24px
- Title margin bottom: 12px
- Description margin bottom: 32px
- Description max width: 512px (32rem)

#### Colors
- Title: Gray-900 (light) / Gray-100 (dark)
- Description: Gray-600 (light) / Gray-400 (dark)
- Icon: 50% opacity

### Code Example

```tsx
<EmptyState
  title="No cases found"
  description="Create your first procurement case to get started"
  icon={<IconFolder />}
  action={
    <Button variant="primary">
      Create Case
    </Button>
  }
/>
```

---

## Skeleton

### Visual Specifications

#### Variants

| Variant | Shape | Use Case |
|---------|-------|----------|
| `text` | Rounded | Text lines |
| `circular` | Circle | Avatars, icons |
| `rectangular` | Rounded corners | Cards, images |

#### Dimensions
- Border radius:
  - `text`: 4px
  - `circular`: 50%
  - `rectangular`: 6px
- Height: Configurable (default: 1em for text)
- Width: Configurable

#### Colors
- Background: Gray-200 (light) / Gray-700 (dark)

#### Animation
- Pulse: 2s infinite
- Keyframes: 100% → 50% → 100% opacity

### Accessibility

- `aria-hidden="true"`
- Purely visual, no semantic meaning

### Code Example

```tsx
<Skeleton variant="rectangular" width={200} height={40} />

<SkeletonText lines={3} />

<Skeleton variant="circular" width={48} height={48} />
```

---

## Design Token Reference

### Spacing Scale (8px base)
```css
--spacing-1: 0.5rem;   /* 8px */
--spacing-2: 1rem;     /* 16px */
--spacing-3: 1.5rem;   /* 24px */
--spacing-4: 2rem;     /* 32px */
--spacing-5: 2.5rem;   /* 40px */
--spacing-6: 3rem;     /* 48px */
--spacing-8: 4rem;     /* 64px */
```

### Border Radius
```css
--radius-sm: 0.25rem;  /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem;   /* 8px */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

### Transitions
```css
--transition-fast: 120ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 180ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 260ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Responsive Breakpoints

```css
sm:  640px   /* Small tablets */
md:  768px   /* Tablets */
lg:  1024px  /* Laptops */
xl:  1280px  /* Desktops */
2xl: 1920px  /* Ultra-wide */
```

**Usage Pattern:** Mobile first
- Default: Mobile (320px+)
- Use `md:`, `lg:` prefixes for larger screens

---

## Component Combination Patterns

### Form Group
```tsx
<div className="space-y-6">
  <Input label="Name" required />
  <Select label="Type" required>
    <option>Option</option>
  </Select>
  <div className="flex gap-3 justify-end">
    <Button variant="secondary">Cancel</Button>
    <Button variant="primary">Submit</Button>
  </div>
</div>
```

### Card with Actions
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Title</CardTitle>
      <Button variant="ghost" size="sm">Edit</Button>
    </div>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### List Item
```tsx
<div className="flex items-center justify-between p-6 hover:bg-gray-50">
  <div className="flex-1">
    <h3 className="font-semibold text-lg">Item Name</h3>
    <div className="flex gap-3 mt-2">
      <Badge variant="success">Active</Badge>
      <span className="text-sm text-gray-600">Details</span>
    </div>
  </div>
  <ChevronRightIcon />
</div>
```

---

## Version History

### 1.0.0 - Current
- Initial component specifications
- All core components documented
- Design tokens established
- Dark mode support
- Accessibility standards

---

**Last Updated:** November 2025  
**Design System Version:** 1.0.0  
**Application:** DigiGov

