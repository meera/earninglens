'use client';

import Link from 'next/link';
import Image from 'next/image';

export function AuthHeader() {
  return (
    <div className="flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-3">
        <Image
          src="/hawk-logo.jpg"
          alt="Market Hawk Eye Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <h1 className="font-bold text-text-primary text-2xl">Markey HawkEye</h1>
      </Link>

      <div className="text-sm text-text-tertiary">
        Need help? <Link href="/about" className="text-primary hover:underline">Contact us</Link>
      </div>
    </div>
  );
}
