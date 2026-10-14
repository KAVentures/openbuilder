import type {Metadata} from 'next';
import Link from 'next/link';
import './globals.css';
const origin=process.env.NEXT_PUBLIC_SITE_URL;
export const metadata:Metadata={
  title:{default:'Your new app',template:'%s | Your new app'},
  description:'A starter web application built with OpenBuilder. Replace this description before launch.',
  ...(origin&&/^https:\/\//.test(origin)?{metadataBase:new URL(origin)}:{}),
  openGraph:{title:'Your new app',description:'Replace with a real product description.'}
};
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>
    <header><Link href="/" aria-label="Home"><strong>OpenBuilder Starter</strong></Link><nav aria-label="Main navigation"><Link href="/">Home</Link><Link href="/contact">Contact</Link></nav></header>
    {children}
    <footer><span>Built with OpenBuilder</span><nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></footer>
  </body></html>;
}
