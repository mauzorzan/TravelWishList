'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the WorldMap to avoid SSR issues with amCharts
const WorldMap = dynamic(() => import('./components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] lg:h-[500px] rounded-2xl bg-slate-800 animate-pulse flex items-center justify-center">
      <div className="text-slate-400">Loading map...</div>
    </div>
  ),
});

interface TravelDestination {
  id: number;
  rank: number;
  destination: string;
  country: string;
  latitude: number;
  longitude: number;
  reason: string;
  budget: string;
  timeline: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

const TIMELINE_OPTIONS = [
  { value: '2025-q1', label: '🌸 Q1 2025 (Jan-Mar)' },
  { value: '2025-q2', label: '☀️ Q2 2025 (Apr-Jun)' },
  { value: '2025-q3', label: '🍂 Q3 2025 (Jul-Sep)' },
  { value: '2025-q4', label: '❄️ Q4 2025 (Oct-Dec)' },
  { value: '2026', label: '🗓️ 2026' },
  { value: 'someday', label: '✨ Someday' },
];

// Geocoding function using OpenStreetMap Nominatim API (free, no API key needed)
async function geocodeLocation(destination: string, country: string): Promise<GeocodingResult | null> {
  try {
    const query = `${destination}, ${country}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'TravelWishlistApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export default function Home() {
  const [destinations, setDestinations] = useState<TravelDestination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<TravelDestination | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Geocoding state
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [locationPreview, setLocationPreview] = useState('');
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    destination: '',
    country: '',
    reason: '',
    timeline: 'someday',
    image_url: '',
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  // Auto-geocode when destination or country changes
  useEffect(() => {
    // Clear previous timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Reset geocoding state
    if (!formData.destination.trim() || !formData.country.trim()) {
      setGeocodingStatus('idle');
      setCoordinates(null);
      setLocationPreview('');
      return;
    }

    // Debounce geocoding requests
    setGeocodingStatus('loading');
    geocodeTimeoutRef.current = setTimeout(async () => {
      const result = await geocodeLocation(formData.destination, formData.country);
      
      if (result) {
        setCoordinates({ lat: result.latitude, lon: result.longitude });
        setLocationPreview(result.displayName);
        setGeocodingStatus('success');
      } else {
        setCoordinates(null);
        setLocationPreview('');
        setGeocodingStatus('error');
      }
    }, 800); // Wait 800ms after user stops typing

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [formData.destination, formData.country]);

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setDestinations(data);
        if (data.length > 0 && !selectedDestination) {
          setSelectedDestination(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.destination.trim() || !formData.country.trim()) {
      setError('Please enter destination and country');
      return;
    }

    if (!coordinates) {
      setError('Could not find coordinates for this location. Please check the destination and country names.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        rank: editingId ? destinations.find(d => d.id === editingId)?.rank : destinations.length + 1,
        destination: formData.destination,
        country: formData.country,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        reason: formData.reason,
        budget: 'moderate',
        timeline: formData.timeline,
        image_url: formData.image_url,
      };

      if (editingId) {
        const response = await fetch(`/api/wishlist/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await fetchDestinations();
          resetForm();
        } else {
          setError('Failed to update destination');
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await fetchDestinations();
          resetForm();
        } else {
          setError('Failed to add destination');
        }
      }
    } catch (error) {
      setError('An error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dest: TravelDestination) => {
    setEditingId(dest.id);
    setFormData({
      destination: dest.destination,
      country: dest.country,
      reason: dest.reason,
      timeline: dest.timeline,
      image_url: dest.image_url || '',
    });
    // Set existing coordinates
    setCoordinates({ lat: dest.latitude, lon: dest.longitude });
    setGeocodingStatus('success');
    setLocationPreview(`${dest.destination}, ${dest.country}`);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this destination?')) return;

    try {
      const response = await fetch(`/api/wishlist/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchDestinations();
        if (selectedDestination?.id === id) {
          setSelectedDestination(destinations.length > 1 ? destinations[0] : null);
        }
      } else {
        alert('Failed to delete destination');
      }
    } catch (error) {
      console.error('Error deleting destination:', error);
      alert('An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      destination: '',
      country: '',
      reason: '',
      timeline: 'someday',
      image_url: '',
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
    setCoordinates(null);
    setGeocodingStatus('idle');
    setLocationPreview('');
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newDests = [...destinations];
    const temp = newDests[index];
    newDests[index] = newDests[index - 1];
    newDests[index - 1] = temp;
    
    // Update ranks
    const ranks = newDests.map((d, i) => ({ id: d.id, rank: i + 1 }));
    
    try {
      await fetch('/api/wishlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ranks }),
      });
      await fetchDestinations();
    } catch (error) {
      console.error('Error updating ranks:', error);
    }
  };

  const moveDown = async (index: number) => {
    if (index === destinations.length - 1) return;
    const newDests = [...destinations];
    const temp = newDests[index];
    newDests[index] = newDests[index + 1];
    newDests[index + 1] = temp;
    
    // Update ranks
    const ranks = newDests.map((d, i) => ({ id: d.id, rank: i + 1 }));
    
    try {
      await fetch('/api/wishlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ranks }),
      });
      await fetchDestinations();
    } catch (error) {
      console.error('Error updating ranks:', error);
    }
  };

  const handleSelectDestination = useCallback((dest: TravelDestination) => {
    setSelectedDestination(dest);
  }, []);

  const getTimelineInfo = (timeline: string) => {
    return TIMELINE_OPTIONS.find(t => t.value === timeline) || TIMELINE_OPTIONS[5];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 sm:text-6xl tracking-tight">
            Travel Wishlist
          </h1>
          <p className="mt-3 text-lg text-slate-400 font-light">
            Your dream destinations, ranked and mapped from San Francisco
          </p>
        </div>

        {/* Map Section */}
        <div className="mb-8 rounded-3xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-4 shadow-2xl">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-slate-300 text-sm">San Francisco (Origin)</span>
            </div>
            {selectedDestination && (
              <>
                <span className="text-slate-600">→</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
                  <span className="text-amber-300 text-sm font-medium">
                    {selectedDestination.destination}, {selectedDestination.country}
                  </span>
                </div>
              </>
            )}
          </div>
          <WorldMap
            destinations={destinations}
            selectedDestination={selectedDestination}
            onSelectDestination={handleSelectDestination}
          />
        </div>


        {/* Add Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105"
          >
            <span className="text-xl">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Cancel' : 'Add Destination'}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mb-8 rounded-3xl bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 p-6 shadow-2xl animate-in slide-in-from-top duration-300">
            <h2 className="mb-6 text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">{editingId ? '✏️' : '🌍'}</span>
              {editingId ? 'Edit Destination' : 'Add New Destination'}
          </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    City / Destination *
              </label>
              <input
                type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Tokyo, Paris, Machu Picchu"
                    className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g., Japan, France, Peru"
                    className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Location Preview / Geocoding Status */}
              <div className={`rounded-xl p-4 transition-all ${
                geocodingStatus === 'loading' ? 'bg-slate-700/50 border border-slate-600' :
                geocodingStatus === 'success' ? 'bg-emerald-900/30 border border-emerald-500/50' :
                geocodingStatus === 'error' ? 'bg-red-900/30 border border-red-500/50' :
                'bg-slate-700/30 border border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  {geocodingStatus === 'idle' && (
                    <>
                      <span className="text-xl">📍</span>
                      <span className="text-slate-400 text-sm">Enter a city and country to automatically find coordinates</span>
                    </>
                  )}
                  {geocodingStatus === 'loading' && (
                    <>
                      <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-300 text-sm">Finding location...</span>
                    </>
                  )}
                  {geocodingStatus === 'success' && coordinates && (
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">✅</span>
                        <span className="text-emerald-300 text-sm font-medium">Location found!</span>
                      </div>
                      <p className="text-slate-300 text-xs truncate">{locationPreview}</p>
                      <p className="text-slate-500 text-xs font-mono mt-1">
                        📐 {coordinates.lat.toFixed(4)}°, {coordinates.lon.toFixed(4)}°
                      </p>
                    </div>
                  )}
                  {geocodingStatus === 'error' && (
                    <>
                      <span className="text-xl">❌</span>
                      <span className="text-red-300 text-sm">Could not find this location. Try a different spelling or nearby city.</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Timeline
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                >
                  {TIMELINE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason to Visit
              </label>
              <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="What draws you to this destination?"
                rows={3}
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
            </div>
            {error && (
                <div className="rounded-xl bg-red-500/20 border border-red-500/50 p-4 text-red-300">
                {error}
              </div>
            )}
              <div className="flex gap-4">
              <button
                type="submit"
                  disabled={loading || geocodingStatus === 'loading' || geocodingStatus === 'error'}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-6 py-3 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {loading ? 'Saving...' : editingId ? 'Update Destination' : 'Add to Wishlist'}
              </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-600 px-6 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700"
                >
                  Cancel
                </button>
            </div>
          </form>
        </div>
        )}

        {/* Destinations List */}
        <div className="space-y-4">
          {destinations.length === 0 ? (
            <div className="rounded-3xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 text-center">
              <div className="text-7xl mb-6">🌏</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Your travel wishlist is empty
              </h3>
              <p className="text-slate-400 mb-6">
                Start adding destinations you dream of visiting!
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-8 py-3 font-semibold text-white transition-all hover:scale-105"
              >
                <span>+</span> Add Your First Destination
              </button>
            </div>
          ) : (
            destinations.map((dest, index) => (
              <div
                key={dest.id}
                onClick={() => setSelectedDestination(dest)}
                className={`group relative rounded-3xl bg-slate-800/60 backdrop-blur-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                  selectedDestination?.id === dest.id
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/20'
                    : 'border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {/* Rank Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shadow-lg ${
                    index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-800' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  {dest.image_url && (
                    <div className="lg:w-64 h-48 lg:h-auto overflow-hidden">
                      <img
                        src={dest.image_url}
                        alt={dest.destination}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 p-6 pl-20">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {dest.destination}
                        </h3>
                        <p className="text-slate-400 text-lg mb-4">
                          📍 {dest.country}
                        </p>
                        
                        {dest.reason && (
                          <p className="text-slate-300 mb-4 leading-relaxed">
                            &ldquo;{dest.reason}&rdquo;
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-500 text-white">
                            {getTimelineInfo(dest.timeline).label}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveDown(index)}
                          disabled={index === destinations.length - 1}
                          className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          ↓
                        </button>
                    <button
                          onClick={() => handleEdit(dest)}
                          className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 transition-colors"
                          title="Edit"
                    >
                          ✏️
                    </button>
                    <button
                          onClick={() => handleDelete(dest.id)}
                          className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                          title="Delete"
                    >
                          🗑️
                    </button>
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-xs text-slate-500 font-mono">
                        📐 {dest.latitude.toFixed(4)}°, {dest.longitude.toFixed(4)}°
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>✈️ Dreaming from San Francisco • {destinations.length} destination{destinations.length !== 1 ? 's' : ''} on your list</p>
        </div>
      </div>
    </div>
  );
}
