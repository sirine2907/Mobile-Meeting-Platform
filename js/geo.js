// Location functions: city autocomplete, distance and search
// For now it uses the CITIES list from data.js. In milestone 2 this will
// call a real geocoding API and the search will run on the server.

// "Montréal" -> "montreal" so the user can type without accents
function normalizeText(text) {
  return (text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findCity(name) {
  const wanted = normalizeText(name);
  return CITIES.find(function (city) {
    return normalizeText(city.name) === wanted;
  });
}

// returns the cities that match a name or a postcode (ex: "J9P 1A1")
function searchCities(query) {
  const q = normalizeText(query);
  if (q === "") return [];

  // canadian postcodes start with letter + digit
  const looksLikePostcode = /^[a-z]\d/.test(q);

  const matches = CITIES.filter(function (city) {
    if (looksLikePostcode) {
      return city.postcodes.some(function (code) {
        const prefix = normalizeText(code);
        return prefix.startsWith(q) || q.startsWith(prefix);
      });
    }
    return normalizeText(city.name).includes(q);
  });

  return matches.slice(0, 6);
}

// distance in km between two points (haversine formula)
function getDistanceKm(from, to) {
  const EARTH_RADIUS = 6371;
  const toRad = function (deg) { return (deg * Math.PI) / 180; };

  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(a));
}

// we only know the city of each user, so the distance is never exact
function formatDistance(km) {
  if (km < 5) return "< 5 km";
  return "≈ " + Math.round(km / 5) * 5 + " km";
}

function distanceFromMe(person) {
  const myCity = findCity(CURRENT_USER.city);
  const theirCity = findCity(person.city);
  if (!myCity || !theirCity) return null;
  return getDistanceKm(myCity, theirCity);
}

// search = { city, radius, interests, sort }
function searchProfiles(search) {
  const center = findCity(search.city);
  if (!center) {
    return { error: "We couldn't find “" + search.city + "”. Pick a city from the suggestions." };
  }

  const results = [];
  PROFILES.forEach(function (profile) {
    const city = findCity(profile.city);
    if (!city) return; // skip profiles with an unknown city

    const km = getDistanceKm(center, city);
    if (km > search.radius) return;

    const shared = profile.interests.filter(function (i) { return search.interests.includes(i); });
    if (search.interests.length > 0 && shared.length === 0) return;

    results.push(Object.assign({}, profile, { km: km, shared: shared }));
  });

  if (search.sort === "recent") {
    results.sort(function (a, b) { return b.joined.localeCompare(a.joined); });
  } else {
    // nearest first, then the ones with more interests in common
    results.sort(function (a, b) { return a.km - b.km || b.shared.length - a.shared.length; });
  }

  return { center: center, results: results };
}
