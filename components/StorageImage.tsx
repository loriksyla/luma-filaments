import React, { useState, useEffect, ReactNode } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { Package } from 'lucide-react';

const URL_TTL_MS = 10 * 60 * 1000; // 10 minutes
const urlCache = new Map<string, { url: string; timestamp: number }>();

function isDirectUrl(path: string): boolean {
  return path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:');
}

export async function getCachedUrl(path: string): Promise<string> {
  if (!path) return '';
  if (isDirectUrl(path)) return path;

  const cached = urlCache.get(path);
  if (cached && Date.now() - cached.timestamp < URL_TTL_MS) {
    return cached.url;
  }

  const res = await getUrl({ path });
  const url = res.url.toString();
  urlCache.set(path, { url, timestamp: Date.now() });
  return url;
}

interface StorageImageProps {
  path: string;
  className?: string;
  fallbackIcon?: ReactNode;
}

const StorageImage: React.FC<StorageImageProps> = ({ path, className, fallbackIcon }) => {
  const [url, setUrl] = useState<string>(() => {
    if (!path) return '';
    if (isDirectUrl(path)) return path;
    const cached = urlCache.get(path);
    return cached && Date.now() - cached.timestamp < URL_TTL_MS ? cached.url : '';
  });

  useEffect(() => {
    if (!path || url) return;
    getCachedUrl(path).then(setUrl).catch(console.error);
  }, [path]);

  if (!url) return (
    <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${className || 'w-full h-full'}`}>
      {fallbackIcon || <Package size={24} className="text-slate-400" />}
    </div>
  );
  return <img src={url} className={`object-cover ${className || 'w-full h-full'}`} loading="lazy" decoding="async" />;
};

export default StorageImage;
