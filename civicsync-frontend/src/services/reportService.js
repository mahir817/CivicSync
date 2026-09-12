// CivicSync Centralized Report & Location Service
// Coordinates and persistent storage for interactive map reports

export const DHAKA_CENTER = [23.8103, 90.4125];

export const DHAKA_LOCATIONS = {
  'dhaka center': [23.8103, 90.4125],
  'dhaka': [23.8103, 90.4125],
  'mirpur': [23.8069, 90.3687],
  'mirpur 10': [23.8069, 90.3687],
  'mirpur 1': [23.7956, 90.3537],
  'mirpur 2': [23.8041, 90.3614],
  'mirpur 11': [23.8190, 90.3650],
  'mirpur 12': [23.8270, 90.3620],
  'dhanmondi': [23.7461, 90.3742],
  'dhanmondi 27': [23.7533, 90.3768],
  'dhanmondi 32': [23.7510, 90.3775],
  'gulshan': [23.7925, 90.4078],
  'gulshan 1': [23.7788, 90.4162],
  'gulshan 2': [23.7925, 90.4078],
  'banani': [23.7937, 90.4066],
  'uttara': [23.8759, 90.3795],
  'uttara sector 3': [23.8690, 90.3980],
  'uttara sector 10': [23.8820, 90.3850],
  'mohakhali': [23.7785, 90.4008],
  'old dhaka': [23.7104, 90.4074],
  'lalbagh': [23.7189, 90.3882],
  'dmch': [23.7258, 90.3975],
  'dhaka medical college': [23.7258, 90.3975],
  'motijheel': [23.7330, 90.4172],
  'farmgate': [23.7570, 90.3887],
  'karwan bazar': [23.7516, 90.3934],
  'badda': [23.7808, 90.4267],
  'rampura': [23.7612, 90.4208],
  'bashundhara': [23.8191, 90.4526],
  'khilkhet': [23.8293, 90.4216],
  'shantinagar': [23.7397, 90.4137],
  'paltan': [23.7323, 90.4128],
  'malibagh': [23.7485, 90.4160],
  'moghbazar': [23.7490, 90.4035],
  'chittagong': [22.3569, 91.7832],
  'sylhet': [24.8949, 91.8687],
};

export const INITIAL_REPORTS = [
  {
    id: 'report-1',
    title: 'Severe Waterlogging at Mirpur 10 Circle',
    category: 'WATER_LOGGING',
    type: 'unconfirmed',
    confirmations: 18,
    severity: 'Severe (Knee-deep)',
    position: [23.8069, 90.3687],
    locationName: 'Mirpur 10 Circle, Dhaka',
    description: 'Knee-deep water on main road towards Kazipara. Vehicles stranded. Avoid Begum Rokeya Sarani.',
    requesterName: 'Tanvir Ahmed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isCivic: true,
  },
  {
    id: 'report-2',
    title: 'URGENT: B+ Blood Needed — DMCH',
    category: 'BLOOD',
    type: 'verified',
    confirmations: 0,
    position: [23.7258, 90.3975],
    locationName: 'Dhaka Medical College Hospital',
    description: 'Dhaka Medical College, Ward 7. Emergency surgery patient requires 2 units of B+ blood.',
    requesterName: 'Delta Hospital (Verifier)',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    goalAmount: null,
    isCivic: false,
  },
  {
    id: 'report-3',
    title: 'Injured Stray Dog Needs Immediate Care',
    category: 'PET_CARE',
    type: 'verified',
    confirmations: 0,
    position: [23.7925, 90.4078],
    locationName: 'Gulshan 2, Dhaka',
    description: 'Found injured dog near Gulshan 2 circle with fractured leg. VetCare clinic admitted for surgery.',
    requesterName: 'Paws & Whiskers Shelter',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    goalAmount: 8000,
    raisedAmount: 5200,
    isCivic: false,
  },
  {
    id: 'report-4',
    title: 'Drainage Overflow at Karwan Bazar',
    category: 'WATER_LOGGING',
    type: 'unconfirmed',
    confirmations: 6,
    severity: 'Moderate (Ankle-deep)',
    position: [23.7516, 90.3934],
    locationName: 'Karwan Bazar, Dhaka',
    description: 'Underpass drainage clogged after morning downpour. Stagnant water blocking lane entries.',
    requesterName: 'Sadia Rahman',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isCivic: true,
  },
  {
    id: 'report-5',
    title: 'O+ Blood Needed — Delta Hospital',
    category: 'BLOOD',
    type: 'verified',
    confirmations: 0,
    position: [23.7461, 90.3742],
    locationName: 'Dhanmondi, Dhaka',
    description: 'Patient undergoing surgery tomorrow morning needs 2 units of O+ blood. Delta Hospital confirmed.',
    requesterName: 'Rafiul Islam',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    goalAmount: null,
    isCivic: false,
  },
  {
    id: 'report-6',
    title: 'Emergency Flood Relief Distribution',
    category: 'DISASTER_RELIEF',
    type: 'verified',
    confirmations: 0,
    position: [23.8759, 90.3795],
    locationName: 'Uttara Relief Staging Hub, Dhaka',
    description: 'Relief distribution hub for flood victims. Collecting dry rations, clean water tablets, and clothing.',
    requesterName: 'CivicAid NGO',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    goalAmount: 150000,
    raisedAmount: 84000,
    isCivic: false,
  },
  {
    id: 'report-7',
    title: 'School Supplies for Underprivileged Kids',
    category: 'CHARITY',
    type: 'verified',
    confirmations: 0,
    position: [23.7104, 90.4074],
    locationName: 'Old Dhaka (Lalbagh)',
    description: 'Providing books, school bags, and uniforms for 40 children in Old Dhaka.',
    requesterName: 'Mim Akter',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    goalAmount: 60000,
    raisedAmount: 22000,
    isCivic: false,
  }
];

