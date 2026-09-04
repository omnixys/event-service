import { env } from '../../config/env.js';
import { GeocodingUnavailableError } from '../errors/geocoding-unavailable.error.js';
import type { GeocodeResultPayload } from '../models/payloads/geocode-result.payload.js';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OmnixysLogger } from '@omnixys/logger-ts';
import { TraceRunner } from '@omnixys/observability-ts';
import { firstValueFrom } from 'rxjs';

const { GEOCODING_URL, GEOCODING_COUNTRY_CODES } = env;

interface NominatimResult {
  readonly lat?: unknown;
  readonly lon?: unknown;
  readonly display_name?: unknown;
}

@Injectable()
export class GeocodingService {
  private readonly logger;

  constructor(
    private readonly http: HttpService,
    logger: OmnixysLogger,
  ) {
    this.logger = logger.log(this.constructor.name);
  }

  async geocode(address: string): Promise<GeocodeResultPayload | null> {
    return TraceRunner.run('[SERVICE] geocodeAddress', async () => {
      this.logger.info('External geocoding call started: %o', {
        provider: 'nominatim',
      });

      try {
        const response = await firstValueFrom(
          this.http.get<unknown>(GEOCODING_URL, {
            params: {
              format: 'json',
              addressdetails: 1,
              limit: 1,
              countrycodes: GEOCODING_COUNTRY_CODES,
              q: address,
            },
            headers: {
              'user-agent': 'omnixys-event-service/1.0',
            },
          }),
        );

        if (!Array.isArray(response.data) || response.data.length === 0) {
          this.logger.info('External geocoding call finished: %o', {
            provider: 'nominatim',
            matched: false,
          });
          return null;
        }

        const result = response.data[0] as NominatimResult;
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new GeocodingUnavailableError('invalid-response');
        }

        this.logger.info('External geocoding call finished: %o', {
          provider: 'nominatim',
          matched: true,
        });
        return {
          latitude,
          longitude,
          displayName: typeof result.display_name === 'string' ? result.display_name : undefined,
        };
      } catch (error) {
        if (error instanceof GeocodingUnavailableError) {
          throw error;
        }
        this.logger.error('External geocoding call failed: %o', {
          provider: 'nominatim',
          error,
        });
        throw new GeocodingUnavailableError('upstream-failure');
      }
    });
  }
}
