import { uid } from './uid.js';

const PHASE_ORDER = { league: 0, eliminator: 1, final: 2 };

export function teamFixturesOrdered(fixtures, teamId) {
  return fixtures
    .filter(f => f.homeId === teamId || f.awayId === teamId)
    .sort((a, b) => {
      const pa = PHASE_ORDER[a.phase] ?? 0, pb = PHASE_ORDER[b.phase] ?? 0;
      if (pa !== pb) return pa - pb;
      return (a.matchday || 999) - (b.matchday || 999);
    });
}

export function nextFixtureForTeam(fixtures, teamId, currentId) {
  const ord = teamFixturesOrdered(fixtures, teamId);
  const idx = ord.findIndex(f => f.id === currentId);
  if (idx < 0) return null;
  for (let i = idx + 1; i < ord.length; i++) {
    if (ord[i].status === 'pending' || ord[i].status === 'locked') return ord[i];
  }
  return null;
}

export function createSuspensions(suspensions, fixtures, redCards, fixtureId) {
  const newSuspensions = [...suspensions];
  redCards.forEach(rc => {
    const next = nextFixtureForTeam(fixtures, rc.teamId, fixtureId);
    newSuspensions.push({
      id: uid(),
      playerId: rc.playerId,
      playerName: rc.playerName,
      teamId: rc.teamId,
      givenInFixtureId: fixtureId,
      servesInFixtureId: next ? next.id : null,
      served: false,
    });
  });
  return newSuspensions;
}

export function resolvePendingSuspensions(suspensions, fixtures) {
  return suspensions.map(s => {
    if (s.served) return s;
    const next = nextFixtureForTeam(fixtures, s.teamId, s.givenInFixtureId);
    return { ...s, servesInFixtureId: next ? next.id : null };
  });
}

export function serveFixtureSuspensions(suspensions, fixtureId) {
  return suspensions.map(s =>
    s.servesInFixtureId === fixtureId ? { ...s, served: true } : s
  );
}

export function activeSuspensions(suspensions) {
  return (suspensions || []).filter(s => !s.served);
}

export function suspensionsForFixture(suspensions, fid) {
  return (suspensions || []).filter(s => s.servesInFixtureId === fid && !s.served);
}
