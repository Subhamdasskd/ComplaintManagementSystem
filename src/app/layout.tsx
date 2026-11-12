import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Complaint Management System — TTL Grievance Desk",
    template: "%s · Complaint Management System",
  },
  description:
    "A role-based complaint management system with automatic assignment, SLA tracking, time-based escalation across L1, L2 and L3 support levels, and live analytics.",
  applicationName: "Complaint Management System",
  authors: [{ name: "Subham Das" }],
  keywords: [
    "complaint management system",
    "grievance handling",
    "helpdesk",
    "SLA",
    "escalation",
    "Next.js",
    "Prisma",
    "PostgreSQL",
  ],
  openGraph: {
    title: "Complaint Management System",
    description:
      "Role-based grievance handling with auto-assignment, SLA tracking and L1 → L2 → L3 escalation.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f9ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
