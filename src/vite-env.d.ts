/// <reference types="vite/client" />

// Global functions
declare global {
  interface Window {
    google: typeof google;
    initializeGoogleMap: () => void;
    initGoogleMap: () => void;
  }
}

// Google Maps types
declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
    }
    
    class Marker {
      constructor(opts?: MarkerOptions);
      addListener(eventName: string, handler: Function): void;
    }
    
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map: Map, anchor?: Marker): void;
    }
    
    class Size {
      constructor(width: number, height: number);
    }
    
    class Point {
      constructor(x: number, y: number);
    }
    
    interface MapOptions {
      zoom?: number;
      center?: LatLng | LatLngLiteral;
      styles?: MapTypeStyle[];
    }
    
    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
    }
    
    interface InfoWindowOptions {
      content?: string | Element;
    }
    
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    
    interface LatLng {
      lat(): number;
      lng(): number;
    }
    
    interface Icon {
      url: string;
      scaledSize?: Size;
      anchor?: Point;
    }
    
    interface Symbol {
      path: string;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      scale?: number;
    }
    
    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: MapTypeStyler[];
    }
    
    interface MapTypeStyler {
      visibility?: string;
      color?: string;
    }
  }
}