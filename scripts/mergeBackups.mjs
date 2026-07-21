import fs from 'fs';
import path from 'path';

const file1Path = path.resolve('fc26-tournament-data (1).json');
const file2Path = path.resolve('fc26-tournament-data (2).json');

const data1 = JSON.parse(fs.readFileSync(file1Path, 'utf8'));
const data2 = JSON.parse(fs.readFileSync(file2Path, 'utf8'));

// Combine history, avoiding duplicates by ID
const historyMap = new Map();
(data2.history || []).forEach(h => historyMap.set(h.id, h));
(data1.history || []).forEach(h => historyMap.set(h.id, h));

const combinedHistory = Array.from(historyMap.values()).sort((a, b) => {
  return new Date(b.createdAt) - new Date(a.createdAt);
});

// Combine profiles
const profileMap = new Map();
(data2.profiles || []).forEach(p => profileMap.set(p.managerName.toLowerCase(), p));
(data1.profiles || []).forEach(p => {
  const existing = profileMap.get(p.managerName.toLowerCase());
  if (!existing || (p.squad && p.squad.length >= (existing.squad || []).length)) {
    profileMap.set(p.managerName.toLowerCase(), p);
  }
});

const merged = {
  tournament: data1.tournament || data2.tournament || null,
  history: combinedHistory,
  profiles: Array.from(profileMap.values()),
};

const outputPath = path.resolve('fc26-tournament-data-all.json');
fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf8');

console.log(`Merged ${combinedHistory.length} tournaments into fc26-tournament-data-all.json`);
