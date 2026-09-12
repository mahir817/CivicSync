import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, 
  Compass, 
  Plus, 
  X, 
  Layers, 
  MapPin, 
  ThumbsUp 
} from 'lucide-react';
import { 
  DHAKA_CENTER, 
  getStoredReports, 
  addReport, 
  confirmReport, 
  resolveCoordinates 
} from '../services/reportService';

// Ensure Leaflet assets don't fail
delete L.Icon.Default.prototype._getIconUrl;

// Custom Teardrop Pin generator using Leaflet L.divIcon
const createCategoryPin = (category, type, confirmations = 0) => {
  let bgColor;
  let iconHtml;
  let pulseBorder;

  const catUpper = (category || '').toUpperCase();

  if (catUpper.includes('WATER') || catUpper.includes('CLOG')) {
    if (confirmations >= 3) {
      bgColor = '#ea580c'; // Confirmed hazard: bright orange
      pulseBorder = 'rgba(234, 88, 12, 0.5)';
      iconHtml = '🌊';
    } else {
      bgColor = '#0284c7'; // Unconfirmed water: sky blue
      pulseBorder = 'rgba(2, 132, 199, 0.4)';
      iconHtml = '💧';
    }
  } else if (catUpper.includes('BLOOD')) {
    bgColor = '#e11d48'; // Rose red
    pulseBorder = 'rgba(225, 29, 72, 0.5)';
    iconHtml = '🩸';
  } else if (catUpper.includes('DISASTER')) {
    bgColor = '#d97706'; // Amber warning
    pulseBorder = 'rgba(217, 119, 6, 0.5)';
    iconHtml = '⚠️';
  } else if (catUpper.includes('PET')) {
    bgColor = '#8b5cf6'; // Purple
    pulseBorder = 'rgba(139, 92, 246, 0.5)';
    iconHtml = '🐾';
  } else {
    bgColor = '#10b981'; // Emerald charity
    pulseBorder = 'rgba(16, 185, 129, 0.5)';
    iconHtml = '🤝';
  }

  return L.divIcon({
    className: 'custom-pin-wrapper',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: pointer;">
        <div style="
          width: 36px;
          height: 36px;
          background: ${bgColor};
          border: 2px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 4px ${pulseBorder};
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        ">
          <span style="transform: rotate(45deg); font-size: 15px; user-select: none;">
            ${iconHtml}
          </span>
        </div>
        <div style="
          width: 7px;
          height: 7px;
          background: ${bgColor};
          border-radius: 50%;
          margin-top: -2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
};

// User's temporary clicked pin
const userPickedIcon = L.divIcon({
  className: 'user-picked-pin',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
      <div style="
        width: 42px;
        height: 42px;
        background: #2563eb;
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 20px #3b82f6, 0 4px 12px rgba(0,0,0,0.5);
      ">
        <span style="transform: rotate(45deg); font-size: 18px;">📍</span>
      </div>
      <div style="
        width: 8px;
        height: 8px;
        background: #2563eb;
        border-radius: 50%;
        margin-top: -3px;
      "></div>
    </div>
  `,
  iconSize: [42, 48],
  iconAnchor: [21, 48],
  popupAnchor: [0, -48],
});

// Map Controller for click events and programmatic flyTo
function MapEventsController({ onMapClick, targetLocation }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size to ensure Leaflet renders all tiles cleanly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (targetLocation) {
      map.flyTo(targetLocation, 14, { duration: 1.2 });
    }
  }, [targetLocation, map]);

  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });

  return null;
}

export default function MapView({ 
  height = '600px', 
  isFullScreen = false, 
  onClose
}) {
  const [reports, setReports] = useState(() => getStoredReports());
  const [newPin, setNewPin] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetLocation, setTargetLocation] = useState(null);
  
  // Reporting Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState('WATER_LOGGING');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLocationName, setReportLocationName] = useState('');
  const [reportSeverity, setReportSeverity] = useState('Severe (Knee-deep)');
  const [reportBloodType, setReportBloodType] = useState('O+');
  const [reportGoal, setReportGoal] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handleUpdate = () => {
      setReports(getStoredReports());
    };

    window.addEventListener('civicsync:reports_updated', handleUpdate);
    return () => {
      window.removeEventListener('civicsync:reports_updated', handleUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMapClick = (latlng) => {
    setNewPin(latlng);
    // Reverse guess location name
    const approxName = `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`;
    setReportLocationName(approxName);
  };

  const openReportModalWithPin = (latlng = null) => {
    if (latlng) {
      setNewPin(latlng);
      setReportLocationName(`Area near ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    } else if (!newPin) {
      // Default to central Dhaka if no pin clicked yet
      setNewPin({ lat: DHAKA_CENTER[0], lng: DHAKA_CENTER[1] });
      setReportLocationName('Dhaka Central');
    }
    setIsReportModalOpen(true);
  };

  const handleCreateReport = (e) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    const lat = newPin ? newPin.lat : DHAKA_CENTER[0];
    const lng = newPin ? newPin.lng : DHAKA_CENTER[1];

    const newEntry = {
      title: reportTitle.trim(),
      category: reportCategory,
      description: reportDesc.trim() || 'No additional details provided.',
      position: [lat, lng],
      locationName: reportLocationName || `Dhaka (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
      severity: reportCategory === 'WATER_LOGGING' ? reportSeverity : undefined,
      bloodGroup: reportCategory === 'BLOOD' ? reportBloodType : undefined,
      goalAmount: reportGoal ? parseFloat(reportGoal) : undefined,
      requesterName: 'Current User',
    };

    addReport(newEntry);
    setReports(getStoredReports());
    setIsReportModalOpen(false);
    setNewPin(null);
    setReportTitle('');
    setReportDesc('');
    setReportGoal('');

    // Center map to new report
    setTargetLocation([lat, lng]);
    showToast(`📍 ${reportCategory.replace('_', ' ')} pinned to map successfully!`);
  };

  const handleConfirmHazard = (reportId, e) => {
    if (e) e.stopPropagation();
    confirmReport(reportId);
    showToast('👍 You confirmed this civic report!');
  };

  // Search location handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const coords = resolveCoordinates(searchQuery.trim());
    setTargetLocation(coords);
    showToast(`Navigated to ${searchQuery}`);
  };

  // Locate current user
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoords = [pos.coords.latitude, pos.coords.longitude];
          setTargetLocation(userCoords);
          setNewPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          showToast('📍 Centered on your current GPS location');
        },
        (err) => {
          console.warn('Geolocation failed:', err);
          showToast('⚠️ Could not access GPS. Centered to Dhaka.');
          setTargetLocation(DHAKA_CENTER);
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.');
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'WATER_LOGGING') return (r.category || '').toUpperCase().includes('WATER');
    if (activeCategory === 'BLOOD') return (r.category || '').toUpperCase().includes('BLOOD');
    if (activeCategory === 'DISASTER_RELIEF') return (r.category || '').toUpperCase().includes('DISASTER');
    if (activeCategory === 'PET_CARE') return (r.category || '').toUpperCase().includes('PET');
    if (activeCategory === 'CHARITY') return (r.category || '').toUpperCase().includes('CHARITY');
    return true;
  });

  return (
    <div className={`relative w-full ${isFullScreen ? 'h-screen' : ''} rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col`} style={{ height: isFullScreen ? '100vh' : height }}>
      
      {/* 1. Top Control Bar (Search & Category Filters) */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="pointer-events-auto flex items-center bg-[#1E293B]/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-xl w-72 max-w-full">
          <Search size={15} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search Mirpur, Dhanmondi, DMCH..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full"
          />
        </form>

        {/* Action Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => openReportModalWithPin(newPin)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus size={14} /> Report Issue
          </button>

          <button
            onClick={handleLocateMe}
            title="Locate Me"
            className="p-1.5 bg-[#1E293B]/90 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 shadow-lg transition-colors cursor-pointer"
          >
            <Compass size={17} />
          </button>

          {isFullScreen && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg transition-colors cursor-pointer"
              title="Close Full Screen"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="pointer-events-auto w-full flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
          {[
            { id: 'ALL', label: 'All Live Pins', icon: '🌐' },
            { id: 'WATER_LOGGING', label: 'Water-Clogging', icon: '💧' },
            { id: 'BLOOD', label: 'Blood Requests', icon: '🩸' },
            { id: 'DISASTER_RELIEF', label: 'Disaster Relief', icon: '⚠️' },
            { id: 'PET_CARE', label: 'Pet Care', icon: '🐾' },
            { id: 'CHARITY', label: 'Charity Aid', icon: '🤝' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all backdrop-blur-md cursor-pointer whitespace-nowrap shadow-md ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white border border-blue-400 font-semibold'
                  : 'bg-[#0F172A]/85 text-slate-300 border border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Leaflet Map Container */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={DHAKA_CENTER}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full bg-[#0F172A]"
        >
          {/* OpenStreetMap Standard Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Map Event Controller */}
          <MapEventsController 
            onMapClick={handleMapClick} 
            targetLocation={targetLocation} 
          />

          {/* Render Active Community & Campaign Pins */}
          {filteredReports.map((item) => {
            const isWater = (item.category || '').toUpperCase().includes('WATER');
            const isConfirmed = item.type === 'verified' || (item.confirmations && item.confirmations >= 3);
            
            return (
              <Marker
                key={item.id}
                position={item.position}
                icon={createCategoryPin(item.category, item.type, item.confirmations || 0)}
              >
                <Popup className="civicsync-popup" minWidth={260} maxWidth={320}>
                  <div className="p-2 text-slate-900 font-sans">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isWater 
                          ? (isConfirmed ? 'bg-orange-100 text-orange-800' : 'bg-sky-100 text-sky-800')
                          : (item.type === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')
                      }`}>
                        {item.category.replace('_', ' ').toUpperCase()}
                      </span>

                      {isWater ? (
                        <span className="text-[10px] font-semibold text-slate-500">
                          {item.confirmations || 0} confirmations
                        </span>
                      ) : (
                        <span className={`text-[10px] font-semibold ${item.type === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {item.type === 'verified' ? '✓ Verified' : '⏳ Pending'}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    {/* Location Name */}
                    {item.locationName && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        {item.locationName}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                      {item.description}
                    </p>

                    {/* Extra specifics */}
                    {item.severity && (
                      <div className="mt-2 text-[11px] text-orange-800 bg-orange-50 px-2 py-1 rounded font-medium">
                        Water Level: <span className="font-bold">{item.severity}</span>
                      </div>
                    )}

                    {item.goalAmount != null && (
                      <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded font-medium">
                        Goal: <span className="font-bold">৳{item.goalAmount}</span>
                        {item.raisedAmount != null && ` (Raised: ৳${item.raisedAmount})`}
                      </div>
                    )}

                    {/* Action Buttons in Popup */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      {isWater ? (
                        <button
                          onClick={(e) => handleConfirmHazard(item.id, e)}
                          className="flex-1 flex items-center justify-center gap-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-1.5 px-2 rounded shadow-sm transition-colors cursor-pointer"
                        >
                          <ThumbsUp size={12} /> Confirm Hazard ({item.confirmations || 0})
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Connecting with request: "${item.title}"`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-2 rounded shadow-sm transition-colors cursor-pointer"
                        >
                          View / Support Request
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* User's Selected Point Pin */}
          {newPin && (
            <Marker position={[newPin.lat, newPin.lng]} icon={userPickedIcon}>
              <Popup>
                <div className="p-2 text-slate-900 font-sans min-w-[190px]">
                  <p className="font-bold text-xs text-blue-600 flex items-center gap-1">
                    <MapPin size={13} /> Selected Location
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Lat: {newPin.lat.toFixed(4)}, Lng: {newPin.lng.toFixed(4)}
                  </p>
                  <button
                    onClick={() => openReportModalWithPin(newPin)}
                    className="mt-2.5 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-2 rounded shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus size={13} /> Report Issue Here
                  </button>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* 3. Floating Map Legend (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-[#0F172A]/90 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-lg text-xs space-y-1.5 text-slate-300 shadow-2xl max-w-[210px] hidden sm:block pointer-events-none">
        <p className="font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
          <Layers size={13} /> Active Dhaka Pins
        </p>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-3 h-3 rounded-full bg-sky-500 shrink-0"></span> Water Clogging (Unconfirmed)
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-3 h-3 rounded-full bg-orange-600 shrink-0"></span> Water Clogging (3+ Confirmed)
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span> Blood Requests
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span> Disaster Relief
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0"></span> Pet Care
        </div>
        <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-700">
          Click any point on the map to pin a live report.
        </p>
      </div>

      {/* 4. Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1100] bg-slate-900/95 text-white border border-blue-500/50 px-4 py-2 rounded-full shadow-2xl text-xs font-medium backdrop-blur-md flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 5. Report Issue Modal Dialog */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <MapPin size={17} className="text-blue-400" />
                  Pin New Report to Dhaka Map
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Coordinates: {newPin ? `${newPin.lat.toFixed(4)}, ${newPin.lng.toFixed(4)}` : 'Dhaka Center'}
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateReport} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Report Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'WATER_LOGGING', label: 'Water Clogging', icon: '💧', color: 'border-sky-500 text-sky-700 bg-sky-50' },
                    { id: 'DISASTER_RELIEF', label: 'Disaster Relief', icon: '⚠️', color: 'border-amber-500 text-amber-700 bg-amber-50' },
                    { id: 'BLOOD', label: 'Blood Need', icon: '🩸', color: 'border-rose-500 text-rose-700 bg-rose-50' },
                    { id: 'PET_CARE', label: 'Pet Care', icon: '🐾', color: 'border-purple-500 text-purple-700 bg-purple-50' },
                    { id: 'CHARITY', label: 'Charity Aid', icon: '🤝', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setReportCategory(cat.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        reportCategory === cat.id 
                          ? `${cat.color} ring-2 ring-blue-500/30 font-bold shadow-sm` 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    reportCategory === 'WATER_LOGGING'
                      ? 'e.g., Knee-deep water at Mirpur 10 Circle'
                      : reportCategory === 'BLOOD'
                      ? 'e.g., URGENT: 2 units O+ blood needed at DMCH'
                      : 'Brief summary of the issue...'
                  }
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Location Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location Area / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mirpur 10, Dhanmondi 27, Gulshan 2"
                  value={reportLocationName}
                  onChange={(e) => setReportLocationName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                />
              </div>

              {/* Category-Specific Fields */}
              {reportCategory === 'WATER_LOGGING' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Water Severity / Level
                  </label>
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-700"
                  >
                    <option value="Mild (Ankle-deep)">Mild (Ankle-deep - pass with care)</option>
                    <option value="Severe (Knee-deep)">Severe (Knee-deep - small cars stalled)</option>
                    <option value="Critical (Waist-deep / Blocked)">Critical (Waist-deep / Road blocked completely)</option>
                  </select>
                </div>
              )}

              {reportCategory === 'BLOOD' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Blood Group Required
                  </label>
                  <select
                    value={reportBloodType}
                    onChange={(e) => setReportBloodType(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-700"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => (
                      <option key={b} value={b}>{b} Blood</option>
                    ))}
                  </select>
                </div>
              )}

              {(reportCategory === 'DISASTER_RELIEF' || reportCategory === 'CHARITY' || reportCategory === 'PET_CARE') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Goal Amount ৳ (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={reportGoal}
                    onChange={(e) => setReportGoal(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Description Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Instructions
                </label>
                <textarea
                  placeholder="Provide situation details, hazards to watch for, or contact info..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-blue-500 resize-none h-20"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reportTitle.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={15} /> Pin to Live Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}