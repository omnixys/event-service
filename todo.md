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
