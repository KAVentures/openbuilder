import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{
  const origin=process.env.NEXT_PUBLIC_SITE_URL;
  if(!origin||!/^https:\/\//.test(origin)) return [];
  return ['/','/contact'].map(route=>({url:new URL(route,origin).toString(),changeFrequency:'monthly' as const,priority:route==='/'?1:0.5}));
}
