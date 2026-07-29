import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "MIKU TYPE — 1:1 타자 대결", description: "한국어 노래 가사로 즐기는 로컬 1대1 타자 배틀" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
