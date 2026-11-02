import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { Toaster } from "sonner";
import { PageTitle } from "@/components/page-title";
export const metadata: Metadata = { title: "BookNook | A little room for big stories", description: "Discover, share, and borrow your next favorite book." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><PageTitle/><SiteHeader/><main>{children}</main><SiteFooter/><Toaster position="top-right" richColors/></body></html>; }
