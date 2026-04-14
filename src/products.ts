export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  image: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "মিনিকেট চাল",
    price: 65,
    unit: "কেজি",
    category: "চাল",
    image: "https://picsum.photos/seed/rice/400/300"
  },
  {
    id: 2,
    name: "মসুর ডাল (দেশি)",
    price: 140,
    unit: "কেজি",
    category: "ডাল",
    image: "https://picsum.photos/seed/dal/400/300"
  },
  {
    id: 3,
    name: "রূপচাঁদা সয়াবিন তেল",
    price: 170,
    unit: "লিটার",
    category: "তেল",
    image: "https://picsum.photos/seed/oil/400/300"
  },
  {
    id: 4,
    name: "চিনি (সাদা)",
    price: 135,
    unit: "কেজি",
    category: "চিনি",
    image: "https://picsum.photos/seed/sugar/400/300"
  },
  {
    id: 5,
    name: "আয়োডিনযুক্ত লবণ",
    price: 40,
    unit: "কেজি",
    category: "লবণ",
    image: "https://picsum.photos/seed/salt/400/300"
  },
  {
    id: 6,
    name: "আটা (প্যাকেট)",
    price: 55,
    unit: "কেজি",
    category: "আটা",
    image: "https://picsum.photos/seed/flour/400/300"
  },
  {
    id: 7,
    name: "গুঁড়ো দুধ (ডিপ্লোমা)",
    price: 850,
    unit: "কেজি",
    category: "দুধ",
    image: "https://picsum.photos/seed/milk/400/300"
  },
  {
    id: 8,
    name: "চা পাতা (ইস্পাহানি)",
    price: 120,
    unit: "২০০ গ্রাম",
    category: "চা",
    image: "https://picsum.photos/seed/tea/400/300"
  }
];
