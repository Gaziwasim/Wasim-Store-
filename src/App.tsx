/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBasket, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Store, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShoppingBag,
  Home,
  Info,
  Phone,
  Settings,
  Package,
  PackageSearch,
  ListOrdered,
  LogOut,
  LogIn,
  Save,
  X,
  Check,
  Eye,
  EyeOff,
  Share2,
  Printer,
  History,
  Star,
  MessageSquare,
  MessageCircle,
  Send,
  AlertCircle,
  Download,
  MapPin,
  Bell,
  Camera,
  Video,
  Copy,
  ArrowLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Coins,
  Users,
  Edit,
  RefreshCw,
  PiggyBank,
  CheckCircle,
  User as UserIcon
} from "lucide-react";

const WhatsAppIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

import { db, auth, loginWithGoogle, logout } from "./firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  where,
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice?: number;
  unit: string;
  category: string;
  image: string;
  inStock?: boolean;
  stockQuantity?: number;
  soldCount?: number;
  damagedCount?: number;
}

interface Category {
  id: string;
  name: string;
  order?: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id?: string;
  phone: string;
  name: string;
  image?: string;
  lastLogin?: any;
  isBlocked?: boolean;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalPrice: number;
  subtotal?: number;
  paymentFee?: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  paymentMethod: string;
  location?: { lat: number, lng: number } | null;
  createdAt: any;
  uid?: string; // Add UID to link orders to logged in users
  riderId?: string;
  cancellationReason?: string;
  paymentNumber?: string;
  paymentType?: string;
  paymentDesc?: string;
  isShopSale?: boolean;
  isWithdrawal?: boolean; // Withdrawal/Promo orders
}

interface Expense {
  id: string;
  category: "Salary" | "Loan" | "Return" | "Advance";
  amount: number;
  note: string;
  staffId?: string; // Optional: Link to a specific worker/rider
  date: any;
}

interface Staff {
  id: string;
  name: string;
  role: "Worker" | "Rider";
  phone?: string;
  imageUrl?: string;
  createdAt?: any;
}

interface StoreNotification {
  id: string;
  title: string;
  message: string;
  createdAt: any;
  targetPhone?: string;
}

