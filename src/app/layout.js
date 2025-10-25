import { Montserrat, Bebas_Neue } from 'next/font/google'
import './globals.css'

// Fuente para texto general
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
})

// Fuente para títulos (ejemplo: Bebas Neue, similar estilo display)
const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
})

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${montserrat.variable} ${bebas.variable}`}>
      <body>{children}</body>
    </html>
  )
}
