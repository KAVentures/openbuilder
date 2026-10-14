import Link from 'next/link';
export default function Home(){
  return <main>
    <div className="eyebrow">Your app is ready to customize</div>
    <h1>Build something people will love.</h1>
    <p>This is a secure-by-default starting point, not a finished production application. Describe the product you want to your AI; OpenBuilder will guide development and verification.</p>
    <Link className="button" href="/contact">Get in touch</Link>
    <section className="card"><h2>Next steps</h2><p>Connect services only as needed. Check your application locally, complete the launch checklist, and only then deploy.</p></section>
  </main>;
}
