# NookNotes Design System 2.0

**Version:** 2.0.1
**Status:** Active
**Last Updated:** January 2026

## 1. Core Philosophy

NookNotes is designed as a personal family dashboard, distinct from corporate enterprise tools. The user interface prioritizes warmth, clarity, and approachability over density.

* **Visual Tone:** Organic, soft, and friendly.
* **Interaction Model:** Touch-friendly targets, clear visual hierarchy, and forgiving inputs.
* **Golden Rule:** Avoid "Sharp Edges" and "Pure Black." All UI elements should feel tactile and approachable.
* **Mobile First:** Complex data rows must degrade gracefully into stacked, readable cards on small screens.

---

## 2. Brand Identity & Tokens

### 2.1 Color Palette ("The Nook Theme")

We utilize a semantic color system derived from the brand logo. These tokens override standard framework defaults to ensure consistency.

| Semantic Role | Token Name | Hex Value | Usage Guidelines |
| --- | --- | --- | --- |
| **Primary** | `--nook-primary` | **`#5DAAD6`** | Main actions, active states, branding elements. |
| **Success** | `--nook-success` | **`#7DBE88`** | Positive values, confirmations, "Completed" states. |
| **Warning** | `--nook-warning` | **`#F5C656`** | Priority flags, non-blocking alerts, ratings. |
| **Danger** | `--nook-danger` | **`#E57373`** | Destructive actions, negative balances. *Note: Softer than standard red.* |
| **Text (Body)** | `--nook-text` | **`#4A5568`** | Primary content. **Never use `#000000`.** |
| **Text (Muted)** | `--nook-muted` | **`#A0AEC0`** | Secondary metadata, icons, placeholders. |
| **Surface** | `--nook-bg` | **`#F8F9FA`** | Global application background (Off-white). |

### 2.2 Typography

We rely on the system font stack for performance but enforce strict hierarchy patterns.

* **Font Family:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
* **Monospace Family:** `SFMono-Regular, Menlo, Monaco, Consolas, monospace` (Used for financial data).

| Style Name | CSS Class | Properties | Usage |
| --- | --- | --- | --- |
| **Page Title** | `.h3` (Bootstrap) | `700` weight, `Nook Primary` | Top-level page headers. |
| **Section Header** | `.text-header-caps` | `0.75rem`, `700` weight, Uppercase, `1px` letter-spacing | Labels, Table Headers, Group titles. |
| **Currency** | `.text-currency` | `font-family: monospace` | All price/financial data alignment. |
| **Mobile Amount** | `.fs-6` | Smaller font size | Compact financial data for mobile views. |

### 2.3 Spacing & Shape

* **Border Radius:**
* **Cards/Modals:** `1rem` (16px) - `rounded-4`
* **Buttons:** `50rem` (Pill shape) - `rounded-pill`
* **Inputs:** `0.5rem` (8px) - `rounded-2`


* **Shadows:**
* **Cards:** `shadow-sm` (Subtle lift)
* **Sticky Elements:** `shadow` (Distinct separation)


* **Responsive Spacing:**
* **Container Padding:** Mobile `px-1` vs Desktop `px-3` (Maximizes width for content on small screens).
* **Card Padding:** Mobile `p-2` vs Desktop `p-sm-3`.
* **Row Margin:** `mb-2` between list items.



---

## 3. UI Component Library

Development must prioritize reusability. Do not build raw HTML elements when a standardized component exists.

### 3.1 Atoms (Primitive Elements)

* **`<StatusBadge />`**
* **Description:** A pill-shaped indicator for state.
* **Props:** `variant` (primary/success/warning), `label`, `icon`.
* **Style:** Uses `bg-subtle` backgrounds to avoid visual heaviness.


* **`<IconButton />`**
* **Description:** A standard icon-only button.
* **Constraint:** Minimum touch target of **44x44px** for mobile accessibility.


* **`<LoadingState />`**
* **Description:** Centralized spinner with consistent messaging.


* **`<EmptyState />`**
* **Description:** A placeholder for lists with 0 items. Must include an icon and helpful subtext.



### 3.2 Smart Components (Data-Connected)

These components encapsulate data fetching logic to ensure consistency across the application.

* **`<CategorySelect />`**: Auto-populates system categories (e.g., Grocery aisles, Budget buckets).
* **`<UnitSelect />`**: Auto-populates measurement units.

### 3.3 Molecules (Composite UI)

* **`<PageHeader />`**
* **Description:** Sticky-top navigation bar containing the Page Title and Primary Actions (e.g., "Add New").


