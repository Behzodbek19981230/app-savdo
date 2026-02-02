# 🚀 Smart Savdo

Zamonaviy va professional savdo boshqaruv tizimi - React, TypeScript va Tailwind CSS yordamida qurilgan.

## ✨ Xususiyatlar

- 🎨 **Zamonaviy UI/UX** - shadcn/ui komponentlari va Tailwind CSS
- 📱 **Responsive Design** - Mobil va desktop uchun optimallashtirilgan
- 🌓 **Dark/Light Mode** - Mavzu o'zgartirish
- 🔐 **Authentication** - To'liq autentifikatsiya tizimi
- 🔄 **React Query** - Server state management
- 📊 **Dashboard** - Statistika va analytics
- 👥 **Customer Management** - Mijozlarni boshqarish
- 📦 **Order Management** - Buyurtmalarni boshqarish
- 🎯 **TypeScript** - Type-safe development
- ⚡ **Vite** - Lightning fast build tool

## 🛠️ Texnologiyalar

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Query
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Theme:** next-themes
- **Charts:** Recharts
- **Form Handling:** React Hook Form + Zod

## 📋 Talablar

- Node.js 18+ 
- npm yoki yarn yoki bun

## 🚀 O'rnatish

1. **Repository'ni clone qiling:**
```bash
git clone <YOUR_GIT_URL>
cd bright-script-booster
```

2. **Dependency'larni o'rnating:**
```bash
npm install
```

3. **Environment variables'ni sozlang:**
```bash
cp .env.example .env
```

`.env` faylida kerakli o'zgarishlarni kiriting:
```env
VITE_API_BASE_URL=https://your-api-url.com
```

4. **Development server'ni ishga tushiring:**
```bash
npm run dev
```

Brauzerda `http://localhost:8080` manzilini oching.

## 📜 Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Linting
npm run lint
```

## 📁 Loyiha Strukturasi

```
src/
├── components/           # React komponentlar
│   ├── dashboard/       # Dashboard komponentlari
│   ├── layouts/         # Layout komponentlari
│   ├── ui/              # shadcn/ui komponentlari
│   └── ProtectedRoute.tsx
├── contexts/            # React Context'lar
├── hooks/               # Custom hooks
│   ├── api/            # React Query hooks
│   └── use-toast.ts
├── lib/                 # Utility funksiyalar
│   ├── api/            # API konfiguratsiya
│   └── utils.ts
├── pages/              # Page komponentlar
├── services/           # API service'lar
├── App.tsx             # Main App component
└── main.tsx            # Entry point
```

## 🔐 Authentication

Loyihada to'liq autentifikatsiya tizimi mavjud:

- Login sahifasi
- Protected routes
- Token management (access & refresh)
- Auto logout on token expiry
- Auth context

### Login

Demo uchun istalgan email va parol kiriting.

Production uchun `src/services/auth.service.ts` faylida API endpoint'larni to'g'ri sozlang.

## 🎯 API Integration

Loyihada to'liq API integration tizimi yaratilgan. Batafsil ma'lumot uchun [API_GUIDE.md](./API_GUIDE.md) faylini o'qing.

### Tez start:

```typescript
// Service'dan foydalanish
import { customerService } from '@/services';
const customers = await customerService.getAll();

// React Query hook'dan foydalanish (tavsiya etiladi)
import { useCustomers } from '@/hooks/api/useCustomers';
function MyComponent() {
  const { data, isLoading } = useCustomers();
  return <div>{data?.map(...)}</div>;
}
```

## 🎨 Customization

### Theme

Theme sozlamalari `src/index.css` faylida:

```css
:root {
  --primary: 221 83% 53%;
  --secondary: 210 40% 96%;
  /* ... */
}
```

### Komponentlar

shadcn/ui komponentlarini qo'shish:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

## 📱 Responsive Design

Loyiha to'liq responsive:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Barcha komponentlar mobil qurilmalarga moslashtirilgan.

## 🚢 Deployment

### Build

```bash
npm run build
```

Build fayllar `dist/` papkasida paydo bo'ladi.

### Deploy qilish

- **Vercel:** `vercel --prod`
- **Netlify:** `netlify deploy --prod`
- **GitHub Pages:** GitHub Actions bilan
- **Custom Server:** `dist/` papkasini server'ga upload qiling

## 🤝 Contributing

1. Fork qiling
2. Feature branch yarating (`git checkout -b feature/amazing-feature`)
3. Commit qiling (`git commit -m 'Add amazing feature'`)
4. Push qiling (`git push origin feature/amazing-feature`)
5. Pull Request oching

## 📄 License

MIT License - batafsil ma'lumot uchun [LICENSE](LICENSE) faylini o'qing.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - UI komponentlar
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [React Query](https://tanstack.com/query) - Data fetching
- [Lucide Icons](https://lucide.dev/) - Icon'lar

## 📞 Support

Agar savollaringiz bo'lsa:
- Issue oching GitHub'da
- Email yuboring
- Telegram: @yourusername

---

**⭐ Agar loyiha yoqsa, star bosishni unutmang!**
# admin-savdo
# admin-savdo
# admin-savdo
