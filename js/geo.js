/**
 * Location helpers: autocomplete, distance and search.
 * The same logic moves server-side in Milestone 2 (PostGIS / geo query),
 * with a real provider for city and postcode autocomplete.
 */
const Geo = (() => {
  const normalize = (s) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  /** Match cities by name or postcode prefix. */
  function autocomplete(query, limit = 6) {
    const q = normalize(query || "");
    if (!q) return [];
    // Canadian postcodes start letter-digit (e.g. "J9P 1A1"): match on the 3-char prefix.
    const isPostcode = /^[a-z]\d/.test(q);
    return CITIES.filter((c) =>
      isPostcode
        ? c.postcodes.some((p) => { const n = normalize(p); return n.startsWith(q) || q.startsWith(n); })
        : normalize(c.name).includes(q)
    ).slice(0, limit);
  }

  function findCity(name) {
    return CITIES.find((c) => normalize(c.name) === normalize(name || ""));
  }

  /** Great-circle distance in km (Haversine). */
  function distanceKm(a, b) {
    const R = 6371;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /** Distances are city-centre based, so we always display them as approximate. */
  function formatDistance(km) {
    if (km < 5) return "< 5 km";
    return `≈ ${Math.round(km / 5) * 5} km`;
  }

  /**
   * Search profiles around a centre city.
   * @param {{city:string, radius:number, interests:string[], sort:'distance'|'recent'}} opts
   */
  function search({ city, radius, interests = [], sort = "distance" }) {
    const centre = findCity(city);
    if (!centre) return { error: `We couldn't find “${city}”. Pick a city from the suggestions.` };

    const results = PROFILES.map((p) => {
      const km = distanceKm(centre, findCity(p.city));
      const shared = p.interests.filter((i) => interests.includes(i));
      return { ...p, km, shared };
    })
      .filter((p) => p.km <= radius)
      .filter((p) => interests.length === 0 || p.shared.length > 0);

    results.sort(sort === "recent"
      ? (a, b) => b.joined.localeCompare(a.joined)
      : (a, b) => a.km - b.km || b.shared.length - a.shared.length);

    return { centre, results };
  }

  return { autocomplete, findCity, distanceKm, formatDistance, search };
})();
