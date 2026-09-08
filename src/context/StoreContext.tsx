import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  db,
  auth,
  googleAuthProvider,
  signInWithPopup,
  signOut,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  Product,
  ProductCategory,
  Sale,
  Purchase,
  StockMovement,
  Expense,
  SaleItem,
  PurchaseItem,
  AppUser,
} from '../types';
import {
  DEFAULT_USERS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_EXPENSES,
} from '../data/initialData';

export interface StoreInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
}

interface StoreContextType {
  // Store info
  storeInfo: StoreInfo;
  
  // Auth state
  currentUser: AppUser | null;
  users: AppUser[];
  login: (identifier: string, passwordOrPin?: string) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  addUser: (userData: Omit<AppUser, 'id'>) => { success: boolean; message?: string };
  updateUser: (id: string, userData: Partial<AppUser>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };

  // Firebase state & sync
  isFirebaseConnected: boolean;
  firebaseUser: any | null;
  loginWithGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;

  // Data collections
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
  expenses: Expense[];
  
  // Actions
  recordSale: (data: {
    customerName?: string;
    paymentMethod: Sale['paymentMethod'];
    items: { productId: string; quantity: number; sellPrice?: number }[];
    notes?: string;
    customDate?: string;
  }) => { success: boolean; error?: string; saleId?: string };

  recordPurchase: (data: {
    supplierName: string;
    paymentMethod: Purchase['paymentMethod'];
    items: {
      productId?: string;
      productName?: string;
      category?: ProductCategory;
      unit?: string;
      quantity: number;
      costPrice: number;
      updateMasterCost?: boolean;
    }[];
    notes?: string;
    customDate?: string;
  }) => { success: boolean; error?: string; purchaseId?: string };

  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  adjustStock: (productId: string, newStock: number, notes: string) => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  
  deleteSale: (id: string) => void;
  deletePurchase: (id: string) => void;
  
