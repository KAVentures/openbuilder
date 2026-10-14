'use client';
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <main><h1>Something went wrong</h1><p>We couldn't load this page. Please try again.</p><button onClick={reset}>Try again</button></main>;}
