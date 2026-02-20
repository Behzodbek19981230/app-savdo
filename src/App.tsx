import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from '@/services';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import Index from './pages/Index';
import Customers from './pages/Customers';
import Products from './pages/Products';
import ProductShow from './pages/ProductShow';
import ProductAdd from './pages/ProductAdd';
import Locations from './pages/Locations';
import ProductCategories from './pages/ProductCategories';
import ProductBranchCategories from './pages/ProductBranchCategories';
import ProductModels from './pages/ProductModels';
import ModelSizes from './pages/ModelSizes';
import ModelTypeAndSize from './pages/ModelTypeAndSize';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Roles from './pages/Roles';
import Users from './pages/Users';
import Companies from './pages/Companies';
import ExchangeRates from './pages/ExchangeRates';
import PurchaseInvoices from './pages/PurchaseInvoices';
import Korzinka from './pages/Korzinka';
import PurchaseInvoiceAdd from './pages/PurchaseInvoiceAdd';
import PurchaseInvoiceShow from './pages/PurchaseInvoiceShow';
import Suppliers from './pages/Suppliers';
import Sklad from './pages/Sklad';
import Units from './pages/Units';
import OrderHistory from './pages/OrderHistory';
import ExpenseCategories from './pages/ExpenseCategories';
import { OrderShowPage } from './pages/OrderHistoryShow';

// React Query client configuration
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 60 * 1000, // 1 minute
		},
	},
});
const RootRedirect = () => {
	const isAuth = authService.isAuthenticated();
	return <Navigate to={isAuth ? '/dashboard' : '/login'} replace />;
};

const publicRoutes = [
	{
		path: '/',
		element: <RootRedirect />,
	},
	{
		path: '/login',
		element: <Login />,
	},
];
const protectedRoutes = [
	{
		path: '/dashboard',
		element: <Index />,
	},
	{
		path: '/customers',
		element: <Customers />,
	},
	{
		path: '/products',
		element: <Products />,
	},
	{
		path: '/products/add',
		element: <ProductAdd />,
	},
	{
		path: '/products/:id',
		element: <ProductShow />,
	},
	{
		path: '/locations',
		element: <Locations />,
	},
	{
		path: '/product-categories',
		element: <ProductCategories />,
	},
	{
		path: '/product-branch-categories',
		element: <ProductBranchCategories />,
	},
	{
		path: '/product-models',
		element: <ProductModels />,
	},
	{
		path: '/model-sizes',
		element: <ModelTypeAndSize defaultTab='model-size' />,
	},
	{
		path: '/model-types',
		element: <ModelTypeAndSize defaultTab='model-type' />,
	},
	{
		path: '/role',
		element: <Roles />,
	},
	{
		path: '/user',
		element: <Users />,
	},
	{
		path: '/company',
		element: <Companies />,
	},
	{
		path: '/exchange-rates',
		element: <ExchangeRates />,
	},
	{
		path: '/purchase-invoices',
		element: <PurchaseInvoices />,
	},
	{
		path: '/karzinka',
		element: <Korzinka />,
	},
	{
		path: '/order-history',
		element: <OrderHistory />,
	},
	{
		path: '/order-history/:id',
		element: <OrderShowPage />,
	},
	{
		path: '/purchase-invoices/add',
		element: <PurchaseInvoiceAdd />,
	},
	{
		path: '/purchase-invoices/:id',
		element: <PurchaseInvoiceShow />,
	},
	{
		path: '/suppliers',
		element: <Suppliers />,
	},
	{
		path: '/sklad',
		element: <Sklad />,
	},
	{
		path: '/units',
		element: <Units />,
	},
	{
		path: '/expense-categories',
		element: <ExpenseCategories />,
	},
];

const App = () => (
	<QueryClientProvider client={queryClient}>
		<ThemeProvider attribute='class' defaultTheme='light' enableSystem>
			<TooltipProvider>
				<Toaster />
				<Sonner />
				<BrowserRouter>
					<AuthProvider>
						<Routes>
							{publicRoutes.map((route) => (
								<Route key={route.path} path={route.path} element={route.element} />
							))}
							{protectedRoutes.map((route) => (
								<Route
									key={route.path}
									path={route.path}
									element={
										<ProtectedRoute>
											<DashboardLayout>{route.element}</DashboardLayout>
										</ProtectedRoute>
									}
								/>
							))}

							{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
							<Route path='*' element={<NotFound />} />
						</Routes>
					</AuthProvider>
				</BrowserRouter>
			</TooltipProvider>
		</ThemeProvider>
	</QueryClientProvider>
);

export default App;
