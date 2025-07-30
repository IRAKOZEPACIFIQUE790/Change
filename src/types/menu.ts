export interface MenuItemType {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  rating: number;
  prepTime?: string;
  popular?: boolean;
  isAvailable?: boolean;
  emoji?: string;
}

export interface CartItem extends MenuItemType {
  quantity: number;
}
