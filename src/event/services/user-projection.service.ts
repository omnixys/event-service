import { env } from '../../config/env.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

interface UserProjectionData {
  id: string;
  username: string;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  primaryPhone?: string | null;
  avatarUrl?: string | null;
  locale?: string | null;
}

@Injectable()
export class UserProjectionService implements OnModuleInit {
  private readonly log;
  private getUsersByIds!: (req: { ids: string[] }) => Promise<{ users: UserProjectionData[] }>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: OmnixysLogger,
  ) {
    this.log = this.logger.log(this.constructor.name);
  }

  async onModuleInit(): Promise<void> {
    const pkgPath = fileURLToPath(import.meta.resolve('@omnixys/grpc/proto'));
    const packageDefinition = protoLoader.loadSync(pkgPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const proto = grpc.loadPackageDefinition(packageDefinition) as {
      omnixys?: { user?: { UserService: new (url: string, creds: unknown) => grpc.Client } };
    };
    const UserServiceClient = proto.omnixys?.user?.UserService;
    if (!UserServiceClient) {
      throw new Error('Failed to load gRPC UserService client from proto definition');
    }
    const client = new UserServiceClient(env.GRPC_USER_SERVICE_URL, grpc.credentials.createInsecure());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.getUsersByIds = promisify((client as any).GetUsersByIds.bind(client));
    this.log.info('gRPC UserService client initialized', {
      target: env.GRPC_USER_SERVICE_URL,
    });
  }

  async ensureUsers(userIds: string[]): Promise<void> {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return;

    const existing = await this.prisma.userProjection.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    const existingSet = new Set(existing.map((u) => u.id));
    const missingIds = uniqueIds.filter((id) => !existingSet.has(id));

    if (missingIds.length === 0) return;

    this.log.debug('Fetching missing user projections via gRPC', {
      count: missingIds.length,
    });

    try {
      const { users } = await this.getUsersByIds({ ids: missingIds });

      for (const user of users) {
        await this.prisma.userProjection.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            username: user.username,
            displayName: user.displayName ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            email: user.email ?? null,
            primaryPhone: user.primaryPhone ?? null,
            avatarUrl: user.avatarUrl ?? null,
            locale: user.locale ?? null,
          },
          update: {
            username: user.username,
            displayName: user.displayName ?? null,
            firstName: user.firstName ?? null,
            lastName: user.lastName ?? null,
            email: user.email ?? null,
            primaryPhone: user.primaryPhone ?? null,
            avatarUrl: user.avatarUrl ?? null,
            locale: user.locale ?? null,
            lastSynced: new Date(),
          },
        });
      }

      this.log.info('User projections synced', { count: users.length });
    } catch (error) {
      this.log.error('gRPC fetch for user projections failed', { error });
    }
  }

  async findByUserId(userId: string) {
    return this.prisma.userProjection.findUnique({
      where: { id: userId },
    });
  }

  async findByIds(userIds: string[]) {
    return this.prisma.userProjection.findMany({
      where: { id: { in: userIds } },
    });
  }

  async upsertFromKafka(data: UserProjectionData): Promise<void> {
    const exists = await this.prisma.userProjection.findUnique({
      where: { id: data.id },
      select: { id: true },
    });
    if (!exists) {
      this.log.debug('Ignoring projection update for unknown user', {
        userId: data.id,
      });
      return;
    }

    await this.prisma.userProjection.update({
      where: { id: data.id },
      data: {
        username: data.username,
        displayName: data.displayName ?? null,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        email: data.email ?? null,
        primaryPhone: data.primaryPhone ?? null,
        avatarUrl: data.avatarUrl ?? null,
        locale: data.locale ?? null,
        lastSynced: new Date(),
      },
    });
    this.log.debug('User projection updated from Kafka', { userId: data.id });
  }
}
