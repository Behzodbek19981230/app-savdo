import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import ProductModels from './pages/ProductModels';
import ModelSizes from './pages/ModelSizes';
import ModelTypes from './pages/ModelTypes';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Roles from './pages/Roles';
import Users from './pages/Users';
import Companies from './pages/Companies';

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
const publicRoutes = [
	{
		path: '/login',
		element: <Login />,
	},
];
const protectedRoutes = [
	{
		path: '/',
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
		path: '/product-models',
		element: <ProductModels />,
	},
	{
		path: '/model-sizes',
		element: <ModelSizes />,
	},
	{
		path: '/model-types',
		element: <ModelTypes />,
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
