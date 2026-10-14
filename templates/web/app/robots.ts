import type {MetadataRoute} from 'next';
export default function robots():MetadataRoute.Robots{
  const origin=process.env.NEXT_PUBLIC_SITE_URL;
  // Refuse indexing until a real HTTPS origin is configured.
  if(!origin||!/^https:\/\//.test(origin)) return {rules:[{userAgent:'*',disallow:'/'}]};
  return {rules:[{userAgent:'*',allow:'/'}],sitemap:new URL('/sitemap.xml',origin).toString()};
}
