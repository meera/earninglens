import { NextResponse } from 'next/server';

/**
 * Post-deployment webhook to notify search engines of sitemap updates
 * Called by Vercel after successful deployment
 */
export async function POST(request: Request) {
  // Verify this is from Vercel (check secret token)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.DEPLOY_HOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://markethawkeye.com';
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  try {
    // Ping Google
    await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);

    // Ping Bing
    await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);

    return NextResponse.json({
      success: true,
      message: 'Search engines notified',
      sitemap: sitemapUrl,
    });
  } catch (error) {
    console.error('Failed to notify search engines:', error);
    return NextResponse.json(
      {
        error: 'Failed to ping search engines',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for manual testing
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://markethawkeye.com';
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  return NextResponse.json({
    message: 'Use POST method with Authorization header',
    sitemap: sitemapUrl,
    example: `curl -X POST ${baseUrl}/api/post-deploy -H "Authorization: Bearer YOUR_SECRET"`,
  });
}
