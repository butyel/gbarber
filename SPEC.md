# GBarber - Sistema de Gestão de Barbearia SaaS

## 1. Project Overview

**Project Name:** GBarber
**Type:** Multi-tenant SaaS Web Application
**Core Functionality:** Complete barber shop management system with appointments, commissions, inventory, and reports
**Target Users:** Barber shop owners and their teams

---

## 2. UI/UX Specification

### 2.1 Layout Structure

**Sidebar (Fixed Left - 280px):**
- Logo at top
- Navigation menu with icons
- User profile at bottom
- Always visible on desktop

**Topbar (64px height):**
- Page title (left)
- Action buttons (right)
- User dropdown menu

**Main Content Area:**
- Full height minus sidebar + topbar
- Padding: 24px
- Scrollable

**Responsive Breakpoints:**
- Desktop: > 1024px (sidebar visible)
- Tablet: 768px - 1024px (collapsible sidebar)
- Mobile: < 768px (hamburger menu)

### 2.2 Visual Design

**Color Palette:**
```css
--primary: #0F172A        /* Slate 900 - Dark blue/gray */
--primary-foreground: #F8FAFC
--secondary: #1E293B     /* Slate 800 */
--accent: #F59E0B        /* Amber 500 - Gold/Yellow accent */
--accent-foreground: #0F172A
--background: #F1F5F9    /* Slate 100 */
--card: #FFFFFF
--card-foreground: #0F172A
--border: #E2E8F0        /* Slate 200 */
--muted: #64748B         /* Slate 500 */
--destructive: #EF4444   /* Red 500 */
--success: #22C55E       /* Green 500 */
--info: #3B82F6          /* Blue 500 */
```

**Typography:**
- Font Family: "Inter", system-ui, sans-serif
- Headings: 
  - H1: 32px, font-weight: 700
  - H2: 24px, font-weight: 600
  - H3: 20px, font-weight: 600
  - H4: 16px, font-weight: 600
- Body: 14px, font-weight: 400
- Small: 12px, font-weight: 400

**Spacing System:**
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 48, 64px

**Visual Effects:**
- Card shadows: `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`
- Hover shadows: `0 4px 6px rgba(0,0,0,0.1)`
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Transitions: 150ms ease-in-out

### 2.3 Components

**Cards:**
- White background
- Subtle shadow
- 8px border radius
- 24px padding

**Buttons:**
- Primary: Dark background, yellow accent
- Secondary: Outlined
- Ghost: Transparent with hover
- States: default, hover, active, disabled, loading

**Tables:**
- Striped rows (alternate gray)
- Sortable headers
- Pagination
- Row actions

**Forms:**
- Label above input
- Error messages below
- Required field indicator
- Loading state on submit

**Badges/Tags:**
- Color variants (success, warning, error, info)
- Small rounded pills

---

## 3. Functionality Specification

### 3.1 Authentication (Firebase Auth)

**Features:**
- Email/password registration
- Email/password login
- Password reset via email
- Session persistence
- Logout

**User Flow:**
1. Unauthenticated users → Login page
2. Register → Create account → Auto-create barberia
3. Login → Redirect to dashboard

### 3.2 Multi-Tenant Data Structure

```
/users/{userId}
  - email: string
  - nome: string
  - createdAt: timestamp
  - plano: "free" | "pro" | "premium"

/barbearias/{userId}
  - nome: string
  - plano: "free" | "pro" | "premium"
  - createdAt: timestamp

/barbearias/{userId}/atendimentos/{atendimentoId}
  - cliente: string
  - barbeiro: string
  - servico: string
  - valor: number
  - produtoVendido: { nome, valor }?
  - comissao: number
  - createdAt: timestamp

/barbearias/{userId}/produtos/{produtoId}
  - nome: string
  - categoria: string
  - custo: number
  - precoVenda: number
  - quantidade: number
  - estoqueMinimo: number
  - createdAt: timestamp

/barbearias/{userId}/barbeiros/{barbeiroId}
  - nome: string
  - telefone: string
  - comissaoServico: number (default 40)
  - comissaoProduto: number (default 15)
  - createdAt: timestamp

/barbearias/{userId}/servicos/{servicoId}
  - nome: string
  - preco: number
  - createdAt: timestamp

/barbearias/{userId}/caixa/{data}
  - abertura: number
  - fechamento: number
  - movimentacoes: array
  - createdAt: timestamp
```

### 3.3 Dashboard

