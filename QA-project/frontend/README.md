# 🖥️ QA Defect Analytics - Frontend

[![Framework](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![UI](https://img.shields.io/badge/UI-Shadcn-black?logo=shadcnui)](https://ui.shadcn.com/)
[![Styling](https://img.shields.io/badge/CSS-Tailwind-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Typescript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)

The frontend dashboard for the QA Defect Analytics platform, built with **Next.js 15**, providing a high-performance, responsive, and visually stunning interface for managing QA workflows and AI-driven insights.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm / yarn / pnpm

### Installation

1.  **Navigate to directory**:
    ```bash
    cd QA-project/frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🏗️ Key Modules

-   **Dashboard**: Overview of key metrics, charts, and system status.
-   **Applications**: Robust workflow for submitting, reviewing, and authorizing QA-related tasks.
-   **User Portal**: Profile management and Telegram account linking.
-   **Analytics**: In-depth reporting and AI-powered defect categorization.

---

## 🎨 UI Architecture

-   **Routing**: Next.js App Router for server-side rendering and static generation.
-   **State Management**: React Context & Hooks.
-   **Components**: Custom atomic components built on top of **Shadcn UI** and **Radix UI**.
-   **Charts**: Dynamic data visualization using **Recharts**.
-   **Theming**: Full support for dark and light modes with **next-themes**.

---

## 📂 Directory Structure

```text
frontend/
├── app/                  # Next.js App Router pages
│   ├── dashboard/        # Dashboard views
│   ├── applications/     # Workflow management
│   └── (auth)/           # Authentication layout
├── components/           # Reusable UI components
│   ├── ui/               # Shadcn UI primitives
│   ├── business/         # Domain-specific components
│   └── shared/           # Common components
├── context/              # Global state providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API clients
└── public/               # Static assets
```

---

## 🧼 Code Quality & Standards

-   **TypeScript**: Strict typing for enhanced developer experience and stability.
-   **ESLint**: Enforced coding standards for consistency.
-   **Tailwind CSS**: Utility-first CSS for rapid, maintainable styling.
-   **Accessibility**: ARIA-compliant components via Radix UI.