* **`<ActionCard />`** (e.g., Checkout Card)
* **Description:** A fixed or sticky container for primary page operations.



### 3.4 Responsive Layout Patterns

We use specific patterns to handle complex data rows on small screens.

**A. The "Split-Row" Pattern (Mobile vs Desktop)**
Used when data cannot fit horizontally on a phone screen (e.g., Account Rows, Transaction Rows).

| Element | Mobile (`< 576px`) | Desktop (`≥ 576px`) |
| --- | --- | --- |
| **Layout** | **Stacked** (2 Rows) | **Single Row** (Flex) |
| **Primary Info** | Top Row (Full Width) | Left Column |
| **Secondary Info** | Bottom Row (Left) | Left Column (Under Primary) |
| **Amount** | **Bottom Row (Right)** | **Right Column (Vertically Centered)** |
| **Badges** | Hidden (`d-none`) | Visible (`d-sm-inline-flex`) |

**B. Action Buttons**

* **Edit Button (Pencil):** Always visible on Mobile (`d-block`).
* **Chevron (Arrow):** Hidden on Mobile (`d-none`) to save space; visible on Desktop (`d-sm-block`) as a visual cue.
* **Click Target:** The entire row is clickable. `e.stopPropagation()` must be used on the Edit button.

---

## 4. Architecture & Naming Conventions

File naming must reflect **function**, not just domain. We use a component-based architecture where the filename describes the UI pattern.

### 4.1 Naming Schema

| Suffix | Definition | Example |
| --- | --- | --- |
| **`...Page.js`** | A route-level wrapper found in `src/pages/`. | `ShoppingListPage.js` |
| **`...Container.js`** | The main feature controller. Manages state and data fetching. | `ShoppingContainer.js` |
| **`...Row.js`** | A single item display component (Read-only or interactive). | `ShoppingRow.js` |
| **`...AddForm.js`** | An input form specifically for creating new records. | `ShoppingAddForm.js` |
| **`...EditModal.js`** | A modal dialog for modifying existing records. | `ShoppingEditModal.js` |
| **`...List.js`** | A pure presentation component that renders a grid or list of items. | `ReceiptsList.js` |

### 4.2 Directory Structure

Components should be co-located by domain, with shared utilities extracted to `common`.

```text
src/
  components/
    common/              # Global Atoms & Molecules
      forms/             # Shared Inputs (Selects, Toggles)
      PageHeader.js
      StatusBadge.js
    shopping/            # Domain: Shopping
      selectors/         # Domain-specific Smart Components
      ShoppingContainer.js
      ShoppingRow.js
    budget/              # Domain: Budget
      accounts/          # Sub-domain: Accounts
        AccountRow.js    # Implements Split-Row Pattern
      transactions/      # Sub-domain: Transactions
        TransactionRow.js
      BudgetContainer.js

```

---

## 5. CSS Implementation Guide

To apply the Nook Theme, ensure the following CSS variables are defined in the global stylesheet (`index.css`).

```css
:root {
  /* --- NOOK PALETTE --- */
  --nook-primary: #5DAAD6;
  --nook-success: #7DBE88;
  --nook-warning: #F5C656;
  --nook-danger:  #E57373;
  --nook-text:    #4A5568;
  --nook-muted:   #A0AEC0;
  --nook-bg:      #F8F9FA;

  /* --- BOOTSTRAP OVERRIDES --- */
  --bs-primary: var(--nook-primary);
  --bs-success: var(--nook-success);
  --bs-warning: var(--nook-warning);
  --bs-danger:  var(--nook-danger);
  --bs-body-color: var(--nook-text);

  /* --- SHAPE --- */
  --bs-border-radius: 0.5rem;
  --bs-border-radius-lg: 1rem; /* Cards */
}

```

### 5.1 Responsive Utility Classes

Use these Bootstrap utility combinations to implement the responsive patterns defined in Section 3.4.

```jsx
/* Hides element on mobile, shows on tablet+ */
className="d-none d-sm-block"

/* Shows on mobile, hides on tablet+ */
className="d-block d-sm-none"

/* Adjusts font size based on screen width */
className="fs-6 fs-sm-5"

/* Adjusts padding based on screen width */
className="p-2 p-sm-3"

/* Flexbox Truncation Fix: The container MUST have minWidth: 0 */
<div className="flex-grow-1 overflow-hidden" style={{ minWidth: 0 }}>
    <div className="text-truncate">Long Text Here...</div>
</div>

```
