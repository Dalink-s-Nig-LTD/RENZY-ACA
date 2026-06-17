# Renzy Academy

Renzy Academy is a full-stack educational web application designed for PMI-ACP Certification Training in Nigeria.

## Architecture & Tech Stack

This project is separated into a robust backend and a highly responsive frontend:

### Frontend
- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a rich custom design system.
- **Components**: [Radix UI](https://www.radix-ui.com/) primitives for accessible components, [Lucide React](https://lucide.dev/) for icons.

### Backend
- **Platform**: [Convex](https://www.convex.dev/) (Serverless Backend)
- **Database**: Convex tables for `submissions`, `adminAuth`, and site `visits`.
- **API/Serverless Functions**: Defined in the `convex/` directory.

## Project Structure

```
├── convex/             # Backend functions, schema, and API
│   ├── schema.ts       # Database schema definitions
│   ├── auth.ts         # Secure server-side admin authentication
│   ├── submissions.ts  # Form submission handlers and analytics
│   └── emails.ts       # Resend integration for email replies
├── src/                # Frontend application
│   ├── components/     # Reusable React components (Navbar, AIAssistant, etc.)
│   ├── lib/            # Utilities, constants, and helper functions
│   ├── routes/         # TanStack Router page definitions
│   ├── server.ts       # Server-side rendering entry point
│   └── styles.css      # Global Tailwind and custom CSS styles
└── public/             # Static assets (images, fonts, etc.)
```

## Getting Started

### Prerequisites
Make sure you have [Bun](https://bun.sh/) installed.

### Installation

1. Clone the repository and install dependencies:
```bash
bun install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Convex connection (provided by default or setup via `npx convex dev`)
VITE_CONVEX_URL="https://adorable-starfish-951.convex.cloud"

# Resend API Key for admin email replies
RESEND_API_KEY="your_resend_api_key_here"
```

### Running Locally

Start the development server:
```bash
bun run dev
```

This will launch the Vite development server. Open your browser and navigate to the local URL (typically `http://localhost:5173`).

### Building for Production

To build the application for production:
```bash
bun run build
```

To preview the built production app:
```bash
bun run preview
```

## Features

- **Responsive Design**: Fully responsive UI tailored for both desktop and mobile devices.
- **AI Assistant**: Interactive AI assistant to answer common user questions instantly.
- **Secure Admin Dashboard**: Built with robust server-side password hashing and session tokens, including rate-limiting and data visualization toggles (7 Days vs All-Time).
- **Live Support**: Direct live chat integration for users to contact support.
- **Real-time Updates**: Convex backend ensures data is reactive and updates in real-time.
