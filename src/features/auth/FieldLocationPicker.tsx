import { useEffect, useState } from "react";
import { divIcon, type Marker as LeafletMarker } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/Button";

const indonesia: [number, number] = [-2.5489, 118.0149];
const markerIcon = divIcon({ className: "field-location-marker", html: "<span></span>", iconSize: [28, 28], iconAnchor: [14, 28] });

function MapClickHandler({ onChange }: { onChange: (latitude: number, longitude: number) => void }) {
  useMapEvents({ click: (event) => onChange(event.latlng.lat, event.latlng.lng) });
  return null;
}

function MapRecenter({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(position, 14); }, [map, position]);
  return null;
}

export function FieldLocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: string;
  longitude: string;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const hasLocation = Number.isFinite(parsedLatitude) && parsedLatitude >= -90 && parsedLatitude <= 90 && Number.isFinite(parsedLongitude) && parsedLongitude >= -180 && parsedLongitude <= 180;
  const position: [number, number] = hasLocation ? [parsedLatitude, parsedLongitude] : indonesia;

  function updateLocation(nextLatitude: number, nextLongitude: number) {
    setLocationError(null);
    onChange(nextLatitude, nextLongitude);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("This browser cannot provide your location. Set the pin or enter coordinates instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => updateLocation(coords.latitude, coords.longitude),
      () => setLocationError("We could not use your location. Set the pin or enter coordinates instead."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-field-200 bg-field-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-forest-700">Field location</p>
        <Button type="button" size="sm" variant="outline" icon={<Crosshair aria-hidden="true" />} onClick={useCurrentLocation}>Use my location</Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Tap the map or drag the pin. You can also enter coordinates below.</p>
      <MapContainer center={position} zoom={hasLocation ? 14 : 5} scrollWheelZoom className="h-56 w-full rounded-md" aria-label="Field location map">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onChange={updateLocation} />
        {hasLocation ? <><MapRecenter position={position} /><Marker position={position} icon={markerIcon} draggable eventHandlers={{ dragend: (event) => {
          const marker = event.target as LeafletMarker;
          const next = marker.getLatLng();
          updateLocation(next.lat, next.lng);
        } }} /></> : null}
      </MapContainer>
      {locationError ? <p className="text-sm font-medium text-destructive" role="alert">{locationError}</p> : null}
    </div>
  );
}
