import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PostsProvider } from "@/contexts/PostsContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pasiar App",
    description: "Authentication with WordPress and Posts Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <PostsProvider>
                        <Navbar />
                        <main>{children}</main>
                    </PostsProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
