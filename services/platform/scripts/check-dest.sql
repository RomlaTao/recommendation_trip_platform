SELECT COUNT(*) AS destinations_count FROM destinations;
SELECT COUNT(*) AS places_total FROM places;
SELECT COUNT(*) AS places_with_destination FROM places WHERE "destinationId" IS NOT NULL;
