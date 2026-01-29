// global.d.ts - Tipos globales

declare global {
    interface Window {
      google: typeof google;
      cloudinary: any;
    }
  }
  
  export {};