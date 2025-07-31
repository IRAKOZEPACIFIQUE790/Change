import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { CartItem } from "@/types/menu";
import { formatPrice, convertToRWF } from "@/utils/currency";

interface ItemSidebarProps {
  selectedItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPlaceOrder: () => void;
}

export const ItemSidebar = ({
  selectedItems = [],
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
}: ItemSidebarProps) => {
  if (selectedItems.length === 0) return null;

  const total = selectedItems.reduce(
    (sum, item) => sum + convertToRWF(item.price) * item.quantity,
    0
  );

  return (
    <div className="w-80 bg-card border-l border-border shadow-professional  flex flex-col animate-slide-in-right">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center space-x-1.5">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground font-playfair">
              Your Order
            </h2>
            <span className="text-xs text-muted-foreground">
              ({selectedItems.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Close cart"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="bg-muted/20 rounded-lg p-2.5 border border-border"
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-xs truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5 ml-1"
                  aria-label="Remove item"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                    }
                    className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="text-xs font-medium w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {Math.round(
                    convertToRWF(item.price) * item.quantity
                  ).toLocaleString()}{" "}
                  RWF
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-sm font-bold">
              <span>Total:</span>
              <span className="text-primary">
                {Math.round(total).toLocaleString()} RWF
              </span>
            </div>
          </div>

          <button
            onClick={onPlaceOrder}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 px-3 text-sm font-semibold hover:bg-primary/90 transition-colors duration-200 shadow-hotel"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
};
