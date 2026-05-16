SELECT COUNT(*) AS destinations FROM destinations;
SELECT COUNT(*) AS places FROM places;
SELECT COUNT(*) AS places_with_dest FROM places WHERE "destinationId" IS NOT NULL;
SELECT COUNT(*) AS trips FROM trips;
