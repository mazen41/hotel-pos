// Root layout required by Next.js, simply forwards children to the [locale] layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
