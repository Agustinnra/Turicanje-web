import { Restaurant } from '@/types/restaurant';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getRestaurants(): Promise<Restaurant[]> {
  const response = await fetch(`${API_URL}/api/restaurants`, {
    next: { revalidate: 60 } // Revalidar cada 60 segundos (ISR)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch restaurants');
  }
  
  return response.json();
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant> {
  const response = await fetch(`${API_URL}/api/restaurants/${slug}`, {
    next: { revalidate: 60 }
  });
  
  if (!response.ok) {
    throw new Error('Restaurant not found');
  }
  
  return response.json();
}