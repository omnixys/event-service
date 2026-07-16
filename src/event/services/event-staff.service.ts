import { UserRoleType } from '../../prisma/generated/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventStaffPayload } from '../models/payloads/event-staff.payload.js';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger';
import { TraceRunner } from '@omnixys/observability';
import { firstValueFrom } from 'rxjs';

interface UserServiceUser {
  id: string;
  username: string;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumbers?: Array<{
      number: string;
      type?: string;
      label?: string;
      isPrimary?: boolean;
    }>;
  };
}

interface UserServiceResponse {
  data?: {
    getUserList?: UserServiceUser[];
  };
  errors?: Array<{ message: string }>;
}

@Injectable()
export class EventStaffService {
  private readonly logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly omnixysLogger: OmnixysLogger,
  ) {
    this.logger = this.omnixysLogger.log(this.constructor.name);
  }

  async getStaff(eventId: string, authToken?: string): Promise<EventStaffPayload[]> {
    return TraceRunner.run('[SERVICE] getEventStaff', async () => {
      this.logger.debug('Fetching staff for event', { eventId });

      const rows = await this.prisma.role.findMany({
        where: {
          eventId,
          role: { not: UserRoleType.GUEST },
        },
        select: { userId: true, role: true },
      });

      this.logger.debug('Staff roles resolved from DB', {
        eventId,
        count: rows.length,
      });

      const grouped = new Map<string, string[]>();
      for (const r of rows) {
        const existing = grouped.get(r.userId) ?? [];
        existing.push(r.role);
        grouped.set(r.userId, existing);
      }

      const userIds = Array.from(grouped.keys());
      const userDetails = await this.fetchUserDetails(userIds, authToken);
      const userMap = new Map(userDetails.map((u) => [u.id, u]));

      return Array.from(grouped.entries()).map(([userId, roles]) => {
        const user = userMap.get(userId);
        return {
          userId,
          roles,
          permissions: [],
          personalInfo: user?.personalInfo
            ? {
                firstName: user.personalInfo.firstName,
                lastName: user.personalInfo.lastName,
              }
            : undefined,
          email: user?.personalInfo?.email,
          phoneNumbers: user?.personalInfo?.phoneNumbers?.map((p) => ({
            number: p.number,
            type: p.type,
            label: p.label,
            isPrimary: p.isPrimary,
          })),
          username: user?.username,
        } satisfies EventStaffPayload;
      });
    });
  }

  private async fetchUserDetails(
    userIds: string[],
    authToken?: string,
  ): Promise<UserServiceUser[]> {
    if (userIds.length === 0) {
      return [];
    }

    try {
      const query = {
        query: `
          query GetStaffUsers($userIds: [ID!]!) {
            getUserList(userIds: $userIds) {
              id
              username
              personalInfo {
                firstName
                lastName
                email
                phoneNumbers {
                  number
                  type
                  label
                  isPrimary
                }
              }
            }
          }
        `,
        variables: { userIds },
      };

      const response = await firstValueFrom(
        this.http.post<UserServiceResponse>(
          process.env.USER_SERVICE_URI ?? 'http://localhost:7001/graphql',
          query,
          {
            headers: {
              'content-type': 'application/json',
              ...(authToken ? { cookie: `access_token=${authToken}` } : {}),
            },
          },
        ),
      );

      if (response.data.errors) {
        this.logger.warn('User service returned errors', {
          errors: response.data.errors,
        });
        return [];
      }

      return response.data.data?.getUserList ?? [];
    } catch (error) {
      this.logger.error('Failed to fetch user details from user service', {
        error,
      });
      return [];
    }
  }
}
