import { Injectable, Logger } from '@nestjs/common';

export interface AppyPayChargeResponse {
    id: string;
    status: string;
    reference?: string;
    amount: number;
    merchantTransactionId: string;
}

export interface CreateGpoParams {
    amount: number;
    merchantTransactionId: string;
    description: string;
    phoneNumber: string;
    customerName: string;
}

interface TokenCache {
    token: string;
    expiresAt: number; // unix ms
}

@Injectable()
export class AppyPayProvider {
    private readonly logger = new Logger(AppyPayProvider.name);
    private tokenCache: TokenCache | null = null;

    private get baseUrl() { return process.env.APPYPAY_BASE_URL || 'https://gwy-api.appypay.co.ao/v2.0'; }
    private get tokenUrl() { return process.env.APPYPAY_TOKEN_URL || 'https://auth.appypay.co.ao/connect/token'; }
    private get clientId() { return process.env.APPYPAY_CLIENT_ID || ''; }
    private get clientSecret() { return process.env.APPYPAY_CLIENT_SECRET || ''; }
    private get resource() { return process.env.APPYPAY_RESOURCE || ''; }
    private get paymentMethodGpo() { return process.env.APPYPAY_PAYMENT_METHOD_GPO || ''; }

    private get isConfigured(): boolean {
        return !!(this.clientId && this.clientSecret);
    }

    // ─── OAuth2 Token (with in-memory cache) ───
    async getAccessToken(): Promise<string> {
        if (!this.isConfigured) {
            this.logger.warn('[AppyPay] Credentials not configured — skipping token fetch');
            return '';
        }

        // Return cached token if still valid (with 60s buffer)
        if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
            return this.tokenCache.token;
        }

        try {
            const body = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                resource: this.resource,
            });

            const response = await fetch(this.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });

            if (!response.ok) {
                throw new Error(`AppyPay token request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as { access_token: string; expires_in: number };

            // Cache token with (expires_in - 60s) buffer
            this.tokenCache = {
                token: data.access_token,
                expiresAt: Date.now() + (data.expires_in - 60) * 1000,
            };

            this.logger.log('[AppyPay] Access token acquired and cached');
            return this.tokenCache.token;
        } catch (error: unknown) {
            const err = error as any;
            this.logger.error(`[AppyPay] Failed to get access token: ${err.message}`);
            throw err;
        }
    }

    // ─── Create GPO Charge ───
    async createGpoCharge(params: CreateGpoParams): Promise<AppyPayChargeResponse> {
        if (!this.isConfigured) {
            this.logger.warn('[AppyPay] Credentials not configured — skipping charge creation');
            return { id: 'MOCK', status: 'PENDING', amount: params.amount, merchantTransactionId: params.merchantTransactionId };
        }

        try {
            const token = await this.getAccessToken();

            const payload = {
                amount: params.amount,
                currency: 'AOA',
                merchantTransactionId: params.merchantTransactionId,
                description: params.description,
                paymentMethod: this.paymentMethodGpo,
                phoneNumber: params.phoneNumber, // formato 244XXXXXXXXX
                isAsync: true,
                notify: {
                    name: params.customerName,
                    telephone: params.phoneNumber,
                    smsNotification: true,
                    emailNotification: false,
                },
            };

            const response = await fetch(`${this.baseUrl}/charges`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`AppyPay createGpoCharge failed: ${response.status} — ${errorBody}`);
            }

            const data = await response.json() as AppyPayChargeResponse;
            this.logger.log(`[AppyPay] GPO charge created: ${data.id} (ref: ${data.reference})`);
            return data;
        } catch (error: unknown) {
            const err = error as any;
            this.logger.error(`[AppyPay] createGpoCharge error: ${err.message}`);
            throw err;
        }
    }

    // ─── Get Charge Status ───
    async getChargeStatus(chargeId: string): Promise<AppyPayChargeResponse> {
        if (!this.isConfigured) {
            this.logger.warn('[AppyPay] Credentials not configured — skipping charge status');
            return { id: chargeId, status: 'UNKNOWN', amount: 0, merchantTransactionId: '' };
        }

        try {
            const token = await this.getAccessToken();

            const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`AppyPay getChargeStatus failed: ${response.status} ${response.statusText}`);
            }

            return await response.json() as AppyPayChargeResponse;
        } catch (error: unknown) {
            const err = error as any;
            this.logger.error(`[AppyPay] getChargeStatus error: ${err.message}`);
            throw err;
        }
    }
}
