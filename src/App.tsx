/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBasket, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Store, 
  ChevronRight,
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
  Star,
  MessageSquare,
  AlertCircle,
  Download,
  MapPin,
  Bell,
  Camera,
  Copy,
  ArrowLeft,
  User as UserIcon
} from "lucide-react";
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
  writeBatch,
  increment
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
  unit: string;
  category: string;
  image: string;
  inStock?: boolean;
  stockQuantity?: number;
  soldCount?: number;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  phone: string;
  name: string;
  image?: string;
  lastLogin?: any;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  paymentMethod: string;
  location?: { lat: number, lng: number } | null;
  createdAt: any;
  uid?: string; // Add UID to link orders to logged in users
}

interface StoreNotification {
  id: string;
  title: string;
  message: string;
  createdAt: any;
}

interface StoreConfig {
  storeName?: string;
  storeSubtext?: string;
  bkashNumber: string;
  nagadNumber: string;
  whatsappNumber?: string;
  imoNumber?: string;
  storeAddress: string;
  storePhone: string;
  storeEmail?: string;
  storeLogo?: string;
  appIcon?: string;
  heroTitle?: string;
  heroSubtext?: string;
  heroImage?: string;
  adminEmail?: string;
  adminPassword?: string;
  announcementText?: string;
  showAnnouncement?: boolean;
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
  const isOutOfStock = product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
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
      <Card className={`group h-full overflow-hidden border-none bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1 rounded-2xl ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
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
              <Badge variant="destructive" className="font-bold">স্টক আউট</Badge>
            )}
            {!isOutOfStock && product.stockQuantity !== undefined && product.stockQuantity < 10 && (
              <Badge className="bg-amber-500 text-white border-none">অল্প স্টক আছে: {product.stockQuantity}</Badge>
            )}
          </div>
          <button 
            onClick={() => onShare(product)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-green-700 shadow-sm backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
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
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
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

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [config, setConfig] = useState<StoreConfig>({
    storeName: "ওয়াসিম স্টোর",
    storeSubtext: "মোদী মাল বিক্রেতা",
    bkashNumber: "",
    nagadNumber: "",
    whatsappNumber: "",
    imoNumber: "",
    storeAddress: "বাজার রোড, ঢাকা",
    storePhone: "+৮৮০ ১২৩৪৫৬৭৮৯০",
    storeEmail: "wasimstore@example.com",
    storeLogo: "https://picsum.photos/seed/store/192/192",
    appIcon: "https://picsum.photos/seed/store/512/512",
    heroTitle: "সেরা মানের মোদী মাল এখন আপনার হাতের নাগালে",
    heroSubtext: "ওয়াসিম স্টোরে পাবেন একদম টাটকা এবং ভেজালমুক্ত নিত্যপ্রয়োজনীয় পণ্য। আজই অর্ডার করুন!",
    adminEmail: "mdgaziwasim@gmail.com",
    adminPassword: "",
    announcementText: "১০০ টাকার পণ্য ক্রয় করলে ডেলিভারি ফ্রি!",
    showAnnouncement: true
  });
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
  const [customers, setCustomers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [notificationInput, setNotificationInput] = useState({ title: "", message: "" });

  const handleSendNotification = async () => {
    if (!notificationInput.title || !notificationInput.message) return;
    try {
      await addDoc(collection(db, "notifications"), {
        ...notificationInput,
        createdAt: serverTimestamp()
      });
      setNotificationInput({ title: "", message: "" });
      setToastMessage("নোটিফিকেশন পাঠানো হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Notification error:", error);
    }
  };
  const [trackingPhone, setTrackingPhone] = useState("");
  const [isTrackingActive, setIsTrackingActive] = useState(false);

  const trackedOrders = useMemo(() => {
    if (!isTrackingActive || !trackingPhone) return [];
    return orders.filter(o => o.customerPhone === trackingPhone);
  }, [orders, trackingPhone, isTrackingActive]);

  const [orderFilter, setOrderFilter] = useState<"pending" | "delivered">("pending");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [reviewInput, setReviewInput] = useState({
    customerName: "",
    rating: 5,
    comment: ""
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const notificationAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
  }, []);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const salesSummary = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const total = validOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const online = validOrders
      .filter(o => o.paymentMethod !== 'Cash on Delivery')
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const cash = validOrders
      .filter(o => o.paymentMethod === 'Cash on Delivery')
      .reduce((sum, o) => sum + o.totalPrice, 0);
    
    return { total, online, cash };
  }, [orders]);

  // Admin Form States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    unit: "কেজি",
    category: "চাল",
    image: "https://picsum.photos/seed/grocery/400/300",
    inStock: true,
    stockQuantity: 0,
    soldCount: 0
  });
  const [isCustomerMode, setIsCustomerMode] = useState(false);
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
    if (!deferredPrompt) return;
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
    paymentMethod: "Cash on Delivery"
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // Load phone user from localStorage
    const savedPhoneUser = localStorage.getItem('phoneUser');
    if (savedPhoneUser) {
      setPhoneUser(JSON.parse(savedPhoneUser));
    }

    const qProducts = query(collection(db, "products"), orderBy("name"));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const pList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(pList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products", setToastMessage, setShowToast);
    });

    const qCategories = query(collection(db, "categories"), orderBy("name"));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const cList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "categories", setToastMessage, setShowToast);
    });

    const qReviews = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10));
    const unsubscribeReviews = onSnapshot(qReviews, (snapshot) => {
      const rList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(rList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "reviews", setToastMessage, setShowToast);
    });

    const unsubscribeConfig = onSnapshot(doc(db, "config", "store"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as StoreConfig);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "config/store", setToastMessage, setShowToast);
    });

    const qNotifications = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(10));
    const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
      const nList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreNotification));
      // Auto-delete logic: Filter out notifications older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filtered = nList.filter(n => {
        const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
        return date > thirtyDaysAgo;
      });
      setNotifications(filtered);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications", setToastMessage, setShowToast);
    });

    // Load hidden notifications
    const savedHidden = localStorage.getItem('hiddenNotifications');
    if (savedHidden) setHiddenNotifications(JSON.parse(savedHidden));

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeReviews();
      unsubscribeConfig();
      unsubscribeNotifications();
    };
  }, []);

  // Fetch customer orders if logged in via phone
  useEffect(() => {
    if (phoneUser) {
      // Use a simpler query to avoid composite index issues if possible, 
      // or just handle the potential lack of index by filtering in memory if needed.
      // But for now, we'll stick to the query and hope the user has indexes or we can simplify.
      const q = query(
        collection(db, "orders"), 
        where("customerPhone", "==", phoneUser.phone)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const oList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        // Sort in memory to avoid index requirement
        const sortedOrders = oList.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
          return dateB.getTime() - dateA.getTime();
        });
        setCustomerOrders(sortedOrders);
      }, (error) => {
        console.error("Customer orders fetch error:", error);
      });
      return () => unsubscribe();
    } else {
      setCustomerOrders([]);
    }
  }, [phoneUser]);

  useEffect(() => {
    // Only subscribe to orders if admin
    let unsubscribeOrders = () => {};
    const isAdminUser = user?.email === "mdgaziwasim@gmail.com" || (config.adminEmail && user?.email === config.adminEmail);
    
    if (isAdminUser) {
      const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const oList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        // Play sound if new order arrives (and it's not the first load)
        if (lastOrderCount !== null && oList.length > lastOrderCount) {
          notificationAudio.current?.play().catch(e => console.log("Audio play failed:", e));
          setToastMessage("নতুন অর্ডার এসেছে!");
          setShowToast(true);
        }
        
        setOrders(oList);
        setLastOrderCount(oList.length);
      });

      const qCustomers = query(collection(db, "customers"), orderBy("lastLogin", "desc"));
      const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
        const cList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(cList);
      });

      return () => {
        unsubscribeOrders();
        unsubscribeCustomers();
      };
    }

    return () => {
      unsubscribeOrders();
    };
  }, [user, config.adminEmail, lastOrderCount]);

  useEffect(() => {
    if (user && config) {
      const userEmail = user.email?.toLowerCase().trim();
      const adminEmail = config.adminEmail?.toLowerCase().trim();
      setIsAdmin(userEmail === adminEmail || userEmail === "mdgaziwasim@gmail.com");
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

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

  const handlePlaceOrder = async () => {
    if (!checkoutInfo.name || !checkoutInfo.phone || !checkoutInfo.address) {
      setToastMessage("দয়া করে সব তথ্য পূরণ করুন");
      setShowToast(true);
      return;
    }

    if (isPlacingOrder) return;

    setIsPlacingOrder(true);
    
    // Try to get location
    let location = null;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (e) {
      console.log("Location access denied or failed:", e);
    }

    try {
      const batch = writeBatch(db);
      
      // Create order reference with auto-generated ID
      const orderRef = doc(collection(db, "orders"));
      
      batch.set(orderRef, {
        customerName: checkoutInfo.name,
        customerPhone: checkoutInfo.phone,
        customerAddress: checkoutInfo.address,
        items: cart,
        totalPrice,
        status: "pending",
        paymentMethod: checkoutInfo.paymentMethod,
        location,
        uid: user?.uid || null,
        phoneUser: phoneUser?.phone || null,
        createdAt: serverTimestamp()
      });

      // Update stock for each item
      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        batch.update(productRef, {
          stockQuantity: increment(-item.quantity),
          soldCount: increment(item.quantity)
        });
      }
      
      await batch.commit();

      setCart([]);
      setIsOrderSuccess(true);
      setToastMessage("অর্ডার সফল হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Order error:", error);
      setToastMessage("অর্ডার করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
      setShowToast(true);
    } finally {
      setIsPlacingOrder(false);
    }
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
        unit: "কেজি", 
        category: "চাল", 
        image: "https://picsum.photos/seed/grocery/400/300",
        stockQuantity: 0,
        soldCount: 0,
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
    await updateDoc(doc(db, "orders", orderId), { status });
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

  useEffect(() => {
    if (config.appIcon) {
      // Update Favicon
      let iconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = config.appIcon;

      // Update Apple Touch Icon
      let appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleIconLink);
      }
      appleIconLink.href = config.appIcon;

      // Update Manifest dynamically
      const manifest = {
        "name": "ওয়াসিম স্টোর",
        "short_name": "ওয়াসিম স্টোর",
        "description": "সেরা মানের মোদী মাল সরাসরি আপনার দরজায়",
        "start_url": "/?s",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#166534",
        "icons": [
          {
            "src": config.appIcon,
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": config.appIcon,
            "sizes": "512x512",
            "type": "image/png"
          }
        ]
      };
      const stringManifest = JSON.stringify(manifest);
      const blob = new Blob([stringManifest], {type: 'application/json'});
      const manifestURL = URL.createObjectURL(blob);
      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (manifestLink) {
        manifestLink.href = manifestURL;
      }
    }
  }, [config.appIcon]);

  const handleUpdateConfig = async () => {
    try {
      await setDoc(doc(db, "config", "store"), config);
      setToastMessage("সেটিংস সেভ হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Update config error:", error);
      setToastMessage("সেটিংস সেভ করতে সমস্যা হয়েছে। সম্ভবত ছবির সাইজ অনেক বড়।");
      setShowToast(true);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, "categories"), { name: newCategoryName.trim() });
      setNewCategoryName("");
    } catch (error) {
      console.error("Add category error:", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      setToastMessage("ক্যাটাগরি মুছে ফেলা হয়েছে।");
      setShowToast(true);
    } catch (error) {
      console.error("Delete category error:", error);
    }
  };

  const handleTrackOrder = () => {
    if (!trackingPhone) return;
    setIsTrackingActive(true);
    const found = orders.filter(o => o.customerPhone === trackingPhone);
    if (found.length === 0) {
      setToastMessage("এই নাম্বারে কোনো অর্ডার পাওয়া যায়নি।");
      setShowToast(true);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const statusLabels = [
    { label: "পেন্ডিং", status: "pending" },
    { label: "নিশ্চিত", status: "confirmed" },
    { label: "অন দ্য ওয়ে", status: "shipped" },
    { label: "ডেলিভারি", status: "delivered" },
    { label: "বাতিল", status: "cancelled" }
  ];

  const handleAdminUnlock = () => {
    const savedPassword = config.adminPassword?.trim();
    const enteredPassword = passwordInput.trim();
    
    if (!savedPassword || enteredPassword === savedPassword) {
      setIsAdminUnlocked(true);
      setPasswordInput("");
      setShowPassword(false);
    } else {
      setToastMessage("ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।");
      setShowToast(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsAdminUnlocked(false);
    setPasswordInput("");
    setShowPassword(false);
  };

  const compressImage = (file: File, maxWidth: number = 800): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'product' | 'logo' | 'hero' | 'appIcon' = 'product') => {
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
    const baseUrl = origin + window.location.pathname;
    const shareUrl = `${baseUrl}?s`;
    const shareText = `${config.storeName || "ওয়াসিম স্টোর"} থেকে সেরা মানের মোদী মাল কিনুন!`;
    
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

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewInput.customerName || !reviewInput.comment) {
      setToastMessage("দয়া করে নাম এবং মন্তব্য লিখুন।");
      setShowToast(true);
      return;
    }

    try {
      await addDoc(collection(db, "reviews"), {
        ...reviewInput,
        createdAt: serverTimestamp()
      });
      setReviewInput({ customerName: "", rating: 5, comment: "" });
      setToastMessage("আপনার রিভিউ দেওয়ার জন্য ধন্যবাদ!");
      setShowToast(true);
    } catch (error) {
      console.error("Review error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] text-[#2d2d2d] font-sans overflow-x-hidden">
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
                  {notifications.length > 0 && (
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
                <div className="flex flex-col items-center gap-2">
                  <Button className="h-20 w-20 rounded-full bg-green-600 hover:bg-green-700 shadow-[0_8px_30px_rgb(22,163,74,0.4)] flex flex-col items-center justify-center gap-1 border-4 border-white">
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
                  </Button>
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl border border-green-100 max-w-[180px] text-center">
                    <p className="text-[10px] font-bold text-green-800 leading-tight">
                      আপনার বাছাইকৃত পণ্য এই ব্যাগে যোগ হয়েছে এখানে অর্ডার করুন
                    </p>
                  </div>
                </div>
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
                      className="w-full border-green-200 text-green-700 font-bold h-12 rounded-xl"
                      onClick={() => {
                        setIsCartOpen(false);
                        setIsOrderSuccess(false);
                        const reviewSection = document.getElementById('review-section');
                        if (reviewSection) {
                          reviewSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      রিভিউ দিন
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
                        <Input placeholder="ঠিকানা" value={checkoutInfo.address} onChange={e => setCheckoutInfo({...checkoutInfo, address: e.target.value})} />
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
                        </div>
                        {checkoutInfo.paymentMethod !== 'Cash on Delivery' && (
                          <div className="space-y-2 p-3 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-[10px] text-center text-green-700 font-bold uppercase tracking-wider">
                              {checkoutInfo.paymentMethod} পেমেন্ট
                            </p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-black text-green-900">
                                {checkoutInfo.paymentMethod === 'bKash' ? config.bkashNumber : config.nagadNumber}
                              </span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-green-600 hover:bg-white rounded-full"
                                onClick={() => {
                                  const num = checkoutInfo.paymentMethod === 'bKash' ? config.bkashNumber : config.nagadNumber;
                                  navigator.clipboard.writeText(num);
                                  setToastMessage("নাম্বার কপি করা হয়েছে!");
                                  setShowToast(true);
                                }}
                              >
                                <Copy size={12} />
                              </Button>
                            </div>
                            <div className="flex justify-center gap-2">
                              {checkoutInfo.paymentMethod === 'bKash' && config.bkashNumber && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-[10px] h-8 bg-pink-50 text-pink-700 border-pink-200 rounded-xl px-4"
                                  onClick={() => window.open(`tel:*247#`)}
                                >
                                  বিকাশ ডায়াল (*২৪৭#)
                                </Button>
                              )}
                              {checkoutInfo.paymentMethod === 'Nagad' && config.nagadNumber && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-[10px] h-8 bg-red-50 text-red-700 border-red-200 rounded-xl px-4"
                                  onClick={() => window.open(`tel:*167#`)}
                                >
                                  নগদ ডায়াল (*১৬৭#)
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex w-full items-center justify-between">
                        <span className="text-muted-foreground">মোট দাম:</span>
                        <span className="text-xl font-bold text-green-800">৳{totalPrice}</span>
                      </div>
                      <Button 
                        onClick={handlePlaceOrder} 
                        disabled={isPlacingOrder}
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-bold"
                      >
                        {isPlacingOrder ? "অর্ডার হচ্ছে..." : "অর্ডার করুন"}
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
            <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {categoryList.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-6 transition-all ${
                      selectedCategory === cat 
                        ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100" 
                        : "border-green-200 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
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
            {isCustomerMode && (
              <div className="mt-16" id="review-section">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">কাস্টমার রিভিউ</h2>
                    <p className="text-xs text-muted-foreground">আমাদের সম্পর্কে মতামত</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="fill-amber-500" size={16} />
                    <span className="text-lg font-bold">৪.৯/৫</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Review Form */}
                  <Card className="h-fit border-none shadow-sm rounded-2xl bg-green-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="text-green-600" size={16} />
                        আপনার মতামত দিন
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleReviewSubmit} className="space-y-3">
                        <Input 
                          placeholder="আপনার নাম"
                          value={reviewInput.customerName}
                          onChange={(e) => setReviewInput({...reviewInput, customerName: e.target.value})}
                          className="rounded-xl h-9 text-xs"
                        />
                        <div className="flex justify-center gap-2 py-1">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setReviewInput({...reviewInput, rating: num})}
                              className={`transition-colors ${reviewInput.rating >= num ? "text-amber-500" : "text-gray-300"}`}
                            >
                              <Star className={reviewInput.rating >= num ? "fill-amber-500" : ""} size={20} />
                            </button>
                          ))}
                        </div>
                        <textarea 
                          className="w-full min-h-[60px] rounded-xl border border-input bg-white px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="আপনার অভিজ্ঞতা..."
                          value={reviewInput.comment}
                          onChange={(e) => setReviewInput({...reviewInput, comment: e.target.value})}
                        />
                        <Button type="submit" size="sm" className="w-full bg-green-600 hover:bg-green-700 rounded-xl font-bold text-xs h-9">
                          জমা দিন
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Review List */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reviews.length === 0 ? (
                      <div className="col-span-full flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 text-muted-foreground text-xs">
                        এখনো কোনো রিভিউ নেই।
                      </div>
                    ) : (
                      reviews.slice(0, 4).map((review, idx) => (
                        <motion.div
                          key={review.id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className="border-none shadow-sm rounded-2xl h-full">
                            <CardContent className="p-4">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="font-bold text-green-800 text-xs">{review.customerName}</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <Star 
                                      key={num} 
                                      size={10} 
                                      className={review.rating >= num ? "fill-amber-500 text-amber-500" : "text-gray-200"} 
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-[11px] text-gray-600 italic line-clamp-2">"{review.comment}"</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
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
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Bell size={20} className="text-green-600" />
                    নোটিফিকেশন বক্স
                  </h4>
                  <div className="grid gap-3">
                    {visibleNotifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic p-4 bg-gray-50 rounded-xl border border-dashed">কোনো নতুন নোটিফিকেশন নেই।</p>
                    ) : (
                      visibleNotifications.map(notif => (
                        <Card key={notif.id} className="border-none shadow-sm bg-white overflow-hidden relative group">
                          <div className="h-1 w-full bg-green-500" />
                          <CardContent className="p-4 pr-12">
                            <h5 className="font-bold text-green-800">{notif.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-[10px] text-gray-400 mt-2">
                              {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('bn-BD') : "এখনই"}
                            </p>
                            <button 
                              onClick={() => hideNotification(notif.id)}
                              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-full"
                            >
                              <Trash2 size={16} />
                            </button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Package size={20} className="text-green-600" />
                    আমার অর্ডারসমূহ
                  </h4>
                  {customerOrders.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                      <Package size={48} className="mx-auto mb-4 opacity-20" />
                      <p>আপনার কোনো অর্ডার পাওয়া যায়নি।</p>
                      <Button variant="link" onClick={() => setActiveTab("home")} className="mt-2 text-green-700">কেনাকাটা শুরু করুন</Button>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {customerOrders.map(order => (
                        <Card key={order.id} className="overflow-hidden border-none shadow-sm">
                          <div className={`h-1 w-full ${
                            order.status === 'pending' ? 'bg-yellow-400' : 
                            order.status === 'confirmed' ? 'bg-blue-400' : 
                            order.status === 'delivered' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                                    {statusLabels.find(s => s.status === order.status)?.label || order.status}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('bn-BD') : "এখনই"}
                                  </span>
                                </div>
                                <h4 className="font-bold text-lg">অর্ডার আইডি: #{order.id.slice(-6).toUpperCase()}</h4>
                                <p className="text-sm text-muted-foreground">মোট মূল্য: <span className="text-green-700 font-bold">৳{order.totalPrice}</span></p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <img src={item.image} className="h-8 w-8 object-cover rounded" alt="" />
                                    <span className="text-xs font-medium">{item.name} x {item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <Card className="p-8 text-center bg-white shadow-xl border-none rounded-3xl">
                  <PackageSearch size={48} className="mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-bold mb-2">অর্ডার ট্র্যাকিং</h3>
                  <p className="text-sm text-muted-foreground mb-6">আপনার ফোন নম্বর দিয়ে লগইন করে সব অর্ডারের আপডেট জানুন।</p>
                  <Button onClick={() => setShowPhoneLogin(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-green-100">
                    লগইন করুন
                  </Button>
                </Card>

                <Card className="rounded-3xl border-none shadow-lg overflow-hidden">
                  <div className="bg-green-700 p-8 text-white">
                    <h3 className="text-2xl font-bold mb-2">কিভাবে মোবাইলে ইন্সটল করবেন?</h3>
                    <p className="opacity-80">আপনার মোবাইলে অ্যাপের মতো ব্যবহার করতে নিচের ধাপগুলো অনুসরণ করুন:</p>
                  </div>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">১</div>
                      <div>
                        <h4 className="font-bold mb-1">ব্রাউজারে ওপেন করুন</h4>
                        <p className="text-sm text-muted-foreground">আপনার মোবাইলের Chrome (Android) বা Safari (iPhone) ব্রাউজারে লিঙ্কটি ওপেন করুন।</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">২</div>
                      <div>
                        <h4 className="font-bold mb-1">মেনু বাটনে ক্লিক করুন</h4>
                        <p className="text-sm text-muted-foreground">Chrome-এ উপরে ডানদিকে তিনটি ডট (⋮) অথবা Safari-তে নিচে শেয়ার (Share) বাটনে ক্লিক করুন।</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 font-bold">৩</div>
                      <div>
                        <h4 className="font-bold mb-1">Add to Home Screen</h4>
                        <p className="text-sm text-muted-foreground">সেখান থেকে "Add to Home Screen" অপশনটি সিলেক্ট করুন। এখন আপনার মোবাইলের হোম স্ক্রিনে অ্যাপের আইকন চলে আসবে।</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-none shadow-lg overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-green-700" />
                      যোগাযোগ করুন
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <p className="text-muted-foreground mb-4">যেকোনো প্রয়োজনে আমাদের কল করুন অথবা সরাসরি দোকানে চলে আসুন।</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                        <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">ফোন</p>
                        <a href={`tel:${config.storePhone}`} className="font-bold hover:text-green-700 transition-colors">{config.storePhone}</a>
                      </div>
                      <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                        <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">ঠিকানা</p>
                        <p className="font-bold">{config.storeAddress}</p>
                      </div>
                      {config.whatsappNumber && (
                        <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                          <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">হোয়াটসঅ্যাপ</p>
                          <a href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="font-bold hover:text-green-700 transition-colors flex items-center gap-2">
                            <MessageSquare size={16} /> {config.whatsappNumber}
                          </a>
                        </div>
                      )}
                      {config.imoNumber && (
                        <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                          <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">ইমু</p>
                          <a href={`imo://chat?phone=${config.imoNumber.replace(/\D/g, '')}`} className="font-bold hover:text-green-700 transition-colors flex items-center gap-2">
                            <Phone size={16} /> {config.imoNumber}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {showInstallButton && (
                  <div className="mt-12 p-8 rounded-[32px] bg-amber-50 border border-amber-100 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                      <Download size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-amber-900 mb-2">{config.storeName || "ওয়াসিম স্টোর"} অ্যাপ ইন্সটল করুন</h3>
                    <p className="text-sm text-amber-700 opacity-80 mb-6">এক ক্লিকে কেনাকাটা করতে এবং অর্ডারের আপডেট পেতে অ্যাপটি ফোনে সেভ করুন।</p>
                    <Button 
                      onClick={handleInstallApp}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-10 py-6 rounded-2xl shadow-lg"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {config.storeName || "ওয়াসিম স্টোর"} অ্যাপ ইন্সটল করুন
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "admin" && (
          <div className="max-w-4xl mx-auto space-y-8">
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
            {!user ? (
              <Card className="p-12 text-center">
                <h3 className="text-2xl font-bold mb-4">অ্যাডমিন লগইন</h3>
                <Button onClick={loginWithGoogle} className="bg-green-600">
                  Google দিয়ে লগইন করুন
                </Button>
              </Card>
            ) : !isAdmin ? (
              <Card className="p-12 text-center text-red-500">
                <p className="mb-2">আপনি অ্যাডমিন নন।</p>
                <p className="text-sm text-gray-500 mb-4">লগইন ইমেইল: {user.email}</p>
                <Button variant="link" onClick={handleLogout}>লগআউট</Button>
              </Card>
            ) : !isAdminUnlocked && config.adminPassword && config.adminPassword.trim() !== "" ? (
              <Card className="mx-auto max-w-md p-8 border-none shadow-2xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="p-0 mb-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <LogIn className="text-green-700" size={32} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">নিরাপত্তা যাচাই</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">অ্যাডমিন প্যানেলে প্রবেশের জন্য পাসওয়ার্ড দিন।</p>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="পাসওয়ার্ড লিখুন" 
                      className="pr-10 h-12 rounded-xl border-gray-200 focus:ring-green-500"
                      value={passwordInput} 
                      onChange={e => setPasswordInput(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleAdminUnlock()}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <Button onClick={handleAdminUnlock} className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-95">
                    প্রবেশ করুন
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">অ্যাডমিন প্যানেল</h3>
                  <Button variant="outline" onClick={handleLogout}>লগআউট</Button>
                </div>

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
                      <Input 
                        type="number" 
                        placeholder="দাম" 
                        value={editingProduct ? editingProduct.price : newProduct.price} 
                        onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: Number(e.target.value)}) : setNewProduct({...newProduct, price: Number(e.target.value)})} 
                      />
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
                          {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                              <span className="font-medium">{cat.name}</span>
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
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone size={18} className="text-green-600" />
                        কাস্টমার তালিকা ({customers.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {customers.map(customer => (
                            <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border group hover:border-green-300 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                                  {customer.image ? (
                                    <img src={customer.image} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <UserIcon size={24} className="text-gray-400 m-auto mt-2" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{customer.name}</p>
                                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] text-gray-400">শেষ লগইন:</p>
                                  <p className="text-[10px] font-medium">
                                    {customer.lastLogin?.toDate ? customer.lastLogin.toDate().toLocaleString('bn-BD') : "অজানা"}
                                  </p>
                                </div>
                                {customer.image && (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full text-green-600 border-green-200 hover:bg-green-50"
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
                                    <Download size={14} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {customers.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-4">কোনো কাস্টমার নেই</p>
                          )}
                        </div>
                      </ScrollArea>
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
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="বিকাশ নাম্বার" value={config.bkashNumber} onChange={e => setConfig({...config, bkashNumber: e.target.value})} />
                        <Input placeholder="নগদ নাম্বার" value={config.nagadNumber} onChange={e => setConfig({...config, nagadNumber: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="হোয়াটসঅ্যাপ নাম্বার" value={config.whatsappNumber} onChange={e => setConfig({...config, whatsappNumber: e.target.value})} />
                        <Input placeholder="ইমু নাম্বার" value={config.imoNumber} onChange={e => setConfig({...config, imoNumber: e.target.value})} />
                      </div>
                      <Input placeholder="দোকানের ঠিকানা" value={config.storeAddress} onChange={e => setConfig({...config, storeAddress: e.target.value})} />
                      <Input placeholder="ফোন নাম্বার" value={config.storePhone} onChange={e => setConfig({...config, storePhone: e.target.value})} />
                      <Input placeholder="দোকানের ইমেইল" value={config.storeEmail} onChange={e => setConfig({...config, storeEmail: e.target.value})} />
                      <Button onClick={handleUpdateConfig} className="w-full bg-blue-600">সেটিংস সেভ করুন</Button>
                    </CardContent>
                  </Card>
                </div>

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
              </>
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
            {!user ? (
              <Card className="p-12 text-center">
                <h3 className="text-2xl font-bold mb-4">অর্ডার ম্যানেজমেন্ট</h3>
                <Button onClick={loginWithGoogle} className="bg-green-600">
                  লগইন করুন
                </Button>
              </Card>
            ) : !isAdmin ? (
              <Card className="p-12 text-center text-red-500">
                <p className="mb-2">আপনি অ্যাডমিন নন।</p>
                <p className="text-sm text-gray-500 mb-4">লগইন ইমেইল: {user.email}</p>
                <Button variant="link" onClick={handleLogout}>লগআউট</Button>
              </Card>
            ) : !isAdminUnlocked && config.adminPassword ? (
              <Card className="mx-auto max-w-md p-8">
                <CardHeader className="p-0 mb-4"><CardTitle>পাসওয়ার্ড দিন</CardTitle></CardHeader>
                <CardContent className="p-0 space-y-4">
                  <p className="text-sm text-muted-foreground">অর্ডার লিস্ট দেখার জন্য পাসওয়ার্ড দিন।</p>
                  <Input 
                    type="password" 
                    placeholder="পাসওয়ার্ড" 
                    value={passwordInput} 
                    onChange={e => setPasswordInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleAdminUnlock()}
                  />
                  <Button onClick={handleAdminUnlock} className="w-full bg-green-600">প্রবেশ করুন</Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h3 className="text-2xl font-bold">অর্ডার ম্যানেজমেন্ট</h3>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setOrderFilter("pending")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${orderFilter === 'pending' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      পেন্ডিং অর্ডার ({orders.filter(o => o.status !== 'delivered').length})
                    </button>
                    <button 
                      onClick={() => setOrderFilter("delivered")}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${orderFilter === 'delivered' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      ডেলিভারি সম্পন্ন ({orders.filter(o => o.status === 'delivered').length})
                    </button>
                  </div>
                </div>

                {/* Sales Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-green-700">মোট বিক্রি</p>
                        <p className="text-xl font-black text-green-900">৳{salesSummary.total}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-700">অনলাইন পেমেন্ট</p>
                        <p className="text-xl font-black text-blue-900">৳{salesSummary.online}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center text-white">
                        <Home size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-700">ক্যাশ অন ডেলিভারি</p>
                        <p className="text-xl font-black text-amber-900">৳{salesSummary.cash}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 pr-4">
                  {orders
                    .filter(order => orderFilter === 'delivered' ? order.status === 'delivered' : order.status !== 'delivered')
                    .map(order => (
                    <Card key={order.id} className="overflow-hidden">
                      <div className={`h-2 w-full ${
                        order.status === 'pending' ? 'bg-yellow-400' : 
                        order.status === 'confirmed' ? 'bg-blue-400' : 
                        order.status === 'shipped' ? 'bg-indigo-400' :
                        order.status === 'delivered' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{statusLabels.find(s => s.status === order.status)?.label || order.status.toUpperCase()}</Badge>
                              <span className="text-xs text-muted-foreground">{order.createdAt?.toDate().toLocaleString()}</span>
                            </div>
                            <h4 className="font-bold text-lg">{order.customerName}</h4>
                            <p className="text-sm">ফোন: {order.customerPhone}</p>
                            <p className="text-sm">ঠিকানা: {order.customerAddress}</p>
                            <p className="text-sm font-bold">পেমেন্ট: {order.paymentMethod}</p>
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
                                <li key={idx}>{item.name} x {item.quantity} - ৳{item.price * item.quantity}</li>
                              ))}
                            </ul>
                            <p className="mt-4 font-bold text-green-700">মোট: ৳{order.totalPrice}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            {order.status !== 'delivered' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>Confirm</Button>
                                <Button size="sm" variant="outline" className="bg-blue-50 text-blue-700" onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}>Ship (On the way)</Button>
                                <Button size="sm" variant="outline" className="bg-green-50 text-green-700" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>Deliver</Button>
                                <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>Cancel</Button>
                              </>
                            )}
                            {order.status === 'delivered' && (
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order.id)}>
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
              </ScrollArea>
            )}
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
            onClick={() => setActiveTab("info")}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "info" ? "text-green-700" : "text-gray-400"}`}
          >
            <PackageSearch size={22} />
            <span className="text-[10px] font-bold">ট্র্যাকিং</span>
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "orders" ? "text-green-700" : "text-gray-400"}`}
          >
            <ListOrdered size={22} />
            <span className="text-[10px] font-bold">অর্ডার</span>
          </button>
          <button 
            onClick={() => setActiveTab("admin")}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "admin" ? "text-green-700" : "text-gray-400"}`}
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
                  <Button 
                    onClick={handleInstallApp}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-green-100"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    এখনই ইন্সটল করুন
                  </Button>
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
      <footer className="mt-20 border-t bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                  <Store size={18} />
                </div>
                <span className="text-lg font-bold text-green-800">{config.storeName || "ওয়াসিম স্টোর"}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                আমরা দিচ্ছি সেরা মানের মোদী মাল সরাসরি আপনার দরজায়। আমাদের লক্ষ্য হলো বিশুদ্ধতা এবং বিশ্বাসযোগ্যতা।
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-bold">যোগাযোগ</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>ঠিকানা: {config.storeAddress}</li>
                <li>ফোন: <a href={`tel:${config.storePhone}`} className="hover:text-green-700">{config.storePhone}</a></li>
                <li>ইমেইল: {config.storeEmail}</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-bold">পেমেন্ট মেথড</h4>
              <div className="flex gap-4">
                <Badge variant="outline" className="px-3 py-1">বিকাশ</Badge>
                <Badge variant="outline" className="px-3 py-1">নগদ</Badge>
                <Badge variant="outline" className="px-3 py-1">ক্যাশ অন ডেলিভারি</Badge>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-xs text-muted-foreground">
            © ২০২৬ {config.storeName || "ওয়াসিম স্টোর"}। সর্বস্বত্ব সংরক্ষিত।
          </div>
        </div>
      </footer>
    </div>
  );
}
