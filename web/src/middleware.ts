import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('puculuxa_token')?.value;
    const { pathname } = request.nextUrl;

    // Protege rotas do dashboard
    if (pathname.startsWith('/dashboard') && !token) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // Redireciona de /login para /dashboard se já estiver logado
    if (pathname === '/login' && token) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
