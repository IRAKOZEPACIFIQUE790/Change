import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Package,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  DollarSign,
} from "lucide-react";
import { adminAPI } from "@/utils/api";
import { useAuth } from "@/context/authContext";
import { Navigation } from "@/components/Navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  prepTime?: string;
  rating: number;
  popular: boolean;
}

interface Order {
  id: number;
  items: unknown[];
  totalAmount: number;
  status: string;
  orderType: string;
  tableNumber?: string;
  deliveryAddress?: string;
  customerName: string;
  customerPhone?: string;
  orderNotes?: string;
  createdAt: string;
}

interface TopItem {
  id: number;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [topFilters, setTopFilters] = useState({
    days: "7",
    status: "delivered",
    rankBy: "quantity" as "quantity" | "revenue",
    limit: "5",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchTopItems = async () => {
    try {
      const data = await adminAPI.getTopItems({
        days: topFilters.days,
        status: topFilters.status,
        rankBy: topFilters.rankBy,
        limit: topFilters.limit,
      });
      setTopItems(data.data || []);
    } catch (e) {
      console.error("Failed to fetch top items", e);
    }
  };

  const fetchData = async () => {
    try {
      const [menuResponse, ordersResponse] = await Promise.all([
        adminAPI.getMenuItems(),
        adminAPI.getOrders(),
      ]);
      setMenuItems(menuResponse.data);
      setOrders(ordersResponse.data);

      // Also fetch top items after base data loads
      fetchTopItems();
    } catch (error) {
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await adminAPI.deleteMenuItem(id.toString());
      setSuccess("Menu item deleted successfully");
      fetchData();
    } catch (error) {
      setError("Failed to delete menu item");
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId.toString(), status);
      setSuccess("Order status updated successfully");
      fetchData();
    } catch (error) {
      setError("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = orders.reduce(
    (sum, order) => sum + (Number(order.totalAmount) || 0),
    0
  );
  const totalOrders = orders.length;
  const totalMenuItems = menuItems.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Manage your restaurant operations</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(totalRevenue || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMenuItems}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Items Card */}
        <Card className="mb-8">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Top Ordered Items</CardTitle>
              <CardDescription>Based on recent orders</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
              <Select
                value={topFilters.days}
                onValueChange={(v) =>
                  setTopFilters((prev) => ({ ...prev, days: v }))
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={topFilters.status}
                onValueChange={(v) =>
                  setTopFilters((prev) => ({ ...prev, status: v }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="all">All statuses</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={topFilters.rankBy}
                onValueChange={(v) =>
                  setTopFilters((prev) => ({
                    ...prev,
                    rankBy: v as "quantity" | "revenue",
                  }))
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Rank by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">By Quantity</SelectItem>
                  <SelectItem value="revenue">By Revenue</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={topFilters.limit}
                onValueChange={(v) =>
                  setTopFilters((prev) => ({ ...prev, limit: v }))
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTopItems}>
                Apply
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-muted-foreground"
                    >
                      No data for selected filters
                    </TableCell>
                  </TableRow>
                ) : (
                  topItems.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell className="text-right">
                        {it.totalQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(it.totalRevenue || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabs for Menu and Orders */}
        <Tabs defaultValue="menu" className="space-y-4">
          <TabsList>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
            <TabsTrigger value="orders">Order Management</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Menu Items</CardTitle>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMenuItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="aspect-video bg-gray-200 relative">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button size="sm" variant="secondary">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <Badge
                            variant={item.isAvailable ? "default" : "secondary"}
                          >
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {item.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">
                            ${item.price}
                          </span>
                          <span className="text-sm text-gray-500">
                            {item.category}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>#{order.id}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          ${(Number(order.totalAmount) || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(status) =>
                              handleUpdateOrderStatus(order.id, status)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">
                                Confirmed
                              </SelectItem>
                              <SelectItem value="preparing">
                                Preparing
                              </SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="delivered">
                                Delivered
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
