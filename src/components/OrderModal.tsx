import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Utensils } from "lucide-react";
import { CartItem } from "@/types/menu";
import { convertToRWF } from "@/utils/currency";

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderSuccess: () => void;
  userData?: {
    name: string;
    phone?: string;
    address?: string;
  };
  tableNumber?: string; // Will come from QR code scan
}

export const OrderModal = ({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
  userData,
  tableNumber = 1,
}: OrderModalProps) => {
  const [formData, setFormData] = useState({
    orderNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = cartItems.reduce(
    (sum, item) => sum + convertToRWF(item.price) * item.quantity,
    0
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Check if user is authenticated
      const userToken = localStorage.getItem("userToken");
      if (!userToken) {
        setError("Please log in to place an order");
        setIsSubmitting(false);
        return;
      }

      // Validate that we have user data and table number
      if (!userData?.name) {
        setError("User profile data is missing");
        setIsSubmitting(false);
        return;
      }

      if (!tableNumber) {
        setError("Table number is missing. Please scan the QR code on your table.");
        setIsSubmitting(false);
        return;
      }

      // Prepare order data
      const orderData = {
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          emoji: item.emoji,
        })),
        totalAmount: total,
        customerName: userData.name,
        customerPhone: userData.phone || "",
        tableNumber: tableNumber,
        orderNotes: formData.orderNotes,
        orderType: "dine-in",
      };

      // Make API call to create order
      const response = await fetch("http://localhost:5000/api/user/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to place order");
      }

      // Order successful
      onOrderSuccess();
      onClose();

      // Show success message
      alert(
        `Order placed successfully! Your order will be served at table ${tableNumber}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Place Your Dine-in Order
          </DialogTitle>
          <DialogDescription>
            {tableNumber 
              ? `Ordering for table ${tableNumber}. Add any special instructions below.`
              : "Please scan the QR code on your table to place an order."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.emoji} {item.name} x{item.quantity}
                  </span>
                  <span>
                    {Math.round(
                      convertToRWF(item.price) * item.quantity
                    ).toLocaleString()}{" "}
                    RWF
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-primary">
                    {Math.round(total).toLocaleString()} RWF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info Display */}
          {userData && (
            <div className="bg-muted/10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Customer Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{userData.name}</span>
                </div>
                {userData.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{userData.phone}</span>
                  </div>
                )}
                {tableNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Table:</span>
                    <span>{tableNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <label htmlFor="orderNotes" className="flex items-center gap-2 text-sm font-medium">
              <Utensils className="h-4 w-4" />
              Special Instructions
            </label>
            <Textarea
              id="orderNotes"
              value={formData.orderNotes}
              onChange={(e) =>
                handleInputChange("orderNotes", e.target.value)
              }
              placeholder="Any special requests or modifications to your order..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !userData?.name || !tableNumber}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Dine-in Order"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
