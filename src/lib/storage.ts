import { kv } from '@vercel/kv';
import { SnapshotData, WeeklyAnalysis } from './constants';

// Keys for KV storage
const SNAPSHOTS_KEY = 'stableflows:snapshots';
const ANALYSIS_KEY = 'stableflows:analyses';

// Load all historical snapshots
export async function loadSnapshots(): Promise<SnapshotData[]> {
  try {
    const data = await kv.get<SnapshotData[]>(SNAPSHOTS_KEY);
    return data || [];
  } catch (error) {
    console.error('Failed to load snapshots from KV:', error);
    return [];
  }
}

// Save a new snapshot
export async function saveSnapshot(snapshot: SnapshotData): Promise<void> {
  try {
    const snapshots = await loadSnapshots();

    // Check if we already have a snapshot for today
    const today = snapshot.timestamp.split('T')[0];
    const existingIndex = snapshots.findIndex(s => s.timestamp.startsWith(today));

    if (existingIndex >= 0) {
      // Update existing snapshot for today
      snapshots[existingIndex] = snapshot;
    } else {
      // Add new snapshot
      snapshots.push(snapshot);
    }

    // Keep only last 365 days of data
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 365);
    const filtered = snapshots.filter(s => new Date(s.timestamp) >= cutoff);

    await kv.set(SNAPSHOTS_KEY, filtered);
  } catch (error) {
    console.error('Failed to save snapshot to KV:', error);
    throw error;
  }
}

// Get the latest snapshot
export async function getLatestSnapshot(): Promise<SnapshotData | null> {
  const snapshots = await loadSnapshots();
  if (snapshots.length === 0) return null;
  return snapshots[snapshots.length - 1];
}

// Get snapshots for a date range
export async function getSnapshotsInRange(startDate: Date, endDate: Date): Promise<SnapshotData[]> {
  const snapshots = await loadSnapshots();
  return snapshots.filter(s => {
    const date = new Date(s.timestamp);
    return date >= startDate && date <= endDate;
  });
}

// Get weekly snapshots (one per week) for charts
export async function getWeeklySnapshots(weeks: number = 12): Promise<SnapshotData[]> {
  const snapshots = await loadSnapshots();
  if (snapshots.length === 0) return [];

  const result: SnapshotData[] = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - (i * 7));

    // Find the closest snapshot to this date
    let closest: SnapshotData | null = null;
    let closestDiff = Infinity;

    for (const snapshot of snapshots) {
      const snapshotDate = snapshot.timestamp.split('T')[0];
      const diff = Math.abs(new Date(snapshotDate).getTime() - targetDate.getTime());
      if (diff < closestDiff && diff < 4 * 24 * 60 * 60 * 1000) { // Within 4 days
        closest = snapshot;
        closestDiff = diff;
      }
    }

    if (closest) {
      result.unshift(closest); // Add to beginning to maintain chronological order
    }
  }

  return result;
}

// Load weekly analyses
export async function loadAnalyses(): Promise<WeeklyAnalysis[]> {
  try {
    const data = await kv.get<WeeklyAnalysis[]>(ANALYSIS_KEY);
    return data || [];
  } catch (error) {
    console.error('Failed to load analyses from KV:', error);
    return [];
  }
}

// Save a new analysis
export async function saveAnalysis(analysis: WeeklyAnalysis): Promise<void> {
  try {
    const analyses = await loadAnalyses();
    analyses.push(analysis);

    // Keep only last 52 weeks of analyses
    const trimmed = analyses.slice(-52);
    await kv.set(ANALYSIS_KEY, trimmed);
  } catch (error) {
    console.error('Failed to save analysis to KV:', error);
    throw error;
  }
}

// Get the latest analysis
export async function getLatestAnalysis(): Promise<WeeklyAnalysis | null> {
  const analyses = await loadAnalyses();
  if (analyses.length === 0) return null;
  return analyses[analyses.length - 1];
}

// Get total snapshot count (for determining if we have enough data for charts)
export async function getSnapshotCount(): Promise<number> {
  const snapshots = await loadSnapshots();
  return snapshots.length;
}
