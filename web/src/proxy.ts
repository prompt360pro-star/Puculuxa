import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): { role?: string } | null {
    try {
        const base64Payload = token.split('.')[1];
        const decoded = Buffer.from(base64Payload, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

export function proxy(request: NextRequest) {
    const token = request.cookies.get('puculuxa_token')?.value;
    const { pathname } = request.nextUrl;

    // Protege rotas do dashboard — exige token E role ADMIN
    if (pathname.startsWith('/dashboard')) {
        if (!token) {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
        const payload = decodeJwtPayload(token);
        if (!payload || payload.role !== 'ADMIN') {
            const url = request.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    // Redireciona de /login para /dashboard se já estiver logado como ADMIN
    if (pathname === '/login' && token) {
        const payload = decodeJwtPayload(token);
        if (payload?.role === 'ADMIN') {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
