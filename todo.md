IDEEN
================================================================================================================================================
new attribute: tags um im frontend zu kategorisieren mit emojis

========================================================================================================================================================================================================================
latitude und longitude für maps aus der api:

https://nominatim.openstreetmap.org/search?format=json&q=Namurstraße 4 70374

input input GeocodeAddressInput {
  address: String!
}
query Geocode($input: GeocodeAddressInput!) {
  geocodeAddress(input: $input) {
    latitude
    longitude
    displayName
  }
}
{
  "input": {
    "address": "Namurstraße 4 70374"
  }
}


type GeocodeResult {
  latitude: Float!
  longitude: Float!
  displayName: String
}


const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=de&q=${encodeURIComponent(input.address)}`;
const result = await fetch(url).then(r => r.json());

return {
  latitude: parseFloat(result[0].lat),
  longitude: parseFloat(result[0].lon),
  displayName: result[0].display_name,
};
================================================================================================================================================================================================================================================================================================

timeline bei Events für jeden meilenstein und zeitpunkt: erstellung, einladung, ticket generierung, öffnung, etc...

================================================================================================================================================================================================================================================================================================
# @license GPL-3.0-or-later
# Copyright (C) 2025 Caleb Gyamfi - Omnixys Technologies
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License for more details.

name: ✅ Task
description: Create or track a technical task within the Event Service project
title: '[Event Task] Async Media Processing via Kafka'
labels: ['task', 'event', 'media', 'kafka']

body:
  - type: input
    id: summary
    attributes:
      label: Task summary
      value: Introduce asynchronous image processing pipeline using Kafka for media uploads
    validations:
      required: true

  - type: textarea
    id: details
    attributes:
      label: Task details
      value: |
        Purpose:
        The current media upload flow performs image processing (variant generation) synchronously,
        which blocks the request lifecycle and impacts performance and scalability.

        This task introduces an asynchronous processing pipeline using Kafka to decouple
        upload handling from image processing.

        Scope:
        - Emit Kafka event after successful media upload (e.g., media.uploaded)
        - Define event payload (mediaId, storage key, metadata)
        - Implement Kafka producer in MediaUploadController
        - Create dedicated consumer/worker for media processing
        - Move MediaProcessingService execution into worker
        - Ensure idempotency and safe re-processing
        - Add logging, tracing, and error handling for async flow

        Expected Deliverables:
        - Kafka topic definition (e.g., media.uploaded)
        - Producer integration in upload flow
        - Worker service consuming events
        - Refactored MediaProcessingService (async execution)
        - Updated architecture (non-blocking upload flow)

        Dependencies / Blockers:
        - Kafka infrastructure availability
        - @omnixys/kafka integration
        - Observability (tracing/logging) alignment
    validations:
      required: true

  - type: textarea
    id: acceptance
    attributes:
      label: Acceptance criteria
      value: |
        - [ ] Upload endpoint no longer blocks on image processing
        - [ ] Kafka event emitted after successful upload
        - [ ] Worker consumes event and processes image variants
        - [ ] Variants are stored and persisted correctly
        - [ ] System handles retries / failures gracefully
        - [ ] No duplicate variant creation (idempotency ensured)
        - [ ] Logs and traces available for full flow
        - [ ] Code merged & tested
        - [ ] Pipeline green
        - [ ] Docs updated