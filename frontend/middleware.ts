import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const {pathname} = request.nextUrl;

  // Public routes (without locale prefix)
  const publicRoutes = ['/', '/login', '/register'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`/${route}`)
  );

  // Also check public routes with locale prefix
  const publicRoutesWithLocale = ['/en/login', '/en/register', '/ar/login', '/ar/register'];
  const isPublicRouteWithLocale = publicRoutesWithLocale.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect to login if not authenticated and trying to access protected route
  if (!token && !isPublicRoute && !isPublicRouteWithLocale) {
    const locale = request.headers.get('accept-language')?.includes('ar') ? 'ar' : 'en';
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Apply internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for internal Next.js files and static assets
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the locale of the user
    '/(en|ar)/:path*',

    // Match all pathnames except for
    // - API routes
    // - Static files (_next/static, _next/image, favicon.ico, images, etc.)
    // - File downloads (.png, .jpg, .svg, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ]
};
