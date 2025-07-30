import { Clock, Star, Plus, Loader2 } from "lucide-react";
import { MenuItemType } from "@/types/menu";
import { formatPrice } from "@/utils/currency";

interface MenuItemProps {
  item: MenuItemType;
  onSelect: (item: MenuItemType) => void;
  isLoading?: boolean;
}

export const MenuItem = ({
  item,
  onSelect,
  isLoading = false,
}: MenuItemProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-gold fill-current" : "text-muted-foreground/30"
        }`}
      />
    ));
  };

  return (
    <div
      className="card-hotel card-hover rounded-2xl overflow-hidden animate-fade-in group cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <div className="relative h-56 overflow-hidden">
        {item.image ? (
          <img
            src={`http://localhost:5000${item.image}`}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center text-8xl p-8 bg-muted/20 h-full">
            {item.emoji || "🍽️"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury/70 via-transparent to-transparent" />
        {item.popular && (
          <div className="absolute top-4 right-4 bg-gold-gradient text-luxury px-3 py-1 rounded-full text-xs font-bold shadow-gold animate-glow">
            ⭐ Popular
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gold font-playfair">
              {formatPrice(item.price)}
            </span>
            <div className="flex items-center space-x-1 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-pearl">
              {renderStars(Math.floor(item.rating))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-card to-card/80">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-foreground font-playfair group-hover:text-gold transition-colors duration-300 leading-tight">
            {item.name}
          </h3>
          {item.prepTime && (
            <div className="flex items-center space-x-1 text-xs text-gold bg-gold/10 px-2 py-1 rounded-full font-medium">
              <Clock className="h-3 w-3" />
              <span>{item.prepTime}</span>
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed font-inter mb-6 line-clamp-3">
          {item.description}
        </p>

        <div className="divider-luxury mb-4" />

        <button
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 px-4 text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-hotel flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={(e) => {
            e.stopPropagation();
            if (!isLoading) {
              onSelect(item);
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
