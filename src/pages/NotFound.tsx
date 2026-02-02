import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20">
          <Search className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mb-3 text-6xl lg:text-7xl font-black text-foreground">404</h1>
        <h2 className="mb-2 text-xl lg:text-2xl font-bold text-foreground">Sahifa topilmadi</h2>
        <p className="mb-8 text-sm lg:text-base text-muted-foreground">
          Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki o'chirilgan.
        </p>
        <Link to="/">
          <Button size="lg" className="gap-2 rounded-xl">
            <Home className="h-4 w-4" />
            Bosh sahifaga qaytish
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
