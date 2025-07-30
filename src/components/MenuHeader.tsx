
import { Utensils, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MenuHeaderProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const MenuHeader = ({ activeCategory, onCategoryChange }: MenuHeaderProps) => {
  const navigate = useNavigate();
  const categoryItems = [
    { key: "beverages", emoji: "🥤", label: "Beverages", color: "text-orange-600 hover:text-orange-700" },
    { key: "mainDishes", emoji: "🍽️", label: "Main Dishes", color: "text-green-600 hover:text-green-700" },
    { key: "snacks", emoji: "🍿", label: "Snacks", color: "text-blue-600 hover:text-blue-700" },
    { key: "desserts", emoji: "🍰", label: "Desserts", color: "text-pink-600 hover:text-pink-700" },
    { key: "appetizers", emoji: "🥗", label: "Appetizers", color: "text-purple-600 hover:text-purple-700" }
  ];

  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-md border-b border-border sticky top-0 z-50 m-0 transition-shadow">
      <div className="w-full px-0 py-6 m-0">
        <div className="flex items-center justify-between w-full m-0">
          {/* Left: Restaurant Name */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="p-2 bg-gold-gradient rounded-xl shadow-gold">
              <Utensils className="h-7 w-7 text-luxury" />
            </div>
            <h1 className="text-3xl font-extrabold text-luxury font-playfair tracking-wide drop-shadow-sm">Epicurean Collection</h1>
          </div>

          {/* Center: Category Navigation */}
          <nav className="hidden md:flex gap-6 flex-1 justify-center">
            {categoryItems.map((item) => (
              <button
                key={item.key}
                onClick={() => onCategoryChange(item.key)}
                className={`text-base font-medium ${item.color} flex items-center gap-2 transition-all duration-300 px-5 py-2 rounded-lg hover:bg-gold/10 border border-transparent shadow-sm ${
                  activeCategory === item.key ? 'font-bold bg-gold/20 border-gold/30 shadow-gold text-shimmer' : 'hover:border-gold/20'
                }`}
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="font-inter">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right: Account Button */}
          {/* <div className="flex items-center flex-shrink-0">
            <Button variant="outline" size="sm" className="border-gold/40 hover:bg-gold/10 shadow-gold text-luxury font-semibold px-5 py-2 rounded-lg transition-all"
              onClick={() => navigate("/login")}
            >
              <User className="h-5 w-5 mr-2" />
              Account
            </Button>
          </div> */}
        </div>
        {/* Divider under nav for polish */}
        <div className="hidden md:block border-t border-border/60 mt-5" />
      </div>
    </header>
  );
};
