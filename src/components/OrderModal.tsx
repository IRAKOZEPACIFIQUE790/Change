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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MapPin, User, Phone, Hash, Utensils } from "lucide-react";
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
}

export const OrderModal = ({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
  userData,
}: OrderModalProps) => {
  const [formData, setFormData] = useState({
    customerName: userData?.name || "",
    customerPhone: userData?.phone || "",
    deliveryAddress: userData?.address || "",
    tableNumber: "",
    orderNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderType, setOrderType] = useState<"dine-in" | "delivery">("dine-in");

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

      // Validate required fields based on order type
      if (orderType === "dine-in" && !formData.tableNumber.trim()) {
        setError("Please enter your table number");
        setIsSubmitting(false);
        return;
      }

      if (orderType === "delivery" && !formData.deliveryAddress.trim()) {
        setError("Please enter your delivery address");
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
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryAddress:
          orderType === "delivery" ? formData.deliveryAddress : null,
        tableNumber: orderType === "dine-in" ? formData.tableNumber : null,
        orderNotes: formData.orderNotes,
        orderType: orderType,
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
        `Order placed successfully! ${
          orderType === "dine-in"
            ? `Your order will be served at table ${formData.tableNumber}`
            : "Your order will be delivered to your address"
        }`
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
            Place Your Order
          </DialogTitle>
          <DialogDescription>
            Please provide your details to complete your order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={orderType === "dine-in" ? "default" : "outline"}
                onClick={() => setOrderType("dine-in")}
                className="flex-1"
              >
                🍽️ Dine-in
              </Button>
              <Button
                type="button"
                variant={orderType === "delivery" ? "default" : "outline"}
                onClick={() => setOrderType("delivery")}
                className="flex-1"
              >
                🚚 Delivery
              </Button>
            </div>
          </div>

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

          {/* Customer Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) =>
                  handleInputChange("customerName", e.target.value)
                }
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="customerPhone"
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) =>
                  handleInputChange("customerPhone", e.target.value)
                }
                placeholder="Enter your phone number"
              />
            </div>

            {/* Conditional fields based on order type */}
            {orderType === "dine-in" ? (
              <div>
                <Label
                  htmlFor="tableNumber"
                  className="flex items-center gap-2"
                >
                  <Hash className="h-4 w-4" />
                  Table Number *
                </Label>
                <Input
                  id="tableNumber"
                  value={formData.tableNumber}
                  onChange={(e) =>
                    handleInputChange("tableNumber", e.target.value)
                  }
                  placeholder="Enter your table number"
                  required
                />
              </div>
            ) : (
              <div>
                <Label
                  htmlFor="deliveryAddress"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Delivery Address *
                </Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) =>
                    handleInputChange("deliveryAddress", e.target.value)
                  }
                  placeholder="Enter your delivery address"
                  rows={3}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="orderNotes" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Special Instructions
              </Label>
              <Textarea
                id="orderNotes"
                value={formData.orderNotes}
                onChange={(e) =>
                  handleInputChange("orderNotes", e.target.value)
                }
                placeholder="Any special requests or modifications to your order..."
                rows={2}
              />
            </div>
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
              disabled={isSubmitting || !formData.customerName.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                `Place ${
                  orderType === "dine-in" ? "Dine-in" : "Delivery"
                } Order`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
