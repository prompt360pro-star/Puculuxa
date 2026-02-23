export interface Order {
    id: string;
    customerName: string;
    eventType: string;
    status: 'PENDING' | 'APPROVED' | 'PRODUCING' | 'READY';
    total: number;
    createdAt: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
}

export interface User {
    id: string;
    name?: string;
    email: string;
    phone?: string;
    role: 'ADMIN' | 'CUSTOMER';
    createdAt: string;
}

export interface Review {
    id: string;
    userId: string;
    orderId: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user?: {
        name: string;
    };
}
