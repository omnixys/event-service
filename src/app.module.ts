/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * For more information, visit <https://www.gnu.org/licenses/>.
 */

import { LoggerModule } from '@omnixys/logger';
import { AdminModule } from './admin/admin.module.js';
import { BannerService } from './banner.service.js';
import { env } from './config/env.js';
import { EventModule } from './event/event.module.js';
import { HealthModule } from './health/health.module.js';
import { Module } from '@nestjs/common';
import { OmnixysGraphQLModule } from '@omnixys/graphql';
import { KafkaModule } from '@omnixys/kafka';
import { ObservabilityModule } from '@omnixys/observability';

const { SCHEMA_TARGET, SERVICE, KAFKA_BROKER, TEMPO_URI} = env;

@Module({
  imports: [
    OmnixysGraphQLModule.forRoot({
      autoSchemaFile:
        SCHEMA_TARGET === 'tmp'
          ? { path: '/tmp/schema.gql', federation: 2 }
          : SCHEMA_TARGET === 'false'
            ? false
            : { path: 'dist/schema.gql', federation: 2 },
      sortSchema: true,
    }),

    KafkaModule.forRoot({
      clientId: `${SERVICE}-service`,
      brokers: [KAFKA_BROKER],
      groupId: `${SERVICE}-consumer`,
    }),
    ObservabilityModule.forRoot({
      serviceName: SERVICE,

      otel: {
        endpoint: TEMPO_URI,
        transport: 'http',
        samplingRatio: 1,
      },

      metrics: {
        port: 9464,
        enabled: true,
      },
    }),

    LoggerModule.forRoot({
      serviceName: SERVICE,

      kafka: {
        enabled: true,
        topic: 'logstream.input',
      },
      batch: {
        enabled: true,
        maxSize: 50,
        flushInterval: 2000,
      },
    }),

    AdminModule,
    EventModule,
    HealthModule,
  ],
  controllers: [],
  providers: [BannerService],
})
export class AppModule {
}