const STORAGE_KEY = 'civicsync_map_reports';

export function getStoredReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REPORTS;
  } catch (err) {
    console.error('Error reading reports from localStorage:', err);
    return INITIAL_REPORTS;
  }
}

export function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('civicsync:reports_updated', { detail: reports }));
  } catch (err) {
    console.error('Error saving reports to localStorage:', err);
  }
}

export function addReport(newReport) {
  const reports = getStoredReports();
  const created = {
    id: 'report-' + Date.now(),
    createdAt: new Date().toISOString(),
    confirmations: 0,
    type: newReport.category === 'WATER_LOGGING' ? 'unconfirmed' : (newReport.type || 'verified'),
    isCivic: newReport.category === 'WATER_LOGGING',
    ...newReport
  };
  const updated = [created, ...reports];
  saveReports(updated);
  return created;
}

export function confirmReport(reportId) {
  const reports = getStoredReports();
  const updated = reports.map(r => {
    if (r.id === reportId) {
      const nextConf = (r.confirmations || 0) + 1;
      return {
        ...r,
        confirmations: nextConf,
        // If 3 or more confirmations, mark as verified/community-confirmed
        type: nextConf >= 3 ? 'verified' : r.type
      };
    }
    return r;
  });
  saveReports(updated);
  return updated;
}

export function resolveCoordinates(locationStr) {
  if (!locationStr) return DHAKA_CENTER;
  
  // Check if string is "lat, lng"
  const coordsMatch = locationStr.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  const normalized = locationStr.toLowerCase().trim();
  for (const [key, coords] of Object.entries(DHAKA_LOCATIONS)) {
    if (normalized.includes(key)) {
      // Add slight jitter so multiple pins in same area don't completely overlap
      const jitterLat = (Math.random() - 0.5) * 0.004;
      const jitterLng = (Math.random() - 0.5) * 0.004;
      return [coords[0] + jitterLat, coords[1] + jitterLng];
    }
  }

  // Fallback to Dhaka center with minor jitter
  const jLat = (Math.random() - 0.5) * 0.015;
  const jLng = (Math.random() - 0.5) * 0.015;
  return [DHAKA_CENTER[0] + jLat, DHAKA_CENTER[1] + jLng];
}
