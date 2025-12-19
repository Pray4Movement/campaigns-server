# DOXA Design Specifications

Design reference: [Adobe XD - DOXA Desktop 4.0](https://xd.adobe.com/view/b8a39bcf-f54d-4ee5-971d-b9856546cad1-edf0/)

## Color Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary Dark Green | `#3B463D` | `forest-500` | Headers, primary backgrounds, main text |
| Secondary Light Green | `#D1D4CD` | `sage-300` | Accent headings, button backgrounds, progress bars |
| Secondary Beige | `#CBC5B9` | `beige-400` | Borders, muted elements, subtle backgrounds |

### Full Color Scales

Colors are defined in `app/assets/css/main.css` with full 50-950 scales:

- **Forest** (primary): `forest-50` through `forest-950`
- **Sage** (secondary): `sage-50` through `sage-950`
- **Beige** (secondary): `beige-50` through `beige-950`

## Typography

### Heading Style

Headlines use a two-tone pattern where the first word is emphasized:

```html
<!-- First word: dark (forest), rest: lighter (sage) -->
<h1>
  <span class="text-forest-500 font-bold">ADOPT</span>
  <span class="text-sage-400">AN UNENGAGED PEOPLE GROUP</span>
</h1>
```

### Font Recommendations

- **Display/Headlines**: Condensed sans-serif (League Spartan, Oswald, or similar)
- **Body**: System sans-serif or Inter

### Text Styles

| Style | Classes |
|-------|---------|
| Page Title | `text-3xl md:text-4xl font-bold uppercase tracking-wide` |
| Section Heading | `text-2xl md:text-3xl font-bold uppercase` |
| Card Heading | `text-xl font-bold uppercase` |
| Body Text | `text-base text-forest-500` |
| Muted Text | `text-sm text-beige-600` |

## Components

### Header/Navigation

- Background: `bg-forest-500`
- Text: `text-white`
- Logo: DOXA with mountain icon
- Nav items: Pray, Adopt, Engage (text links)
- Hamburger menu on mobile

```html
<header class="bg-forest-500 text-white px-6 py-4">
  <!-- Logo left, nav right -->
</header>
```

### Cards

White cards with large rounded corners and subtle shadow.

```html
<div class="bg-white rounded-2xl shadow-sm p-6">
  <!-- Card content -->
</div>
```

### Buttons

#### Primary Button (CTA)
- Pill shape
- Sage background
- Dark text

```html
<UButton
  class="rounded-full px-8 py-3 bg-sage-300 text-forest-500 hover:bg-sage-400"
>
  GET STARTED
</UButton>
```

#### Back Button
- Small pill with arrow icon

```html
<UButton
  variant="soft"
  class="rounded-full"
  icon="i-lucide-chevron-left"
>
  BACK
</UButton>
```

### Number Badges

Dark circles with white numbers for step indicators.

```html
<div class="w-10 h-10 rounded-full bg-forest-500 text-white flex items-center justify-center font-bold">
  1
</div>
```

### Progress Bar

```html
<div class="w-full bg-sage-200 rounded-full h-2">
  <div class="bg-forest-500 h-2 rounded-full" style="width: 25%"></div>
</div>
```

### Feature Cards (Horizontal)

Cards with circular image on left, text on right.

```html
<div class="flex items-start gap-4 bg-forest-400 rounded-lg p-4">
  <img src="..." class="w-16 h-16 rounded-full object-cover" />
  <div>
    <h3 class="font-bold text-white uppercase">HEADING</h3>
    <p class="text-sage-200 text-sm">Description text...</p>
  </div>
</div>
```

### Stats Display

```html
<div class="bg-forest-500 text-white rounded-lg p-6">
  <p class="text-sm uppercase tracking-wide">Current Status</p>
  <p class="text-4xl font-bold">525 / 2085</p>
  <p class="text-sm text-sage-300">people groups adopted</p>
</div>
```

## Layout Patterns

### Section Backgrounds

Alternate between:
1. White (`bg-white`)
2. Dark green (`bg-forest-500`)
3. Medium green (`bg-forest-400`)
4. Light beige (`bg-beige-50`)

### Grid Layouts

#### 3-Column Steps/Features
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Cards -->
</div>
```

#### 2-Column Hero
```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
  <div><!-- Text content --></div>
  <div><!-- Image --></div>
</div>
```

### Spacing

- Section padding: `py-16 md:py-24`
- Container max-width: `max-w-7xl mx-auto px-4`
- Card padding: `p-6` or `p-8`
- Element gaps: `gap-4`, `gap-6`, or `gap-8`

## Page Templates

### Landing Page Structure

1. **Header** - Dark green nav bar
2. **Hero Section** - Two-tone heading, stats, image
3. **How It Works** - Dark background, 3-column cards
4. **Why It Matters** - Medium green, horizontal feature cards
5. **CTA Section** - Call to action with button
6. **Footer** - Dark green

### Form Page Structure

1. **Header** - Dark green nav bar
2. **Back Button** - Top left
3. **Page Title** - Two-tone heading
4. **Description** - Intro paragraph
5. **Form Content** - White cards with form fields

## Icons

Use Lucide icons via Nuxt UI:

```html
<UIcon name="i-lucide-chevron-left" />
<UIcon name="i-lucide-menu" />
<UIcon name="i-lucide-check" />
```

## Responsive Breakpoints

Follow Tailwind defaults:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Mobile-first approach with progressive enhancement.
