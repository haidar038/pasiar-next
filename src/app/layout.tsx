import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// Impor Navbar yang sudah diperbarui
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Pusdatin Budaya Ternate",
    description: "Pusat Data dan Informasi Kebudayaan Kota Ternate",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className={`${inter.className} bg-gray-50`}>
                <Navbar />
                <main>{children}</main>
                {/* Anda bisa menambahkan komponen Footer di sini nanti */}
            </body>
        </html>
    );
}
