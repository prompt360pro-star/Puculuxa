import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });

    const softDeleteModels = ['Product', 'Quotation', 'User', 'Order'];

    const extendedClient: any = this.$extends({
      query: {
        $allModels: {
          async delete({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              return (extendedClient as any)[model].update({
                ...args,
                data: { deletedAt: new Date() },
              });
            }
            return query(args);
          },
          async deleteMany({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              return (extendedClient as any)[model].updateMany({
                ...args,
                data: { ...((args as any).data || {}), deletedAt: new Date() },
              });
            }
            return query(args);
          },
          async findFirst({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },
          async findUnique({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              return (extendedClient as any)[model].findFirst({
                ...args,
                where: { ...args.where, deletedAt: null },
              });
            }
            return query(args);
          },
          async findMany({ model, args, query }: any) {
            if (softDeleteModels.includes(model)) {
              args.where = { ...args.where, deletedAt: null };
            }
            return query(args);
          },
        },
      },
    });

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'onModuleInit') return target.onModuleInit.bind(target);
        if (prop === 'onModuleDestroy') return target.onModuleDestroy.bind(target);
        if (prop in extendedClient) {
          return (extendedClient as any)[prop];
        }
        return (target as any)[prop];
      },
    }) as any;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