  resetToDefaultData: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
  getBackupData: () => any;
  restoreFromBackupData: (data: any) => boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  USER: 'agen_beras_gendis_user_v2',
  USERS: 'agen_beras_gendis_users_list_v2',
  PRODUCTS: 'agen_beras_gendis_products_v2',
  SALES: 'agen_beras_gendis_sales_v2',
  PURCHASES: 'agen_beras_gendis_purchases_v2',
  MOVEMENTS: 'agen_beras_gendis_movements_v2',
  EXPENSES: 'agen_beras_gendis_expenses_v2',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storeInfo: StoreInfo = {
    name: 'Agen Beras Gendis',
    tagline: 'Pusat Grosir & Eceran Beras Berkualitas serta Kebutuhan Sembako',
    address: 'Jl. Raya Pasar Induk No. 45 • Telp: 0812-3456-7890',
    phone: '0812-3456-7890',
  };

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);

  // Users list
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        return JSON.parse(saved);
      }
      const viaUser: AppUser = {
        id: 'user-1',
        name: 'Via',
        email: 'via',
        role: 'OWNER',
        roleLabel: 'Owner (Pemilik Toko)',
        avatarColor: 'bg-emerald-600',
        pin: '1008',
      };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([viaUser]));
      return [viaUser];
    } catch {
      return DEFAULT_USERS;
    }
  });

  // Active User session - starts as null so login is shown first
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        const parsed: AppUser = JSON.parse(saved);
        return {
          id: 'user-1',
          name: 'Via',
          email: 'via',
          role: 'OWNER',
          roleLabel: 'Owner (Pemilik Toko)',
          avatarColor: 'bg-emerald-600',
          pin: parsed.pin || '1008',
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : INITIAL_SALES;
    } catch {
      return INITIAL_SALES;
    }
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    } catch {
      return INITIAL_PURCHASES;
    }
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
    } catch {
      return INITIAL_STOCK_MOVEMENTS;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  // Persist local storage as instant local cache
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  // Firebase real-time listeners and synchronization
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (user) {
        setIsFirebaseConnected(true);
        // If owner logs in via Google
        if (!currentUser) {
          const u: AppUser = {
            id: user.uid,
            name: user.displayName || 'Via',
            email: user.email || 'agenberasgendis@gmail.com',
            role: 'OWNER',
            roleLabel: 'Owner (Pemilik Toko)',
            avatarColor: 'bg-emerald-600',
          };
          setCurrentUser(u);
        }
      }
    });

    testFirestoreConnection().then((ok) => {
      if (ok) setIsFirebaseConnected(true);
    });

    // 1. Products collection sync
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => list.push(d.data() as Product));
          setProducts(list);
          setIsFirebaseConnected(true);
        } else {
          // If Firestore is completely fresh, seed initial products
          INITIAL_PRODUCTS.forEach((p) => {
            setDoc(doc(db, 'products', p.id), p).catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, `products/${p.id}`);
            });
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'products');
      }
    );

    // 2. Sales collection sync
    const unsubSales = onSnapshot(
      collection(db, 'sales'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Sale[] = [];
          snapshot.forEach((d) => list.push(d.data() as Sale));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setSales(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'sales');
      }
    );

    // 3. Purchases collection sync
    const unsubPurchases = onSnapshot(
      collection(db, 'purchases'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Purchase[] = [];
          snapshot.forEach((d) => list.push(d.data() as Purchase));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setPurchases(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'purchases');
      }
    );

    // 4. Stock movements sync
    const unsubMovements = onSnapshot(
      collection(db, 'stockMovements'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: StockMovement[] = [];
          snapshot.forEach((d) => list.push(d.data() as StockMovement));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setStockMovements(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'stockMovements');
      }
    );

    // 5. Expenses sync
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Expense[] = [];
          snapshot.forEach((d) => list.push(d.data() as Expense));
          list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setExpenses(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'expenses');
      }
    );

    return () => {
      unsubAuth();
      unsubProducts();
      unsubSales();
      unsubPurchases();
      unsubMovements();
      unsubExpenses();
    };
  }, []);

  // Google Login for Firebase Auth
  const loginWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      if (res.user) {
        const u: AppUser = {
          id: res.user.uid,
          name: res.user.displayName || 'Via',
          email: res.user.email || 'agenberasgendis@gmail.com',
          role: 'OWNER',
          roleLabel: 'Owner (Pemilik Toko)',
          avatarColor: 'bg-emerald-600',
        };
        setCurrentUser(u);
        setIsFirebaseConnected(true);
      }
    } catch (err) {
      console.error('Google Sign-In error:', err);
    }
  };

  const logoutGoogle = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Google Sign-Out error:', err);
    }
  };

  // Auth Operations
  const login = (identifier: string, passwordOrPin?: string) => {
    const trimmed = identifier.trim().toLowerCase();
    const pin = (passwordOrPin || '').trim();

    if (trimmed === 'via' || trimmed === 'owner' || trimmed === 'agenberasgendis@gmail.com') {
      if (pin && pin !== '1008') {
        return { success: false, message: 'PIN salah. Gunakan PIN: 1008' };
      }

      const viaUser: AppUser = {
        id: 'user-1',
        name: 'Via',
        email: 'via',
        role: 'OWNER',
        roleLabel: 'Owner (Pemilik Toko)',
        avatarColor: 'bg-emerald-600',
        pin: '1008',
      };
      setCurrentUser(viaUser);
      return { success: true };
    }

    const matched = users.find(
      (u) => u.name.toLowerCase() === trimmed || u.email.toLowerCase() === trimmed
    );

    if (matched) {
      if (matched.pin && pin && matched.pin !== pin) {
        return { success: false, message: 'PIN keamanan salah.' };
      }
      setCurrentUser(matched);
      return { success: true };
    }

    return {
      success: false,
      message: 'Akun tidak ditemukan. Masukkan nama "Via" dan PIN 1008.',
    };
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const addUser = (userData: Omit<AppUser, 'id'>) => {
    const newUser: AppUser = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return { success: true };
  };

  const updateUser = (id: string, userData: Partial<AppUser>) => {
    const updated = users.map((u) => (u.id === id ? { ...u, ...userData } : u));
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    if (currentUser?.id === id) {
      setCurrentUser({ ...currentUser, ...userData });
    }
    return { success: true };
  };

  const deleteUser = (id: string) => {
    if (id === 'user-1') {
      return { success: false, message: 'Akun Owner utama tidak dapat dihapus.' };
    }
    const updated = users.filter((u) => u.id !== id);
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return { success: true };
  };

  // Record Sale
  const recordSale = (data: {
    customerName?: string;
    paymentMethod: Sale['paymentMethod'];
    items: { productId: string; quantity: number; sellPrice?: number }[];
    notes?: string;
    customDate?: string;
  }) => {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Pilih minimal 1 produk.' };
    }

    for (const item of data.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, error: `Produk ID ${item.productId} tidak ditemukan.` };
      }
      if (item.quantity <= 0) {
        return { success: false, error: `Jumlah ${prod.name} harus lebih dari 0.` };
      }
    }

    const saleDate = data.customDate || new Date().toISOString();
    const dateObj = new Date(saleDate);
    const dateFormatted = `${dateObj.getFullYear()}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}`;
    const invoiceNumber = `PJ-${dateFormatted}-${(sales.length + 1).toString().padStart(3, '0')}`;
    const saleId = `sl-${Date.now()}`;
    const operatorLabel = currentUser ? currentUser.name : 'Via (Owner)';

    let totalRevenue = 0;
    let totalCost = 0;
    const saleItems: SaleItem[] = [];
    const newMovements: StockMovement[] = [];
    const updatedProductsMap = new Map<string, number>();

    for (const item of data.items) {
      const prod = products.find((p) => p.id === item.productId)!;
      const sellPrice = item.sellPrice !== undefined ? item.sellPrice : prod.sellPrice;
      const costPrice = prod.costPrice;
      const subtotal = sellPrice * item.quantity;
      const subtotalCost = costPrice * item.quantity;
      const profit = subtotal - subtotalCost;

      totalRevenue += subtotal;
      totalCost += subtotalCost;

      saleItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unit: prod.unit,
        costPrice,
        sellPrice,
        subtotalCost,
        subtotal,
        profit,
      });

      const movementId = `mv-out-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const mv: StockMovement = {
        id: movementId,
        productId: prod.id,
        productName: prod.name,
        type: 'OUT',
        quantity: item.quantity,
        unit: prod.unit,
        unitCostPrice: costPrice,
        unitSellPrice: sellPrice,
        totalAmount: subtotal,
        profit,
        date: saleDate,
        referenceId: invoiceNumber,
        referenceType: 'SALE',
        operatorName: operatorLabel,
        notes: `Penjualan ${data.customerName ? 'ke ' + data.customerName : 'Tunai'} • Dicatat oleh ${operatorLabel}`,
      };
      newMovements.push(mv);

      // Save movement to Firestore
      setDoc(doc(db, 'stockMovements', movementId), mv).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `stockMovements/${movementId}`);
      });

      const currentStock = updatedProductsMap.has(prod.id)
        ? updatedProductsMap.get(prod.id)!
        : prod.stock;
      updatedProductsMap.set(prod.id, currentStock - item.quantity);
    }

    const totalProfit = totalRevenue - totalCost;

    const newSale: Sale = {
      id: saleId,
      invoiceNumber,
      date: saleDate,
      items: saleItems,
      totalRevenue,
      totalCost,
      totalProfit,
      paymentMethod: data.paymentMethod,
      customerName: data.customerName || 'Pembeli Umum',
      cashierName: operatorLabel,
      notes: data.notes || '',
    };

    // Update products stock locally and in Firestore
    setProducts((prev) =>
      prev.map((p) => {
        if (updatedProductsMap.has(p.id)) {
          const newStk = updatedProductsMap.get(p.id)!;
          const updatedProd = {
            ...p,
            stock: newStk,
            updatedAt: new Date().toISOString(),
          };
          updateDoc(doc(db, 'products', p.id), {
            stock: newStk,
            updatedAt: updatedProd.updatedAt,
          }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `products/${p.id}`);
          });
          return updatedProd;
        }
        return p;
      })
    );

    setSales((prev) => [newSale, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);

    // Save Sale to Firestore
    setDoc(doc(db, 'sales', saleId), newSale).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `sales/${saleId}`);
    });

    return { success: true, saleId };
  };

  // Record Purchase (Barang Masuk / Kulakan)
  const recordPurchase = (data: {
    supplierName: string;
    paymentMethod: Purchase['paymentMethod'];
    items: {
      productId?: string;
      productName?: string;
      category?: ProductCategory;
      unit?: string;
      quantity: number;
      costPrice: number;
      updateMasterCost?: boolean;
    }[];
    notes?: string;
    customDate?: string;
  }) => {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Pilih minimal 1 barang kulakan.' };
    }

    const purchaseDate = data.customDate || new Date().toISOString();
    const dateObj = new Date(purchaseDate);
    const dateFormatted = `${dateObj.getFullYear()}${(dateObj.getMonth() + 1).toString().padStart(2, '0')}${dateObj.getDate().toString().padStart(2, '0')}`;
    const invoiceNumber = `PB-${dateFormatted}-${(purchases.length + 1).toString().padStart(3, '0')}`;
    const purchaseId = `pch-${Date.now()}`;
    const operatorLabel = currentUser ? currentUser.name : 'Via (Owner)';

    let totalAmount = 0;
    const purchaseItems: PurchaseItem[] = [];
    const newMovements: StockMovement[] = [];
    const stockAdditionMap = new Map<string, { addStock: number; newCost?: number }>();
    const newlyCreatedProducts: Product[] = [];

    const currentProducts = [...products];

    for (const item of data.items) {
      let prod = item.productId
        ? currentProducts.find((p) => p.id === item.productId)
        : undefined;

      if (!prod && item.productName) {
        prod = currentProducts.find(
          (p) => p.name.trim().toLowerCase() === item.productName!.trim().toLowerCase()
        );
      }

      if (!prod && item.productName) {
        const newProdId = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        prod = {
          id: newProdId,
          sku: `BRG-${Date.now().toString().slice(-4)}`,
          name: item.productName.trim(),
          category: item.category || 'Beras & Biji',
          unit: item.unit || 'sak',
          stock: 0,
          minStock: 5,
          costPrice: item.costPrice,
          sellPrice: Math.round(item.costPrice * 1.15),
          updatedAt: new Date().toISOString(),
        };
        currentProducts.push(prod);
        newlyCreatedProducts.push(prod);

        // Create in Firestore
        setDoc(doc(db, 'products', newProdId), prod).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `products/${newProdId}`);
        });
      }

      if (!prod) continue;

      const subtotal = item.costPrice * item.quantity;
      totalAmount += subtotal;

      purchaseItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unit: prod.unit,
        costPrice: item.costPrice,
        subtotal,
      });

      const movementId = `mv-in-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const mv: StockMovement = {
        id: movementId,
        productId: prod.id,
        productName: prod.name,
        type: 'IN',
        quantity: item.quantity,
        unit: prod.unit,
        unitCostPrice: item.costPrice,
        unitSellPrice: 0,
        totalAmount: subtotal,
        profit: 0,
        date: purchaseDate,
        referenceId: invoiceNumber,
        referenceType: 'PURCHASE',
        operatorName: operatorLabel,
        notes: `Kulakan dari ${data.supplierName} • Dicatat oleh ${operatorLabel}`,
      };
      newMovements.push(mv);

      // Save movement to Firestore
      setDoc(doc(db, 'stockMovements', movementId), mv).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `stockMovements/${movementId}`);
      });

      const currAddition = stockAdditionMap.get(prod.id) || { addStock: 0 };
      stockAdditionMap.set(prod.id, {
        addStock: currAddition.addStock + item.quantity,
        newCost: item.updateMasterCost !== false ? item.costPrice : currAddition.newCost,
      });
    }

    const newPurchase: Purchase = {
      id: purchaseId,
      invoiceNumber,
      date: purchaseDate,
      supplierName: data.supplierName || 'Distributor / Penggilingan Beras',
      items: purchaseItems,
      totalAmount,
      paymentMethod: data.paymentMethod,
      operatorName: operatorLabel,
      notes: data.notes || '',
    };

    // Update products stock and cost price locally and in Firestore
    setProducts((prev) => {
      const combined = [...newlyCreatedProducts, ...prev];
      return combined.map((p) => {
        if (stockAdditionMap.has(p.id)) {
          const update = stockAdditionMap.get(p.id)!;
          const newCost = update.newCost !== undefined ? update.newCost : p.costPrice;
          const newStk = p.stock + update.addStock;
          const updatedProd = {
            ...p,
            stock: newStk,
            costPrice: newCost,
            updatedAt: new Date().toISOString(),
          };
          updateDoc(doc(db, 'products', p.id), {
            stock: newStk,
            costPrice: newCost,
            updatedAt: updatedProd.updatedAt,
          }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `products/${p.id}`);
          });
          return updatedProd;
        }
        return p;
      });
    });

    setPurchases((prev) => [newPurchase, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);

    // Save purchase to Firestore
    setDoc(doc(db, 'purchases', purchaseId), newPurchase).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `purchases/${purchaseId}`);
    });

    return { success: true, purchaseId };
  };

  // Add product
  const addProduct = (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    setDoc(doc(db, 'products', newProduct.id), newProduct).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `products/${newProduct.id}`);
    });
  };

  // Update product
  const updateProduct = (id: string, productData: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...productData, updatedAt: now } : p))
    );
    updateDoc(doc(db, 'products', id), { ...productData, updatedAt: now }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    });
  };

  // Delete product
  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    deleteDoc(doc(db, 'products', id)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    });
  };

  // Adjust stock
  const adjustStock = (productId: string, newStock: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const diff = newStock - prod.stock;
    if (diff === 0) return;

    const isIncrease = diff > 0;
    const operatorLabel = currentUser ? currentUser.name : 'Via (Owner)';
    const moveId = `mv-adj-${Date.now()}`;

    const move: StockMovement = {
      id: moveId,
      productId: prod.id,
      productName: prod.name,
      type: 'ADJUST',
      quantity: Math.abs(diff),
      unit: prod.unit,
      unitCostPrice: prod.costPrice,
      unitSellPrice: isIncrease ? 0 : prod.sellPrice,
      totalAmount: Math.abs(diff) * prod.costPrice,
      profit: 0,
      date: new Date().toISOString(),
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      referenceType: 'MANUAL',
      operatorName: operatorLabel,
      notes: `Koreksi fisik (${diff > 0 ? '+' : ''}${diff} ${prod.unit}): ${reason} • Diperiksa oleh ${operatorLabel}`,
    };

    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock, updatedAt: now } : p))
    );
    setStockMovements((prev) => [move, ...prev]);

    updateDoc(doc(db, 'products', productId), { stock: newStock, updatedAt: now }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
    });
    setDoc(doc(db, 'stockMovements', moveId), move).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `stockMovements/${moveId}`);
    });
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const operatorLabel = currentUser ? currentUser.name : 'Via (Owner)';
    const expId = `exp-${Date.now()}`;

    const newExpense: Expense = {
      ...expenseData,
      id: expId,
      recordedBy: expenseData.recordedBy || operatorLabel,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setDoc(doc(db, 'expenses', expId), newExpense).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `expenses/${expId}`);
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    deleteDoc(doc(db, 'expenses', id)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`);
    });
  };

  // Delete Sale and restore stock
  const deleteSale = (id: string) => {
    const saleToDelete = sales.find((s) => s.id === id);
    if (!saleToDelete) return;

    setProducts((prev) =>
      prev.map((prod) => {
        const item = saleToDelete.items.find((it) => it.productId === prod.id);
        if (item) {
          const restoredStock = prod.stock + item.quantity;
          updateDoc(doc(db, 'products', prod.id), {
            stock: restoredStock,
            updatedAt: new Date().toISOString(),
          }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `products/${prod.id}`);
          });
          return { ...prod, stock: restoredStock };
        }
        return prod;
      })
    );

    setStockMovements((prev) =>
      prev.filter((m) => m.referenceId !== saleToDelete.invoiceNumber)
    );
    setSales((prev) => prev.filter((s) => s.id !== id));

    deleteDoc(doc(db, 'sales', id)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `sales/${id}`);
    });
  };

  // Delete Purchase and deduct stock
  const deletePurchase = (id: string) => {
    const purchaseToDelete = purchases.find((p) => p.id === id);
    if (!purchaseToDelete) return;

    setProducts((prev) =>
      prev.map((prod) => {
        const item = purchaseToDelete.items.find((it) => it.productId === prod.id);
        if (item) {
          const deductedStock = Math.max(0, prod.stock - item.quantity);
          updateDoc(doc(db, 'products', prod.id), {
            stock: deductedStock,
            updatedAt: new Date().toISOString(),
          }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `products/${prod.id}`);
          });
          return { ...prod, stock: deductedStock };
        }
        return prod;
      })
    );

    setStockMovements((prev) =>
      prev.filter((m) => m.referenceId !== purchaseToDelete.invoiceNumber)
    );
    setPurchases((prev) => prev.filter((p) => p.id !== id));

    deleteDoc(doc(db, 'purchases', id)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `purchases/${id}`);
    });
  };

  // Reset Data to Default
  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setExpenses(INITIAL_EXPENSES);

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(INITIAL_SALES));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(INITIAL_PURCHASES));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));

    // Seed Firestore
    INITIAL_PRODUCTS.forEach((p) => {
      setDoc(doc(db, 'products', p.id), p).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `products/${p.id}`);
      });
    });
  };

  // JSON Export / Import
  const exportDataJSON = () => {
    const backup = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      storeInfo,
      products,
      sales,
      purchases,
      stockMovements,
      expenses,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-agen-beras-gendis-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (Array.isArray(data.stockMovements)) setStockMovements(data.stockMovements);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);

      // Sync imported products to Firestore
      if (Array.isArray(data.products)) {
        data.products.forEach((p: Product) => {
          setDoc(doc(db, 'products', p.id), p).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `products/${p.id}`);
          });
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  const getBackupData = () => ({
    version: '2.0',
    exportDate: new Date().toISOString(),
    storeInfo,
    products,
    sales,
    purchases,
    stockMovements,
    expenses,
  });

  const restoreFromBackupData = (data: any): boolean => {
    try {
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (Array.isArray(data.stockMovements)) setStockMovements(data.stockMovements);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        storeInfo,
        currentUser,
        users,
        login,
        logout,
        switchUser,
        addUser,
        updateUser,
        deleteUser,
        isFirebaseConnected,
        firebaseUser,
        loginWithGoogle,
        logoutGoogle,
        products,
        sales,
        purchases,
        stockMovements,
        expenses,
        recordSale,
        recordPurchase,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addExpense,
        deleteExpense,
        deleteSale,
        deletePurchase,
        resetToDefaultData,
        exportDataJSON,
        importDataJSON,
        getBackupData,
        restoreFromBackupData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