**KPIs Cards (4 columns on desktop):**
1. Faturamento do Dia - Total value of all appointments today
2. Atendimentos Hoje - Count of appointments today
3. Ticket Médio - Average value per appointment
4. Comissões Hoje - Total commissions for today

**Recent Appointments Table:**
- Last 10 appointments
- Columns: Cliente, Barbeiro, Serviço, Valor, Hora

**Quick Actions:**
- "Novo Atendimento" button
- "Fechar Caixa" button

### 3.4 Appointments

**List View:**
- Table with all appointments
- Filter by date range
- Search by client name

**Create/Edit Modal:**
- Client name (text input)
- Barber (select from list)
- Service (select from list)
- Value (auto-filled from service, editable)
- Product sold (optional, select from products)
- Commission auto-calculated:
  - Service: 40% of value
  - Product: 15% of value

### 3.5 Barbers/Commissions

**Barber Management:**
- Add/Edit/Delete barbers
- Set individual commission rates

**Commission Report:**
- Ranking by total commission
- Daily totals
- Service vs Product breakdown

### 3.6 Products/Inventory

**Product List:**
- Name, category, cost, price, quantity
- Low stock warning badge

**Add/Edit Product:**
- Name, category, cost, price, quantity, minimum stock

**Stock Movements:**
- Entry (add quantity)
- Exit (remove quantity)
- History log

### 3.7 Cash Register

**Daily Summary:**
- Opening balance
- Gross revenue (services + products)
- Total commissions paid
- Net profit
- Closing balance

**Close Day:**
- Button to close register
- Creates daily summary record

### 3.8 Reports

**Period Selector:**
- Last 7 days
- Last 30 days
- Custom range

**Charts/Metrics:**
- Revenue by day (bar chart)
- Top services (pie/bar)
- Barber performance (ranking)

---

## 4. Technical Specification

### 4.1 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS 3.x
- **Components:** Shadcn/UI
- **Icons:** Lucide React
- **Auth/Database:** Firebase (Auth + Firestore)
- **State:** React Context + useState
- **Forms:** React Hook Form + Zod

### 4.2 Project Structure

```
/app
  /layout.tsx              - Root layout with providers
  /page.tsx                - Login/Landing (redirect if authenticated)
  /(auth)
    /login/page.tsx        - Login form
    /register/page.tsx     - Register form
  /(dashboard)
    /layout.tsx            - Dashboard layout with sidebar
    /dashboard/page.tsx    - Main dashboard
    /atendimentos/page.tsx - Appointments list
    /comissoes/page.tsx    - Commissions page
    /produtos/page.tsx     - Products/Inventory
    /caixa/page.tsx        - Cash register
    /relatorios/page.tsx   - Reports
    /configuracoes/page.tsx - Settings
/components
  /ui/                     - Shadcn components
  /layout/                 - Sidebar, Topbar
  /forms/                  - Form components
/lib
  /firebase.ts             - Firebase config
  /hooks/                  - Custom hooks
  /utils.ts                - Utility functions
/services
  /auth.service.ts        - Auth operations
  /barbearia.service.ts   - CRUD operations
/types
  /index.ts                - TypeScript interfaces
```

### 4.3 Key Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "firebase": "10.x",
    "lucide-react": "latest",
    "react-hook-form": "7.x",
    "zod": "3.x",
    "@hookform/resolvers": "3.x",
    "recharts": "2.x",
    "date-fns": "2.x",
    "clsx": "2.x",
    "tailwind-merge": "2.x"
  },
  "devDependencies": {
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "eslint": "8.x"
  }
}
```

---

## 5. Acceptance Criteria

### 5.1 Authentication
- [ ] User can register with email/password
- [ ] User can login with credentials
- [ ] User can logout
- [ ] Session persists on refresh

### 5.2 Multi-Tenancy
- [ ] Each user sees only their own data
- [ ] Data isolation enforced at Firestore level

### 5.3 Dashboard
- [ ] Shows 4 KPI cards with real data
- [ ] Recent appointments table populated
- [ ] Quick action buttons work

### 5.4 Appointments
- [ ] Can create new appointment
- [ ] Commission auto-calculated
- [ ] Can view/edit/delete appointments

### 5.5 Products
- [ ] Can add/edit/delete products
- [ ] Stock quantity tracks movements
- [ ] Low stock warning shows

### 5.6 Cash Register
- [ ] Shows daily summary
- [ ] Close day button works

### 5.7 Reports
- [ ] Date range filter works
- [ ] Charts display correctly

### 5.8 UI/UX
- [ ] Loading states on all async operations
- [ ] Toast notifications for actions
- [ ] Responsive design works
- [ ] Consistent styling throughout