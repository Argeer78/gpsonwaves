'use client'; // HMR Trigger

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Menu, UserCircle, Crown, LogOut, Shield } from 'lucide-react';

// Dynamic import for MapComponent to avoid SSR window error
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-emerald-500">Loading Chart...</div>
});
import DecisionCard from '@/components/NewDecisionCard';
import SavedSpotsDrawer from '@/components/SavedSpotsDrawer';
import SiteFooter from '@/components/SiteFooter';
import AuthModal from '@/components/AuthModal';
import PricingModal from '@/components/PricingModal';
import { useUser } from '@/context/UserContext';
import SaveSpotModal from '@/components/SaveSpotModal';
import Speedometer from '@/components/Speedometer';
import { ScoutService, ScoutSpot } from '@/services/ScoutService';
import { saveSpot } from '@/utils/Storage';
import { Species } from '@/utils/FishabilityEngine';

export default function Home() {
  // State
  const { user, isLoading, logout } = useUser();
  const [selectedLocation, setSelectedLocation] = useState<[number, number]>([25.7617, -80.1918]); // Target for analysis
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null); // Real-time GPS
  const [structures, setStructures] = useState<Array<{ lat: number, lng: number }>>([]);
  const [scoutSpots, setScoutSpots] = useState<ScoutSpot[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modals
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [pricingReason, setPricingReason] = useState("");

  // Save Modal State
  const [saveModalData, setSaveModalData] = useState<{ lat: number, lng: number, score: number, depth?: number } | null>(null);

  useEffect(() => {
    if (!isClient) setIsClient(true);
    if ('geolocation' in navigator) {
      // Use watchPosition for continuous boat tracking
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(newPos);

          // Initial center only
          // If we want the map to start at user loc, we can set selectedLocation once?
          // Or just let user explore. 
          // Let's set selectedLocation ONLY if it hasn't been moved yet? 
          // Actually, let's just initialize it once.
        },
        (err) => {
          console.log("Loc unavailable, using default");
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
      );

      return () => navigator.geolocation.clearWatch(id);
    }
  }, []);

  const handleSaveSpot = (data: { name: string; tags: string[]; notes: string; weather?: any }) => {
    if (!saveModalData) return;

    saveSpot({
      name: data.name,
      lat: saveModalData.lat,
      lng: saveModalData.lng,
      species: 'Bass', // Placeholder
      score: saveModalData.score,
      verdict: saveModalData.score >= 7 ? 'good' : saveModalData.score >= 4 ? 'borderline' : 'bad',
      notes: data.notes,
      tags: data.tags,
      conditions: {
        depth: saveModalData.depth,
        temp: data.weather?.temp ?? 22,
        weather: data.weather?.condition ?? 'Unknown',
        wind: data.weather?.windSpeed ? `${data.weather.windSpeed} km/h` : 'Unknown'
      }
    });
    setSaveModalData(null);
    setIsDrawerOpen(true); // Open drawer to verify save
  };

  if (!isClient) return null;

  return (
    <main className="full-screen">
      <MapComponent
        center={selectedLocation}
        userLocation={userLocation}
        onLocationSelect={(lat: number, lng: number) => {
          setSelectedLocation([lat, lng]);
          setStructures([]);
        }}
        structures={structures}
        scoutSpots={scoutSpots}
        isPro={!!user?.isPro}
        onShowPricing={(reason) => {
          setPricingReason(reason);
          setShowPricing(true);
        }}
      />

      {/* App Logo */}
      <div className="app-logo">
        <img src="/logo.png" alt="GPSonWaves" style={{ height: '50px', width: 'auto' }} />
      </div>

      {/* Header Actions (Right Side) */}
      <div
        className="flex items-center"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 50,
          gap: '0.75rem'
        }}
      >

        {/* User Button */}
        <button
          onClick={() => {
            if (!user) setShowAuth(true);
            else if (!user.isPro) setShowPricing(true);
          }}
          className="flex items-center gap-2 transition-colors"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900/80
            backdropFilter: 'blur(12px)',
            color: 'white',
            padding: '0.5rem 0.75rem',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          {user ? (
            <>
              <div className="rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold" style={{ width: '1.5rem', height: '1.5rem' }}>
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium pr-1">{user.isPro ? 'PRO' : 'Free'}</span>
              {user.isPro && <Crown size={14} className="text-amber-400" />}
            </>
          ) : (
            <>
              <UserCircle size={20} style={{ opacity: 0.7 }} />
              <span className="text-sm font-semibold">Log In</span>
            </>
          )}
        </button>

        {/* Admin Button */}
        {user?.isAdmin && (
          <Link
            href="/admin"
            title="Admin Dashboard"
            className="hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              color: '#a855f7', // purple-500
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Shield size={18} />
          </Link>
        )}

        {/* Logout Button */}
        {user && (
          <button
            onClick={logout}
            title="Log Out"
            className="hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              color: '#f43f5e', // rose-500
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <LogOut size={18} />
          </button>
        )}

        {/* Menu Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open Saved Spots"
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-accent-good)', // emerald-500
            color: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.1s'
          }}
        >
          <Menu size={20} />
        </button>
      </div>

      <DecisionCard
        initialLat={selectedLocation[0]}
        initialLng={selectedLocation[1]}
        onStructureFound={(locs) => setStructures(locs)}
        onScoutFound={(spots) => setScoutSpots(spots)}
        onOpenPricing={(reason) => {
          setPricingReason(reason);
          setShowPricing(true);
        }}
        onRequestSave={(data) => setSaveModalData(data)}
      />

      <SavedSpotsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectSpot={(lat, lng) => setSelectedLocation([lat, lng])}
      />

      <Speedometer />

      <SiteFooter />

      {/* Modals */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <PricingModal
        isOpen={showPricing}
        onClose={() => { setShowPricing(false); setPricingReason(""); }}
        triggerReason={pricingReason}
      />
      <SaveSpotModal
        isOpen={!!saveModalData}
        initialData={saveModalData}
        onClose={() => setSaveModalData(null)}
        onSave={handleSaveSpot}
      />

    </main>
  );
}