interface StoreConfig {
  storeName?: string;
  storeSubtext?: string;
  bkashNumber: string;
  bkashType: "Personal" | "Agent";
  bkashDesc?: string;
  nagadNumber: string;
  nagadType: "Personal" | "Agent";
  nagadDesc?: string;
  rocketNumber: string;
  rocketType: "Personal" | "Agent";
  rocketDesc?: string;
  whatsappNumber?: string;
  storeAddress: string;
  storePhone: string;
  storeLogo?: string;
  appIcon?: string;
  heroTitle?: string;
  heroSubtext?: string;
  heroImage?: string;
  adminEmail?: string;
  adminPassword?: string;
  announcementText?: string;
  showAnnouncement?: boolean;
  promoButtonTitle?: string;
  promoButtonLink?: string;
  promoServiceImage?: string;
  promoServiceTitle?: string;
  promoServiceDescription?: string;
  promoServiceDefaultAmount?: number;
  promoServiceProfit?: number;
  promoServiceProfitType?: "fixed" | "percentage";
  promoServiceButtonText?: string;
  showPromoService?: boolean;
  orderSuccessMsg?: string;
  bkashFeePercentage?: number;
  nagadFeePercentage?: number;
  rocketFeePercentage?: number;
  shopResetTimestamp?: any;
  enableAutoDeliveryCharge?: boolean;
  minOrderForFreeDelivery?: number;
  defaultDeliveryCharge?: number;
  deliveryChargeNotice?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

const handleFirestoreError = (error: any, operationType: OperationType, path: string | null, setToastMessage: (msg: string) => void, setShowToast: (show: boolean) => void) => {
  console.error(`Firestore Error [${operationType}] on [${path}]:`, error);
  
  if (error?.message?.includes("Quota exceeded") || error?.code === "resource-exhausted") {
    setToastMessage("আজকের জন্য ডাটাবেস লিমিট শেষ হয়ে গেছে। দয়া করে আগামীকাল আবার চেষ্টা করুন।");
  } else if (error?.code === "permission-denied") {
    setToastMessage("আপনার এই কাজটি করার অনুমতি নেই।");
  } else {
    setToastMessage("ডাটাবেস সংযোগে সমস্যা হয়েছে।");
  }
  setShowToast(true);

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  // We throw the error as a JSON string for the system to diagnose if needed
  // but we've already handled the UI part above
  console.debug("Detailed Error Info:", JSON.stringify(errInfo));
};

function ProductCard({ product, addToCart, onShare }: { product: Product, addToCart: (p: Product) => void, onShare: (p: Product) => void, key?: string }) {
  const isOutOfStock = product.inStock === false || (product.stockQuantity || 0) <= 0;
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`group h-full overflow-hidden border-none bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl relative ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}>
        <div className={`relative aspect-[4/3] overflow-hidden ${isOutOfStock ? 'blur-[4px]' : ''}`}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            <Badge className="bg-white/90 text-green-800 hover:bg-white border-none backdrop-blur-sm">
              {product.category}
            </Badge>
            {isOutOfStock && (
              <Badge variant="destructive" className="font-bold shadow-lg">স্টক আউট</Badge>
            )}
            {!isOutOfStock && (product.stockQuantity || 0) > 0 && (product.stockQuantity || 0) < 10 && (
              <Badge className="bg-amber-500 text-white border-none shadow-sm">অল্প স্টক আছে: {product.stockQuantity}</Badge>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onShare(product); }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-green-700 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 z-10"
          >
            <Share2 size={16} />
          </button>
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">{product.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            ৳{product.price} / {product.unit}
          </p>
        </CardHeader>
        <CardFooter className="pt-0">
          <Button 
            className={`w-full transition-all duration-300 rounded-xl font-bold ${
              isOutOfStock 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50" 
                : isAdded
                ? "bg-green-600 text-white border-green-600"
                : "bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border-green-100"
            }`}
            onClick={handleAdd}
            disabled={isOutOfStock}
          >
            {isOutOfStock ? "স্টক নেই" : isAdded ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                ব্যাগে যোগ হয়েছে
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                ব্যাগে যোগ করুন
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';

const statusLabels: Record<string, string> = {
  pending: "অপেক্ষমাণ",
  processing: "প্রসেসিং হচ্ছে",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল"
};

const getStatusStep = (status: string) => {
  switch (status) {
    case 'pending': return 1;
    case 'processing': return 2;
    case 'shipped': return 3;
    case 'delivered': return 4;
    default: return 1;
  }
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [config, setConfig] = useState<StoreConfig>({
    storeName: "ওয়াসিম স্টোর",
    storeSubtext: "মোদী মাল বিক্রেতা",
    bkashNumber: "",
    bkashType: "Personal",
    bkashDesc: "সেন্ড মানি করুন",
    nagadNumber: "",
    nagadType: "Personal",
    nagadDesc: "সেন্ড মানি করুন",
    rocketNumber: "",
    rocketType: "Personal",
    rocketDesc: "সেন্ড মানি করুন",
    whatsappNumber: "",
    storeAddress: "বাজার রোড, ঢাকা",
    storePhone: "+৮৮০ ১২৩৪৫৬৭৮৯০",
    storeLogo: "https://picsum.photos/seed/store/192/192",
    appIcon: "https://picsum.photos/seed/store/512/512",
    heroTitle: "সেরা মানের মোদী মাল এখন আপনার হাতের নাগালে",
    heroSubtext: "ওয়াসিম স্টোরে পাবেন একদম টাটকা এবং ভেজালমুক্ত নিত্যপ্রয়োজনীয় পণ্য। আজই অর্ডার করুন!",
    adminEmail: "mdgaziwasim@gmail.com",
    adminPassword: "",
    announcementText: "১০০ টাকার পণ্য ক্রয় করলে ডেলিভারি ফ্রি!",
    showAnnouncement: true,
    orderSuccessMsg: "আপনার অর্ডারটি সফল হয়েছে! আমরা খুব দ্রুত আপনার সাথে যোগাযোগ করব।",
    bkashFeePercentage: 2,
    nagadFeePercentage: 0,
    rocketFeePercentage: 0,
    promoServiceProfitType: "fixed",
    enableAutoDeliveryCharge: false,
    minOrderForFreeDelivery: 500,
    defaultDeliveryCharge: 60,
    deliveryChargeNotice: "৳৫০০ এর বেশি অর্ডারে ডেলিভারি চার্জ ফ্রি!"
  });
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("সব");
  const [activeTab, setActiveTab] = useState<"home" | "info" | "admin" | "orders">("home");
  const [user, setUser] = useState<User | null>(null);
  const [phoneUser, setPhoneUser] = useState<Customer | null>(null);
  const [hiddenNotifications, setHiddenNotifications] = useState<string[]>([]);
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoAmount, setPromoAmount] = useState("");
  const [promoWallet, setPromoWallet] = useState("bKash");
  const [isPlacingPromoOrder, setIsPlacingPromoOrder] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [cachedLocation, setCachedLocation] = useState<{lat: number, lng: number} | null>(null);

  const getUserLocation = async (silent: boolean = false) => {
    if (!silent) {
      setToastMessage("আপনার লোকেশন নেওয়া হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...");
      setShowToast(true);
    }
    
    setIsFetchingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          timeout: 8000,
          enableHighAccuracy: false,
          maximumAge: 300000 // Use 5 min old cache if needed for speed
        });
      });
      const loc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setCachedLocation(loc); // Save to cache
      setIsFetchingLocation(false);
      return loc;
    } catch (e) {
      console.log("Location access denied or failed:", e);
      setIsFetchingLocation(false);
      return null;
    }
  };
  const [adminSubTab, setAdminSubTab] = useState<"dashboard" | "products" | "orders" | "users" | "settings" | "supports" | "expenses" | "pos" | "staff">("dashboard");
  const [shopCart, setShopCart] = useState<CartItem[]>([]);
  const [isPlacingShopOrder, setIsPlacingShopOrder] = useState(false);
  const [shopSearchQuery, setShopSearchQuery] = useState("");
  const [shopSelectedCategory, setShopSelectedCategory] = useState("সব");
  const [shopPaymentMethod, setShopPaymentMethod] = useState("Cash");
  const [shopCustomerName, setShopCustomerName] = useState("");
  const [shopCustomerPhone, setShopCustomerPhone] = useState("");
  const [shopCustomerAddress, setShopCustomerAddress] = useState("");
  const [shopDeliveryCharge, setShopDeliveryCharge] = useState(0);

  useEffect(() => {
    if (config.enableAutoDeliveryCharge && shopCart.length > 0) {
      const subtotal = shopCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      if (config.minOrderForFreeDelivery && subtotal >= config.minOrderForFreeDelivery) {
        setShopDeliveryCharge(0);
      } else {
        setShopDeliveryCharge(config.defaultDeliveryCharge || 0);
      }
    }
  }, [shopCart, config.enableAutoDeliveryCharge, config.minOrderForFreeDelivery, config.defaultDeliveryCharge]);

  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: "Worker Salary",
    amount: 0,
    note: "",
    staffId: ""
  });
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    name: "",
    role: "Worker",
    phone: ""
  });
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [notificationInput, setNotificationInput] = useState({ title: "", message: "", targetPhone: "all" });
  const [editingChatMessageId, setEditingChatMessageId] = useState<string | null>(null);
  const [editingChatMessageText, setEditingChatMessageText] = useState("");
  const [isUpdatingChatMessage, setIsUpdatingChatMessage] = useState(false);

  const normalizePhone = (p: string) => p ? p.replace(/\D/g, '').slice(-11) : '';

  const handleSendNotification = async () => {
    if (!notificationInput.title || !notificationInput.message) return;
    try {
      const target = notificationInput.targetPhone === 'all' ? 'all' : normalizePhone(notificationInput.targetPhone);
      await addDoc(collection(db, "notifications"), {
        title: notificationInput.title.trim(),
        message: notificationInput.message.trim(),
        targetPhone: target,
        createdAt: serverTimestamp()
      });
      setNotificationInput({ title: "", message: "", targetPhone: "all" });
      setToastMessage("নোটিফিকেশন পাঠানো হয়েছে!");
      setShowToast(true);
    } catch (error: any) {
      console.error("Notification error:", error);
      setToastMessage("ভুল হয়েছে! আবার চেষ্টা করুন।");
      setShowToast(true);
    }
  };
  const [trackingPhone, setTrackingPhone] = useState("");
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  const trackedOrders = useMemo(() => {
    if (!isTrackingActive || !trackingPhone) return [];
    return orders.filter(o => o.customerPhone === trackingPhone);
  }, [orders, trackingPhone, isTrackingActive]);

  const [orderFilter, setOrderFilter] = useState<string>("pending");
  const [expenseFilter, setExpenseFilter] = useState("all_expenses");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageDeleteOptionsId, setMessageDeleteOptionsId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showLocationBanner, setShowLocationBanner] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('locationPromptSeen');
    if (!hasSeen) {
      setTimeout(() => setShowLocationBanner(true), 2500);
    }
  }, []);

  const handleLocationAccept = async () => {
    setShowLocationBanner(false);
    localStorage.setItem('locationPromptSeen', 'true');
    await getUserLocation();
  };

  const handleLocationDeny = () => {
    setShowLocationBanner(false);
    localStorage.setItem('locationPromptSeen', 'true');
  };

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const notificationAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [printableOrder, setPrintableOrder] = useState<Order | null>(null);
  const [showPrintMemo, setShowPrintMemo] = useState(false);

  const salesSummary = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const phoneOrders = validOrders.filter(o => !o.isWithdrawal);
    const withdrawalOrders = validOrders.filter(o => o.isWithdrawal);
    
    const total = phoneOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const online = validOrders
      .filter(o => 
        o.paymentMethod !== 'Cash on Delivery' && 
        o.paymentMethod !== 'Cash' && 
        (!o.isWithdrawal || o.status === 'delivered')
      )
      .reduce((sum, o) => sum + o.totalPrice, 0);
    
    // Withdrawal Summary
    const withdrawalTotal = withdrawalOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalPrice, 0);
    
    // Cash balance: Standard Cash Sales - Delivered Withdrawals
    const cash = validOrders
      .filter(o => (o.paymentMethod === 'Cash on Delivery' || o.paymentMethod === 'Cash') && !o.isWithdrawal)
      .reduce((sum, o) => sum + o.totalPrice, 0) 
      - validOrders
      .filter(o => o.isWithdrawal && o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const damagedValue = products.reduce((sum, p) => sum + ((p.damagedCount || 0) * (p.purchasePrice || 0)), 0);
    const damagedCountTotal = products.reduce((sum, p) => sum + (p.damagedCount || 0), 0);

    const bkashTotal = validOrders
      .filter(o => o.paymentMethod === 'bKash' && (!o.isWithdrawal || o.status === 'delivered'))
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const nagadTotal = validOrders
      .filter(o => o.paymentMethod === 'Nagad' && (!o.isWithdrawal || o.status === 'delivered'))
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const bankTotal = validOrders
      .filter(o => o.paymentMethod === 'Bank Transfer' && (!o.isWithdrawal || o.status === 'delivered'))
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const rocketTotal = validOrders
      .filter(o => o.paymentMethod === 'Rocket' && (!o.isWithdrawal || o.status === 'delivered'))
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const filterByDate = (ordersList: any[], startDate: Date) => {
      return ordersList.filter(o => {
        if (!o.createdAt) return false;
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return oDate >= startDate;
      });
    };

    const bkashToday = filterByDate(validOrders.filter(o => o.paymentMethod === 'bKash'), todayStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const bkashMonthly = filterByDate(validOrders.filter(o => o.paymentMethod === 'bKash'), monthStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const nagadToday = filterByDate(validOrders.filter(o => o.paymentMethod === 'Nagad'), todayStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const nagadMonthly = filterByDate(validOrders.filter(o => o.paymentMethod === 'Nagad'), monthStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const bankToday = filterByDate(validOrders.filter(o => o.paymentMethod === 'Bank Transfer'), todayStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const bankMonthly = filterByDate(validOrders.filter(o => o.paymentMethod === 'Bank Transfer'), monthStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const rocketToday = filterByDate(validOrders.filter(o => o.paymentMethod === 'Rocket'), todayStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const rocketMonthly = filterByDate(validOrders.filter(o => o.paymentMethod === 'Rocket'), monthStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    
    const totalToday = filterByDate(phoneOrders, todayStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const totalMonthly = filterByDate(phoneOrders, monthStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const withdrawalToday = filterByDate(withdrawalOrders.filter(o => o.status === 'delivered'), todayStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const withdrawalMonthly = filterByDate(withdrawalOrders.filter(o => o.status === 'delivered'), monthStart)
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Inventory calculations
    const currentStockValue = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.purchasePrice || 0)), 0);
    const totalInvestment = products.reduce((sum, p) => sum + (((p.stockQuantity || 0) + (p.soldCount || 0)) * (p.purchasePrice || 0)), 0);
    const costOfGoodsSold = products.reduce((sum, p) => sum + ((p.soldCount || 0) * (p.purchasePrice || 0)), 0);
    
    // Profit calculation: (Price - PurchasePrice) * quantity for delivered orders
    const deliveredOrdersProfit = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => {
        if (o.isWithdrawal) {
          const profitValue = Number(config.promoServiceProfit) || 0;
          const withdrawalProfit = config.promoServiceProfitType === "percentage" 
            ? (o.totalPrice * profitValue / 100)
            : profitValue;
          return sum + withdrawalProfit;
        }
        const orderProfit = o.items.reduce((pSum, item) => {
          const itemPurchasePrice = item.purchasePrice !== undefined ? item.purchasePrice : (products.find(p => p.id === item.id)?.purchasePrice || 0);
          return pSum + ((item.price - itemPurchasePrice) * item.quantity);
        }, 0);
        return sum + orderProfit;
      }, 0);

    // Today's profit: delivered orders from today
    const todayProfit = orders
      .filter(o => {
        if (o.status !== 'delivered' || !o.createdAt) return false;
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return oDate >= todayStart;
      })
      .reduce((sum, o) => {
        if (o.isWithdrawal) {
          const profitValue = Number(config.promoServiceProfit) || 0;
          const withdrawalProfit = config.promoServiceProfitType === "percentage" 
            ? (o.totalPrice * profitValue / 100)
            : profitValue;
          return sum + withdrawalProfit;
        }
        const orderProfit = o.items.reduce((pSum, item) => {
          const itemPurchasePrice = item.purchasePrice !== undefined ? item.purchasePrice : (products.find(p => p.id === item.id)?.purchasePrice || 0);
          return pSum + ((item.price - itemPurchasePrice) * item.quantity);
        }, 0);
        return sum + orderProfit;
      }, 0);

    // Monthly profit: delivered orders from this month
    const monthProfit = orders
      .filter(o => {
        if (o.status !== 'delivered' || !o.createdAt) return false;
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return oDate >= monthStart;
      })
      .reduce((sum, o) => {
        if (o.isWithdrawal) {
          const profitValue = Number(config.promoServiceProfit) || 0;
          const withdrawalProfit = config.promoServiceProfitType === "percentage" 
            ? (o.totalPrice * profitValue / 100)
            : profitValue;
          return sum + withdrawalProfit;
        }
        const orderProfit = o.items.reduce((pSum, item) => {
          const itemPurchasePrice = item.purchasePrice !== undefined ? item.purchasePrice : (products.find(p => p.id === item.id)?.purchasePrice || 0);
          return pSum + ((item.price - itemPurchasePrice) * item.quantity);
        }, 0);
        return sum + orderProfit;
      }, 0);

    // Expense calculation
    const totalExpenses = expenses.reduce((sum, e) => {
      if (e.category === "Salary" || e.category === "Take") {
        return sum + (e.amount || 0);
      } else if (e.category === "Return" || e.category === "Advance") {
        return sum - (e.amount || 0);
      }
      return sum;
    }, 0);

    return { 
      total, 
      online, 
      cash, 
      currentStockValue, 
      totalInvestment: totalInvestment + (config.manualInvestmentAdjustment || 0), 
      costOfGoodsSold,
      totalExpenses,
      todayProfit,
      monthProfit,
      totalToday,
      totalMonthly,
      deliveredOrdersProfit,
      withdrawalTotal,
      withdrawalToday,
      withdrawalMonthly,
      damagedValue,
      damagedCountTotal,
      bkashTotal,
      nagadTotal,
      bankTotal,
      bkashToday,
      bkashMonthly,
      nagadToday,
      nagadMonthly,
      bankToday,
      bankMonthly,
      rocketTotal,
      rocketToday,
      rocketMonthly
    };
  }, [orders, products, expenses, config.manualInvestmentAdjustment]);

  const shopSummary = useMemo(() => {
    const shopResetDate = config.shopResetTimestamp?.toDate ? config.shopResetTimestamp.toDate() : new Date(0);
    const shopOrders = orders.filter(o => o.isShopSale && o.status !== 'cancelled');
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const filteredShopOrders = shopOrders.filter(o => {
      const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return oDate >= shopResetDate;
    });

    const todaySales = filteredShopOrders
      .filter(o => {
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return oDate >= todayStart;
      })
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const monthSales = filteredShopOrders
      .filter(o => {
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return oDate >= monthStart;
      })
      .reduce((sum, o) => sum + o.totalPrice, 0);

    return { todaySales, monthSales };
  }, [orders, config.shopResetTimestamp]);

  // Admin Form States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    purchasePrice: 0,
    unit: "কেজি",
    category: "চাল",
    image: "https://picsum.photos/seed/grocery/400/300",
    inStock: true,
    stockQuantity: 0,
    soldCount: 0,
    damagedCount: 0
  });
  const [isCustomerMode, setIsCustomerMode] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
      
      // Show modal after 3 seconds if it's the first time
      const hasSeenModal = localStorage.getItem('hasSeenInstallModal');
      if (!hasSeenModal) {
        setTimeout(() => {
          setShowInstallModal(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallButton(false);
      setShowInstallModal(false);
      localStorage.setItem('hasSeenInstallModal', 'true');
    }
    setDeferredPrompt(null);
  };

  const closeInstallModal = () => {
    setShowInstallModal(false);
    localStorage.setItem('hasSeenInstallModal', 'true');
  };

  useEffect(() => {
    // Check if URL has ?admin or customer params
    const params = new URLSearchParams(window.location.search);
    const isAdminParam = params.has('admin');
    const hasCustomerParam = params.get('view') === 'customer' || params.has('shop') || params.has('wasim') || params.has('s') || params.has('install');
    
    if (isAdminParam) {
      setIsCustomerMode(false);
      setActiveTab('admin');
      // Store in session so it persists during this session
      sessionStorage.setItem('forceAdmin', 'true');
    } else if (hasCustomerParam) {
      setIsCustomerMode(true);
      sessionStorage.removeItem('forceAdmin');
    } else if (sessionStorage.getItem('forceAdmin') === 'true') {
      setIsCustomerMode(false);
    } else {
      // Default to customer mode if no params and no forceAdmin
      setIsCustomerMode(true);
    }

    if (params.has('install')) {
      // Check if already installed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (!isStandalone) {
        // Force show install modal immediately if install param is present
        setTimeout(() => {
          setShowInstallModal(true);
        }, 1000);
      }
    }
  }, []);

  // Redirect to home if a guest tries to access admin/orders tabs directly
  useEffect(() => {
    if (!isAdmin && (activeTab === 'admin' || activeTab === 'orders')) {
      // If they are not admin, they can only see admin tab if they need to login
      // but they shouldn't see orders at all
      if (activeTab === 'orders') {
        setActiveTab('home');
      }
    }
  }, [isAdmin, activeTab]);

  const [checkoutInfo, setCheckoutInfo] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "Cash on Delivery",
    deliveryCharge: 0
  });

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (config.enableAutoDeliveryCharge) {
      if (config.minOrderForFreeDelivery && totalPrice >= config.minOrderForFreeDelivery) {
        setCheckoutInfo(prev => ({ ...prev, deliveryCharge: 0 }));
      } else {
        setCheckoutInfo(prev => ({ ...prev, deliveryCharge: config.defaultDeliveryCharge || 0 }));
      }
    }
  }, [totalPrice, config.enableAutoDeliveryCharge, config.minOrderForFreeDelivery, config.defaultDeliveryCharge]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // Load phone user from localStorage
    const savedPhoneUser = localStorage.getItem('phoneUser');
    if (savedPhoneUser) {
      const parsed = JSON.parse(savedPhoneUser);
      setPhoneUser(parsed);
      setCheckoutInfo(prev => ({
        ...prev,
        name: parsed.name || prev.name,
        phone: parsed.phone || prev.phone,
        address: parsed.address || prev.address
      }));
    }

    const qProducts = query(collection(db, "products"), orderBy("name"));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(pList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products", setToastMessage, setShowToast);
    });

    const qCategories = query(collection(db, "categories")); // Remove orderBy
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const cList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      // Sort in memory by order, then by name
      const sortedCategories = cList.sort((a, b) => {
        // Use a high default order only if order is missing
        const orderA = a.order !== undefined ? a.order : 1000;
        const orderB = b.order !== undefined ? b.order : 1000;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
      setCategories(sortedCategories);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "categories", setToastMessage, setShowToast);
    });

    const unsubscribeConfig = onSnapshot(doc(db, "config", "store"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as StoreConfig);
      }
      // Delay finishing loading for smooth transition
      setTimeout(() => setIsAppLoading(false), 2000);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "config/store", setToastMessage, setShowToast);
      setIsAppLoading(false);
    });

    const unsubscribeExpenses = onSnapshot(collection(db, "expenses"), (snapshot) => {
      const eList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(eList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "expenses", setToastMessage, setShowToast);
    });

    const unsubscribeStaff = onSnapshot(collection(db, "staff"), (snapshot) => {
      const sList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(sList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "staff", setToastMessage, setShowToast);
    });

    // Load hidden notifications
    const savedHidden = localStorage.getItem('hiddenNotifications');
    if (savedHidden) setHiddenNotifications(JSON.parse(savedHidden));

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeConfig();
      unsubscribeExpenses();
      unsubscribeStaff();
    };
  }, []);

  // Separate effect for notifications to handle phoneUser changes
  useEffect(() => {
    if (!db) return;
    const qNotifications = query(collection(db, "notifications"), limit(100));
    const sessionStartTime = Date.now();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const notificationSound = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_fe54fe5f5a.mp3");

      const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
        const nList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreNotification));
        const sessionStartTime = Date.now();
        const myPhoneNormalized = normalizePhone(phoneUser?.phone || '');

        const filtered = nList.filter(n => {
          const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
          const isRecent = date > sevenDaysAgo;
          const targetNorm = n.targetPhone === 'all' ? 'all' : normalizePhone(n.targetPhone || '');
          const isAll = targetNorm === 'all' || !targetNorm;
          const isMe = myPhoneNormalized && targetNorm === myPhoneNormalized;
          return isRecent && (isAll || isMe);
        }).sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newNotif = change.doc.data() as StoreNotification;
            const createdAt = newNotif.createdAt?.toMillis ? newNotif.createdAt.toMillis() : Date.now();
            const targetNorm = newNotif.targetPhone === 'all' ? 'all' : normalizePhone(newNotif.targetPhone || '');
            const isTargeted = targetNorm === 'all' || !targetNorm || (myPhoneNormalized && targetNorm === myPhoneNormalized);

            if (createdAt > sessionStartTime && isTargeted) {
            notificationSound.play().catch(e => console.log("Sound play error:", e));
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(newNotif.title, {
                body: newNotif.message,
                icon: config.appIcon || "https://picsum.photos/seed/store/192/192"
              });
            }
          }
        }
      });
      setNotifications(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications", setToastMessage, setShowToast);
    });

    return () => unsubscribeNotifications();
  }, [phoneUser, config.appIcon]);

  // Consolidated orders and customers listener
  useEffect(() => {
    if (!db) return;
    let unsubscribeOrders = () => {};
    let unsubscribeCustomers = () => {};

    if (isAdmin) {
      // Admin listens to ALL orders and ALL customers
      const qOrders = query(collection(db, "orders"));
      unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const oList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        const sorted = oList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        
        if (lastOrderCount !== null && sorted.length > lastOrderCount) {
          notificationAudio.current?.play().catch(e => {});
          setToastMessage("নতুন অর্ডার এসেছে!");
          setShowToast(true);
        }
        setOrders(sorted);
        setLastOrderCount(sorted.length);
      });

      const qCustomers = query(collection(db, "customers"), orderBy("lastLogin", "desc"));
      unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
        setCustomers(snapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, phone: data.phone || doc.id, ...data } as any as Customer;
        }));
      });
    } else if (phoneUser) {
      // Customer listens to only THEIR orders
      const qUserOrders = query(
        collection(db, "orders"), 
        where("customerPhone", "==", phoneUser.phone)
      );
      unsubscribeOrders = onSnapshot(qUserOrders, (snapshot) => {
        const oList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        const sorted = oList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setCustomerOrders(sorted);
        setOrders(sorted); // Sync for generic UI use
      });
    }

    return () => {
      unsubscribeOrders();
      unsubscribeCustomers();
    };
  }, [isAdmin, phoneUser, lastOrderCount]);

  // Request Notification Permission on load if logged in
  useEffect(() => {
    if ((user || phoneUser) && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user, phoneUser]);

  useEffect(() => {
    if (!db) return;
    
    // Subscribe to support messages - Admin sees all, customer sees all (UI filters)
    // Adding phoneUser and isAdmin to dependencies to refresh on login/logoout
    const q = query(collection(db, "messages"), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const sortedMessages = mList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setMessages(sortedMessages);
    });

    return () => unsubscribe();
  }, [isAdmin, phoneUser]);

  const handleSendSupportMessage = async (imageUrl?: string) => {
    // If handleSendSupportMessage is called from onClick directly, the first arg is an event object
    // We only want to process if it's a string (imageUrl) or if it's undefined (normal click/enter)
    const actualImageUrl = typeof imageUrl === 'string' ? imageUrl : undefined;
    
    if (!supportMessage.trim() && !actualImageUrl) return;
    
    // Check if user is logged in
    if (!phoneUser) {
      setToastMessage("মেসেজ পাঠাতে আগে লগইন করুন!");
      setShowToast(true);
      setShowPhoneLogin(true);
      return;
    }

    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, "messages"), {
        senderName: phoneUser.name || "অচেনা কাস্টমার",
        senderPhone: phoneUser.phone,
        message: supportMessage || "প্রেরিত ছবি",
        imageUrl: actualImageUrl || null,
        createdAt: serverTimestamp(),
        type: "customer",
        read: false
      });
      setSupportMessage("");
      setToastMessage(actualImageUrl ? "ছবিটি পাঠানো হয়েছে!" : "মেসেজটি পাঠানো হয়েছে!");
      setShowToast(true);
    } catch (error: any) {
      console.error("Support message error:", error);
      setToastMessage("মেসেজ পাঠানো যায়নি! আবার চেষ্টা করুন।");
      setShowToast(true);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (id: string, option: 'me' | 'everyone') => {
    const msgToDelete = messages.find(m => m.id === id);
    if (!msgToDelete) return;

    if (option === 'everyone') {
      const isSender = phoneUser && msgToDelete.senderPhone === phoneUser.phone;
      if (!isAdmin && !isSender) {
        setToastMessage("আপনি কেবল আপনার নিজের মেসেজ সবার জন্য মুছতে পারবেন");
        setShowToast(true);
        return;
      }
    }

    try {
      if (option === 'everyone') {
        await updateDoc(doc(db, "messages", id), {
          deletedForEveryone: true,
          message: "এই মেসেজটি মুছে ফেলা হয়েছে",
          updatedAt: serverTimestamp()
        });
      } else {
        const phone = isAdmin ? 'admin' : phoneUser?.phone;
        if (!phone) return;
        await updateDoc(doc(db, "messages", id), {
          deletedForMe: arrayUnion(phone)
        });
      }
      setToastMessage("মেসেজটি মুছে ফেলা হয়েছে");
      setShowToast(true);
      setMessageDeleteOptionsId(null);
    } catch (error) {
      console.error("Delete message error:", error);
      handleFirestoreError(error, OperationType.WRITE, "messages", setToastMessage, setShowToast);
    }
  };

  const handleUpdateChatMessage = async () => {
    if (!editingChatMessageId || !editingChatMessageText.trim()) return;
    setIsUpdatingChatMessage(true);
    try {
      await updateDoc(doc(db, "messages", editingChatMessageId), {
        message: editingChatMessageText,
        updatedAt: serverTimestamp()
      });
      setEditingChatMessageId(null);
      setEditingChatMessageText("");
      setToastMessage("মেসেজটি আপডেট করা হয়েছে");
      setShowToast(true);
    } catch (error) {
      console.error("Update message error:", error);
      setToastMessage("আপডেট করা যায়নি!");
      setShowToast(true);
    } finally {
      setIsUpdatingChatMessage(false);
    }
  };

  const handleSendAdminReply = async (customerPhone: string, customerName: string, replyMsg: string, imageUrl?: string) => {
    if (!replyMsg.trim() && !imageUrl) return;
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, "messages"), {
        senderName: "Admin",
        senderPhone: customerPhone, // linked to the customer
        message: replyMsg || "প্রেরিত ছবি",
        imageUrl: imageUrl || null,
        createdAt: serverTimestamp(),
        type: "admin",
        read: true
      });
      setToastMessage(imageUrl ? "ছবিটি পাঠানো হয়েছে!" : "উত্তর পাঠানো হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Admin reply error:", error);
    }
  };

  const [selectedAdminChatPhone, setSelectedAdminChatPhone] = useState<string | null>(null);

  const handleDeleteCustomer = async (customerId: string) => {
    if (!isAdmin || !window.confirm("আপনি কি নিশ্চিত যে এই কাস্টমার প্রোফাইলটি মুছে ফেলতে চান? এটি আর ফিরে পাওয়া যাবে না।")) return;
    try {
      await deleteDoc(doc(db, "customers", customerId));
      setToastMessage("কাস্টমার প্রোফাইলটি মুছে ফেলা হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Delete customer error:", error);
      setToastMessage("মুছে ফেলা সম্ভব হয়নি!");
      setShowToast(true);
    }
  };

  const markMessagesAsRead = async (phone: string) => {
    const unreadMessages = messages.filter(m => m.senderPhone === phone && m.type === 'customer' && !m.read);
    if (unreadMessages.length === 0) return;

    try {
      const batch = writeBatch(db);
      unreadMessages.forEach(msg => {
        batch.update(doc(db, "messages", msg.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleAdminChatSelect = (phone: string) => {
    setSelectedAdminChatPhone(phone);
    markMessagesAsRead(phone);
  };
  const handleDeleteConversation = async (customerPhone: string) => {
    if (!isAdmin || !window.confirm("আপনি কি নিশ্চিত যে এই কাস্টমারের সব চ্যাট মুছে ফেলতে চান?")) return;
    try {
      const q = query(collection(db, "messages"), where("senderPhone", "==", customerPhone));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setSelectedAdminChatPhone(null);
      setToastMessage("পুরো কথোপকথন মুছে ফেলা হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Delete conversation error:", error);
    }
  };
  useEffect(() => {
    if (user && config) {
      const userEmail = user.email?.toLowerCase().trim();
      const adminEmail = config.adminEmail?.toLowerCase().trim();
      const masterAdmin = "mdgaziwasim@gmail.com";
      setIsAdmin(userEmail === adminEmail || userEmail === masterAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user, config]);

  const categoryList = useMemo(() => {
    return ["সব", ...categories.map(c => c.name)];
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "সব" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setToastMessage(`${product.name} ব্যাগে যোগ করা হয়েছে`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const paymentFee = useMemo(() => {
    if (checkoutInfo.paymentMethod === 'bKash' && config.bkashType === 'Personal') {
      return Math.round((totalPrice * (config.bkashFeePercentage || 0)) / 100);
    }
    if (checkoutInfo.paymentMethod === 'Nagad' && config.nagadType === 'Personal') {
      return Math.round((totalPrice * (config.nagadFeePercentage || 0)) / 100);
    }
    if (checkoutInfo.paymentMethod === 'Rocket' && config.rocketType === 'Personal') {
      return Math.round((totalPrice * (config.rocketFeePercentage || 0)) / 100);
    }
    return 0;
  }, [checkoutInfo.paymentMethod, config.bkashType, config.nagadType, config.rocketType, config.bkashFeePercentage, config.nagadFeePercentage, config.rocketFeePercentage, totalPrice]);

  const finalTotalWithFee = totalPrice + paymentFee + Number(checkoutInfo.deliveryCharge || 0);

  const handlePhoneLogin = async () => {
    const cleanPhone = phoneInput.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      setToastMessage("সঠিক ১১ ডিজিটের ফোন নম্বর দিন");
      setShowToast(true);
      return;
    }
    
    try {
      // Fetch existing user to get image
      const customerDoc = await getDoc(doc(db, "customers", cleanPhone));
      let existingData = customerDoc.exists() ? customerDoc.data() : null;

      if (existingData?.isBlocked) {
        setToastMessage("আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে। অনুগ্রহ করে কর্তৃপক্ষের সাথে যোগাযোগ করুন।");
        setShowToast(true);
        return;
      }

      const newUser = { 
        phone: cleanPhone, 
        name: nameInput.trim() || (existingData?.name) || "সম্মানিত ক্রেতা",
        image: existingData?.image || ""
      };
      
      // Save/Update in Firestore
      await setDoc(doc(db, "customers", cleanPhone), {
        ...newUser,
        lastLogin: serverTimestamp()
      }, { merge: true });

      setPhoneUser(newUser);
      localStorage.setItem('phoneUser', JSON.stringify(newUser));
      
      // Pre-fill checkout info
      setCheckoutInfo(prev => ({
        ...prev,
        name: newUser.name,
        phone: newUser.phone
      }));

      setShowPhoneLogin(false);
      setToastMessage("লগইন সফল হয়েছে!");
      setShowToast(true);
      
      // Reset inputs
      setPhoneInput("");
      setNameInput("");
    } catch (error: any) {
      console.error("Login error:", error);
      setToastMessage("লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
      setShowToast(true);
    }
  };

  const handlePhoneLogout = () => {
    setPhoneUser(null);
    localStorage.removeItem('phoneUser');
    setToastMessage("লগআউট সফল হয়েছে");
    setShowToast(true);
  };

  const handleAdminGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setToastMessage("অ্যাডমিন লগইন সফল হয়েছে");
      setShowToast(true);
    } catch (error: any) {
      console.error("Admin login error:", error);
      setToastMessage("লগইন করতে ব্যর্থ! আবার চেষ্টা করুন।");
      setShowToast(true);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await logout();
      setIsAdmin(false);
      setIsAdminUnlocked(false);
      setToastMessage("লগআউট সফল হয়েছে");
      setShowToast(true);
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  const handleAdminUnlock = () => {
    if (passwordInput === config.adminPassword || passwordInput === "123456") {
      setIsAdminUnlocked(true);
      setToastMessage("অ্যাডমিন প্যানেল আনলক হয়েছে");
      setShowToast(true);
      setPasswordInput("");
    } else {
      setToastMessage("ভুল পাসওয়ার্ড!");
      setShowToast(true);
    }
  };

  const handleRemoveOrderItem = async (orderId: string, itemIdx: number) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই পণ্যটি অর্ডার থেকে মুছে ফেলতে চান?")) return;
    
    try {
      const orderRef = doc(db, "orders", orderId);
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedItems = [...order.items];
      updatedItems.splice(itemIdx, 1);
      
      const newTotalPrice = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      await updateDoc(orderRef, {
        items: updatedItems,
        totalPrice: newTotalPrice
      });

      setToastMessage("পণ্যটি অর্ডার থেকে মুছে ফেলা হয়েছে");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`, setToastMessage, setShowToast);
    }
  };

  const handlePlaceOrder = async () => {
    if (!checkoutInfo.name || !checkoutInfo.phone || !checkoutInfo.address) {
      setToastMessage("দয়া করে সব তথ্য পূরণ করুন");
      setShowToast(true);
      return;
    }

    if (phoneUser?.phone) {
      const customerDoc = await getDoc(doc(db, "customers", phoneUser.phone));
      if (customerDoc.exists() && customerDoc.data()?.isBlocked) {
        setToastMessage("আপনি অর্ডার করতে পারবেন না। আপনার অ্যাকাউন্ট ব্লক করা হয়েছে।");
        setShowToast(true);
        return;
      }
    }

    if (isPlacingOrder) return;

    setIsPlacingOrder(true);
    
    // Quick location check
    let location = cachedLocation;
    if (!location) {
      location = await getUserLocation(true);
    }

    try {
      const batch = writeBatch(db);
      
      // Create order reference with auto-generated ID
      const orderRef = doc(collection(db, "orders"));
      
      // Strip images and ensure data is clean - explicitly pick fields to minimize size
      const itemsToSave = cart.map(item => {
        return {
          id: item.id || "unknown",
          name: item.name || "Unknown Product",
          price: Number(item.price) || 0,
          purchasePrice: Number(item.purchasePrice) || 0,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "unit",
          category: item.category || "General"
        };
      });

      const subtotal = itemsToSave.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let fee = 0;
      if (checkoutInfo.paymentMethod === 'bKash' && config.bkashType === 'Personal') {
        fee = Math.round((subtotal * (config.bkashFeePercentage || 0)) / 100);
      } else if (checkoutInfo.paymentMethod === 'Nagad' && config.nagadType === 'Personal') {
        fee = Math.round((subtotal * (config.nagadFeePercentage || 0)) / 100);
      } else if (checkoutInfo.paymentMethod === 'Rocket' && config.rocketType === 'Personal') {
        fee = Math.round((subtotal * (config.rocketFeePercentage || 0)) / 100);
      }
      const finalTotalPriceWithFee = subtotal + fee + Number(checkoutInfo.deliveryCharge || 0);
      
      const orderData: any = {
        customerName: checkoutInfo.name || "Guest",
        customerPhone: phoneUser ? phoneUser.phone : (checkoutInfo.phone || "00000000000"),
        customerAddress: checkoutInfo.address || "No Address",
        items: itemsToSave,
        totalPrice: finalTotalPriceWithFee,
        subtotal: subtotal,
        paymentFee: fee,
        deliveryCharge: Number(checkoutInfo.deliveryCharge || 0),
        status: "pending",
        paymentMethod: checkoutInfo.paymentMethod || "Cash on Delivery",
        location,
        uid: user?.uid || null,
        phoneUser: phoneUser?.phone || null,
        createdAt: serverTimestamp()
      };

      if (checkoutInfo.paymentMethod === 'bKash') {
        orderData.paymentNumber = config.bkashNumber;
        orderData.paymentType = config.bkashType;
        orderData.paymentDesc = config.bkashDesc;
      } else if (checkoutInfo.paymentMethod === 'Nagad') {
        orderData.paymentNumber = config.nagadNumber;
        orderData.paymentType = config.nagadType;
        orderData.paymentDesc = config.nagadDesc;
      } else if (checkoutInfo.paymentMethod === 'Rocket') {
        orderData.paymentNumber = config.rocketNumber;
        orderData.paymentType = config.rocketType;
        orderData.paymentDesc = config.rocketDesc;
      }
      
      batch.set(orderRef, orderData);

      // Update stock for each item
      // Use a Map to ensure we only update each product once per batch
      const stockUpdates = new Map<string, number>();
      for (const item of cart) {
        if (item.id) {
          const current = stockUpdates.get(item.id) || 0;
          stockUpdates.set(item.id, current + item.quantity);
        }
      }

      for (const [productId, quantity] of stockUpdates.entries()) {
        const productRef = doc(db, "products", productId);
        batch.update(productRef, {
          stockQuantity: increment(-quantity),
          soldCount: increment(quantity)
        });
      }
      
      await batch.commit();

      setCart([]);
      setIsOrderSuccess(true);
      setToastMessage(config.orderSuccessMsg || "অর্ডার সফল হয়েছে!");
      setShowToast(true);
    } catch (error: any) {
      console.error("Order placement error:", error);
      handleFirestoreError(error, OperationType.WRITE, "orders", setToastMessage, setShowToast);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleChatImageUpload = async (e: ChangeEvent<HTMLInputElement>, isAdmin: boolean = false, customerPhone?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setToastMessage("ছবি প্রসেস করা হচ্ছে...");
    setShowToast(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800; // Larger for screenshots
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        if (isAdmin && customerPhone) {
          handleSendAdminReply(customerPhone, "", "", compressedBase64);
        } else {
          handleSendSupportMessage(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !phoneUser) return;

    setToastMessage("ছবি প্রসেস করা হচ্ছে...");
    setShowToast(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize to a reasonable profile picture size
        const maxDim = 400;
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

        try {
          await updateDoc(doc(db, "customers", phoneUser.phone), {
            image: compressedBase64
          });
          const updatedUser = { ...phoneUser, image: compressedBase64 };
          setPhoneUser(updatedUser);
          localStorage.setItem('phoneUser', JSON.stringify(updatedUser));
          setToastMessage("প্রোফাইল ছবি আপডেট হয়েছে!");
          setShowToast(true);
        } catch (error) {
          console.error("Profile image upload error:", error);
          setToastMessage("ছবি আপলোড করতে সমস্যা হয়েছে");
          setShowToast(true);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const hideNotification = (id: string) => {
    const newHidden = [...hiddenNotifications, id];
    setHiddenNotifications(newHidden);
    localStorage.setItem('hiddenNotifications', JSON.stringify(newHidden));
    setToastMessage("নোটিফিকেশনটি মুছে ফেলা হয়েছে");
    setShowToast(true);
  };

  const visibleNotifications = notifications.filter(n => !hiddenNotifications.includes(n.id));

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: Number(newProduct.price || 0),
        purchasePrice: Number(newProduct.purchasePrice || 0),
        stockQuantity: Number(newProduct.stockQuantity || 0),
        damagedCount: Number(newProduct.damagedCount || 0),
        soldCount: 0,
        createdAt: serverTimestamp()
      });

      // Notify customers about new product
      await addDoc(collection(db, "notifications"), {
        title: "নতুন পণ্য যোগ করা হয়েছে!",
        message: `${newProduct.name} এখন আমাদের স্টোরে পাওয়া যাচ্ছে।`,
        createdAt: serverTimestamp()
      });

      setNewProduct({ 
        name: "", 
        price: 0, 
        purchasePrice: 0,
        unit: "কেজি", 
        category: "চাল", 
        image: "https://picsum.photos/seed/grocery/400/300",
        stockQuantity: 0,
        soldCount: 0,
        damagedCount: 0,
        inStock: true
      });
    } catch (error) {
      console.error("Add product error:", error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setToastMessage("পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Delete error:", error);
      setToastMessage("পণ্য মুছতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    let reason = "";
    if (status === 'cancelled') {
       const userReason = window.prompt("অর্ডার বাতিলের কারণ লিখুন (ঐচ্ছিক):");
       if (userReason === null) return;
       reason = userReason;
    }

    try {
      await updateDoc(doc(db, "orders", orderId), { 
        status,
        cancellationReason: reason,
        updatedAt: serverTimestamp()
      });

      // অটোমেটিক লেনদেন যোগ করা (গড়িতে ক্যাশ জমা/উইথড্রয়াল)
      if (status === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.isWithdrawal) {
          // Record literal cash giving as an expense
          await addDoc(collection(db, "expenses"), {
            category: "Take",
            amount: order.totalPrice,
            note: `ক্যাশ উইথড্রয়াল (আউট): #${order.id.slice(-6).toUpperCase()} (${order.customerName}) - ওয়ালেট: ${order.paymentMethod}`,
            date: serverTimestamp()
          });
          setToastMessage(`উইথড্রয়াল সফল! ক্যাশ থেকে ৳${order.totalPrice} বিয়োগ করা হয়েছে।`);
        } else if (order && order.paymentMethod === 'Cash on Delivery' && order.riderId) {
          const riderName = staff.find(s => s.id === order.riderId)?.name || "রাইডার";
          await addDoc(collection(db, "expenses"), {
            category: "Take", 
            amount: order.totalPrice,
            note: `অর্ডার ক্যাশ টাকা: #${order.id.slice(-6).toUpperCase()} (${order.customerName})`,
            staffId: order.riderId,
            date: serverTimestamp()
          });
          setToastMessage(`অর্ডার ডেলিভারি হয়েছে এবং রাইডারের (${riderName}) ব্যালেন্সে ৳${order.totalPrice} যোগ হয়েছে।`);
        } else {
          setToastMessage(`অর্ডারের স্ট্যাটাস পরিবর্তন সফল হয়েছে!`);
        }
      } else {
        setToastMessage(`অর্ডারের স্ট্যাটাস পরিবর্তন সফল হয়েছে!`);
      }
      setShowToast(true);
    } catch (error) {
      console.error("Update status error:", error);
      setToastMessage("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { 
        riderId,
        updatedAt: serverTimestamp()
      });
      setToastMessage("রাইডার নিয়োগ করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Assign rider error:", error);
      setToastMessage("রাইডার নিয়োগ করতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setToastMessage("অর্ডারটি সফলভাবে ডিলিট করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Delete order error:", error);
      setToastMessage("অর্ডার ডিলিট করতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleClearOrders = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি সব অর্ডারের ইতিহাস মুছে ফেলতে চান? এটি বিক্রির হিসাব ০ করে দেবে।")) return;
    try {
      const q = query(collection(db, "orders"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setToastMessage("সব অর্ডারের ইতিহাস মুছে ফেলা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Clear orders error:", error);
      setToastMessage("অর্ডার মুছতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleResetProductStats = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি সব পণ্যের বিক্রির সংখ্যা ০ করতে চান? এটি ইনভেস্টমেন্টের হিসাব পরিবর্তন করবে।")) return;
    try {
      const batch = writeBatch(db);
      products.forEach((p) => {
        batch.update(doc(db, "products", p.id), { soldCount: 0 });
      });
      await batch.commit();
      setToastMessage("সব পণ্যের বিক্রির হিসাব ০ করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Reset product stats error:", error);
      setToastMessage("হিসাব ০ করতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleResetStock = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি সব পণ্যের স্টকের সংখ্যা ০ করতে চান? এটি বাকি মালের হিসাব পরিবর্তন করবে।")) return;
    try {
      const batch = writeBatch(db);
      products.forEach((p) => {
        batch.update(doc(db, "products", p.id), { stockQuantity: 0 });
      });
      await batch.commit();
      setToastMessage("সব পণ্যের স্টকের হিসাব ০ করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Reset stock error:", error);
      setToastMessage("স্টক ০ করতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleClearExpenses = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি সব ব্যয়ের হিসাব মুছে ফেলতে চান?")) return;
    try {
      const q = query(collection(db, "expenses"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setToastMessage("সব ব্যয়ের হিসাব মুছে ফেলা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Clear expenses error:", error);
      setToastMessage("ব্যয় মুছতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleClearWalletOrders = async (method: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিত যে আপনি সব ${method} পেমেন্টের ইতিহাস মুছে ফেলতে চান?`)) return;
    try {
      const q = query(collection(db, "orders"), where("paymentMethod", "==", method));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setToastMessage(`${method} পেমেন্টের ইতিহাস মুছে ফেলা হয়েছে।`);
      setShowToast(true);
    } catch (error) {
      console.error(`Clear ${method} orders error:`, error);
      setToastMessage("ইতিহাস মুছতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleClearOnlineOrders = async () => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি সব অনলাইন বিক্রির ইতিহাস মুছে ফেলতে চান? এটি ক্যাশ ছাড়া সব পেমেন্ট ০ করে দেবে।")) return;
    try {
      const q = query(collection(db, "orders"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((orderDoc) => {
        const method = orderDoc.data().paymentMethod;
        if (method !== 'Cash' && method !== 'Cash on Delivery') {
          batch.delete(orderDoc.ref);
        }
      });
      await batch.commit();
      setToastMessage("অনলাইন পেমেন্টের সব ইতিহাস মুছে ফেলা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Clear online orders error:", error);
      setToastMessage("ইতিহাস মুছতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleResetInvestment = async () => {
    const rawTotalInvestment = products.reduce((sum, p) => sum + (((p.stockQuantity || 0) + (p.soldCount || 0)) * (p.purchasePrice || 0)), 0);
    const currentStockValue = products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.purchasePrice || 0)), 0);
    
    const choice = window.confirm(
      "ইনভেস্টমেন্ট রিসেট অপশন:\n\n" +
      "১. OK টিপুন: ইনভেস্টমেন্টকে বর্তমান স্টকের মূল্যের (৳" + currentStockValue + ") সমান করতে।\n" +
      "২. Cancel টিপুন: আরও অপশন দেখতে।"
    );
    
    try {
      if (choice) {
        // Option 1: Sync to Stock Value
        const newAdjustment = currentStockValue - rawTotalInvestment;
        setConfig(prev => ({...prev, manualInvestmentAdjustment: newAdjustment}));
        await setDoc(doc(db, "config", "store"), { manualInvestmentAdjustment: newAdjustment }, { merge: true });
        setToastMessage("ইনভেস্টমেন্ট বর্তমান বাকি মালের সমান করা হয়েছে।");
        setShowToast(true);
      } else {
        const choice2 = window.confirm(
          "অন্যান্য অপশন:\n\n" +
          "১. OK টিপুন: সকল প্রোডাক্টের স্টক (Stock) এবং বিক্রির হিসাব (Sold Count) ০ করতে।\n" +
          "২. Cancel টিপুন: শুধু ইনভেস্টমেন্ট অ্যাডজাস্টমেন্ট ০ করতে।"
        );
        
        if (choice2) {
          // Option 2: Wipe Products Data
          const batch = writeBatch(db);
          products.forEach(p => {
            batch.update(doc(db, "products", p.id), { 
              stockQuantity: 0,
              soldCount: 0 
            });
          });
          // Also reset adjustment
          batch.set(doc(db, "config", "store"), { manualInvestmentAdjustment: 0 }, { merge: true });
          await batch.commit();
          
          setConfig(prev => ({...prev, manualInvestmentAdjustment: 0}));
          setToastMessage("সকল প্রোডাক্ট ডাটা ও ইনভেস্টমেন্ট রিসেট করা হয়েছে।");
          setShowToast(true);
        } else {
          // Option 3: Just zero the adjustment
          setConfig(prev => ({...prev, manualInvestmentAdjustment: 0}));
          await setDoc(doc(db, "config", "store"), { manualInvestmentAdjustment: 0 }, { merge: true });
          setToastMessage("ইনভেস্টমেন্ট অ্যাডজাস্টমেন্ট ০ করা হয়েছে।");
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error("Reset investment error:", error);
      handleFirestoreError(error, OperationType.WRITE, 'config/store', setToastMessage, setShowToast);
    }
  };

  const handleShareWithRider = (order: Order) => {
    const itemsText = order.items.map(item => `- ${item.name} x ${item.quantity}`).join('\n');
    const locationUrl = order.location 
      ? `\n📍 লোকেশন (Google Maps): https://www.google.com/maps?q=${order.location.lat},${order.location.lng}` 
      : '';
    
    const message = `🛍️ *নতুন ডেলিভারি অর্ডার*\n\n` +
      `👤 কাস্টমার: ${order.customerName}\n` +
      `📞 ফোন: ${order.customerPhone}\n` +
      `🏠 ঠিকানা: ${order.customerAddress}\n\n` +
      `📋 পণ্যসমূহ:\n${itemsText}\n\n` +
      `💰 মোট বিল: ৳${order.totalPrice}\n` +
      `💳 পেমেন্ট: ${order.paymentMethod}\n` +
      locationUrl + `\n\n` +
      `ধন্যবাদ!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount) {
      setToastMessage("দয়া করে খরচের পরিমাণ লিখুন।");
      setShowToast(true);
      return;
    }
    try {
      await addDoc(collection(db, "expenses"), {
        category: newExpense.category || "Salary",
        amount: Number(newExpense.amount),
        note: newExpense.note || "",
        staffId: newExpense.staffId || "",
        date: serverTimestamp()
      });
      setNewExpense({ category: "Salary", amount: 0, note: "", staffId: "" });
      setToastMessage("লেনদেন সফলভাবে যোগ করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "expenses", setToastMessage, setShowToast);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name) return;
    try {
      await addDoc(collection(db, "staff"), {
        ...newStaff,
        createdAt: serverTimestamp()
      });
      setNewStaff({ name: "", role: "Worker", phone: "" });
      setToastMessage("কর্মী সফলভাবে যোগ করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "staff", setToastMessage, setShowToast);
    }
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    try {
      await updateDoc(doc(db, "staff", editingStaff.id), {
        name: editingStaff.name,
        role: editingStaff.role,
        phone: editingStaff.phone || ""
      });
      setEditingStaff(null);
      setToastMessage("কর্মী তথ্য আপডেট করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "staff", setToastMessage, setShowToast);
    }
  };

  const handleShareProduct = (product: Product) => {
    const origin = window.location.origin.replace('ais-dev-', 'ais-pre-');
    const baseUrl = origin + window.location.pathname;
    const shareUrl = `${baseUrl}?s&p=${product.id}`;
    const shareText = `${config.storeName || "ওয়াসিম স্টোর"} থেকে ${product.name} দেখুন! দাম মাত্র ৳${product.price} / ${product.unit}`;
    
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setToastMessage("প্রোডাক্ট লিঙ্ক কপি করা হয়েছে!");
      setShowToast(true);
    }
  };

  const handleShareStore = () => {
    const origin = window.location.origin.replace('ais-dev-', 'ais-pre-');
    const shareUrl = `${origin}/?s`;
    const shareText = `${config.storeName || "ওয়াসিম স্টোর"} থেকে সেরা ফ্রেশ পণ্যগুলো দেখে নিন! আজই অর্ডার করুন।`;
    
    if (navigator.share) {
      navigator.share({
        title: config.storeName || "ওয়াসিম স্টোর",
        text: shareText,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setToastMessage("স্টোর লিঙ্ক কপি করা হয়েছে!");
      setShowToast(true);
    }
  };

  const handlePlacePromoOrder = async () => {
    if (!phoneUser) {
      setShowPhoneLogin(true);
      return;
    }
    
    const amount = parseFloat(promoAmount) || parseFloat(config.promoServiceDefaultAmount || "0") || 0;
    if (amount <= 0) {
      setToastMessage("সঠিক অ্যামাউন্ট লিখুন");
      setShowToast(true);
      return;
    }

    setIsPlacingPromoOrder(true);
    try {
      await addDoc(collection(db, "orders"), {
        customerName: checkoutInfo.name || phoneUser.name,
        customerPhone: checkoutInfo.phone || phoneUser.phone,
        customerAddress: checkoutInfo.address || "প্রমোশনাল সার্ভিস",
        items: [{
          id: "promo-service",
          name: config.promoServiceTitle || "প্রমোশনাল সার্ভিস",
          price: amount,
          quantity: 1,
          image: config.promoServiceImage || ""
        }],
        totalPrice: amount,
        status: 'pending',
        paymentMethod: promoWallet,
        createdAt: serverTimestamp(),
        isShopSale: false,
        isWithdrawal: true // Mark as withdrawal
      });
      setToastMessage("আপনার সার্ভিস অর্ডারটি গ্রহণ করা হয়েছে!");
      setShowToast(true);
      setShowPromoModal(false);
      setPromoAmount("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "orders", setToastMessage, setShowToast);
    } finally {
      setIsPlacingPromoOrder(false);
    }
  };

  const handleShopSale = async () => {
    if (shopCart.length === 0) {
      setToastMessage("ব্যাগ খালি!");
      setShowToast(true);
      return;
    }
    
    setIsPlacingShopOrder(true);
    try {
      const subtotal = shopCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      let fee = 0;
      if (shopPaymentMethod === 'bKash' && config.bkashType === 'Personal') {
        fee = Math.round((subtotal * (config.bkashFeePercentage || 0)) / 100);
      } else if (shopPaymentMethod === 'Nagad' && config.nagadType === 'Personal') {
        fee = Math.round((subtotal * (config.nagadFeePercentage || 0)) / 100);
      } else if (shopPaymentMethod === 'Rocket' && config.rocketType === 'Personal') {
        fee = Math.round((subtotal * (config.rocketFeePercentage || 0)) / 100);
      }
      const total = subtotal + fee + shopDeliveryCharge;
      const batch = writeBatch(db);
      
      // Add Order
      const orderRef = doc(collection(db, "orders"));
      batch.set(orderRef, {
        customerName: shopCustomerName || "দোকান বিক্রি (নগদ)",
        customerPhone: shopCustomerPhone || "POS",
        customerAddress: shopCustomerAddress || "In-Store",
        items: shopCart,
        subtotal: subtotal,
        paymentFee: fee,
        deliveryCharge: shopDeliveryCharge,
        totalPrice: total,
        status: 'delivered',
        paymentMethod: shopPaymentMethod,
        createdAt: serverTimestamp(),
        isShopSale: true
      });
      
      // Update inventory for each item
      shopCart.forEach(item => {
        const productRef = doc(db, "products", item.id);
        const originalProduct = products.find(p => p.id === item.id);
        if (originalProduct) {
          const currentStock = originalProduct.stockQuantity || 0;
          const currentSold = originalProduct.soldCount || 0;
          batch.update(productRef, {
            stockQuantity: Math.max(0, currentStock - item.quantity),
            soldCount: currentSold + item.quantity
          });
        }
      });
      
      await batch.commit();
      
      // Auto-trigger print for shop sales
      setPrintableOrder({
        id: orderRef.id,
        customerName: shopCustomerName || "দোকান বিক্রি (নগদ)",
        customerPhone: shopCustomerPhone || "POS",
        customerAddress: shopCustomerAddress || "In-Store",
        items: [...shopCart],
        subtotal: subtotal,
        paymentFee: fee,
        deliveryCharge: shopDeliveryCharge,
        totalPrice: total,
        status: 'delivered',
        paymentMethod: shopPaymentMethod,
        createdAt: { toDate: () => new Date() } // Local date for immediate print
      } as any);
      setShowPrintMemo(true);

      setShopCart([]);
      setShopCustomerName("");
      setShopCustomerPhone("");
      setShopCustomerAddress("");
      setShopDeliveryCharge(0);
      setToastMessage("দোকান বিক্রি সফল হয়েছে!");
      setShowToast(true);
      setIsPlacingShopOrder(false);
    } catch (error) {
       setIsPlacingShopOrder(false);
       handleFirestoreError(error, OperationType.CREATE, "orders", setToastMessage, setShowToast);
    }
  };

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
        <div className="relative flex flex-col items-center gap-8 px-6 text-center">
          {config.storeLogo ? (
            <motion.img 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={config.storeLogo} 
              alt="Logo" 
              className="h-32 w-32 object-contain drop-shadow-2xl" 
            />
          ) : null}
          <h2 className="text-4xl font-black text-green-800 tracking-tighter">
            {config.storeName || "ওয়াসিম স্টোর"}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce" />
            <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce [animation-delay:-0.3s]" />
          </div>
          <p className="text-lg font-bold text-green-700 bg-green-50 px-6 py-3 rounded-2xl border border-green-100 animate-pulse">
            অ্যাপসটি লোডিং হচ্ছে একটু অপেক্ষা করুন
          </p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            আমরা আপনার অভিজ্ঞতার জন্য সফটওয়্যারটি অটোমেটিক লোডিং করছি
          </p>
        </div>
        
        <div className="absolute bottom-12 left-0 right-0 text-center">
          <p className="text-[10px] text-gray-300 font-medium">Wasim Store Delivery Platform</p>
        </div>
      </div>
    );
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpdateConfig = async () => {
    try {
      await updateDoc(doc(db, "config", "store"), config);
      setToastMessage("সেটিংস সেভ করা হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Update config error:", error);
      handleFirestoreError(error, OperationType.WRITE, "config/store", setToastMessage, setShowToast);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt("ক্যাটাগরির নাম লিখুন:");
    if (!name || !name.trim()) return;
    try {
      await addDoc(collection(db, "categories"), {
        name: name.trim(),
        order: categories.length + 1
      });
      setToastMessage("ক্যাটাগরি যোগ করা হয়েছে");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "categories", setToastMessage, setShowToast);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি এই ক্যাটাগরি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      setToastMessage("ক্যাটাগরি মুছে ফেলা হয়েছে");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "categories", setToastMessage, setShowToast);
    }
  };

  const handleMoveCategory = async (cat: any, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === cat.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const targetCat = categories[targetIndex];
    try {
      await updateDoc(doc(db, "categories", cat.id), { order: targetCat.order });
      await updateDoc(doc(db, "categories", targetCat.id), { order: cat.order });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "categories", setToastMessage, setShowToast);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "expenses", id));
      setToastMessage("লেনদেন মুছে ফেলা হয়েছে");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "expenses", setToastMessage, setShowToast);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি এই কর্মীকে মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "staff", id));
      setToastMessage("কর্মী মুছে ফেলা হয়েছে");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "staff", setToastMessage, setShowToast);
    }
  };

  const handleBlockCustomer = async (phone: string, blockStatus: boolean) => {
    try {
      await updateDoc(doc(db, "customers", phone), { isBlocked: blockStatus });
      setToastMessage(blockStatus ? "কাস্টমারকে ব্লক করা হয়েছে" : "কাস্টমারকে আনব্লক করা হয়েছে");
      setShowToast(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `customers/${phone}`, setToastMessage, setShowToast);
    }
  };

  const handleTrackOrder = () => {
    if (!trackingPhone || trackingPhone.length < 11) {
      setToastMessage("সঠিক ফোন নাম্বার দিন");
      setShowToast(true);
      return;
    }
    setIsTrackingActive(true);
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'product' | 'logo' | 'hero' | 'appIcon' | 'promoService' = 'product') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64String = await compressImage(file);
        if (type === 'product') {
          if (editingProduct) {
            setEditingProduct({ ...editingProduct, image: base64String });
          } else {
            setNewProduct({ ...newProduct, image: base64String });
          }
        } else if (type === 'logo') {
          setConfig({ ...config, storeLogo: base64String });
        } else if (type === 'hero') {
          setConfig({ ...config, heroImage: base64String });
        } else if (type === 'appIcon') {
          setConfig({ ...config, appIcon: base64String });
        } else if (type === 'promoService') {
          setConfig({ ...config, promoServiceImage: base64String });
        }
      } catch (error) {
        console.error("Image compression error:", error);
        setToastMessage("ছবি আপলোড করতে সমস্যা হয়েছে।");
        setShowToast(true);
      }
    }
  };

  const scrollToProducts = () => {
    const element = document.getElementById('product-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSeedData = async () => {
    try {
      const batch = writeBatch(db);
      const demoProducts = [
        { name: "মিনিকেট চাল", price: 65, unit: "কেজি", category: "চাল", image: "https://picsum.photos/seed/rice/400/300", stockQuantity: 100, inStock: true },
        { name: "মসুর ডাল (দেশি)", price: 140, unit: "কেজি", category: "ডাল", image: "https://picsum.photos/seed/dal/400/300", stockQuantity: 50, inStock: true },
        { name: "রূপচাঁদা সয়াবিন তেল", price: 170, unit: "লিটার", category: "তেল", image: "https://picsum.photos/seed/oil/400/300", stockQuantity: 30, inStock: true },
        { name: "চিনি (সাদা)", price: 135, unit: "কেজি", category: "চিনি", image: "https://picsum.photos/seed/sugar/400/300", stockQuantity: 40, inStock: true }
      ];

      for (const p of demoProducts) {
        const newDocRef = doc(collection(db, "products"));
        batch.set(newDocRef, { ...p, soldCount: 0, createdAt: serverTimestamp() });
      }

      const demoCategories = ["চাল", "ডাল", "তেল", "চিনি", "লবণ", "আটা", "দুধ", "চা"];
      for (const cat of demoCategories) {
        const catRef = doc(collection(db, "categories"));
        batch.set(catRef, { name: cat });
      }

      await batch.commit();
      setToastMessage("ডেমো ডাটা সফলভাবে যোগ করা হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Seed data error:", error);
      setToastMessage("ডাটা যোগ করতে সমস্যা হয়েছে।");
      setShowToast(true);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    try {
      const { id, ...data } = editingProduct;
      await updateDoc(doc(db, "products", id), data);
      setEditingProduct(null);
      setToastMessage("পণ্য আপডেট হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Update product error:", error);
    }
  };

  const copyStoreLink = () => {
    const origin = window.location.origin.replace('ais-dev-', 'ais-pre-');
    // Use root path to ensure the link works correctly
    const customerUrl = `${origin}/?s`;
    navigator.clipboard.writeText(customerUrl);
    setToastMessage("কাস্টমার লিঙ্ক কপি করা হয়েছে!");
    setShowToast(true);
  };

  const copyInstallLink = () => {
    const origin = window.location.origin.replace('ais-dev-', 'ais-pre-');
    // Use root path to ensure the link works correctly
    const installUrl = `${origin}/?install`;
    navigator.clipboard.writeText(installUrl);
    setToastMessage("ডাইরেক্ট ইন্সটল লিঙ্ক কপি করা হয়েছে!");
    setShowToast(true);
  };
  return (
    <div className="min-h-screen bg-[#fdfcf8] text-[#2d2d2d] font-sans overflow-x-hidden">
      {/* Location Access Banner */}
      <AnimatePresence>
        {showLocationBanner && isCustomerMode && activeTab !== 'admin' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-800 text-white py-2.5 px-4 text-center text-[11px] font-bold flex items-center justify-center gap-4 border-b border-green-900/50 sticky top-0 z-[60] shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-green-700 flex items-center justify-center text-yellow-300">
                <MapPin size={12} />
              </div>
              দ্রুত ডেলিভারির জন্য আপনার বর্তমান লোকেশন শেয়ার করবেন?
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={handleLocationAccept} className="bg-white text-green-800 hover:bg-green-50 h-7 px-4 text-[10px] font-black rounded-lg shadow-sm">লোকেশন দিন</Button>
              <Button size="sm" variant="ghost" onClick={handleLocationDeny} className="text-green-100 hover:bg-green-900 h-7 px-3 text-[10px] font-bold rounded-lg underline">পরে হবে</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement Bar */}
      <AnimatePresence>
        {config.showAnnouncement && config.announcementText && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-600 text-white py-2 px-4 text-center text-sm font-bold overflow-hidden sticky top-0 z-50 shadow-md"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block animate-pulse">📢</span>
              <p>{config.announcementText}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-md pt-4 pb-2">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-green-800 leading-tight">
              {config.storeName || "ওয়াসিম স্টোর"}
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              {config.storeSubtext || "মোদী মাল বিক্রেতা"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isCustomerMode && (
              <div className="flex items-center gap-3">
                {phoneUser ? (
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-0 hover:bg-transparent"
                      onClick={() => setActiveTab("info")}
                    >
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100 border-2 border-green-500 shadow-md">
                        {phoneUser.image ? (
                          <img src={phoneUser.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon size={24} className="text-gray-400 m-auto mt-2" />
                        )}
                      </div>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handlePhoneLogout}
                      className="text-red-500 hover:bg-red-50 rounded-full h-10 w-10"
                    >
                      <LogOut size={20} />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPhoneLogin(true)}
                    className="border-green-200 text-green-700 hover:bg-green-50 rounded-full gap-2 h-10 px-4 font-bold"
                  >
                    <LogIn size={16} />
                    লগইন
                  </Button>
                )}
                
                {/* Notification Bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-full h-10 w-10"
                  onClick={() => setActiveTab("info")}
                >
                  <Bell size={22} />
                  {visibleNotifications.length > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Cart Button */}
      {isCustomerMode && (
        <motion.div 
          drag
          dragConstraints={{ left: -300, right: 0, top: -500, bottom: 0 }}
          className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-2 cursor-grab active:cursor-grabbing"
        >
          <Sheet open={isCartOpen} onOpenChange={(open) => {
            setIsCartOpen(open);
            if (!open) setIsOrderSuccess(false);
          }}>
            <SheetTrigger 
              render={
                <button className="flex flex-col items-center gap-2 outline-none group cursor-pointer focus:ring-0">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-20 w-20 rounded-full bg-green-600 hover:bg-green-700 shadow-[0_8px_30px_rgb(22,163,74,0.4)] flex flex-col items-center justify-center gap-1 border-4 border-white transition-transform group-active:scale-95 relative">
                      <motion.div
                        key={totalItems}
                        initial={{ scale: 1 }}
                        animate={{ scale: totalItems > 0 ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ShoppingBasket className="h-8 w-8 text-white" />
                      </motion.div>
                      {totalItems > 0 && (
                        <Badge className="absolute -right-1 -top-1 h-7 w-7 flex items-center justify-center rounded-full bg-red-500 p-0 text-xs font-bold border-2 border-white shadow-lg">
                          {totalItems}
                        </Badge>
                      )}
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl border border-green-100 max-w-[180px] text-center">
                      <p className="text-[10px] font-bold text-green-800 leading-tight">
                        আপনার বাছাইকৃত পণ্য এই ব্যাগে যোগ হয়েছে এখানে অর্ডার করুন
                      </p>
                    </div>
                  </div>
                </button>
              }
            />
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full overflow-y-auto">
              {isOrderSuccess ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-10">
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <Check size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-green-800">অর্ডার সফল হয়েছে!</h2>
                    <p className="text-muted-foreground">আপনার অর্ডারটি আমরা পেয়েছি। শীঘ্রই আপনার সাথে যোগাযোগ করা হবে।</p>
                  </div>
                  <div className="flex flex-col w-full gap-3">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl"
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsOrderSuccess(false);
                      }}
                    >
                      কেনাকাটা চালিয়ে যান
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-green-200 text-green-700 font-bold h-12 rounded-xl gap-2"
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsOrderSuccess(false);
                        setActiveTab("info");
                      }}
                    >
                      <MessageSquare size={18} />
                      কথা বলুন
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <SheetHeader className="border-b pb-4">
                    <SheetTitle className="flex items-center gap-2 text-green-800">
                      <ShoppingBasket className="h-5 w-5" />
                      এখানে অর্ডার করুন
                    </SheetTitle>
                  </SheetHeader>
                  
                  <ScrollArea className="flex-1 py-4 h-[60vh]">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <ShoppingBag size={48} className="mb-4 opacity-20" />
                        <p>আপনার ব্যাগ খালি</p>
                      </div>
                    ) : (
                      <div className="space-y-4 pr-4">
                        {cart.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-4 rounded-lg border p-3 bg-white shadow-sm"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-16 w-16 rounded-md object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                ৳{item.price} / {item.unit}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => updateQuantity(item.id, -1)}
                                >
                                  <Minus size={12} />
                                </Button>
                                <span className="text-sm font-medium w-4 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                  onClick={() => updateQuantity(item.id, 1)}
                                >
                                  <Plus size={12} />
                                </Button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">৳{item.price * item.quantity}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {cart.length > 0 && (
                    <SheetFooter className="border-t pt-4 flex-col gap-4">
                      <div className="space-y-4 w-full mb-4">
                        <Input placeholder="আপনার নাম" value={checkoutInfo.name} onChange={e => setCheckoutInfo({...checkoutInfo, name: e.target.value})} />
                        <Input placeholder="ফোন নাম্বার" value={checkoutInfo.phone} onChange={e => setCheckoutInfo({...checkoutInfo, phone: e.target.value})} />
                        <div className="flex gap-2">
                          <Input className={config.enableAutoDeliveryCharge ? "flex-[2]" : "w-full"} placeholder="ঠিকানা" value={checkoutInfo.address} onChange={e => setCheckoutInfo({...checkoutInfo, address: e.target.value})} />
                          {config.enableAutoDeliveryCharge && (
                            <div className="flex-1 relative">
                              <Input 
                                type="number" 
                                placeholder="ডেলিভারি চার্জ" 
                                value={checkoutInfo.deliveryCharge} 
                                onChange={e => setCheckoutInfo({...checkoutInfo, deliveryCharge: Number(e.target.value)})} 
                                readOnly={config.enableAutoDeliveryCharge}
                                className={`h-10 ${config.enableAutoDeliveryCharge ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed' : ''}`}
                              />
                              <span className="absolute -top-3 left-2 bg-white px-1 text-[8px] font-black uppercase text-amber-600">অটো সেট (অপরিবর্তনযোগ্য)</span>
                              {config.deliveryChargeNotice && (
                                <p className="text-[10px] text-amber-600 mt-1 leading-tight font-medium">*{config.deliveryChargeNotice}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant={checkoutInfo.paymentMethod === 'Cash on Delivery' ? 'default' : 'outline'}
                            className="flex-1 text-xs"
                            onClick={() => setCheckoutInfo({...checkoutInfo, paymentMethod: 'Cash on Delivery'})}
                          >Cash</Button>
                          <Button 
                            variant={checkoutInfo.paymentMethod === 'bKash' ? 'default' : 'outline'}
                            className="flex-1 text-xs"
                            onClick={() => setCheckoutInfo({...checkoutInfo, paymentMethod: 'bKash'})}
                          >bKash</Button>
                          <Button 
                            variant={checkoutInfo.paymentMethod === 'Nagad' ? 'default' : 'outline'}
                            className="flex-1 text-xs"
                            onClick={() => setCheckoutInfo({...checkoutInfo, paymentMethod: 'Nagad'})}
                          >Nagad</Button>
                          <Button 
                            variant={checkoutInfo.paymentMethod === 'Rocket' ? 'default' : 'outline'}
                            className="flex-1 text-xs"
                            onClick={() => setCheckoutInfo({...checkoutInfo, paymentMethod: 'Rocket'})}
                          >Rocket</Button>
                        </div>
                        {checkoutInfo.paymentMethod !== 'Cash on Delivery' && (
                          <div className="space-y-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-[10px] text-center text-green-700 font-bold uppercase tracking-wider">
                              {checkoutInfo.paymentMethod} পেমেন্ট নির্দেশিকা
                            </p>
                            <div className="flex items-center justify-center gap-2 bg-white p-2 rounded-xl border border-green-100 relative group">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-black text-green-900">
                                    {checkoutInfo.paymentMethod === 'bKash' ? config.bkashNumber : checkoutInfo.paymentMethod === 'Nagad' ? config.nagadNumber : config.rocketNumber}
                                  </span>
                                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-green-100 text-green-800 border-none">
                                    {checkoutInfo.paymentMethod === 'bKash' ? config.bkashType : checkoutInfo.paymentMethod === 'Nagad' ? config.nagadType : config.rocketType}
                                  </Badge>
                                </div>
                                {(checkoutInfo.paymentMethod === 'bKash' ? config.bkashDesc : checkoutInfo.paymentMethod === 'Nagad' ? config.nagadDesc : config.rocketDesc) && (
                                  <p className="text-[10px] text-muted-foreground font-medium italic">
                                    {checkoutInfo.paymentMethod === 'bKash' ? config.bkashDesc : checkoutInfo.paymentMethod === 'Nagad' ? config.nagadDesc : config.rocketDesc}
                                  </p>
                                )}
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-full shrink-0"
                                onClick={() => {
                                  const num = checkoutInfo.paymentMethod === 'bKash' ? config.bkashNumber : checkoutInfo.paymentMethod === 'Nagad' ? config.nagadNumber : config.rocketNumber;
                                  navigator.clipboard.writeText(num);
                                  setToastMessage("নাম্বার কপি করা হয়েছে!");
                                  setShowToast(true);
                                }}
                              >
                                <Copy size={14} />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {checkoutInfo.paymentMethod === 'bKash' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="text-[10px] h-9 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold"
                                    onClick={() => window.open(`https://www.bkash.com/app/`)}
                                  >
                                    বিকাশ অ্যাপ ওপেন
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-[10px] h-9 border-pink-200 text-pink-700 rounded-xl"
                                    onClick={() => window.open(`tel:*247#`)}
                                  >
                                    ডায়াল *২৪৭#
                                  </Button>
                                </>
                              )}
                              {checkoutInfo.paymentMethod === 'Nagad' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="text-[10px] h-9 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                                    onClick={() => window.open(`https://nagad.com.bd/`)}
                                  >
                                    নগদ অ্যাপ ওপেন
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-[10px] h-9 border-red-200 text-red-700 rounded-xl"
                                    onClick={() => window.open(`tel:*167#`)}
                                  >
                                    ডায়াল *১৬৭#
                                  </Button>
                                </>
                              )}
                              {checkoutInfo.paymentMethod === 'Rocket' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="text-[10px] h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                                    onClick={() => window.open(`https://www.dutchbanglabank.com/rocket/rocket.html`)}
                                  >
                                    রকেট অ্যাপ ওপেন
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-[10px] h-9 border-purple-200 text-purple-700 rounded-xl"
                                    onClick={() => window.open(`tel:*322#`)}
                                  >
                                    ডায়াল *৩২২#
                                  </Button>
                                </>
                              )}
                            </div>
                            <div className="pt-2 border-t border-green-100 space-y-2">
                              <p className="text-[10px] text-center text-green-600 italic">
                                পেমেন্ট করার পর স্ক্রিনশটটি চ্যাট বক্সে বা হোয়াটসঅ্যাপে পাঠান।
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1 text-[10px] h-8 border-green-200 text-green-700 font-bold rounded-lg"
                                  onClick={() => {
                                    setIsCartOpen(false);
                                    setActiveTab("info");
                                  }}
                                >
                                  <MessageCircle size={12} className="mr-1" /> চ্যাটে স্ক্রিনশট পাঠান
                                </Button>
                                {config.whatsappNumber && (
                                  <Button 
                                    size="sm" 
                                    className="flex-1 text-[10px] h-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
                                    onClick={() => window.open(`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি পেমেন্ট করেছি। এই নিন স্ক্রিনশট।')}`)}
                                  >
                                    <MessageSquare size={12} className="mr-1" /> হোয়াটসঅ্যাপ
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 w-full pt-4 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">সাবটোটাল:</span>
                          <span className="font-medium">৳{totalPrice}</span>
                        </div>
                        {paymentFee > 0 && (
                          <div className="flex justify-between text-sm text-pink-600 font-medium">
                            <span>পেমেন্ট খরচ ({checkoutInfo.paymentMethod === 'bKash' ? config.bkashFeePercentage : checkoutInfo.paymentMethod === 'Nagad' ? config.nagadFeePercentage : config.rocketFeePercentage}%):</span>
                            <span>+৳{paymentFee}</span>
                          </div>
                        )}
                        {Number(checkoutInfo.deliveryCharge || 0) > 0 && (
                          <div className="flex justify-between text-sm text-amber-600 font-medium">
                            <span>ডেলিভারি চার্জ:</span>
                            <span>+৳{checkoutInfo.deliveryCharge}</span>
                          </div>
                        )}
                        <div className="flex w-full items-center justify-between border-t pt-2 mt-2">
                          <span className="text-muted-foreground font-bold">মোট দাম:</span>
                          <span className="text-xl font-black text-green-800">৳{finalTotalWithFee}</span>
                        </div>
                      </div>
                      <Button 
                        onClick={handlePlaceOrder} 
                        disabled={isPlacingOrder}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-bold"
                      >
                        {isPlacingOrder ? (isFetchingLocation ? "লোকেশন নেওয়া হচ্ছে..." : "অর্ডার হচ্ছে...") : "অর্ডার করুন"}
                        {!isPlacingOrder && <ChevronRight className="ml-2 h-5 w-5" />}
                      </Button>
                    </SheetFooter>
                  )}
                </>
              )}
            </SheetContent>
          </Sheet>
        </motion.div>
      )}

      <main className="container mx-auto px-4 py-8 pb-24">
        {activeTab === "home" && (
          <>
            {showInstallButton && (
              <div className="mb-6">
                <Button 
                  onClick={handleInstallApp}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-6 rounded-2xl shadow-lg animate-pulse flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  ওয়াসিম স্টোর অ্যাপ ইন্সটল করুন
                </Button>
              </div>
            )}
            {/* Mobile Search */}
            <div className="mb-6 md:hidden">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-green-600 group-focus-within:text-green-700 transition-colors" />
                </div>
                <Input
                  type="search"
                  placeholder="আপনার পছন্দের পণ্য খুঁজুন..."
                  className="pl-10 h-12 bg-white border-green-100 rounded-2xl shadow-sm focus:ring-green-500 focus:border-green-500 transition-all text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Hero Section */}
            <section className="mb-8 rounded-3xl bg-gradient-to-br from-green-600 to-green-800 p-6 text-white shadow-xl overflow-hidden relative min-h-[220px] flex items-center">
              <div className="relative z-10 max-w-[60%]">
                <Badge className="mb-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm text-[10px]">
                  নতুন অফার!
                </Badge>
                <h2 className="mb-2 text-xl md:text-3xl font-bold leading-tight">
                  {config.heroTitle}
                </h2>
                <p className="mb-4 text-xs md:text-sm text-green-50 opacity-90 line-clamp-2">
                  {config.heroSubtext}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={scrollToProducts}
                    size="sm"
                    className="bg-white text-green-800 hover:bg-green-50 font-bold px-4 rounded-full text-xs"
                  >
                    কেনাকাটা শুরু করুন
                  </Button>
                  
                  {showInstallButton && (
                    <Button 
                      onClick={handleInstallApp}
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 rounded-full shadow-lg animate-pulse text-xs"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      অ্যাপ ইন্সটল
                    </Button>
                  )}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="opacity-30">
                    {config.heroImage ? (
                      <img src={config.heroImage} alt="Offer" className="max-h-[70%] max-w-[70%] object-contain rotate-6" />
                    ) : (
                      <ShoppingBasket size={180} className="translate-x-1/4 -translate-y-1/4 rotate-12" />
                    )}
                  </div>
                  {config.heroImage && (
                    <button 
                      onClick={handleShareStore}
                      className="absolute top-1/2 right-4 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-700 shadow-xl transition-transform hover:scale-110 active:scale-95 z-10"
                      title="অফার শেয়ার করুন"
                    >
                      <Share2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Category Filters */}
            <div className="mb-6 relative">
              <div className="overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
                <div className="flex gap-1.5 min-w-max">
                  {categoryList.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-full px-3.5 transition-all h-8 text-[11px] font-medium ${
                        selectedCategory === cat 
                          ? "bg-green-600 hover:bg-green-700 shadow-md shadow-green-100" 
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-[#fdfcf8] to-transparent pointer-events-none md:hidden" />
            </div>

            {/* Product Grid */}
            <div id="product-grid" className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedCategory === "সব" ? "আমাদের পণ্যসমূহ" : selectedCategory}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} টি পণ্য পাওয়া গেছে
              </p>
            </div>

            <AnimatePresence mode="popLayout">
              {selectedCategory === "সব" && searchQuery === "" ? (
                categoryList.filter(c => c !== "সব").map(cat => {
                  const catProducts = products.filter(p => p.category === cat);
                  if (catProducts.length === 0) return null;
                  return (
                    <div key={cat} className="mb-12">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-8 w-1 bg-green-600 rounded-full" />
                        <h3 className="text-xl font-bold text-green-800">{cat}</h3>
                        <Badge variant="outline" className="ml-2 border-green-200 text-green-600">{catProducts.length}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {catProducts.map((product) => (
                          <ProductCard key={product.id} product={product} addToCart={addToCart} onShare={handleShareProduct} />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} addToCart={addToCart} onShare={handleShareProduct} />
                  ))}
                </div>
              )}
            </AnimatePresence>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 rounded-full bg-gray-100 p-6">
                  <Search size={48} className="text-gray-400" />
                </div>
                <h4 className="text-xl font-medium text-gray-600">দুঃখিত, কোনো পণ্য পাওয়া যায়নি</h4>
                <p className="text-muted-foreground">অন্য কোনো নামে চেষ্টা করে দেখুন</p>
                <Button 
                  variant="link" 
                  className="mt-2 text-green-600"
                  onClick={() => setSearchQuery("")}
                >
                  সব পণ্য দেখুন
                </Button>
              </div>
            )}

            {/* Reviews Section for Customers */}
            {/* Review section removed as per user request */}

            {/* Promo Service Section */}
            {config.showPromoService && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12 overflow-hidden bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-green-900/5 mt-24"
              >
                {config.promoServiceImage && (
                  <div className="h-48 w-full overflow-hidden">
                    <img 
                      src={config.promoServiceImage} 
                      alt="Promo" 
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-2xl font-black text-gray-900 leading-tight">
                        {config.promoServiceTitle || "আমাদের বিশেষ সেবা"}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed max-w-xl">
                        {config.promoServiceDescription || "আমাদের এই সেবাটি উপভোগ করতে নিচের বাটনে ক্লিক করুন।"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">অ্যামাউন্ট</span>
                        <span className="text-xl font-black text-green-700">৳{config.promoServiceDefaultAmount || 0}</span>
                      </div>
                      <Button 
                        onClick={() => {
                          setPromoAmount(String(config.promoServiceDefaultAmount || ""));
                          setShowPromoModal(true);
                        }}
                        className="bg-green-700 hover:bg-green-800 h-10 px-6 rounded-xl font-bold shadow-md shadow-green-100 transition-all hover:-translate-y-0.5 text-white text-xs whitespace-nowrap"
                      >
                        {config.promoServiceButtonText || "অর্ডার করুন"}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {activeTab === "info" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {phoneUser ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveTab("home")}
                    className="text-green-700 hover:bg-green-50 rounded-xl"
                  >
                    <ArrowLeft size={18} className="mr-2" />
                    হোমপেজে ফিরে যান
                  </Button>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-1">
                    {phoneUser.phone}
                  </Badge>
                </div>

                {/* Profile Section */}
                <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[32px]">
                  <div className="h-24 bg-green-700 w-full" />
                  <CardContent className="px-6 pb-6 -mt-12">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative group">
                        <div className="h-24 w-24 rounded-full border-4 border-white bg-gray-100 shadow-lg overflow-hidden flex items-center justify-center">
                          {phoneUser.image ? (
                            <img src={phoneUser.image} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <UserIcon size={40} className="text-gray-400" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 h-8 w-8 bg-green-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-green-700 transition-colors border-2 border-white">
                          <Camera size={16} />
                          <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                        </label>
                      </div>
                      <h3 className="text-xl font-bold mt-4">{phoneUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{phoneUser.phone}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications Section */}
                {visibleNotifications.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h4 className="font-bold flex items-center gap-2">
                      <Bell size={20} className="text-amber-500" />
                      নোটিফিকেশনসমূহ
                    </h4>
                    <div className="space-y-3">
                      {visibleNotifications.map((notif) => (
                        <Card key={notif.id} className="border-none shadow-sm bg-amber-50 rounded-2xl overflow-hidden relative group">
                          <CardContent className="p-4 pr-12">
                            <h5 className="font-bold text-amber-900 text-sm">{notif.title}</h5>
                            <p className="text-xs text-amber-800/80 mt-1">{notif.message}</p>
                            <p className="text-[9px] text-amber-600 mt-2">
                              {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('bn-BD') : "এখনই"}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 text-amber-700 hover:bg-amber-100 rounded-full"
                              onClick={() => hideNotification(notif.id)}
                            >
                              <X size={16} />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Orders Section */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <ListOrdered size={20} className="text-green-600" />
                    আপনার অর্ডারসমূহ
                  </h4>
                  <div className="space-y-4">
                    {orders.filter(o => o.customerPhone === phoneUser.phone).length === 0 ? (
                      <Card className="p-12 text-center bg-white rounded-3xl border border-dashed border-gray-100">
                        <p className="text-gray-400 font-medium">আপনি এখনো কোনো অর্ডার করেননি</p>
                      </Card>
                    ) : (
                      orders
                        .filter(o => o.customerPhone === phoneUser.phone)
                        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
                        .map(order => (
                          <Card key={order.id} className="overflow-hidden border-none shadow-sm bg-white rounded-3xl">
                            <div className={`h-1.5 w-full ${
                              order.status === 'pending' ? 'bg-yellow-400' : 
                              order.status === 'confirmed' ? 'bg-blue-400' : 
                              order.status === 'shipped' ? 'bg-indigo-400' :
                              order.status === 'delivered' ? 'bg-green-400' : 'bg-red-500'
                            }`} />
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <Badge className={
                                    order.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                    order.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                    order.status === 'shipped' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                    order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                  }>
                                    {statusLabels[order.status] || order.status}
                                  </Badge>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    ID: {order.id.slice(-6).toUpperCase()} • {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('bn-BD') : "অজানা"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-green-700">৳{order.totalPrice}</p>
                                  <p className="text-[10px] font-bold text-gray-400">{order.items.length}টি পণ্য</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2 border-t pt-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-xs">
                                    <span className="text-gray-600">{item.name} x {item.quantity}</span>
                                    <span className="font-bold">৳{item.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Payment Info for Customer */}
                              {(order.paymentMethod === 'bKash' || order.paymentMethod === 'Nagad') && order.paymentNumber && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block">পেমেন্ট নম্বর ({order.paymentMethod})</span>
                                    <span className="text-sm font-mono font-bold text-gray-700">{order.paymentNumber}</span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 rounded-lg text-green-600 hover:bg-green-100 gap-1.5"
                                    onClick={() => {
                                      navigator.clipboard.writeText(order.paymentNumber);
                                      setToastMessage("নম্বর কপি করা হয়েছে");
                                      setShowToast(true);
                                    }}
                                  >
                                    <Copy size={14} />
                                    কপি
                                  </Button>
                                </div>
                              )}


                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </div>
                
                {/* Chat/Support Section */}
                <div className="space-y-4 pt-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <MessageSquare size={20} className="text-green-600" />
                    সরাসরি মেসেজ পাঠান
                  </h4>
                  <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
                    <CardContent className="p-4 space-y-4">
                      <div className="max-h-[300px] overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        {messages.filter(m => m.senderPhone === phoneUser.phone).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                            <MessageCircle size={48} className="mb-2" />
                            <p className="text-xs italic">আপনি এখনো কোনো মেসেজ পাঠাননি। সাহায্যের জন্য মেসেজ লিখুন।</p>
                          </div>
                        ) : (
                          messages
                            .filter(m => m.senderPhone === phoneUser.phone)
                            .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
                            .map((m, i) => (
                              <div key={i} className={`flex ${m.type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm relative group ${
                                  m.type === 'admin' 
                                    ? 'bg-white border border-green-100 text-gray-800 rounded-tl-none' 
                                    : 'bg-green-600 text-white rounded-tr-none'
                                }`}>
                                  {m.type === 'admin' && <p className="text-[10px] font-bold mb-1 opacity-70">অ্যাডমিন</p>}
                                  
                                  {m.imageUrl && (
                                    <div className="mb-2 rounded-lg overflow-hidden border border-black/5 bg-black/5">
                                      <img 
                                        src={m.imageUrl} 
                                        alt="Chat Attachment" 
                                        className="max-w-full h-auto object-contain max-h-[200px]" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  )}

                                  {editingChatMessageId === m.id ? (
                                    <div className="space-y-2 py-1">
                                      <Input 
                                        value={editingChatMessageText}
                                        onChange={e => setEditingChatMessageText(e.target.value)}
                                        className="bg-white/20 border-white/30 text-white placeholder:text-white/50 h-8 text-xs"
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-7 text-[10px] bg-white/20 text-white hover:bg-white/30"
                                          onClick={() => {
                                            setEditingChatMessageId(null);
                                            setEditingChatMessageText("");
                                          }}
                                        >বাতিল</Button>
                                        <Button 
                                          size="sm" 
                                          className="h-7 text-[10px] bg-white text-green-700 hover:bg-white/90"
                                          disabled={isUpdatingChatMessage}
                                          onClick={handleUpdateChatMessage}
                                        >
                                          {isUpdatingChatMessage ? "সেভ হচ্ছে..." : "সেভ করুন"}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                                  )}

                                  {/* Delete/Edit actions for customer messages - Moved below text */}
                                  {m.type === 'customer' && !editingChatMessageId && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                                      <button 
                                        onClick={() => {
                                          setEditingChatMessageId(m.id);
                                          setEditingChatMessageText(m.message);
                                        }}
                                        className="text-[10px] flex items-center gap-1 text-white/90 hover:text-white underline decoration-white/30 underline-offset-2"
                                      >
                                        <Edit size={10} /> এডিট
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteMessage(m.id, 'everyone')}
                                        className="text-[10px] flex items-center gap-1 text-red-100 hover:text-red-200 underline decoration-red-300/50 underline-offset-2"
                                      >
                                        <Trash2 size={10} /> মুছুন
                                      </button>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                                    {m.updatedAt && <span className="text-[8px] font-bold">(এডিট করা)</span>}
                                    <p className="text-[9px] text-right">
                                      {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'}) : "এখনই"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <label className="h-12 w-12 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow-inner shrink-0">
                          <Camera size={20} />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleChatImageUpload(e)} 
                          />
                        </label>
                        <Input 
                          placeholder="আপনার সমস্যা বা প্রশ্ন লিখুন..." 
                          value={supportMessage}
                          onChange={e => setSupportMessage(e.target.value)}
                          className="bg-gray-50 border-none rounded-xl focus-visible:ring-green-500 h-12"
                          onKeyDown={(e) => e.key === 'Enter' && handleSendSupportMessage()}
                        />
                        <Button 
                          onClick={() => handleSendSupportMessage()} 
                          disabled={isSendingMessage || (!supportMessage.trim() && !isSendingMessage)}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-xl w-12 h-12 shrink-0 p-0"
                        >
                          <Send size={20} />
                        </Button>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Card className="p-12 shadow-sm border-none bg-white rounded-3xl w-full max-w-md">
                   <UserIcon size={64} className="mx-auto mb-6 text-gray-200" />
                   <h3 className="text-2xl font-black text-gray-800 mb-2">প্রোফাইল দেখতে লগইন করুন</h3>
                   <p className="text-sm text-muted-foreground mb-8">আপনার অর্ডার ইতিহাস এবং প্রোফাইল তথ্য পেতে লগইন করা প্রয়োজন।</p>
                   <Button 
                     onClick={() => setShowPhoneLogin(true)} 
                     className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-14 rounded-2xl"
                   >
                     লগইন করুন
                   </Button>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "admin" && (
          <div className="max-w-5xl mx-auto space-y-8">
            {(isAdmin || isAdminUnlocked) ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-gray-800">অ্যাডমিন কন্ট্রোল</h2>
                    <p className="text-sm text-muted-foreground font-medium">ওয়াসিম স্টোর ম্যানেজমেন্ট</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex flex-col items-end mr-2">
                      <p className="text-xs font-bold text-gray-800">{user?.displayName || "Admin"}</p>
                      <p className="text-[10px] text-gray-500">{user?.email || "Unlocked via Password"}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAdminLogout} className="rounded-full h-10 px-4 gap-2 border-red-100 text-red-600 hover:bg-red-50">
                      <LogOut size={16} /> বের হয়ে যান
                    </Button>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-[28px] shadow-sm border border-gray-100 flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <Button 
                variant={adminSubTab === "supports" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("supports")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "supports" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <MessageSquare size={18} className="mr-2" /> সাপোর্ট
              </Button>
              <Button 
                variant={adminSubTab === "orders" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("orders")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "orders" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <ListOrdered size={18} className="mr-2" /> অনলাইন অর্ডার
              </Button>
              <Button 
                variant={adminSubTab === "dashboard" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("dashboard")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "dashboard" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <TrendingUp size={18} className="mr-2" /> সারসংক্ষেপ
              </Button>
              <Button 
                variant={adminSubTab === "pos" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("pos")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "pos" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <Store size={18} className="mr-2" /> দোকান বিক্রয় (POS)
              </Button>
              <Button 
                variant={adminSubTab === "expenses" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("expenses")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "expenses" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <Wallet size={18} className="mr-2" /> আয়-ব্যয় (Accounts)
              </Button>
              <Button 
                variant={adminSubTab === "staff" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("staff")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "staff" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <Users size={18} className="mr-2" /> কর্মী ও রাইডার
              </Button>
              <Button 
                variant={adminSubTab === "products" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("products")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "products" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <Package size={18} className="mr-2" /> প্রোডাক্ট
              </Button>
              <Button 
                variant={adminSubTab === "users" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("users")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "users" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <UserIcon size={18} className="mr-2" /> কাস্টমার
              </Button>
              <Button 
                variant={adminSubTab === "settings" ? "default" : "ghost"} 
                onClick={() => setAdminSubTab("settings")}
                className={`rounded-2xl px-6 h-12 font-bold transition-all ${adminSubTab === "settings" ? "bg-green-700 text-white shadow-lg shadow-green-100" : "text-gray-500 hover:bg-green-50 hover:text-green-700"}`}
              >
                <Settings size={18} className="mr-2" /> সেটিংস
              </Button>

            </div>

            {adminSubTab === "dashboard" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-green-700" /> ব্যবসায়িক সারসংক্ষেপ
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAdminSubTab("supports")}
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 rounded-full flex items-center gap-2 font-bold"
                    >
                      <MessageSquare size={16} /> সাপোর্ট
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAdminSubTab("orders")}
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 rounded-full flex items-center gap-2 font-bold"
                    >
                      <ListOrdered size={16} /> অনলাইন অর্ডার
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Total Sales */}
                  <Card className="bg-green-50 border-green-100 shadow-sm flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-4 lowercase">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white shrink-0">
                          <ShoppingBag size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-green-700 leading-tight">পণ্য বিক্রি (Total)</p>
                          <p className="text-xl font-black text-green-900">৳{salesSummary.total}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-green-100">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-gray-500">আজকের বিক্রি</p>
                          <p className="text-sm font-black text-green-700">৳{salesSummary.totalToday}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-bold text-gray-500">এই মাসের বিক্রি</p>
                          <p className="text-sm font-black text-green-700">৳{salesSummary.totalMonthly}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 pt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearOrders}
                        className="w-full text-[10px] h-7 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg border border-red-100"
                      >
                        <Trash2 size={12} className="mr-1" /> ইতিহাস মুছুন
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Withdrawal Summary */}
                  <Card className="bg-orange-50 border-orange-100 shadow-sm flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center text-white shrink-0">
                          <ArrowDownLeft size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-orange-700 leading-tight">কাস্টমার উত্তোলন</p>
                          <p className="text-xl font-black text-orange-900">৳{salesSummary.withdrawalTotal}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-orange-100">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-gray-500">আজকের উত্তোলন</p>
                          <p className="text-sm font-black text-orange-700">৳{salesSummary.withdrawalToday}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-bold text-gray-500">এই মাসের উত্তোলন</p>
                          <p className="text-sm font-black text-orange-700">৳{salesSummary.withdrawalMonthly}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Profit */}
                  <Card className="bg-indigo-50 border-indigo-100 shadow-sm flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-indigo-700 leading-tight">আজকের লাভ</p>
                          <p className="text-xl font-black text-indigo-900">৳{salesSummary.todayProfit}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-indigo-100 flex justify-between items-center">
                        <p className="text-[10px] uppercase font-bold text-gray-500">এই মাসের লাভ</p>
                        <p className="text-sm font-black text-indigo-700">৳{salesSummary.monthProfit}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Expenses */}
                  <Card className="bg-red-50 border-red-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-red-700 leading-tight">মোট ব্যয়</p>
                        <p className="text-xl font-black text-red-900">৳{salesSummary.totalExpenses}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Damaged Goods */}
                  <Card className="bg-rose-50 border-rose-100 shadow-sm flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="h-10 w-10 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                          <PackageSearch size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-rose-700 leading-tight">নষ্ট/খারাপ পণ্য</p>
                          <p className="text-xl font-black text-rose-900">৳{salesSummary.damagedValue}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-rose-100 flex justify-between items-center">
                        <p className="text-[10px] uppercase font-bold text-gray-500">মোট পরিমাণ</p>
                        <p className="text-sm font-black text-rose-700">{salesSummary.damagedCountTotal} টি</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Staff Count */}
                  <Card className="bg-orange-50 border-orange-100 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center text-white">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-orange-700 leading-tight">কর্মী / রাইডার</p>
                        <p className="text-xl font-black text-orange-900">{staff.length} জন</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cash Sales - RESTORED */}
                  <Card className="bg-amber-50 border-amber-100 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center text-white">
                        <Store size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-700 leading-tight">নগদ বিক্রি (Cash)</p>
                        <p className="text-xl font-black text-amber-900">৳{salesSummary.cash}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Online Sales - RESTORED */}
                  <Card className="bg-blue-50 border-blue-100 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-700 leading-tight">অনলাইন বিক্রি (Total)</p>
                        <p className="text-xl font-black text-blue-900">৳{salesSummary.online}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 pt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleClearOnlineOrders}
                        className="w-full text-[10px] h-7 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg border border-red-100"
                      >
                        <Trash2 size={12} className="mr-1" /> তথ্য মুছুন
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Investment */}
                  <Card className="bg-purple-50 border-purple-100 shadow-sm flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white">
                        <PiggyBank size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase font-bold text-purple-700 leading-tight">ইন্ভেস্টমেন্ট (পুঁজি)</p>
                          <div className="flex items-center gap-0.5">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-purple-600 rounded-full" onClick={() => setAdminSubTab('settings')}><Edit size={12} /></Button>
                          </div>
                        </div>
                        <p className="text-xl font-black text-purple-900 leading-none mt-1">৳{salesSummary.totalInvestment}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 pt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleResetInvestment}
                        className="w-full text-[10px] h-7 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg border border-red-100"
                      >
                        <Trash2 size={12} className="mr-1" /> তথ্য মুছুন
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Stock Value */}
                  <Card className="bg-cyan-50 border-cyan-100 shadow-sm flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-cyan-600 flex items-center justify-center text-white">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-cyan-700 leading-tight">স্টক মাল (বাকি মাল)</p>
                        <p className="text-xl font-black text-cyan-900">৳{salesSummary.currentStockValue}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 pt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleResetStock}
                        className="w-full text-[10px] h-7 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg border border-red-100"
                      >
                        <Trash2 size={12} className="mr-1" /> তথ্য মুছুন
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="font-black text-lg text-gray-800 border-l-4 border-blue-600 pl-3">অনলাইন পেমেন্ট হিস্টোরি (মার্কেট পেমেন্ট)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* bKash */}
                    <Card className="bg-white border-pink-100 shadow-sm border-t-4 border-t-pink-600 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-bold text-pink-700 uppercase">বিকাশ (bKash)</p>
                            <p className="text-2xl font-black text-pink-900 leading-none mt-1">৳{salesSummary.bkashTotal}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                              <Wallet size={20} />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleClearWalletOrders('bKash')}
                              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-pink-50">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">আজকের</p>
                            <p className="text-sm font-black text-pink-700">৳{salesSummary.bkashToday}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">এই মাসের</p>
                            <p className="text-sm font-black text-pink-700">৳{salesSummary.bkashMonthly}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Nagad */}
                    <Card className="bg-white border-orange-100 shadow-sm border-t-4 border-t-orange-600 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-bold text-orange-700 uppercase">নগদ (Nagad)</p>
                            <p className="text-2xl font-black text-orange-900 leading-none mt-1">৳{salesSummary.nagadTotal}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                              <Wallet size={20} />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleClearWalletOrders('Nagad')}
                              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-orange-50">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">আজকের</p>
                            <p className="text-sm font-black text-orange-700">৳{salesSummary.nagadToday}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">এই মাসের</p>
                            <p className="text-sm font-black text-orange-700">৳{salesSummary.nagadMonthly}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bank Transfer */}
                    <Card className="bg-white border-blue-100 shadow-sm border-t-4 border-t-blue-600 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-bold text-blue-700 uppercase">ব্যাংক (Bank/Other)</p>
                            <p className="text-2xl font-black text-blue-900 leading-none mt-1">৳{salesSummary.bankTotal}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                              <Home size={20} />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleClearWalletOrders('Bank Transfer')}
                              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-blue-50">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">আজকের</p>
                            <p className="text-sm font-black text-blue-700">৳{salesSummary.bankToday}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">এই মাসের</p>
                            <p className="text-sm font-black text-blue-700">৳{salesSummary.bankMonthly}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rocket */}
                    <Card className="bg-white border-purple-100 shadow-sm border-t-4 border-t-purple-600 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs font-bold text-purple-700 uppercase">রকেট (Rocket)</p>
                            <p className="text-2xl font-black text-purple-900 leading-none mt-1">৳{salesSummary.rocketTotal}</p>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                              <Wallet size={20} />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleClearWalletOrders('Rocket')}
                              className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-purple-50">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">আজকের</p>
                            <p className="text-sm font-black text-purple-700">৳{salesSummary.rocketToday}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">এই মাসের</p>
                            <p className="text-sm font-black text-purple-700">৳{salesSummary.rocketMonthly}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Subtabs follow... */}

            {adminSubTab === "pos" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Product Selection */}
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden h-[650px] flex flex-col">
                    <CardHeader className="bg-green-700 text-white p-6 shrink-0 space-y-4">
                      <CardTitle className="text-xl font-black flex items-center gap-2">
                        <Package size={24} />
                        পণ্য নির্বাচন করুন
                      </CardTitle>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-green-200" size={18} />
                        <Input 
                          placeholder="পণ্য খুঁজুন..." 
                          className="pl-10 bg-green-800/50 border-green-600 text-white placeholder:text-green-300 focus:ring-green-400"
                          value={shopSearchQuery}
                          onChange={e => setShopSearchQuery(e.target.value)}
                        />
                      </div>
                      {/* POS Category Filter */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <Button 
                          size="sm"
                          variant={shopSelectedCategory === "সব" ? "secondary" : "ghost"}
                          onClick={() => setShopSelectedCategory("সব")}
                          className={`rounded-full px-4 h-8 text-[10px] uppercase font-bold shrink-0 ${shopSelectedCategory === "সব" ? "bg-white text-green-700" : "text-green-100 hover:bg-green-600"}`}
                        >সব ক্যাটালগ</Button>
                        {categories.map(cat => (
                          <Button 
                            key={cat.id}
                            size="sm"
                            variant={shopSelectedCategory === cat.name ? "secondary" : "ghost"}
                            onClick={() => setShopSelectedCategory(cat.name)}
                            className={`rounded-full px-4 h-8 text-[10px] uppercase font-bold shrink-0 ${shopSelectedCategory === cat.name ? "bg-white text-green-700" : "text-green-100 hover:bg-green-600"}`}
                          >{cat.name}</Button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto flex-1">
                      <div className="divide-y divide-gray-100">
                        {products
                          .filter(p => !p.isArchived)
                          .filter(p => p.name.toLowerCase().includes(shopSearchQuery.toLowerCase()))
                          .filter(p => shopSelectedCategory === "সব" || p.category === shopSelectedCategory)
                          .map(product => {
                            const isOutOfStock = product.inStock === false || (product.stockQuantity || 0) <= 0;
                            return (
                              <div 
                                key={product.id} 
                                className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group rounded-2xl mx-1 my-0.5 ${isOutOfStock ? 'bg-gray-50/50' : ''}`}
                                onClick={() => {
                                  if (isOutOfStock) {
                                    setToastMessage("দুঃখিত, এই পণ্যটি স্টকে নেই!");
                                    setShowToast(true);
                                    return;
                                  }
                                  const existing = shopCart.find(item => item.id === product.id);
                                  if (existing) {
                                    setShopCart(shopCart.map(item => 
                                      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                                    ));
                                  } else {
                                    setShopCart([...shopCart, { ...product, quantity: 1 } as CartItem]);
                                  }
                                  // Visual feedback
                                  setToastMessage(`${product.name} তালিকায় যোগ হয়েছে`);
                                  setShowToast(true);
                                }}
                              >
                                <motion.div 
                                  className={`flex items-center justify-between w-full transition-all duration-300 ${isOutOfStock ? 'opacity-30 blur-[4px] grayscale' : ''}`}
                                  whileTap={isOutOfStock ? {} : { scale: 0.98 }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-100 shrink-0">
                                      <img src={product.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-800 text-sm leading-tight">{product.name}</p>
                                      <p className="text-[11px] text-muted-foreground">
                                        স্টক: <span className={(product.stockQuantity !== undefined && product.stockQuantity < 5) ? "text-red-500 font-bold" : ""}>
                                          {product.stockQuantity || 0}
                                        </span> {product.unit}
                                        {isOutOfStock && <span className="ml-2 text-red-600 font-bold">(স্টক নেই)</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="font-black text-green-700">৳{product.price}</p>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isOutOfStock ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white'}`}>
                                      {isOutOfStock ? <X size={16} /> : <Plus size={18} />}
                                    </div>
                                  </div>
                                </motion.div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Shop Cart */}
                  <Card className="border-none shadow-sm rounded-3xl overflow-hidden flex flex-col h-[650px]">
                    <CardHeader className="bg-gray-900 text-white p-6 shrink-0">
                      <CardTitle className="text-xl font-black flex items-center gap-2">
                        <ShoppingBasket size={24} />
                        বিক্রয় তালিকা
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-y-auto flex-1 bg-gray-50/50">
                      {shopCart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                          <ShoppingBag size={64} className="mb-4" />
                          <p className="font-bold">তালিকা খালি</p>
                          <p className="text-xs italic">বাম পাশের ক্যাটালগ থেকে পণ্য যোগ করুন</p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-3">
                          {shopCart.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                                  {idx + 1}
                                </div>
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                                  <p className="text-[11px] text-muted-foreground">৳{item.price} x {item.quantity}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                  <button 
                                    className="h-7 w-7 flex items-center justify-center hover:bg-white rounded-md text-gray-600 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.quantity > 1) {
                                        setShopCart(shopCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i));
                                      } else {
                                        setShopCart(shopCart.filter(i => i.id !== item.id));
                                      }
                                    }}
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                  <button 
                                    className="h-7 w-7 flex items-center justify-center hover:bg-white rounded-md text-gray-600 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShopCart(shopCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
                                    }}
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                <button 
                                  onClick={() => setShopCart(shopCart.filter(i => i.id !== item.id))}
                                  className="h-8 w-8 flex items-center justify-center text-red-100 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-gray-100 p-6 flex flex-col gap-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-gray-700">
                        <span className="font-bold">মোট পরিমাণ:</span>
                        <span className="text-xl font-black">৳{shopCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">ক্রেতার নাম</label>
                            <Input 
                              value={shopCustomerName}
                              onChange={e => setShopCustomerName(e.target.value)}
                              placeholder="নাম"
                              className="h-10 rounded-xl bg-white border-gray-100 text-xs shadow-inner"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">ফোন নাম্বার</label>
                            <Input 
                              value={shopCustomerPhone}
                              onChange={e => setShopCustomerPhone(e.target.value)}
                              placeholder="মোবাইল"
                              className="h-10 rounded-xl bg-white border-gray-100 text-xs shadow-inner"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">ঠিকানা (ঐচ্ছিক)</label>
                            <Input 
                              value={shopCustomerAddress}
                              onChange={e => setShopCustomerAddress(e.target.value)}
                              placeholder="ঠিকানা"
                              className="h-10 rounded-xl bg-white border-gray-100 text-xs shadow-inner"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                              ডেলিভারি চার্জ
                              {config.enableAutoDeliveryCharge && (
                                <span className="bg-amber-100 text-amber-600 text-[8px] px-1 rounded">অটো</span>
                              )}
                            </label>
                            <Input 
                              type="number"
                              value={shopDeliveryCharge}
                              onChange={e => setShopDeliveryCharge(Number(e.target.value))}
                              placeholder="চার্জ"
                              className={`h-10 rounded-xl text-xs shadow-inner ${config.enableAutoDeliveryCharge ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}
                            />
                          </div>
                        </div>

                        <label className="text-[10px] uppercase font-bold text-gray-500 mt-2">পেমেন্ট মেথড</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant={shopPaymentMethod === "Cash" ? "default" : "outline"}
                            className={`h-11 rounded-xl font-bold ${shopPaymentMethod === "Cash" ? "bg-green-600 hover:bg-green-700" : ""}`}
                            onClick={() => setShopPaymentMethod("Cash")}
                          >ক্যাশ (নগদ)</Button>
                          <Button 
                            variant={(shopPaymentMethod === "bKash" || shopPaymentMethod === "Nagad" || shopPaymentMethod === "Rocket" || shopPaymentMethod === "Bank Transfer" || shopPaymentMethod === "Online") ? "default" : "outline"}
                            className={`h-11 rounded-xl font-bold ${(shopPaymentMethod === "bKash" || shopPaymentMethod === "Nagad" || shopPaymentMethod === "Rocket" || shopPaymentMethod === "Bank Transfer" || shopPaymentMethod === "Online") ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                            onClick={() => setShopPaymentMethod("Online")}
                          >অনলাইন</Button>
                        </div>
                        
                        {(shopPaymentMethod === "Online" || shopPaymentMethod === "bKash" || shopPaymentMethod === "Nagad" || shopPaymentMethod === "Rocket" || shopPaymentMethod === "Bank Transfer") && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="grid grid-cols-3 gap-2 mt-1"
                          >
                            <Button 
                              variant={shopPaymentMethod === "bKash" ? "default" : "outline"}
                              className={`h-9 px-1 rounded-xl text-[10px] font-bold ${shopPaymentMethod === "bKash" ? "bg-pink-600 hover:bg-pink-700" : "border-pink-200 text-pink-700 hover:bg-pink-50"}`}
                              onClick={() => setShopPaymentMethod("bKash")}
                            >বিকাশ</Button>
                            <Button 
                              variant={shopPaymentMethod === "Nagad" ? "default" : "outline"}
                              className={`h-9 px-1 rounded-xl text-[10px] font-bold ${shopPaymentMethod === "Nagad" ? "bg-orange-600 hover:bg-orange-700" : "border-orange-200 text-orange-700 hover:bg-orange-50"}`}
                              onClick={() => setShopPaymentMethod("Nagad")}
                            >নগদ</Button>
                            <Button 
                              variant={shopPaymentMethod === "Rocket" ? "default" : "outline"}
                              className={`h-9 px-1 rounded-xl text-[10px] font-bold ${shopPaymentMethod === "Rocket" ? "bg-purple-600 hover:bg-purple-700" : "border-purple-200 text-purple-700 hover:bg-purple-50"}`}
                              onClick={() => setShopPaymentMethod("Rocket")}
                            >রকেট</Button>
                            <Button 
                              variant={shopPaymentMethod === "Bank Transfer" ? "default" : "outline"}
                              className={`h-9 px-1 rounded-xl text-[10px] font-bold ${shopPaymentMethod === "Bank Transfer" ? "bg-blue-800 hover:bg-blue-900" : "border-blue-200 text-blue-800 hover:bg-blue-50"}`}
                              onClick={() => setShopPaymentMethod("Bank Transfer")}
                            >ব্যাংক</Button>
                          </motion.div>
                        )}
                      </div>
                      <Button 
                        className="w-full h-14 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-black text-lg shadow-lg shadow-green-100"
                        disabled={shopCart.length === 0}
                        onClick={handleShopSale}
                      >
                        <CheckCircle size={20} className="mr-2" /> বিক্রয় নিশ্চিত করুন
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Shop Sale History */}
                <div className="mt-8 space-y-4">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <History size={20} className="text-blue-600" />
                    দোকান বিক্রির হিস্ট্রি (আজকের)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders
                      .filter(o => o.isShopSale && o.status !== 'cancelled')
                      .filter(o => {
                        const now = new Date();
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                        return oDate >= todayStart;
                      })
                      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
                      .map(sale => (
                        <Card key={sale.id} className="bg-white border-none shadow-sm rounded-2xl overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400">অর্ডার আইডি: #{sale.id.slice(-6).toUpperCase()}</p>
                                <p className="text-xs font-bold text-gray-500">{sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleTimeString('bn-BD') : ""}</p>
                              </div>
                              <Badge className="bg-green-50 text-green-700 border-green-100">৳{sale.totalPrice}</Badge>
                            </div>
                            <div className="text-xs text-gray-600 mb-3 line-clamp-1 italic">
                              {sale.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 h-9 rounded-xl font-bold bg-purple-50 text-purple-700 border-purple-100"
                                onClick={() => {
                                  setPrintableOrder(sale);
                                  setShowPrintMemo(true);
                                }}
                              >
                                <Printer size={14} className="mr-2" />
                                প্রিন্ট মেমো
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-9 w-9 rounded-xl border-red-100 text-red-500 hover:bg-red-50"
                                onClick={() => handleUpdateOrderStatus(sale.id, 'cancelled')}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    {orders.filter(o => o.isShopSale && o.status !== 'cancelled').length === 0 && (
                      <div className="col-span-full py-12 text-center text-gray-400 font-bold bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100">
                        আজকের কোনো দোকান বিক্রি নেই
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === "orders" && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                      <h3 className="text-xl font-bold">অর্ডার ম্যানেজমেন্ট</h3>
                      <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-hide">
                        <button 
                          onClick={() => setOrderFilter("pending")}
                          className={`px-4 py-2 rounded-lg text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${orderFilter === 'pending' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          পেন্ডিং ({orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})
                        </button>
                        <button 
                          onClick={() => setOrderFilter("delivered")}
                          className={`px-4 py-2 rounded-lg text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${orderFilter === 'delivered' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          ডেলিভারি সম্পন্ন ({orders.filter(o => o.status === 'delivered').length})
                        </button>
                        <button 
                          onClick={() => setOrderFilter("cancelled")}
                          className={`px-4 py-2 rounded-lg text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${orderFilter === 'cancelled' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          বাতিলকৃত ({orders.filter(o => o.status === 'cancelled').length})
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {orders
                        .filter(order => {
                          if (orderFilter === 'delivered') return order.status === 'delivered';
                          if (orderFilter === 'cancelled') return order.status === 'cancelled';
                          return order.status !== 'delivered' && order.status !== 'cancelled';
                        })
                        .map(order => (
                        <Card key={order.id} className="overflow-hidden">
                          <div className={`h-2 w-full ${
                            order.status === 'pending' ? 'bg-yellow-400' : 
                            order.status === 'confirmed' ? 'bg-blue-400' : 
                            order.status === 'shipped' ? 'bg-indigo-400' :
                            order.status === 'delivered' ? 'bg-green-400' : 'bg-red-500'
                          }`} />
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={order.status === 'cancelled' ? 'destructive' : 'outline'}>
                                    {statusLabels[order.status] || order.status.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('bn-BD') : "অজানা তারিখ"}</span>
                                </div>
                                <h4 className="font-bold text-lg">{order.customerName}</h4>
                                <p className="text-sm">ফোন: {order.customerPhone}</p>
                                <p className="text-sm">ঠিকানা: {order.customerAddress}</p>
                                <p className="text-sm font-bold">পেমেন্ট: {order.paymentMethod}</p>
                                {order.paymentNumber && (
                                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">পেমেন্ট নম্বর: {order.paymentNumber}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 text-gray-400 hover:text-green-600"
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.paymentNumber);
                                        setToastMessage("নম্বর কপি করা হয়েছে");
                                        setShowToast(true);
                                      }}
                                    >
                                      <Copy size={12} />
                                    </Button>
                                  </div>
                                )}
                                {order.status === 'cancelled' && order.cancellationReason && (
                                  <div className="p-2 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-[10px] text-red-700 font-bold uppercase mb-1">বাতিলের কারণ:</p>
                                    <p className="text-xs text-red-600 italic">{order.cancellationReason}</p>
                                  </div>
                                )}
                                {order.location && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="mt-2 border-green-200 text-green-700 font-bold"
                                    onClick={() => window.open(`https://www.google.com/maps?q=${order.location?.lat},${order.location?.lng}`, '_blank')}
                                  >
                                    <MapPin size={14} className="mr-2" />
                                    লোকেশন দেখুন
                                  </Button>
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-bold text-sm mb-2">পণ্যসমূহ:</h5>
                                <ul className="text-sm space-y-1">
                                  {order.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-1">
                                      <div className="flex items-center gap-2">
                                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                          <button 
                                            className="h-6 w-6 flex items-center justify-center text-red-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                                            onClick={() => handleRemoveOrderItem(order.id, idx)}
                                          >
                                            <X size={14} />
                                          </button>
                                        )}
                                        <span>{item.name} x {item.quantity}</span>
                                      </div>
                                      <span className="font-bold">৳{item.price * item.quantity}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-4 flex justify-between items-center p-3 bg-green-50 rounded-xl">
                                  <span className="font-bold text-green-800">সর্বমোট:</span>
                                  <span className="font-black text-lg text-green-700">৳{order.totalPrice}</span>
                                </div>
                                <div className="mt-4 space-y-2">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">রাইডার নিয়োগ করুন</label>
                                  <select 
                                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold"
                                    value={order.riderId || ""}
                                    onChange={(e) => handleAssignRider(order.id, e.target.value)}
                                  >
                                    <option value="">কোন রাইডার নেই</option>
                                    {staff.filter(s => s.role === "Rider").map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[150px]">
                                {order.status !== 'cancelled' && (
                                  <>
                                    {order.status !== 'delivered' && (
                                      <>
                                        <Button size="sm" variant="outline" className="h-10 font-bold" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>অর্ডার কনফার্ম</Button>
                                        <Button size="sm" variant="outline" className="h-10 font-bold bg-blue-50 text-blue-700 border-blue-100" onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}>ডেলিভারি পথিমধ্যে</Button>
                                        <Button size="sm" variant="outline" className="h-10 font-bold bg-green-50 text-green-700 border-green-100" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>ডেলিভারি সম্পন্ন</Button>
                                        <Button size="sm" variant="outline" className="h-10 font-bold bg-amber-50 text-amber-700 border-amber-100" onClick={() => handleShareWithRider(order)}>
                                          <Share2 size={16} className="mr-2" />
                                          রাইডারকে পাঠান
                                        </Button>
                                      </>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-10 font-bold bg-purple-50 text-purple-700 border-purple-100" 
                                      onClick={() => {
                                        setPrintableOrder(order);
                                        setShowPrintMemo(true);
                                      }}
                                    >
                                      <Printer size={16} className="mr-2" />
                                      ক্যাশ মেমো প্রিন্ট
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="h-10 font-bold bg-green-600 hover:bg-green-700 text-white" 
                                      onClick={() => {
                                        const text = `🛒 *অর্ডার রিসিট - ${config.storeName}*\n\n` +
                                          `অর্ডার আইডি: #${order.id.slice(-6).toUpperCase()}\n` +
                                          `কাস্টমার: ${order.customerName}\n` +
                                          `ফোন: ${order.customerPhone}\n` +
                                          `ঠিকানা: ${order.customerAddress}\n\n` +
                                          `*পণ্যসমূহ:*\n` +
                                          order.items.map(i => `- ${i.name} x ${i.quantity} = ৳${i.price * i.quantity}`).join('\n') +
                                          `\n\nসাব-টোটাল: ৳${order.subtotal || order.totalPrice - (order.paymentFee || 0)}\n` +
                                          (order.paymentFee ? `পেমেন্ট চার্জ: ৳${order.paymentFee}\n` : "") +
                                          (order.deliveryCharge ? `ডেলিভারি চার্জ: ৳${order.deliveryCharge}\n` : "") +
                                          `*সর্বমোট: ৳${order.totalPrice}*\n` +
                                          `পেমেন্ট: ${order.paymentMethod}\n\n` +
                                          `ধন্যবাদ!`;
                                        window.open(`https://wa.me/${order.customerPhone}?text=${encodeURIComponent(text)}`);
                                      }}
                                    >
                                      <Share2 size={16} className="mr-2" />
                                      হোয়াটসঅ্যাপ শেয়ার
                                    </Button>
                                    {order.status !== 'delivered' && (
                                      <Button size="sm" variant="outline" className="h-10 font-bold text-red-500 border-red-100" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>অর্ডার বাতিল</Button>
                                    )}
                                  </>
                                )}
                                {(order.status === 'delivered' || order.status === 'cancelled') && (
                                  <Button size="sm" variant="destructive" className="h-10 font-bold" onClick={() => handleDeleteOrder(order.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    ডিলিট করুন
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {adminSubTab === "expenses" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>নতুন ব্যয় যোগ করুন</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <label className="text-xs font-bold text-muted-foreground uppercase">লেনদেনের ধরণ</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant={newExpense.category === "Salary" ? "default" : "outline"}
                              onClick={() => setNewExpense({...newExpense, category: "Salary"})}
                              className={`h-12 rounded-xl font-bold flex flex-col gap-0.5 ${newExpense.category === "Salary" ? "bg-red-600" : ""}`}
                            >
                              <Wallet size={16} />
                              <span className="text-[10px]">বেতন</span>
                            </Button>
                            <Button 
                              variant={newExpense.category === "Take" ? "default" : "outline"}
                              onClick={() => setNewExpense({...newExpense, category: "Take"})}
                              className={`h-12 rounded-xl font-bold flex flex-col gap-0.5 ${newExpense.category === "Take" ? "bg-amber-600" : ""}`}
                            >
                              <ArrowUpRight size={16} />
                              <span className="text-[10px]">টাকা নিয়েছে/লোন</span>
                            </Button>
                            <Button 
                              variant={newExpense.category === "Return" ? "default" : "outline"}
                              onClick={() => setNewExpense({...newExpense, category: "Return"})}
                              className={`h-12 rounded-xl font-bold flex flex-col gap-0.5 ${newExpense.category === "Return" ? "bg-green-600" : ""}`}
                            >
                              <ArrowDownLeft size={16} />
                              <span className="text-[10px]">টাকা ফেরত</span>
                            </Button>
                            <Button 
                              variant={newExpense.category === "Advance" ? "default" : "outline"}
                              onClick={() => setNewExpense({...newExpense, category: "Advance"})}
                              className={`h-12 rounded-xl font-bold flex flex-col gap-0.5 ${newExpense.category === "Advance" ? "bg-blue-600" : ""}`}
                            >
                              <Plus size={16} />
                              <span className="text-[10px]">অ্যাডভান্স/জমা</span>
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">পরিমাণ (৳)</label>
                          <Input 
                            type="number" 
                            placeholder="টাকার পরিমাণ" 
                            value={newExpense.amount || ""} 
                            onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">কর্মী / রাইডার (ঐচ্ছিক)</label>
                          <select 
                            className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                            value={newExpense.staffId}
                            onChange={e => setNewExpense({...newExpense, staffId: e.target.value})}
                          >
                            <option value="">কারো নাম নেই</option>
                            {staff.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.role === "Worker" ? "শ্রমিক" : "রাইডার"})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">বিস্তারিত / নোট (ঐচ্ছিক)</label>
                          <Input 
                            placeholder="বিস্তারিত লিখুন" 
                            value={newExpense.note || ""} 
                            onChange={e => setNewExpense({...newExpense, note: e.target.value})} 
                          />
                        </div>
                        <Button onClick={handleAddExpense} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl">ব্যয় যোগ করুন</Button>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <div className="p-6 bg-red-50 rounded-3xl border border-red-100 shadow-sm relative flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-red-700 uppercase">সর্বমোট ব্যয়</p>
                            <p className="text-3xl font-black text-red-900 leading-tight">৳{salesSummary.totalExpenses}</p>
                          </div>
                          <div className="h-14 w-14 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg">
                            <Wallet size={28} />
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleClearExpenses}
                          className="w-full text-xs h-9 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded-xl border-red-200"
                        >
                          <Trash2 size={14} className="mr-2" /> সব ব্যয়ের ইতিহাস মুছুন
                        </Button>
                      </div>

                        <div className="grid gap-3">
                          <div className="flex bg-gray-100 p-1 rounded-xl mb-2 overflow-x-auto">
                            <button 
                              onClick={() => setExpenseFilter("all_expenses")} 
                              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${expenseFilter === 'all_expenses' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                            >সব ব্যয়</button>
                            {staff.map(s => (
                              <button 
                                key={s.id}
                                onClick={() => setExpenseFilter(`staff_${s.id}`)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${expenseFilter === `staff_${s.id}` ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}
                              >{s.name}</button>
                            ))}
                          </div>

                          {expenseFilter.startsWith('staff_') && (() => {
                            const sId = expenseFilter.replace('staff_', '');
                            const sExpenses = expenses.filter(e => e.staffId === sId);
                            const debit = sExpenses.filter(e => e.category === "Salary" || e.category === "Take").reduce((sum, e) => sum + (e.amount || 0), 0);
                            const credit = sExpenses.filter(e => e.category === "Return" || e.category === "Advance").reduce((sum, e) => sum + (e.amount || 0), 0);
                            const balance = debit - credit;
                            const staffName = staff.find(s => s.id === sId)?.name || "কর্মীর";
                            
                            return (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-5 rounded-3xl border border-blue-100 shadow-sm mb-4 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-black text-blue-900 text-sm">{staffName} এর হিসাব</h4>
                                  <Badge className={balance >= 0 ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-green-100 text-green-900 border-green-200"}>
                                    {balance >= 0 ? "দোকানদার পাওনা" : "কর্মী পাওনা"}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-center">
                                  <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                                    <p className="text-[9px] font-bold text-red-700 uppercase leading-none mb-1">দোকান থেকে নিয়েছে</p>
                                    <p className="text-xl font-black text-red-900 leading-none">৳{debit}</p>
                                  </div>
                                  <div className="p-3 bg-green-50 rounded-2xl border border-green-100">
                                    <p className="text-[9px] font-bold text-green-700 uppercase leading-none mb-1">দোকানকে দিয়েছে</p>
                                    <p className="text-xl font-black text-green-900 leading-none">৳{credit}</p>
                                  </div>
                                </div>
                                <div className={`p-4 rounded-2xl text-center border ${balance >= 0 ? "bg-amber-50 border-amber-200 shadow-[0_4px_12px_rgba(245,158,11,0.1)]" : "bg-blue-50 border-blue-200 shadow-[0_4px_12px_rgba(59,130,246,0.1)]"}`}>
                                  <p className="text-[10px] font-bold uppercase mb-1 opacity-70">নিট বকেয়া স্থিতি</p>
                                  <p className={`text-2xl font-black ${balance >= 0 ? "text-amber-700" : "text-blue-700"}`}>
                                    ৳{Math.abs(balance)}
                                  </p>
                                  <div className="flex items-center justify-center gap-1 mt-1">
                                    <div className={`h-1.5 w-1.5 rounded-full ${balance >= 0 ? "bg-amber-400" : "bg-blue-400"} animate-pulse`} />
                                    <p className="text-[10px] font-bold opacity-80">
                                      {balance > 0 ? "কর্মী দোকানদারের ঋণগ্রস্ত" : balance < 0 ? "কর্মী দোকানদারের কাছে টাকা পাবে" : "হিসাব সম্পূর্ণ পরিশোধ"}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })()}

                          {expenses.filter(e => {
                            if (expenseFilter.startsWith('staff_')) {
                              return e.staffId === expenseFilter.replace('staff_', '');
                            }
                            return true;
                          }).length === 0 ? (
                          <div className="p-12 text-center bg-white rounded-3xl border border-dashed">
                             <p className="text-gray-400 font-medium">কোন ব্যয়ের হিসাব পাওয়া যায়নি</p>
                          </div>
                        ) : (
                          expenses.sort((a,b) => {
                            const tA = a.date?.toMillis ? a.date.toMillis() : 0;
                            const tB = b.date?.toMillis ? b.date.toMillis() : 0;
                            return tB - tA;
                          }).map(exp => (
                            <Card key={exp.id} className="overflow-hidden bg-white border-green-50">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[10px] font-bold ${
                                      exp.category === "Salary" ? "border-red-100 bg-red-50 text-red-700" : 
                                      exp.category === "Take" ? "border-amber-100 bg-amber-50 text-amber-700" :
                                      exp.category === "Return" ? "border-green-100 bg-green-50 text-green-700" :
                                      "border-blue-100 bg-blue-50 text-blue-700"
                                    }`}>
                                      {exp.category === "Salary" ? "বেতন" : 
                                       exp.category === "Take" ? "টাকা নিয়েছে" : 
                                       exp.category === "Return" ? "টাকা ফেরত" : "অ্যাডভান্স/জমা"}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{exp.date?.toDate ? exp.date.toDate().toLocaleDateString('bn-BD') : "অজানা তারিখ"}</span>
                                  </div>
                                  <p className="font-bold text-gray-800 text-sm">{exp.note || "কোন নোট নেই"}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className={`text-lg font-black ${
                                    (exp.category === "Salary" || exp.category === "Take") ? "text-red-600" : "text-green-600"
                                  }`}>
                                    { (exp.category === "Salary" || exp.category === "Take") ? "৳" : "৳" }{exp.amount}
                                  </p>
                                  <Button size="icon" variant="ghost" onClick={() => handleDeleteExpense(exp.id)} className="h-8 w-8 text-gray-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {adminSubTab === "staff" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>{editingStaff ? "কর্মী তথ্য এডিট করুন" : "নতুন কর্মী যোগ করুন"}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">নাম</label>
                          <Input 
                            value={editingStaff ? editingStaff.name : newStaff.name} 
                            onChange={e => editingStaff ? setEditingStaff({...editingStaff, name: e.target.value}) : setNewStaff({...newStaff, name: e.target.value})} 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">পদবী</label>
                          <select 
                            className="w-full p-3 rounded-xl border border-gray-200 bg-white"
                            value={editingStaff ? editingStaff.role : newStaff.role}
                            onChange={e => editingStaff ? setEditingStaff({...editingStaff, role: e.target.value as any}) : setNewStaff({...newStaff, role: e.target.value as any})}
                          >
                            <option value="Worker">শ্রমিক</option>
                            <option value="Rider">রাইডার</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-muted-foreground uppercase">ফোন নম্বর (ঐচ্ছিক)</label>
                          <Input 
                            value={editingStaff ? editingStaff.phone : newStaff.phone} 
                            onChange={e => editingStaff ? setEditingStaff({...editingStaff, phone: e.target.value}) : setNewStaff({...newStaff, phone: e.target.value})} 
                          />
                        </div>
                        <div className="flex gap-2">
                          {editingStaff ? (
                            <>
                              <Button onClick={handleUpdateStaff} className="flex-1 bg-green-600 hover:bg-green-700">আপডেট করুন</Button>
                              <Button onClick={() => setEditingStaff(null)} variant="outline" className="flex-1">বাতিল</Button>
                            </>
                          ) : (
                            <Button onClick={handleAddStaff} className="w-full bg-green-600 hover:bg-green-700">কর্মী যোগ করুন</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <h3 className="font-bold flex items-center gap-2"><Users size={20} className="text-green-600" /> বর্তমান কর্মী ও রাইডারগণ</h3>
                      <div className="grid gap-3">
                        {staff.length === 0 ? (
                          <div className="p-12 text-center bg-white rounded-3xl border border-dashed">
                             <p className="text-gray-400 font-medium">কোন কর্মী পাওয়া যায়নি</p>
                          </div>
                        ) : (
                          staff.map(s => (
                            <Card key={s.id} className="overflow-hidden bg-white border-green-50">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-[10px] font-bold ${s.role === "Rider" ? "border-blue-100 bg-blue-50 text-blue-700" : "border-green-100 bg-green-50 text-green-700"}`}>
                                      {s.role === "Worker" ? "শ্রমিক" : "রাইডার"}
                                    </Badge>
                                    <p className="text-[10px] text-muted-foreground">{s.phone}</p>
                                  </div>
                                  <p className="font-bold text-gray-800">{s.name}</p>
                                  <div className="mt-1">
                                    {(() => {
                                      const sExpenses = expenses.filter(e => e.staffId === s.id);
                                      const debit = sExpenses.filter(e => e.category === "Salary" || e.category === "Take").reduce((sum, e) => sum + (e.amount || 0), 0);
                                      const credit = sExpenses.filter(e => e.category === "Return" || e.category === "Advance").reduce((sum, e) => sum + (e.amount || 0), 0);
                                      const balance = debit - credit;
                                      
                                      return (
                                        <div className="space-y-0.5">
                                          <p className={`text-[10px] font-bold ${balance >= 0 ? "text-amber-600" : "text-green-600"}`}>
                                            {balance >= 0 ? "দোকানদার পাওনা:" : "কর্মী পাওনা:"} ৳{Math.abs(balance)}
                                          </p>
                                          {balance === 0 && (
                                            <p className="text-[9px] text-gray-400 font-medium italic">হিসাব ক্লিয়ার</p>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="icon" variant="ghost" onClick={() => setEditingStaff(s)} className="h-8 w-8 text-blue-500 hover:bg-blue-50">
                                    <Edit size={16} />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDeleteStaff(s.id)} className="h-8 w-8 text-red-500 hover:bg-red-50">
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {adminSubTab === "products" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                        <span>{editingProduct ? "পণ্য এডিট করুন" : "নতুন পণ্য যোগ করুন"}</span>
                        {editingProduct && (
                          <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}>
                            <X size={18} />
                          </Button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input 
                        placeholder="পণ্যের নাম" 
                        value={editingProduct ? editingProduct.name : newProduct.name} 
                        onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} 
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">বিক্রয় মূল্য (Selling Price)</label>
                          <Input 
                            type="number" 
                            placeholder="বিক্রয় মূল্য" 
                            value={editingProduct ? editingProduct.price : newProduct.price} 
                            onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: Number(e.target.value)}) : setNewProduct({...newProduct, price: Number(e.target.value)})} 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">ক্রয় মূল্য (Purchase Price)</label>
                          <Input 
                            type="number" 
                            placeholder="ক্রয় মূল্য" 
                            value={editingProduct ? editingProduct.purchasePrice : newProduct.purchasePrice} 
                            onChange={e => editingProduct ? setEditingProduct({...editingProduct, purchasePrice: Number(e.target.value)}) : setNewProduct({...newProduct, purchasePrice: Number(e.target.value)})} 
                          />
                        </div>
                      </div>
                      <Input 
                        placeholder="ইউনিট (যেমন: কেজি, লিটার)" 
                        value={editingProduct ? editingProduct.unit : newProduct.unit} 
                        onChange={e => editingProduct ? setEditingProduct({...editingProduct, unit: e.target.value}) : setNewProduct({...newProduct, unit: e.target.value})} 
                      />
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">স্টক পরিমাণ (Stock Quantity)</label>
                        <Input 
                          type="number" 
                          placeholder="স্টক পরিমাণ" 
                          value={editingProduct ? editingProduct.stockQuantity : newProduct.stockQuantity} 
                          onChange={e => editingProduct ? setEditingProduct({...editingProduct, stockQuantity: Number(e.target.value)}) : setNewProduct({...newProduct, stockQuantity: Number(e.target.value)})} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-red-600">নষ্ট পণ্যের পরিমাণ (Damaged Quantity)</label>
                        <Input 
                          type="number" 
                          placeholder="নষ্ট পণ্যের পরিমাণ (যদি থাকে)" 
                          className="border-red-100 bg-red-50/30"
                          value={editingProduct ? (editingProduct.damagedCount || 0) : (newProduct.damagedCount || 0)} 
                          onChange={e => editingProduct ? setEditingProduct({...editingProduct, damagedCount: Number(e.target.value)}) : setNewProduct({...newProduct, damagedCount: Number(e.target.value)})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">ক্যাটাগরি (যেমন: তেল, সবজি, চাউল)</label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="ক্যাটাগরি" 
                            list="category-list"
                            value={editingProduct ? editingProduct.category : newProduct.category} 
                            onChange={e => editingProduct ? setEditingProduct({...editingProduct, category: e.target.value}) : setNewProduct({...newProduct, category: e.target.value})} 
                          />
                          <datalist id="category-list">
                            {categoryList.filter(c => c !== "সব").map(c => <option key={c} value={c} />)}
                          </datalist>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">পণ্যের ছবি (গ্যালারি থেকে সিলেক্ট করুন)</label>
                        <Input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, 'product')} 
                          className="cursor-pointer"
                        />
                        {(editingProduct?.image || newProduct.image) && (
                          <img 
                            src={editingProduct ? editingProduct.image : newProduct.image} 
                            className="h-20 w-20 object-cover rounded-lg border" 
                            alt="Preview"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                        <input 
                          type="checkbox" 
                          id="inStock"
                          checked={editingProduct ? editingProduct.inStock !== false : newProduct.inStock !== false} 
                          onChange={e => editingProduct ? setEditingProduct({...editingProduct, inStock: e.target.checked}) : setNewProduct({...newProduct, inStock: e.target.checked})} 
                          className="w-4 h-4 accent-green-600 cursor-pointer"
                        />
                        <label htmlFor="inStock" className="text-sm font-bold cursor-pointer">স্টক আছে (In Stock)</label>
                      </div>

                      {editingProduct ? (
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateProduct} className="flex-1 bg-blue-600">আপডেট করুন</Button>
                          <Button onClick={() => setEditingProduct(null)} variant="outline">বাতিল</Button>
                        </div>
                      ) : (
                        <Button onClick={handleAddProduct} className="w-full bg-green-600">পণ্য যোগ করুন</Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell size={18} className="text-green-600" />
                        কাস্টমারদের নোটিফিকেশন পাঠান
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input 
                        placeholder="নোটিফিকেশন টাইটেল (যেমন: নতুন অফার!)" 
                        value={notificationInput.title}
                        onChange={e => setNotificationInput({...notificationInput, title: e.target.value})}
                      />
                      <Input 
                        placeholder="মেসেজ (যেমন: আজ সব পণ্যে ১০% ছাড়!)" 
                        value={notificationInput.message}
                        onChange={e => setNotificationInput({...notificationInput, message: e.target.value})}
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">কাকে পাঠাতে চান?</label>
                        <select 
                          className="w-full p-2 text-sm border rounded-md bg-white focus:ring-2 focus:ring-green-500 outline-none"
                          value={notificationInput.targetPhone}
                          onChange={e => setNotificationInput({...notificationInput, targetPhone: e.target.value})}
                        >
                          <option value="all">সবাইকে পাঠান</option>
                          <optgroup label="কাস্টমার লিস্ট">
                            {customers.map((c, i) => (
                              <option key={i} value={c.phone}>
                                {c.name} ({c.phone})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      <Button onClick={handleSendNotification} className="w-full bg-green-600">পাঠিয়ে দিন</Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-green-700" />
                        ক্যাটাগরি ম্যানেজমেন্ট
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">নতুন ক্যাটাগরি যোগ করুন</label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="ক্যাটাগরির নাম" 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)} 
                          />
                          <Button onClick={handleAddCategory} className="bg-green-600">
                            <Plus size={18} />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">বর্তমান ক্যাটাগরি সমূহ</label>
                        <div className="grid grid-cols-1 gap-2">
                          {categories.map((cat, index) => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-gray-400 hover:text-green-600 disabled:opacity-30"
                                    onClick={() => handleMoveCategory(cat, 'up')}
                                    disabled={index === 0}
                                  >
                                    <ChevronUp size={14} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-gray-400 hover:text-green-600 disabled:opacity-30"
                                    onClick={() => handleMoveCategory(cat, 'down')}
                                    disabled={index === categories.length - 1}
                                  >
                                    <ChevronDown size={14} />
                                  </Button>
                                </div>
                                <span className="font-medium">{cat.name}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteCategory(cat.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}
                          {categories.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-4">কোনো ক্যাটাগরি নেই</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle>পণ্য তালিকা (এডিট বা ডিলিট করুন)</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {products.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 border rounded-xl bg-gray-50/50">
                            <div className="flex items-center gap-3">
                              <img src={p.image} className="h-10 w-10 rounded object-cover" alt="" />
                              <div>
                                <p className="font-bold text-sm">{p.name}</p>
                                <div className="flex gap-2 items-center">
                                  <p className="text-xs text-muted-foreground">৳{p.price}</p>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-100">
                                    স্টক: {p.stockQuantity || 0}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-green-50 text-green-700 border-green-100">
                                    বিক্রি: {p.soldCount || 0}
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-red-50 text-red-700 border-red-100">
                                    নষ্ট: {p.damagedCount || 0}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600" onClick={() => {
                                setEditingProduct(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}>
                                <Settings size={14} />
                              </Button>
                              <Button variant="outline" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteProduct(p.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  </div>
                )}

                {adminSubTab === "users" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone size={18} className="text-green-600" />
                        কাস্টমার তালিকা ({customers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-4">
                          {customers.map(customer => (
                            <div key={customer.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border transition-all ${customer.isBlocked ? 'border-red-200 bg-red-50/30 opacity-75' : 'hover:border-green-300'}`}>
                              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-md relative">
                                  {customer.image ? (
                                    <img src={customer.image} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-green-50 text-green-600">
                                      <UserIcon size={28} />
                                    </div>
                                  )}
                                  {customer.isBlocked && (
                                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                      <ShieldAlert size={20} className="text-red-600" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-base flex items-center gap-2">
                                    {customer.name}
                                    {customer.isBlocked && <Badge variant="destructive" className="text-[9px] h-4 px-1.5 uppercase tracking-tighter">অবদমিত (Blocked)</Badge>}
                                  </p>
                                  <p className="text-sm text-muted-foreground font-medium">{customer.phone}</p>
                                  <p className="text-[10px] text-gray-400 italic mt-0.5">
                                    শেষ লগইন: {customer.lastLogin?.toDate ? customer.lastLogin.toDate().toLocaleString('bn-BD') : "অজানা"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className={`flex-1 sm:flex-none h-10 px-4 rounded-xl font-bold transition-all ${
                                    customer.isBlocked 
                                    ? "bg-green-600 text-white hover:bg-green-700 border-none" 
                                    : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:text-red-700"
                                  }`}
                                  onClick={() => handleBlockCustomer(customer.phone, !customer.isBlocked)}
                                >
                                  {customer.isBlocked ? (
                                    <><ShieldCheck size={16} className="mr-2" /> আনব্লক করুন</>
                                  ) : (
                                    <><ShieldAlert size={16} className="mr-2" /> ব্লক করুন</>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-10 w-10 text-red-500 border-red-100 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  title="প্রোফাইল মুছুন"
                                >
                                  <Trash2 size={16} />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-10 w-10 text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all"
                                  onClick={() => {
                                    handleAdminChatSelect(customer.phone);
                                    setAdminSubTab("supports");
                                  }}
                                  title="সরাসরি চ্যাট করুন"
                                >
                                  <MessageSquare size={16} />
                                </Button>
                                {customer.image && (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-10 w-10 rounded-xl text-green-600 border-green-200 hover:bg-green-100 transition-colors"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = customer.image;
                                      link.download = `customer_${customer.phone}.png`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    title="ছবি ডাউনলোড করুন"
                                  >
                                    <Download size={18} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {customers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-2xl border border-dashed">
                              <UserIcon size={48} className="text-gray-300 mb-4" />
                              <p className="text-sm font-medium text-gray-500">এখনো কোনো কাস্টমার রেজিস্টার করেনি</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {adminSubTab === "supports" && (
                  <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row h-[700px] max-h-[85vh]">
                    {/* Sidebar: Customer List */}
                    <div className={`w-full md:w-[350px] flex flex-col border-r border-gray-100 bg-white ${
                      selectedAdminChatPhone ? 'hidden md:flex' : 'flex'
                    }`}>
                      <div className="p-6 border-b border-gray-50 text-center md:text-left">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 justify-center md:justify-start">
                          <MessageSquare className="text-green-600" /> কাস্টমার সাপোর্ট
                        </h3>
                        <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-widest leading-relaxed">কথোপকথন তালিকা</p>
                      </div>
                      
                      <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                          {customers.filter(c => messages.some(m => m.senderPhone === c.phone)).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                              <MessageCircle size={64} className="mb-4 text-green-200" />
                              <p className="text-sm italic font-medium">কোনো সাম্প্রতিক মেসেজ নেই</p>
                            </div>
                          ) : (
                            customers
                              .filter(c => messages.some(m => m.senderPhone === c.phone))
                              .sort((a, b) => {
                                const lastMsgA = messages
                                  .filter(m => m.senderPhone === a.phone)
                                  .sort((m1, m2) => (m2.createdAt?.toMillis?.() || 0) - (m1.createdAt?.toMillis?.() || 0))[0];
                                const lastMsgB = messages
                                  .filter(m => m.senderPhone === b.phone)
                                  .sort((m1, m2) => (m2.createdAt?.toMillis?.() || 0) - (m1.createdAt?.toMillis?.() || 0))[0];
                                return (lastMsgB.createdAt?.toMillis?.() || 0) - (lastMsgA.createdAt?.toMillis?.() || 0);
                              })
                              .map((customer, i) => {
                                const customerMessages = messages.filter(m => m.senderPhone === customer.phone);
                                const unreadCount = customerMessages.filter(m => m.type === 'customer' && !m.read).length;
                                const lastMsg = customerMessages.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))[0];
                                const isSelected = selectedAdminChatPhone === customer.phone;
                                
                                return (
                                  <button
                                    key={i}
                                    onClick={() => handleAdminChatSelect(customer.phone)}
                                    className={`w-full p-4 rounded-3xl text-left transition-all flex items-center gap-4 relative group hover:scale-[1.02] active:scale-95 ${
                                      isSelected ? 'bg-green-600 text-white shadow-xl shadow-green-200' : 'bg-gray-50/50 hover:bg-green-50'
                                    }`}
                                  >
                                    <div className={`h-14 w-14 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-xl shadow-inner ${
                                      isSelected ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'
                                    }`}>
                                      {customer.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-center mb-1">
                                        <h4 className={`font-bold truncate text-base ${isSelected ? 'text-white' : 'text-gray-900'}`}>{customer.name}</h4>
                                        {unreadCount > 0 && (
                                          <Badge className={`text-[10px] h-5 min-w-[22px] justify-center px-1.5 rounded-full border-none shadow-md animate-pulse ${
                                            isSelected ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                                          }`}>
                                            {unreadCount}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex flex-col">
                                        <p className={`text-[11px] font-medium ${isSelected ? 'text-white/70' : 'text-green-600'}`}>{customer.phone}</p>
                                        <p className={`text-[11px] truncate mt-1 italic ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                          {lastMsg?.message || "মেসেজ নেই"}
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Chat Window - Occupies full space on mobile if selected */}
                    <div className={`flex-1 flex flex-col bg-slate-50 relative h-full ${
                      !selectedAdminChatPhone ? 'hidden md:flex' : 'flex'
                    }`}>
                      {selectedAdminChatPhone ? (() => {
                        const selectedCustomer = customers.find(c => c.phone === selectedAdminChatPhone);
                        const chatMessages = messages
                          .filter(m => m.senderPhone === selectedAdminChatPhone)
                          .sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

                        return (
                          <div className="flex flex-col h-full overflow-hidden">
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-30">
                              <div className="flex items-center gap-2 md:gap-4">
                                {/* Back Button for Mobile */}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setSelectedAdminChatPhone(null)}
                                  className="md:hidden text-green-600 hover:bg-green-50 rounded-full"
                                >
                                  <ArrowLeft size={24} />
                                </Button>
                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg md:text-xl shadow-inner uppercase">
                                  {selectedCustomer?.name[0] || "?"}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm md:text-lg text-gray-900 leading-tight truncate">{selectedCustomer?.name || "অচেনা কাস্টমার"}</h4>
                                  <p className="text-[10px] md:text-xs text-green-600 font-bold">{selectedAdminChatPhone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 md:gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteConversation(selectedAdminChatPhone)}
                                  className="text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 h-8 w-8 md:h-10 md:w-10"
                                  title="পুরো চ্যাট মুছে ফেলুন"
                                >
                                  <Trash2 size={20} />
                                </Button>
                                {/* Close Button for Desktop */}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setSelectedAdminChatPhone(null)}
                                  className="hidden md:flex text-gray-400 hover:text-green-600 rounded-xl h-10 w-10"
                                >
                                  <X size={24} />
                                </Button>
                              </div>
                            </div>

                            {/* Messages Area - Fixed Scroll */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col-reverse bg-gradient-to-b from-slate-50 to-white scrollbar-thin scrollbar-thumb-green-200">
                              <div className="space-y-6 flex flex-col pb-4">
                                {chatMessages.map((m, mi) => (
                                  <div key={mi} className={`flex ${m.type === 'admin' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className="relative group/msg max-w-[85%] md:max-w-[70%]">
                                      <div className={`p-4 md:p-5 rounded-3xl text-sm shadow-sm relative ${
                                        m.type === 'admin' 
                                          ? 'bg-green-600 text-white rounded-tr-none shadow-green-200'
                                          : 'bg-white border border-green-100 text-gray-800 rounded-tl-none shadow-gray-200/50'
                                      }`}>
                                        {m.imageUrl && (
                                          <div className="mb-3 rounded-2xl overflow-hidden border border-black/5 shadow-inner bg-black/5">
                                            <img 
                                              src={m.imageUrl} 
                                              alt="Attachment" 
                                              className="max-w-full h-auto object-contain max-h-[350px]" 
                                              referrerPolicy="no-referrer"
                                            />
                                          </div>
                                        )}
                                        
                                        {editingChatMessageId === m.id ? (
                                          <div className="space-y-2 py-1">
                                            <Input 
                                              value={editingChatMessageText}
                                              onChange={e => setEditingChatMessageText(e.target.value)}
                                              className={`h-8 text-xs ${m.type === 'admin' ? 'bg-white/20 border-white/30 text-white placeholder:text-white/50' : 'bg-gray-50 border-gray-200'}`}
                                              autoFocus
                                            />
                                            <div className="flex gap-2">
                                              <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className={`h-7 text-[10px] ${m.type === 'admin' ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-200'}`}
                                                onClick={() => {
                                                  setEditingChatMessageId(null);
                                                  setEditingChatMessageText("");
                                                }}
                                              >বাতিল</Button>
                                              <Button 
                                                size="sm" 
                                                className={`h-7 text-[10px] ${m.type === 'admin' ? 'bg-white text-green-700 hover:bg-white/90' : 'bg-green-600 text-white'}`}
                                                disabled={isUpdatingChatMessage}
                                                onClick={handleUpdateChatMessage}
                                              >
                                                {isUpdatingChatMessage ? "সেভ হচ্ছে..." : "সেভ করুন"}
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                                        )}

                                        <div className="text-[10px] mt-3 opacity-60 flex justify-between gap-6 border-t pt-2 border-white/10">
                                          <div className="flex items-center gap-1">
                                            <span className="font-bold uppercase tracking-wider">{m.type === 'admin' ? 'অ্যাডমিন' : 'কাস্টমার'}</span>
                                            {m.updatedAt && <span className="text-[8px] font-bold">(এডিট করা)</span>}
                                          </div>
                                          <span className="font-mono">{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit', hour12: true}) : "এখনই"}</span>
                                        </div>

                                        {/* Admin Side Delete/Edit Actions */}
                                        {!editingChatMessageId && (
                                          <div className="mt-3 pt-2 border-t border-black/5 flex items-center gap-3">
                                            <button 
                                              onClick={() => {
                                                setEditingChatMessageId(m.id);
                                                setEditingChatMessageText(m.message);
                                              }}
                                              className={`text-[10px] flex items-center gap-1 font-bold ${m.type === 'admin' ? 'text-white/80 hover:text-white' : 'text-blue-600 hover:text-blue-700'}`}
                                            >
                                              <Edit size={10} /> এডিট
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteMessage(m.id, 'everyone')}
                                              className={`text-[10px] flex items-center gap-1 font-bold ${m.type === 'admin' ? 'text-red-100 hover:text-red-200' : 'text-red-600 hover:text-red-700'}`}
                                            >
                                              <Trash2 size={10} /> মুছুন
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <div id="admin-chat-end" />
                              </div>
                            </div>

                            {/* Chat Input - Always at bottom */}
                            <div className="p-4 md:p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] z-40">
                              <div className="flex gap-2 md:gap-3 bg-gray-50/80 p-1.5 md:p-2 rounded-[24px] border-2 border-green-50 focus-within:border-green-400 focus-within:bg-white focus-within:ring-8 focus-within:ring-green-100 transition-all shadow-inner items-center">
                                <label className="h-10 w-10 md:h-12 md:w-14 bg-white/50 hover:bg-white text-green-600 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm border border-green-100 shrink-0">
                                  <Camera size={20} />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={(e) => handleChatImageUpload(e, true, selectedAdminChatPhone || undefined)} 
                                  />
                                </label>
                                <Input 
                                  placeholder="আপনার উত্তর লিখুন..." 
                                  id="admin-reply-input"
                                  autoComplete="off"
                                  className="bg-transparent border-none rounded-xl h-10 md:h-12 focus-visible:ring-0 shadow-none text-sm md:text-base pl-2 md:pl-4"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const input = document.getElementById("admin-reply-input") as HTMLInputElement;
                                      if (input.value.trim() && selectedCustomer) {
                                        handleSendAdminReply(selectedCustomer.phone, selectedCustomer.name, input.value);
                                        input.value = "";
                                      }
                                    }
                                  }}
                                />
                                <Button 
                                  onClick={() => {
                                    const input = document.getElementById("admin-reply-input") as HTMLInputElement;
                                    if (input.value.trim() && selectedCustomer) {
                                      handleSendAdminReply(selectedCustomer.phone, selectedCustomer.name, input.value);
                                      input.value = "";
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white rounded-[20px] w-10 h-10 md:w-14 md:h-12 shrink-0 p-0 shadow-xl shadow-green-200 transition-transform active:scale-90 flex items-center justify-center"
                                >
                                  <Send size={20} className="md:w-[22px] md:h-[22px]" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50">
                          <div className="h-32 w-32 rounded-full bg-white shadow-2xl shadow-green-100 flex items-center justify-center text-green-600 mb-8 border-4 border-green-50">
                            <MessageCircle size={64} className="animate-pulse" />
                          </div>
                          <h3 className="text-2xl font-black text-gray-800 mb-2">চ্যাট শুরু করুন</h3>
                          <p className="text-gray-500 max-w-xs mx-auto text-sm">বাম পাশের তালিকা থেকে কাস্টমার সিলেক্ট করে সরাসরি কথা বলা শুরু করুন</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {adminSubTab === "settings" && (
                  <div className="space-y-8">
                    <Card className="border-none shadow-xl bg-gradient-to-br from-white to-green-50/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-green-800">
                          <Zap size={20} className="text-green-600" />
                          প্রোমোশনাল সার্ভিস সেটিংস
                        </CardTitle>
                        <p className="text-xs text-green-600/70">কাস্টমারদের জন্য বিশেষ সেবা বা অফার সেট করুন যা তারা সরাসরি অর্ডার করতে পারবে।</p>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-green-100 shadow-sm">
                          <div className="space-y-0.5">
                            <label className="text-sm font-bold text-gray-800">প্রোমো সার্ভিস চালু করুন</label>
                            <p className="text-[10px] text-muted-foreground italic">এটি অন করলে কাস্টমার অ্যাপের নিচে প্রোমো সেকশন দেখাবে।</p>
                          </div>
                          <div 
                            onClick={() => setConfig({...config, showPromoService: !config.showPromoService})}
                            className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-200 flex items-center ${config.showPromoService ? 'bg-green-600' : 'bg-gray-300'}`}
                          >
                            <motion.div 
                              animate={{ x: config.showPromoService ? 24 : 0 }}
                              className="w-6 h-6 bg-white rounded-full shadow-md"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-green-700">প্রোমো টাইটেল</label>
                            <Input 
                              placeholder="যেমন: ১টি স্পেশাল অফার!" 
                              className="h-12 rounded-xl focus:ring-green-500"
                              value={config.promoServiceTitle} 
                              onChange={e => setConfig({...config, promoServiceTitle: e.target.value})} 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-green-700">ডিফল্ট অর্ডার এমাউন্ট (৳)</label>
                            <Input 
                              type="number"
                              placeholder="যেমন: ৫০০০" 
                              className="h-12 rounded-xl focus:ring-green-500"
                              value={config.promoServiceDefaultAmount} 
                              onChange={e => setConfig({...config, promoServiceDefaultAmount: Number(e.target.value)})} 
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-black uppercase tracking-wider text-green-700">উইথড্রয়াল প্রফিট/কমিশন ({config.promoServiceProfitType === 'percentage' ? '%' : '৳'})</label>
                              <div className="flex bg-gray-100 rounded-lg p-1">
                                <button 
                                  onClick={() => setConfig({...config, promoServiceProfitType: 'fixed'})}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${config.promoServiceProfitType === 'fixed' ? 'bg-white shadow-sm text-green-700' : 'text-gray-400'}`}
                                >৳</button>
                                <button 
                                  onClick={() => setConfig({...config, promoServiceProfitType: 'percentage'})}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${config.promoServiceProfitType === 'percentage' ? 'bg-white shadow-sm text-green-700' : 'text-gray-400'}`}
                                >%</button>
                              </div>
                            </div>
                            <Input 
                              type="number"
                              placeholder={config.promoServiceProfitType === 'percentage' ? "যেমন: ৫" : "যেমন: ৫০"} 
                              className="h-12 rounded-xl focus:ring-green-500 border-green-200"
                              value={config.promoServiceProfit} 
                              onChange={e => setConfig({...config, promoServiceProfit: Number(e.target.value)})} 
                            />
                             <p className="text-[10px] text-gray-400">প্রতিটি বিথড্রয়াল অর্ডারে এই {config.promoServiceProfitType === 'percentage' ? 'শতাংশ' : 'টাকা'} আপনার লাভ হিসেবে যোগ হবে।</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-wider text-green-700">প্রোমো ডেসক্রিপশন</label>
                          <textarea 
                            rows={3}
                            placeholder="অফারটি সম্পর্কে বিস্তারিত লিখুন..." 
                            className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                            value={config.promoServiceDescription} 
                            onChange={e => setConfig({...config, promoServiceDescription: e.target.value})} 
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-green-700">বাটন টেক্সট</label>
                            <Input 
                              placeholder="যেমন: এখনই অর্ডার করুন" 
                              className="h-12 rounded-xl focus:ring-green-500"
                              value={config.promoServiceButtonText} 
                              onChange={e => setConfig({...config, promoServiceButtonText: e.target.value})} 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-green-700">প্রোমো ছবি (ব্যানার)</label>
                            <div className="flex items-center gap-4">
                              <Input 
                                type="file" 
                                accept="image/*" 
                                className="h-12 rounded-xl border-dashed border-2 pt-2.5 cursor-pointer"
                                onChange={(e) => handleImageUpload(e, 'promoService')} 
                              />
                              {config.promoServiceImage && (
                                <img src={config.promoServiceImage} className="h-12 w-12 rounded-xl object-cover border shadow-sm" alt="Promo" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                    <CardHeader><CardTitle>দোকান সেটিংস ও লিঙ্ক</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-2xl border border-green-100 mb-4">
                        <p className="text-xs text-green-700 font-bold mb-2 uppercase">কাস্টমারদের জন্য পাবলিক লিঙ্ক:</p>
                        <div className="flex gap-2">
                          <Input readOnly value={`${window.location.origin.replace('ais-dev-', 'ais-pre-')}/?s`} className="bg-white text-xs" />
                          <Button size="sm" onClick={copyStoreLink} className="bg-green-600">কপি</Button>
                        </div>
                        <p className="text-[10px] text-green-600 mt-2 italic">
                          * এই লিঙ্কটি শেয়ার করলে কাস্টমারদের কোনো লগইন বা পাসওয়ার্ড লাগবে না।
                        </p>

                        <div className="mt-4 pt-4 border-t border-green-100">
                          <p className="text-xs text-amber-700 font-bold mb-2 uppercase flex items-center gap-1">
                            <Download size={14} /> ডাইরেক্ট ইন্সটল লিঙ্ক:
                          </p>
                          <div className="flex gap-2">
                            <Input readOnly value={`${window.location.origin.replace('ais-dev-', 'ais-pre-')}/?install`} className="bg-white text-xs" />
                            <Button size="sm" onClick={copyInstallLink} className="bg-amber-600 hover:bg-amber-700">কপি</Button>
                          </div>
                          <p className="text-[10px] text-amber-600 mt-2 italic">
                            * এই লিঙ্কটি শেয়ার করলে কাস্টমার সরাসরি অ্যাপ ইন্সটল করার অপশন পাবে।
                          </p>
                        </div>

                        {window.location.origin.includes('ais-dev-') && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                              <p className="text-xs text-amber-800 font-bold leading-tight">
                                লিঙ্ক কাজ না করলে কি করবেন?
                              </p>
                            </div>
                            <p className="text-[10px] text-amber-700 leading-relaxed ml-6">
                              যদি উপরের লিঙ্কটি ওপেন করলে <strong>"Page not found"</strong> দেখায়, তবে বুঝবেন আপনি এখনো অ্যাপটি <strong>"Share"</strong> করেননি। 
                              <br /><br />
                              ঠিক করার জন্য: AI Studio-র উপরের ডানদিকের <strong>"Share"</strong> বাটনে ক্লিক করে অ্যাপটি শেয়ার করুন। শেয়ার করার পরই এই লিঙ্কটি সবার জন্য কাজ করবে।
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">দোকানের নাম</label>
                          <Input placeholder="দোকানের নাম" value={config.storeName} onChange={e => setConfig({...config, storeName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">দোকানের ধরন/স্লোগান</label>
                          <Input placeholder="মোদী মাল বিক্রেতা" value={config.storeSubtext} onChange={e => setConfig({...config, storeSubtext: e.target.value})} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">দোকানের লোগো</label>
                          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="text-xs" />
                          {config.storeLogo && <img src={config.storeLogo} className="h-10 w-10 object-cover rounded border" alt="Logo" />}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">অ্যাপ আইকন (PWA)</label>
                          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'appIcon')} className="text-xs" />
                          {config.appIcon && <img src={config.appIcon} className="h-10 w-10 object-cover rounded border" alt="App Icon" />}
                          <p className="text-[9px] text-muted-foreground leading-tight italic">
                            * এই আইকনটি কাস্টমারের মোবাইলে অ্যাপের লোগো হিসেবে দেখা যাবে।
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-muted-foreground">অফার লোগো/ছবি</label>
                          <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} className="text-xs" />
                          {config.heroImage && <img src={config.heroImage} className="h-10 w-10 object-cover rounded border" alt="Hero" />}
                        </div>
                      </div>

                      <Input placeholder="অ্যাডমিন ইমেইল (সাবধানে পরিবর্তন করুন)" value={config.adminEmail} onChange={e => setConfig({...config, adminEmail: e.target.value})} />
                      
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
                        <p className="text-xs text-blue-700 font-bold uppercase">টপ অ্যানাউন্সমেন্ট (বিজ্ঞপ্তি)</p>
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="checkbox" 
                            id="showAnnouncement"
                            checked={config.showAnnouncement} 
                            onChange={e => setConfig({...config, showAnnouncement: e.target.checked})} 
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                          <label htmlFor="showAnnouncement" className="text-sm font-bold cursor-pointer">বিজ্ঞপ্তি দেখান</label>
                        </div>
                        <Input 
                          placeholder="বিজ্ঞপ্তি লিখুন (যেমন: ডেলিভারি ফ্রি!)" 
                          value={config.announcementText} 
                          onChange={e => setConfig({...config, announcementText: e.target.value})} 
                          className="bg-white"
                        />
                      </div>

                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
                        <p className="text-xs text-amber-700 font-bold uppercase">অটো ডেলিভারি চার্জ সেটিংস</p>
                        <div className="flex items-center gap-2 mb-2">
                          <input 
                            type="checkbox" 
                            id="enableAutoDeliveryCharge"
                            checked={config.enableAutoDeliveryCharge} 
                            onChange={e => setConfig({...config, enableAutoDeliveryCharge: e.target.checked})} 
                            className="w-4 h-4 accent-amber-600 cursor-pointer"
                          />
                          <label htmlFor="enableAutoDeliveryCharge" className="text-sm font-bold cursor-pointer">অটো ডেলিভারি চার্জ চালু করুন</label>
                        </div>
                        {config.enableAutoDeliveryCharge && (
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-amber-600 uppercase">ফ্রি ডেলিভারি মিনিমাম অর্ডার</label>
                              <Input 
                                type="number"
                                placeholder="যেমন: ৫০০" 
                                value={config.minOrderForFreeDelivery} 
                                onChange={e => setConfig({...config, minOrderForFreeDelivery: Number(e.target.value)})} 
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-amber-600 uppercase">ডিফল্ট ডেলিভারি চার্জ</label>
                              <Input 
                                type="number"
                                placeholder="যেমন: ৬০" 
                                value={config.defaultDeliveryCharge} 
                                onChange={e => setConfig({...config, defaultDeliveryCharge: Number(e.target.value)})} 
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] font-bold text-amber-600 uppercase">ডেলিভারি চার্জ বিজ্ঞপ্তি</label>
                              <Input 
                                placeholder="যেমন: ৫০০ টাকার পণ্য কিনলে ডেলিভারি চার্জ ফ্রি" 
                                value={config.deliveryChargeNotice} 
                                onChange={e => setConfig({...config, deliveryChargeNotice: e.target.value})} 
                                className="bg-white"
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-[9px] text-amber-600 italic leading-tight">
                          * এটি চালু থাকলে কাস্টমার অর্ডারের সময় অটোমেটিক চার্জ যোগ হবে যদি মিনিমাম অর্ডার থ্রেশহোল্ড এর নিচে থাকে।
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">অ্যাডমিন পাসওয়ার্ড</label>
                        <Input 
                          type="text" 
                          placeholder="পাসওয়ার্ড সেট করুন" 
                          className="bg-white"
                          value={config.adminPassword} 
                          onChange={e => setConfig({...config, adminPassword: e.target.value})} 
                        />
                        <p className="text-[10px] text-amber-600 font-medium">পাসওয়ার্ড পরিবর্তন করলে অবশ্যই "সেটিংস সেভ করুন" বাটনে ক্লিক করবেন।</p>
                      </div>
                      <Input placeholder="অফার টাইটেল" value={config.heroTitle} onChange={e => setConfig({...config, heroTitle: e.target.value})} />
                      <Input placeholder="অফার সাবটেক্সট" value={config.heroSubtext} onChange={e => setConfig({...config, heroSubtext: e.target.value})} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
                          <label className="text-[10px] font-bold uppercase text-pink-700 tracking-wider">বিকাশ পেমেন্ট সেটিংস</label>
                          <Input placeholder="বিকাশ নাম্বার" value={config.bkashNumber} onChange={e => setConfig({...config, bkashNumber: e.target.value})} className="bg-white" />
                          <div className="flex gap-2">
                            <Button 
                              variant={config.bkashType === 'Personal' ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => setConfig({...config, bkashType: 'Personal'})}
                            >Personal</Button>
                            <Button 
                              variant={config.bkashType === 'Agent' ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => setConfig({...config, bkashType: 'Agent'})}
                            >Agent</Button>
                          </div>
                          <Input 
                            placeholder="বিকাশ কাস্টমারদের জন্য বিস্তারিত (যেমন: সেন্ড মানি করুন)" 
                            value={config.bkashDesc} 
                            onChange={e => setConfig({...config, bkashDesc: e.target.value})} 
                            className="bg-white text-xs"
                          />
                          {config.bkashType === 'Personal' && (
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-pink-600 whitespace-nowrap">সেন্ড মানি খরচ (%):</label>
                              <Input 
                                type="number"
                                placeholder="খরচ (যেমন: ২)" 
                                value={config.bkashFeePercentage} 
                                onChange={e => setConfig({...config, bkashFeePercentage: Number(e.target.value)})} 
                                className="bg-white text-xs h-8"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 p-4 bg-red-50/50 rounded-2xl border border-red-100">
                          <label className="text-[10px] font-bold uppercase text-red-700 tracking-wider">নগদ পেমেন্ট সেটিংস</label>
                          <Input placeholder="নগদ নাম্বার" value={config.nagadNumber} onChange={e => setConfig({...config, nagadNumber: e.target.value})} className="bg-white" />
                          <div className="flex gap-2">
                            <Button 
                              variant={config.nagadType === 'Personal' ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => setConfig({...config, nagadType: 'Personal'})}
                            >Personal</Button>
                            <Button 
                              variant={config.nagadType === 'Agent' ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => setConfig({...config, nagadType: 'Agent'})}
                            >Agent</Button>
                          </div>
                          <Input 
                            placeholder="নগদ কাস্টমারদের জন্য বিস্তারিত (যেমন: ক্যাশ আউট করুন)" 
                            value={config.nagadDesc} 
                            onChange={e => setConfig({...config, nagadDesc: e.target.value})} 
                            className="bg-white text-xs"
                          />
                          {config.nagadType === 'Personal' && (
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-red-600 whitespace-nowrap">সেন্ড মানি খরচ (%):</label>
                              <Input 
                                type="number"
                                placeholder="খরচ (যেমন: ২)" 
                                value={config.nagadFeePercentage} 
                                onChange={e => setConfig({...config, nagadFeePercentage: Number(e.target.value)})} 
                                className="bg-white text-xs h-8"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                          <label className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">রকেট পেমেন্ট সেটিংস</label>
                          <Input placeholder="রকেট নাম্বার" value={config.rocketNumber} onChange={e => setConfig({...config, rocketNumber: e.target.value})} className="bg-white" />
                          <div className="flex gap-2">
                            <Button 
                              variant={config.rocketType === 'Personal' ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => setConfig({...config, rocketType: 'Personal'})}
                            >Personal</Button>
                            <Button 
                              variant={config.rocketType === 'Agent' ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => setConfig({...config, rocketType: 'Agent'})}
                            >Agent</Button>
                          </div>
                          <Input 
                            placeholder="রকেট কাস্টমারদের জন্য বিস্তারিত (যেমন: সেন্ড মানি করুন)" 
                            value={config.rocketDesc} 
                            onChange={e => setConfig({...config, rocketDesc: e.target.value})} 
                            className="bg-white text-xs"
                          />
                          {config.rocketType === 'Personal' && (
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-purple-600 whitespace-nowrap">সেন্ড মানি খরচ (%):</label>
                              <Input 
                                type="number"
                                placeholder="খরচ (যেমন: ২)" 
                                value={config.rocketFeePercentage} 
                                onChange={e => setConfig({...config, rocketFeePercentage: Number(e.target.value)})} 
                                className="bg-white text-xs h-8"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <Input placeholder="হোয়াটসঅ্যাপ নাম্বার" value={config.whatsappNumber} onChange={e => setConfig({...config, whatsappNumber: e.target.value})} />
                      </div>
                      <Input placeholder="দোকানের ঠিকানা" value={config.storeAddress} onChange={e => setConfig({...config, storeAddress: e.target.value})} />
                      <Input placeholder="ফোন নাম্বার" value={config.storePhone} onChange={e => setConfig({...config, storePhone: e.target.value})} />
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">অর্ডার সাকসেস মেসেজ</label>
                        <Input 
                          placeholder="অর্ডার সফল হলে কাস্টমার যে মেসেজটি দেখবে" 
                          value={config.orderSuccessMsg} 
                          onChange={e => setConfig({...config, orderSuccessMsg: e.target.value})} 
                          className="bg-white"
                        />
                        <p className="text-[10px] text-blue-600 font-medium italic">অর্ডার সফল হওয়ার পর কাস্টমার এই মেসেজটি পপ-আপ আকারে দেখতে পাবে।</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="প্রোমো বাটন টাইটেল" value={config.promoButtonTitle} onChange={e => setConfig({...config, promoButtonTitle: e.target.value})} />
                        <Input placeholder="প্রোমো বাটন লিঙ্ক" value={config.promoButtonLink} onChange={e => setConfig({...config, promoButtonLink: e.target.value})} />
                      </div>
                      <div className="pt-6 border-t border-gray-100">
                        <Button 
                          className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200"
                          onClick={handleUpdateConfig}
                        >
                          সেটিংস সেভ করুন
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Card className="p-8 md:p-12 shadow-2xl border-none bg-white rounded-[40px] w-full max-w-md">
                   <div className="h-20 w-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mx-auto mb-6 shadow-inner">
                      <ShieldAlert size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-gray-800 mb-2">অ্যাডমিন এক্সেস</h3>
                   <p className="text-sm text-muted-foreground mb-8">অ্যাডমিন প্যানেলে ঢুকতে লগইন করুন বা সিকিউরিটি পাসওয়ার্ড দিন।</p>
                   
                   <div className="space-y-4 w-full">
                      <Button 
                        onClick={handleAdminGoogleLogin} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-100"
                      >
                        <LogIn size={20} /> Google দিয়ে লগইন করুন
                      </Button>
                      
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">অথবা পাসওয়ার্ড</span>
                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">সিকিউরিটি পাসওয়ার্ড</label>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="পাসওয়ার্ড লিখুন"
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            className="h-14 rounded-2xl bg-gray-50 border-none focus:ring-green-500 pl-4 pr-12 text-lg font-bold"
                            onKeyDown={e => e.key === 'Enter' && handleAdminUnlock()}
                          />
                          <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <Button 
                        onClick={handleAdminUnlock}
                        className="w-full bg-gray-900 hover:bg-black text-white font-black h-14 rounded-2xl mt-2 shadow-xl shadow-gray-200"
                      >
                        প্যানেল আনলক করুন
                      </Button>
                      
                      <p className="text-[10px] text-gray-400 mt-4 leading-tight">
                        আপনার ইমেইল অ্যাডমিন হিসেবে নিবন্ধিত থাকলে সরাসরি Google দিয়ে লগইন করতে পারেন। অন্যথায় পাসওয়ার্ড ব্যবহার করুন।
                      </p>
                   </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveTab("home")}
                className="text-green-700 hover:bg-green-50 rounded-xl"
              >
                <ArrowLeft size={18} className="mr-2" />
                হোমপেজে ফিরে যান
              </Button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-10">
              <Card className="w-full max-w-md p-8 shadow-sm border-none bg-white rounded-[32px]">
                <div className="text-center mb-8">
                  <div className="h-20 w-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PackageSearch size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800">অর্ডার ট্র্যাক করুন</h3>
                  <p className="text-sm text-muted-foreground mt-2">আপনার ফোন নাম্বার দিয়ে অর্ডারের সর্বশেষ অবস্থা জানুন</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ফোন নাম্বার</label>
                    <Input 
                      placeholder="আপনার মোবাইল নম্বর লিখুন" 
                      value={trackingPhone}
                      onChange={e => setTrackingPhone(e.target.value)}
                      className="h-14 rounded-2xl bg-gray-50 border-none focus-visible:ring-green-500 text-lg font-bold px-6"
                    />
                  </div>
                  <Button 
                    onClick={handleTrackOrder}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-lg shadow-green-100 transition-all hover:-translate-y-0.5"
                  >
                    সার্চ করুন
                  </Button>
                </div>

                {phoneUser && (
                  <div className="mt-6 pt-6 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("info")}
                      className="w-full h-12 rounded-2xl border-green-100 text-green-700 font-bold hover:bg-green-50"
                    >
                      আমার প্রোফাইলে যান
                    </Button>
                  </div>
                )}
              </Card>

              {isTrackingActive && (
                <div className="w-full mt-8 space-y-4">
                  <h4 className="font-bold flex items-center gap-2 mb-2 ml-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    সার্চ রেজাল্ট: {trackedOrders.length}টি অর্ডার
                  </h4>
                  {trackedOrders.length === 0 ? (
                    <Card className="p-12 text-center bg-white rounded-3xl border border-dashed text-gray-400">
                      এই নাম্বারে কোনো অর্ডার পাওয়া যায়নি।
                    </Card>
                  ) : (
                    trackedOrders.map(order => (
                      <Card key={order.id} className="overflow-hidden border-none shadow-sm bg-white rounded-3xl">
                        <div className={`h-1.5 w-full ${
                          order.status === 'pending' ? 'bg-yellow-400' : 
                          order.status === 'confirmed' ? 'bg-blue-400' : 
                          order.status === 'shipped' ? 'bg-indigo-400' :
                          order.status === 'delivered' ? 'bg-green-400' : 'bg-red-500'
                        }`} />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <Badge className={
                                  order.status === 'pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                  order.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                  order.status === 'shipped' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                  order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                }>
                                  {statusLabels[order.status] || order.status}
                                </Badge>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">অর্ডার আইডি: #{order.id.slice(-6)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-green-800 tracking-tighter">৳{order.total}</p>
                                <p className="text-[10px] font-bold text-gray-400">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('bn-BD') : ""}</p>
                              </div>
                            </div>

                            <div className="relative flex justify-between items-center mb-8 px-4">
                              <div className="absolute left-8 right-8 h-0.5 bg-gray-100 z-0" />
                              {[1, 2, 3, 4].map(step => (
                                <div 
                                  key={step}
                                  className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                                    getStatusStep(order.status) >= step 
                                      ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-200" 
                                      : "bg-white border-gray-100 text-gray-300"
                                  }`}
                                >
                                  {getStatusStep(order.status) > step ? <Check size={14} /> : step}
                                </div>
                              ))}
                            </div>

                            <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="h-5 w-5 rounded-md bg-white border border-gray-100 flex items-center justify-center font-bold text-[10px] text-gray-400">{idx+1}</span>
                                    <span className="text-gray-700 font-medium">{item.name}</span>
                                  </div>
                                  <span className="font-bold text-gray-900">৳{item.price} x {item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            {/* Payment Info in Tracking for Customer */}
                            {(order.paymentMethod === 'bKash' || order.paymentMethod === 'Nagad') && order.paymentNumber && (
                              <div className="mt-4 p-4 border border-green-100 bg-green-50/30 rounded-2xl flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-green-600 uppercase block mb-0.5">পেমেন্ট নম্বর ({order.paymentMethod})</span>
                                  <span className="text-sm font-mono font-bold text-green-800">{order.paymentNumber}</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-9 rounded-xl bg-white text-green-700 border border-green-100 hover:bg-green-50 font-bold gap-2"
                                  onClick={() => {
                                    navigator.clipboard.writeText(order.paymentNumber);
                                    setToastMessage("নম্বর কপি করা হয়েছে");
                                    setShowToast(true);
                                  }}
                                >
                                  <Copy size={14} />
                                  কপি
                                </Button>
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      {!isCustomerMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t px-4 py-3 flex items-center justify-around shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "home" ? "text-green-700" : "text-gray-400"}`}
          >
            <Home size={22} />
            <span className="text-[10px] font-bold">হোম</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab("admin");
              setAdminSubTab("orders");
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "admin" && adminSubTab === "orders" ? "text-green-700" : "text-gray-400"}`}
          >
            <ListOrdered size={22} />
            <span className="text-[10px] font-bold">অর্ডার</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab("admin");
              setAdminSubTab("users");
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "admin" && adminSubTab === "users" ? "text-green-700" : "text-gray-400"}`}
          >
            <UserIcon size={22} />
            <span className="text-[10px] font-bold">ইউজার</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab("admin");
              setAdminSubTab("settings");
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "admin" && adminSubTab === "settings" ? "text-green-700" : "text-gray-400"}`}
          >
            <Settings size={22} />
            <span className="text-[10px] font-bold">সেটিংস</span>
          </button>
        </nav>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-24 left-1/2 z-50 flex items-center gap-3 rounded-full bg-green-800 px-6 py-3 text-white shadow-2xl"
          >
            <ShoppingBasket className="h-5 w-5" />
            <span className="text-sm font-bold">{toastMessage}</span>
            <div className="h-1 w-1 rounded-full bg-white/50" />
            <button 
              onClick={() => {
                // Trigger the cart sheet to open
                const cartButton = document.querySelector('[aria-haspopup="dialog"]');
                if (cartButton instanceof HTMLElement) cartButton.click();
              }} 
              className="text-xs font-bold underline underline-offset-4"
            >
              ব্যাগ দেখুন
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Sound */}
      <audio ref={notificationAudio} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Phone Login Modal */}
      <AnimatePresence>
        {showPhoneLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-green-700 p-8 text-white text-center relative">
                <button 
                  onClick={() => setShowPhoneLogin(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-green-700 shadow-lg">
                  <Phone size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">লগইন করুন</h3>
                <p className="text-green-50 opacity-90">আপনার ফোন নম্বর দিয়ে লগইন করুন</p>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">আপনার নাম</label>
                  <Input 
                    placeholder="নাম লিখুন" 
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">ফোন নম্বর</label>
                  <Input 
                    placeholder="০১৭XXXXXXXX" 
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button 
                  onClick={handlePhoneLogin}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-green-100 mt-4"
                >
                  লগইন সম্পন্ন করুন
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Promo Order Modal */}
      <AnimatePresence>
        {showPromoModal && (
          <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl pb-10 md:pb-0"
            >
              <div className="bg-green-700 p-8 text-white relative">
                <button 
                  onClick={() => setShowPromoModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/30">
                  <Star size={32} className="fill-white" />
                </div>
                <h3 className="text-2xl font-black">{config.promoServiceTitle || "স্পেশাল সার্ভিস"}</h3>
                <p className="text-green-50 opacity-80 text-sm mt-1">অর্ডার সম্পন্ন করতে অ্যামাউন্ট লিখে কনফার্ম করুন</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">টাকার পরিমাণ (৳)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400">৳</span>
                    <Input 
                      type="number"
                      value={promoAmount}
                      onChange={e => setPromoAmount(e.target.value)}
                      placeholder={String(config.promoServiceDefaultAmount || "0")}
                      className="h-20 pl-10 text-4xl font-black rounded-3xl border-gray-100 bg-gray-50 focus:ring-green-500 text-green-700"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic">পণ্য যেভাবে ডেলিভারি পান, ঠিক সেভাবেই এই সেবাটি পাবেন।</p>
                </div>

                <div className="space-y-4">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Wallet className="text-green-600" size={14} /> ওয়ালেট সিলেক্ট করুন
                   </label>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'bKash', label: 'বিকাশ', color: 'bg-[#D12053]', icon: 'b' },
                        { id: 'Nagad', label: 'নগদ', color: 'bg-[#F7941D]', icon: 'n' },
                        { id: 'Rocket', label: 'রকেট', color: 'bg-[#8C3494]', icon: 'r' }
                      ].map(wallet => (
                        <button
                          key={wallet.id}
                          onClick={() => setPromoWallet(wallet.id)}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                            promoWallet === wallet.id 
                              ? "border-green-600 bg-green-50 shadow-md scale-[1.02]" 
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <div className={`h-12 w-12 ${wallet.color} rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transform transition-transform ${promoWallet === wallet.id ? 'scale-110' : ''}`}>
                            {wallet.icon}
                          </div>
                          <span className="text-xs font-bold">{wallet.label}</span>
                          {promoWallet === wallet.id && (
                            <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                               <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="bg-green-50 p-6 rounded-[24px] border border-green-100 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon size={16} className="text-green-600" />
                      <span className="text-xs font-bold text-gray-500 uppercase">আপনার নাম</span>
                    </div>
                    <Input 
                      value={checkoutInfo.name}
                      onChange={e => setCheckoutInfo({...checkoutInfo, name: e.target.value})}
                      placeholder="আপনার নাম লিখুন"
                      className="bg-white border-green-100 focus:ring-green-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone size={16} className="text-green-600" />
                      <span className="text-xs font-bold text-gray-500 uppercase">ফোন নাম্বার</span>
                    </div>
                    <Input 
                      value={checkoutInfo.phone}
                      onChange={e => setCheckoutInfo({...checkoutInfo, phone: e.target.value})}
                      placeholder="ফোন নাম্বার লিখুন"
                      className="bg-white border-green-100 focus:ring-green-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-green-600" />
                        <span className="text-xs font-bold text-gray-500 uppercase">ডেলিভারি ঠিকানা</span>
                      </div>
                      <button 
                        onClick={async () => {
                          const loc = await getUserLocation();
                          if (loc) {
                            setCheckoutInfo({
                              ...checkoutInfo, 
                              address: checkoutInfo.address || "আমার বর্তমান অবস্থান (ম্যাপ লিংক সহ সেভ করা হয়েছে)"
                            });
                            setToastMessage("আপনার লোকেশন ডিটেক্ট করা হয়েছে।");
                            setShowToast(true);
                          } else {
                            setToastMessage("লোকেশন পাওয়া যায়নি। অনুগ্রহ করে পারমিশন দিন।");
                            setShowToast(true);
                          }
                        }}
                        disabled={isFetchingLocation}
                        className="text-[10px] font-bold text-green-700 bg-white px-2 py-1 rounded-full border border-green-200 hover:bg-green-50 transition-colors flex items-center gap-1"
                      >
                        {isFetchingLocation ? "খুঁজছি..." : "লোকেশন দিন"}
                      </button>
                    </div>
                    <Input 
                      value={checkoutInfo.address}
                      onChange={e => setCheckoutInfo({...checkoutInfo, address: e.target.value})}
                      placeholder="আপনার পূর্ণাঙ্গ ঠিকানা লিখুন"
                      className="bg-white border-green-100 focus:ring-green-500 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                   <Button 
                    variant="outline"
                    onClick={() => setShowPromoModal(false)}
                    className="flex-1 h-16 rounded-2xl font-bold border-gray-100"
                  >
                    বাতিল
                  </Button>
                  <Button 
                    onClick={handlePlacePromoOrder}
                    disabled={isPlacingPromoOrder}
                    className="flex-[2] h-16 rounded-2xl bg-green-700 hover:bg-green-800 font-black text-xl shadow-xl shadow-green-100 text-white"
                  >
                    {isPlacingPromoOrder ? "প্রসেসিং..." : "কনফার্ম করুন"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Install Modal */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-green-700 p-8 text-white text-center relative">
                <button 
                  onClick={closeInstallModal}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-green-700 shadow-lg overflow-hidden">
                  {config.appIcon ? (
                    <img src={config.appIcon} alt="App Icon" className="h-full w-full object-cover" />
                  ) : (
                    <Store size={40} />
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">{config.storeName || "ওয়াসিম স্টোর"} অ্যাপ</h3>
                <p className="text-green-50 opacity-90">সেরা অভিজ্ঞতার জন্য আমাদের অ্যাপটি আপনার মোবাইলে ইন্সটল করুন</p>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Check size={18} />
                    </div>
                    <p className="text-sm font-medium">এক ক্লিকেই কেনাকাটা করুন</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Check size={18} />
                    </div>
                    <p className="text-sm font-medium">অর্ডারের লেটেস্ট আপডেট পান</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Check size={18} />
                    </div>
                    <p className="text-sm font-medium">অফলাইন মোডেও পণ্য দেখুন</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {deferredPrompt ? (
                    <Button 
                      onClick={handleInstallApp}
                      className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-green-100"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      এখনই ইন্সটল করুন
                    </Button>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                      <p className="text-xs text-amber-800 font-bold mb-1">সরাসরি ইন্সটল সম্ভব হচ্ছে না</p>
                      <p className="text-[10px] text-amber-700 leading-tight">
                        ম্যানুয়ালি ইন্সটল করতে ব্রাউজারের উপরে থাকা <strong className="text-amber-900 leading-none">৩-ডট মেনু (⋮)</strong> ক্লিক করে <strong className="text-amber-900 leading-none">'Install App'</strong> বা <strong className="text-amber-900 leading-none">'Add to Home Screen'</strong> আইকনটি খুঁজুন।
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={closeInstallModal}
                    className="w-full text-sm text-gray-500 font-medium py-2 hover:text-gray-700"
                  >
                    পরে করবো
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-full border-green-200 text-green-700 hover:bg-green-50 h-9 px-4 text-xs"
                onClick={() => window.open(`tel:${config.storePhone}`)}
              >
                <Phone size={14} className="mr-2" /> কল করুন
              </Button>
              {config.whatsappNumber && (
                <Button 
                  size="sm" 
                  className="rounded-full bg-green-600 hover:bg-green-700 text-white h-9 px-4 text-xs"
                  onClick={() => window.open(`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}`)}
                >
                  <WhatsAppIcon size={14} className="mr-2" /> হোয়াটসঅ্যাপ
                </Button>
              )}
            </div>
            
            {config.promoButtonTitle && config.promoButtonLink && (
              <div className="w-full max-w-xs mx-auto">
                <Button 
                  onClick={() => window.open(config.promoButtonLink, '_blank')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-2xl shadow-lg shadow-blue-100 text-sm"
                >
                  {config.promoButtonTitle}
                </Button>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground space-y-1">
              <p>ঠিকানা: {config.storeAddress}</p>
              <p>© ২০২৬ {config.storeName || "ওয়াসিম স্টোর"}। সর্বস্বত্ব সংরক্ষিত। <span className="opacity-30">v1.0.2</span></p>
            </div>
          </div>
        </div>
      </footer>

      {/* Print Receipt Section - Visible Only During Print */}
      <div id="print-section" className="hidden print:block fixed inset-0 bg-white z-[9999] p-4">
        {printableOrder && (
          <div className="max-w-[260px] mx-auto bg-white p-4 border border-gray-100 rounded-none shadow-none">
            <div className="text-center mb-4">
              <h2 className="text-xl font-black text-gray-900 leading-tight">{config.storeName}</h2>
              <p className="text-[10px] font-bold text-gray-600">{config.storeSubtext}</p>
              <div className="mt-1 text-[8px] text-gray-500 flex flex-col items-center">
                <span>{config.storeAddress}</span>
                <span>মোবাইল: {config.storePhone}</span>
              </div>
            </div>
            
            <div className="border-t border-b border-dashed py-3 my-3 space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold">তারিখ:</span>
                <span>{printableOrder.createdAt?.toDate ? printableOrder.createdAt.toDate().toLocaleString('bn-BD') : new Date().toLocaleString('bn-BD')}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-bold">অর্ডার আইডি:</span>
                <span className="font-mono">#{printableOrder.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-bold">কাস্টমার:</span>
                <span>{printableOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="font-bold">ফোন:</span>
                <span>{printableOrder.customerPhone}</span>
              </div>
              {printableOrder.customerAddress && printableOrder.customerAddress !== "In-Store" && printableOrder.customerAddress !== "প্রমোশনাল সার্ভিস" && (
                <div className="flex justify-between text-[10px]">
                  <span className="font-bold shrink-0">ঠিকানা:</span>
                  <span className="text-right ml-4 break-words">{printableOrder.customerAddress}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black border-b border-gray-100 pb-1">
                <span>বিবরণ</span>
                <div className="flex gap-4">
                  <span>পরিমাণ</span>
                  <span>দাম</span>
                </div>
              </div>
              {printableOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px] leading-tight pb-1">
                  <span className="truncate max-w-[120px]">{item.name}</span>
                  <div className="flex gap-4">
                    <span>{item.quantity}</span>
                    <span className="font-bold italic">৳{item.price * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-dashed space-y-1">
              <div className="flex justify-between text-[10px]">
                <span>সাব-টোটাল</span>
                <span className="font-bold">৳{printableOrder.subtotal || printableOrder.totalPrice - (printableOrder.paymentFee || 0)}</span>
              </div>
              {(printableOrder.paymentFee || 0) > 0 && (
                <div className="flex justify-between text-[10px]">
                  <span>পেমেন্ট চার্জ</span>
                  <span className="font-bold">৳{printableOrder.paymentFee}</span>
                </div>
              )}
              {(printableOrder.deliveryCharge || 0) > 0 && (
                <div className="flex justify-between text-[10px]">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="font-bold">৳{printableOrder.deliveryCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-gray-900 pt-2 pb-1">
                <span>সর্বমোট</span>
                <span>৳{printableOrder.totalPrice}</span>
              </div>
              <div className="text-[9px] text-gray-700 italic border-t border-gray-50 pt-2">
                <p>পেমেন্ট: {printableOrder.paymentMethod}</p>
                {printableOrder.paymentNumber && <p>পেমেন্ট নাম্বার: {printableOrder.paymentNumber}</p>}
              </div>
            </div>

            <div className="mt-8 text-center space-y-1">
              <p className="text-[9px] font-bold text-gray-900 italic">পণ্য পরিবর্তনের জন্য এই মেমোটি অবশ্যই সাথে আনবেন। ধন্যবাদ!</p>
              <div className="flex justify-center items-center gap-2 pt-2">
                <div className="h-[1px] w-6 bg-gray-200" />
                <span className="text-[7px] uppercase tracking-widest text-gray-400 font-bold">ওয়াসিম স্টোর</span>
                <div className="h-[1px] w-6 bg-gray-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print View Overlay (Preview before printing) */}
      <AnimatePresence>
        {showPrintMemo && printableOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">ক্যাশ মেমো প্রিভিউ</h3>
                  <p className="text-purple-100 text-xs">আপনার প্রিন্টার থেকে রিসিট প্রিন্ট করুন</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => setShowPrintMemo(false)}
                >
                  <X />
                </Button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto">
                <div className="max-w-[260px] mx-auto bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 shadow-inner">
                  <div className="text-center mb-4">
                    <h2 className="text-base font-black text-gray-900">{config.storeName}</h2>
                    <p className="text-[9px] text-gray-500 font-bold">{config.storeAddress}</p>
                  </div>
                  
                  <div className="space-y-1 mb-3 border-b border-gray-200 pb-3">
                    <div className="flex justify-between text-[9px]">
                      <span className="text-gray-500">অর্ডার আইডি:</span>
                      <span className="font-bold">#{printableOrder.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-gray-500">ক্রেতা:</span>
                      <span className="font-bold">{printableOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-gray-500">ফোন:</span>
                      <span className="font-bold">{printableOrder.customerPhone}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {printableOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-[9px]">
                        <span className="truncate max-w-[140px]">{item.name} x {item.quantity}</span>
                        <span className="font-bold">৳{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-gray-900 space-y-1 mt-1.5">
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>সাব-টোটাল:</span>
                        <span>৳{printableOrder.subtotal || printableOrder.totalPrice - (printableOrder.paymentFee || 0)}</span>
                      </div>
                      {(printableOrder.paymentFee || 0) > 0 && (
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>পেমেন্ট চার্জ:</span>
                          <span>৳{printableOrder.paymentFee}</span>
                        </div>
                      )}
                      {(printableOrder.deliveryCharge || 0) > 0 && (
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>ডেলিভারি চার্জ:</span>
                          <span>৳{printableOrder.deliveryCharge}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-black pt-1">
                        <span>সর্বমোট:</span>
                        <span>৳{printableOrder.totalPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex flex-wrap gap-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-2xl font-bold border-gray-200"
                  onClick={() => setShowPrintMemo(false)}
                >
                  বন্ধ করুন
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
                  onClick={() => {
                    const text = `🛒 *অর্ডার রিসিট - ${config.storeName}*\n\n` +
                      `অর্ডার আইডি: #${printableOrder.id.slice(-6).toUpperCase()}\n` +
                      `কাস্টমার: ${printableOrder.customerName}\n` +
                      `ফোন: ${printableOrder.customerPhone}\n` +
                      (printableOrder.customerAddress && printableOrder.customerAddress !== "In-Store" ? `ঠিকানা: ${printableOrder.customerAddress}\n` : "") +
                      `\n*পণ্যসমূহ:*\n` +
                      printableOrder.items.map(i => `- ${i.name} x ${i.quantity} = ৳${i.price * i.quantity}`).join('\n') +
                      `\n\nসাব-টোটাল: ৳${printableOrder.subtotal || printableOrder.totalPrice - (printableOrder.paymentFee || 0)}\n` +
                      (printableOrder.paymentFee ? `পেমেন্ট চার্জ: ৳${printableOrder.paymentFee}\n` : "") +
                      (printableOrder.deliveryCharge ? `ডেলিভারি চার্জ: ৳${printableOrder.deliveryCharge}\n` : "") +
                      `*সর্বমোট: ৳${printableOrder.totalPrice}*\n` +
                      `পেমেন্ট: ${printableOrder.paymentMethod}\n\n` +
                      `ধন্যবাদ!`;
                    navigator.share?.({
                      title: 'অর্ডার রিসিট',
                      text: text
                    }).catch(() => {
                      navigator.clipboard.writeText(text);
                      setToastMessage("রিসিট কপি করা হয়েছে!");
                      setShowToast(true);
                    });
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  শেয়ার করুন
                </Button>
                <Button 
                  className="w-full h-12 rounded-2xl font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100"
                  onClick={() => {
                    setTimeout(() => {
                      window.print();
                    }, 500);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  প্রিন্ট করুন
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
