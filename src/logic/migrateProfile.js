/**
 * Converts a profile from the old single-team format (preferredClub + squad)
 * to the new multi-team format (teams array).
 * Idempotent: profiles already in the new format are returned as-is.
 */
export function migrateProfileShape(profile) {
  if (Array.isArray(profile.teams)) return profile; // already new format
  const oldClub  = profile.preferredClub || '';
  const oldSquad = Array.isArray(profile.squad) ? profile.squad : [];
  return {
    ...profile,
    teams: oldClub
      ? [{ id: profile.id + '_legacy', clubName: oldClub, squad: oldSquad }]
      : [],
  };
}
