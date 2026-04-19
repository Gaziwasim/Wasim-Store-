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
  isBlocked?: boolean;
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
  targetPhone?: string;
}

interface StoreConfig {
  storeName?: string;
  storeSubtext?: string;
  bkashNumber: string;
  nagadNumber: string;
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
  promoServiceButtonText?: string;
  showPromoService?: boolean;
  orderSuccessMsg?: string;
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
  const [config, setConfig] = useState<StoreConfig>({
    storeName: "ওয়াসিম স্টোর",
    storeSubtext: "মোদী মাল বিক্রেতা",
    bkashNumber: "",
    nagadNumber: "",
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
    orderSuccessMsg: "আপনার অর্ডারটি সফল হয়েছে! আমরা খুব দ্রুত আপনার সাথে যোগাযোগ করব।"
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
  const [isPlacingPromoOrder, setIsPlacingPromoOrder] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const getUserLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          timeout: 10000,
          enableHighAccuracy: true 
        });
      });
      setIsFetchingLocation(false);
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
    } catch (e) {
      console.log("Location access denied or failed:", e);
      setIsFetchingLocation(false);
      return null;
    }
  };
  const [adminSubTab, setAdminSubTab] = useState<"products" | "orders" | "users" | "settings" | "supports">("orders");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [notificationInput, setNotificationInput] = useState({ title: "", message: "", targetPhone: "all" });

  const handleSendNotification = async () => {
    if (!notificationInput.title || !notificationInput.message) return;
    try {
      await addDoc(collection(db, "notifications"), {
        title: notificationInput.title,
        message: notificationInput.message,
        targetPhone: notificationInput.targetPhone,
        createdAt: serverTimestamp()
      });
      setNotificationInput({ title: "", message: "", targetPhone: "all" });
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
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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
    paymentMethod: "Cash on Delivery"
  });

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

    const qCategories = query(collection(db, "categories"), orderBy("name"));
    const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
      const cList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cList);
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

    const qNotifications = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
    const sessionStartTime = Date.now();
    const notificationSound = new Audio("https://cdn.pixabay.com/audio/2022/03/15/audio_fe54fe5f5a.mp3");
    
    const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
      const nList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreNotification));
      
      // Auto-filter: Only show notifications from the last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const filtered = nList.filter(n => {
        const date = n.createdAt?.toDate ? n.createdAt.toDate() : new Date();
        const isRecent = date > threeDaysAgo;
        
        // Target filtering
        const isTargeted = n.targetPhone === 'all' || !n.targetPhone || (phoneUser && n.targetPhone === phoneUser.phone);
        
        return isRecent && isTargeted;
      });

      // Handle new notifications (Sound and Browser alert)
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newNotif = change.doc.data() as StoreNotification;
          const createdAt = newNotif.createdAt?.toMillis ? newNotif.createdAt.toMillis() : Date.now();
          
          // Target check for real-time notification
          const isTargeted = newNotif.targetPhone === 'all' || !newNotif.targetPhone || (phoneUser && newNotif.targetPhone === phoneUser.phone);

          if (createdAt > sessionStartTime && isTargeted) {
            // Play sound
            notificationSound.play().catch(e => console.log("Sound play error:", e));
            
            // Browser Push Notification (if permission granted)
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

    // Load hidden notifications
    const savedHidden = localStorage.getItem('hiddenNotifications');
    if (savedHidden) setHiddenNotifications(JSON.parse(savedHidden));

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeConfig();
      unsubscribeNotifications();
    };
  }, []);

  // Automatic cleanup of old notifications (Admins only)
  useEffect(() => {
    if (isAdmin && db) {
      const cleanupOldNotifications = async () => {
        try {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          
          const q = query(collection(db, "notifications"), where("createdAt", "<", threeDaysAgo));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            console.log(`Cleaning up ${snapshot.size} old notifications...`);
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      };
      
      cleanupOldNotifications();
    }
  }, [isAdmin]);

  // Request Notification Permission on load if logged in
  useEffect(() => {
    if ((user || phoneUser) && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user, phoneUser]);

  // Fetch all customers for admin
  useEffect(() => {
    let unsubscribe = () => {};
    if (isAdmin && db) {
      const q = query(collection(db, "customers"), orderBy("lastLogin", "desc"));
      unsubscribe = onSnapshot(q, (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ ...doc.data() } as Customer)));
      }, (error) => {
        console.error("Customers fetch error:", error);
      });
    }
    return () => unsubscribe();
  }, [isAdmin]);

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
    if (!db) return;
    
    // Subscribe to support messages
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const handleSendSupportMessage = async () => {
    if (!supportMessage.trim()) return;
    
    // Check if user is logged in
    if (!phoneUser) {
      setToastMessage("মেসেজ পাঠাতে আগে লগইন করুন!");
      setShowToast(true);
      setShowPhoneLogin(true);
      return;
    }

    setIsSendingMessage(true);
    try {
      console.log("Sending message as:", phoneUser.phone);
      await addDoc(collection(db, "messages"), {
        senderName: phoneUser.name || "অচেনা কাস্টমার",
        senderPhone: phoneUser.phone,
        message: supportMessage,
        createdAt: serverTimestamp(),
        type: "customer",
        read: false
      });
      console.log("Message sent successfully!");
      setSupportMessage("");
      setToastMessage("মেসেজটি পাঠানো হয়েছে!");
      setShowToast(true);
    } catch (error: any) {
      console.error("Support message detailed error:", error);
      setToastMessage("মেসেজ পাঠানো যায়নি! আবার চেষ্টা করুন।");
      setShowToast(true);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendAdminReply = async (customerPhone: string, customerName: string, replyMsg: string) => {
    if (!replyMsg.trim() || !isAdmin) return;
    try {
      await addDoc(collection(db, "messages"), {
        senderName: "Admin",
        senderPhone: customerPhone, // linked to the customer
        message: replyMsg,
        createdAt: serverTimestamp(),
        type: "admin"
      });
      setToastMessage("উত্তর পাঠানো হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Admin reply error:", error);
    }
  };

  const [selectedAdminChatPhone, setSelectedAdminChatPhone] = useState<string | null>(null);

  const handleDeleteMessage = async (messageId: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, "messages", messageId));
      setToastMessage("মেসেজটি মুছে ফেলা হয়েছে!");
      setShowToast(true);
    } catch (error) {
      console.error("Delete message error:", error);
    }
  };

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
      
      // Strip images and ensure data is clean - explicitly pick fields to minimize size
      const itemsToSave = cart.map(item => {
        return {
          id: item.id || "unknown",
          name: item.name || "Unknown Product",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || "unit",
          category: item.category || "General"
        };
      });

      const finalTotalPrice = itemsToSave.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const orderData = {
        customerName: checkoutInfo.name || "Guest",
        customerPhone: phoneUser ? phoneUser.phone : (checkoutInfo.phone || "00000000000"),
        customerAddress: checkoutInfo.address || "No Address",
        items: itemsToSave,
        totalPrice: finalTotalPrice,
        status: "pending",
        paymentMethod: checkoutInfo.paymentMethod || "Cash on Delivery",
        location,
        uid: user?.uid || null,
        phoneUser: phoneUser?.phone || null,
        createdAt: serverTimestamp()
      };
      
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

  const handleBlockCustomer = async (phone: string, isBlocked: boolean) => {
    try {
      await updateDoc(doc(db, "customers", phone), { isBlocked });
      setToastMessage(isBlocked ? "কাস্টমারকে ব্লক করা হয়েছে।" : "কাস্টমারকে আনব্লক করা হয়েছে।");
      setShowToast(true);
    } catch (error) {
       console.error("Block error:", error);
       setToastMessage("কাস্টমার ব্লক করতে সমস্যা হয়েছে।");
       setShowToast(true);
    }
  };

  const handlePlacePromoOrder = async () => {
    if (!phoneUser) {
      setToastMessage("অর্ডার করতে প্রথমে লগইন করুন।");
      setShowToast(true);
      setShowPhoneLogin(true);
      return;
    }

    const amount = Number(promoAmount) || config.promoServiceDefaultAmount || 0;
    if (amount <= 0) {
      setToastMessage("সঠিক অ্যামাউন্ট দিন");
      setShowToast(true);
      return;
    }

    setIsPlacingPromoOrder(true);
    
    // Automatically try to get location if not already fetched
    const location = await getUserLocation();

    try {
      // Check block status
      const customerDoc = await getDoc(doc(db, "customers", phoneUser.phone));
      if (customerDoc.exists() && customerDoc.data()?.isBlocked) {
         setToastMessage("আপনি অর্ডার করতে পারবেন না। আপনার অ্যাকাউন্ট ব্লক করা হয়েছে।");
         setShowToast(true);
         setIsPlacingPromoOrder(false);
         return;
      }

      const orderData = {
        customerName: checkoutInfo.name || phoneUser.name,
        customerPhone: phoneUser.phone,
        customerAddress: checkoutInfo.address || "ঠিকানা দেওয়া হয়নি",
        items: [{
          id: "PROMO_SERVICE",
          name: config.promoServiceTitle || "স্পেশাল সার্ভিস",
          price: amount,
          quantity: 1,
          category: "Service",
          unit: "টাকা",
          image: config.promoServiceImage || "https://picsum.photos/seed/service/200/200"
        }],
        totalPrice: amount,
        status: "pending",
        paymentMethod: "Cash on Delivery",
        location,
        createdAt: serverTimestamp(),
        note: `সার্ভিস অর্ডার: ${amount} টাকা`,
        uid: user?.uid || null,
        phoneUser: phoneUser?.phone || null
      };

      await addDoc(collection(db, "orders"), orderData);
      
      setToastMessage(config.orderSuccessMsg || "আপনার অর্ডারটি সফল হয়েছে!");
      setShowToast(true);
      setShowPromoModal(false);
      setPromoAmount("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "orders/promo", setToastMessage, setShowToast);
    } finally {
      setIsPlacingPromoOrder(false);
    }
  };

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

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1] 
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1.5, repeat: Infinity }
          }}
          className="mb-8 p-4 bg-green-50 rounded-full text-green-600 shadow-xl shadow-green-100"
        >
          <Store size={64} />
        </motion.div>
        
        <div className="space-y-4 max-w-sm">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">
            ওয়াসিম স্টোর
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
        
        <div className="absolute bottom-12 left-0 right-0">
          <p className="text-[10px] text-gray-300 font-medium">Wasim Store Delivery Platform</p>
        </div>
      </div>
    );
  }

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
                          <div className="space-y-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-[10px] text-center text-green-700 font-bold uppercase tracking-wider">
                              {checkoutInfo.paymentMethod} পেমেন্ট নির্দেশিকা
                            </p>
                            <div className="flex items-center justify-center gap-2 bg-white p-2 rounded-xl border border-green-100">
                              <span className="text-sm font-black text-green-900">
                                {checkoutInfo.paymentMethod === 'bKash' ? config.bkashNumber : config.nagadNumber}
                              </span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-full"
                                onClick={() => {
                                  const num = checkoutInfo.paymentMethod === 'bKash' ? config.bkashNumber : config.nagadNumber;
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
                            </div>
                            <div className="pt-2 border-t border-green-100">
                              <p className="text-[9px] text-center text-green-600 italic">
                                পেমেন্ট করার পর স্ক্রিনশটটি আমাদের হোয়াটসঅ্যাপে পাঠান।
                              </p>
                              {config.whatsappNumber && (
                                <Button 
                                  size="sm" 
                                  variant="link" 
                                  className="w-full text-[10px] text-green-700 font-bold h-6"
                                  onClick={() => window.open(`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি পেমেন্ট করেছি। এই নিন স্ক্রিনশট।')}`)}
                                >
                                  স্ক্রিনশট পাঠাতে এখানে ক্লিক করুন
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
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                  m.type === 'admin' 
                                    ? 'bg-white border border-green-100 text-gray-800 rounded-tl-none' 
                                    : 'bg-green-600 text-white rounded-tr-none'
                                }`}>
                                  {m.type === 'admin' && <p className="text-[10px] font-bold mb-1 opacity-70">অ্যাডমিন</p>}
                                  <p className="leading-relaxed">{m.message}</p>
                                  <p className="text-[9px] mt-1 opacity-60 text-right">
                                    {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'}) : "এখনই"}
                                  </p>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="আপনার সমস্যা বা প্রশ্ন লিখুন..." 
                          value={supportMessage}
                          onChange={e => setSupportMessage(e.target.value)}
                          className="bg-gray-50 border-none rounded-xl focus-visible:ring-green-500 h-12"
                          onKeyDown={(e) => e.key === 'Enter' && handleSendSupportMessage()}
                        />
                        <Button 
                          onClick={handleSendSupportMessage} 
                          disabled={isSendingMessage || !supportMessage.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-xl w-12 h-12 shrink-0 p-0"
                        >
                          <Send size={20} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

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
                                {order.items.map((item, idx) => {
                                  const productInfo = products.find(p => p.id === item.id);
                                  return (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                      <img 
                                        src={item.image || productInfo?.image || "https://picsum.photos/seed/product/100/100"} 
                                        className="h-8 w-8 object-cover rounded" 
                                        alt="" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <span className="text-xs font-medium">{item.name} x {item.quantity}</span>
                                    </div>
                                  );
                                })}
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

                {/* Admin Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                  {[
                    { id: 'supports', label: 'মেসেজ', icon: MessageSquare },
                    { id: 'orders', label: 'অর্ডারসমূহ', icon: ListOrdered },
                    { id: 'products', label: 'পণ্যসমূহ', icon: Package },
                    { id: 'users', label: 'কাস্টমার', icon: UserIcon },
                    { id: 'settings', label: 'সেটিংস', icon: Settings }
                  ].map(tab => (
                    <Button
                      key={tab.id}
                      variant={adminSubTab === tab.id ? "default" : "outline"}
                      onClick={() => setAdminSubTab(tab.id as any)}
                      className={`rounded-xl flex items-center gap-2 h-11 shrink-0 ${
                        adminSubTab === tab.id ? "bg-green-700 hover:bg-green-800 shadow-md" : "border-green-100 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      <tab.icon size={18} />
                      <span className="text-sm font-bold">{tab.label}</span>
                    </Button>
                  ))}
                </div>

                {adminSubTab === "orders" && (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                      <h3 className="text-xl font-bold">অর্ডার ম্যানেজমেন্ট</h3>
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setOrderFilter("pending")}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${orderFilter === 'pending' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          পেন্ডিং ({orders.filter(o => o.status !== 'delivered').length})
                        </button>
                        <button 
                          onClick={() => setOrderFilter("delivered")}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${orderFilter === 'delivered' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          ডেলিভারি সম্পন্ন ({orders.filter(o => o.status === 'delivered').length})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
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

                    <div className="grid gap-4">
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
                                  <span className="text-xs text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('bn-BD') : "অজানা তারিখ"}</span>
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
                                    <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-1">
                                      <span>{item.name} x {item.quantity}</span>
                                      <span className="font-bold">৳{item.price * item.quantity}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-4 flex justify-between items-center p-3 bg-green-50 rounded-xl">
                                  <span className="font-bold text-green-800">সর্বমোট:</span>
                                  <span className="font-black text-lg text-green-700">৳{order.totalPrice}</span>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[150px]">
                                {order.status !== 'delivered' && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-10 font-bold" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}>অর্ডার কনফার্ম</Button>
                                    <Button size="sm" variant="outline" className="h-10 font-bold bg-blue-50 text-blue-700 border-blue-100" onClick={() => handleUpdateOrderStatus(order.id, 'shipped')}>ডেলিভারি পথিমধ্যে</Button>
                                    <Button size="sm" variant="outline" className="h-10 font-bold bg-green-50 text-green-700 border-green-100" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>ডেলিভারি সম্পন্ন</Button>
                                    <Button size="sm" variant="outline" className="h-10 font-bold text-red-500 border-red-100" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}>অর্ডার বাতিল</Button>
                                  </>
                                )}
                                {order.status === 'delivered' && (
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
                  <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-green-100 h-[750px] flex flex-row shadow-green-100/50 relative">
                    {/* Conversations Sidebar - Hidden on mobile if a chat is selected */}
                    <div className={`w-full md:w-[350px] border-r border-gray-100 flex flex-col bg-white transition-all duration-300 ${
                      selectedAdminChatPhone ? 'hidden md:flex' : 'flex'
                    }`}>
                      <div className="p-6 border-b border-gray-100 bg-green-50/30">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-green-800">
                          <MessageSquare className="text-green-600" />
                          চ্যাট তালিকা
                        </h3>
                        <p className="text-[10px] text-green-600 mt-1">সব কাস্টমারের সাথে কথোপকথন</p>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-3 space-y-2">
                          {customers.filter(c => messages.some(m => m.senderPhone === c.phone)).length === 0 ? (
                            <div className="py-24 text-center opacity-30">
                              <MessageCircle size={64} className="mx-auto mb-3 text-green-700" />
                              <p className="text-sm font-bold">এখনো কোনো মেসেজ নেই</p>
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
                                        <p className="leading-relaxed whitespace-pre-wrap break-words">{m.message}</p>
                                        <div className="text-[10px] mt-3 opacity-60 flex justify-between gap-6 border-t pt-2 border-white/10">
                                          <span className="font-bold uppercase tracking-wider">{m.type === 'admin' ? 'অ্যাডমিন' : 'কাস্টমার'}</span>
                                          <span className="font-mono">{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit', hour12: true}) : "এখনই"}</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteMessage(m.id)}
                                        className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover/msg:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-95 z-30 flex items-center justify-center"
                                        title="মেসেজ মুছুন"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <div id="admin-chat-end" />
                              </div>
                            </div>

                            {/* Chat Input - Always at bottom */}
                            <div className="p-4 md:p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] z-40">
                              <div className="flex gap-2 md:gap-3 bg-gray-50/80 p-1.5 md:p-2 rounded-[24px] border-2 border-green-50 focus-within:border-green-400 focus-within:bg-white focus-within:ring-8 focus-within:ring-green-100 transition-all shadow-inner">
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
                      <Button onClick={handleUpdateConfig} className="w-full bg-blue-600">সেটিংস সেভ করুন</Button>
                    </CardContent>
                  </Card>
                </div>
              )}
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
                <h3 className="text-2xl font-bold mb-4">অ্যাডমিন প্রবেশ</h3>
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
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-green-200">
                <ListOrdered size={48} className="text-green-200 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-4">অর্ডার ম্যানেজমেন্ট এখন অ্যাডমিন প্যানেলে</h3>
                <Button 
                  onClick={() => {
                    setAdminSubTab('orders');
                    setActiveTab("admin");
                  }}
                  className="bg-green-700 hover:bg-green-800"
                >
                  অ্যাডমিন প্যানেলে যান
                </Button>
              </div>
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
    </div>
  );
}
