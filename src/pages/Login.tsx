import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Eye,
    EyeOff,
    Lock,
    User,
    LogIn,
    TrendingUp,
    ShoppingCart,
    Users,
    DollarSign,
    Package,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authService } from '@/services';

// Validation schema
const loginSchema = z.object({
    username: z.string().min(3, "Username kamida 3 ta belgidan iborat bo'lishi kerak").max(50, 'Username juda uzun'),
    password: z.string().min(4, "Parol kamida 4 ta belgidan iborat bo'lishi kerak").max(100, 'Parol juda uzun'),
    rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
            rememberMe: false,
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);

        try {
            await authService.login({
                username: data.username,
                password: data.password,
            });

            localStorage.setItem('isAuthenticated', 'true');
            await authService.getCurrentUser();

            toast({
                title: 'Xush kelibsiz!',
                description: 'Tizimga muvaffaqiyatli kirdingiz.',
            });

            navigate('/products');
        } catch (error) {
            toast({
                title: 'Xatolik yuz berdi',
                description: "Username yoki parol noto'g'ri.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center relative overflow-hidden p-4'>
            {/* Theme Toggle - Top Right */}
            <div className='absolute top-4 right-4 z-20'>
                <ThemeToggle />
            </div>

            {/* Animated Background */}
            <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-success/10 dark:from-primary/5 dark:via-background dark:to-success/5' />

            {/* Floating Icons Animation */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
                {/* Top Left - Shopping Cart */}
                <div className='absolute top-20 left-20 opacity-10 animate-float'>
                    <ShoppingCart className='w-24 h-24 text-primary' />
                </div>

                {/* Top Right - Trending */}
                <div className='absolute top-32 right-32 opacity-10 animate-float-delayed'>
                    <TrendingUp className='w-32 h-32 text-success' />
                </div>

                {/* Bottom Left - Users */}
                <div className='absolute bottom-40 left-32 opacity-10 animate-float-slow'>
                    <Users className='w-28 h-28 text-info' />
                </div>

                {/* Bottom Right - Dollar */}
                <div className='absolute bottom-32 right-24 opacity-10 animate-float'>
                    <DollarSign className='w-36 h-36 text-warning' />
                </div>

                {/* Center Left - Package */}
                <div className='absolute top-1/2 left-10 -translate-y-1/2 opacity-10 animate-float-delayed'>
                    <Package className='w-20 h-20 text-primary' />
                </div>

                {/* Center Right - Chart */}
                <div className='absolute top-1/2 right-10 -translate-y-1/2 opacity-10 animate-float-slow'>
                    <BarChart3 className='w-24 h-24 text-success' />
                </div>

                {/* Additional decorative circles */}
                <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse' />
                <div className='absolute bottom-1/4 right-1/4 w-80 h-80 bg-success/5 rounded-full blur-3xl animate-pulse-slow' />
            </div>

            {/* Main Content */}
            <div className='relative z-10  max-w-6xl  justify-center items-center'>
                {/* Right Side - Login Card */}
                <Card className='w-full  sm:max-w-xl` md:max-w-2xl lg:max-w-3xl shadow-2xl border-border/50 backdrop-blur-sm bg-card/95 p-4 '>
                    <CardHeader className='space-y-1 text-center'>
                        <CardTitle className='text-2xl lg:text-3xl font-bold'>Tizimga kirish</CardTitle>
                    </CardHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className='space-y-4'>
                                {/* Username Field */}
                                <FormField
                                    control={form.control}
                                    name='username'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Username</FormLabel>
                                            <FormControl>
                                                <div className='relative'>
                                                    <User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                                    <Input placeholder='username' className='pl-10 h-11' {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Password Field */}
                                <FormField
                                    control={form.control}
                                    name='password'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Parol</FormLabel>
                                            <FormControl>
                                                <div className='relative'>
                                                    <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                                                    <Input
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder='••••••••'
                                                        className='pl-10 pr-10 h-11'
                                                        {...field}
                                                    />
                                                    <button
                                                        type='button'
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className='h-4 w-4' />
                                                        ) : (
                                                            <Eye className='h-4 w-4' />
                                                        )}
                                                    </button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Remember Me & Forgot Password */}
                                <div className='flex items-center justify-between'>
                                    <FormField
                                        control={form.control}
                                        name='rememberMe'
                                        render={({ field }) => (
                                            <FormItem className='flex items-center space-x-2 space-y-0'>
                                                <FormControl>
                                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormLabel className='text-sm font-medium cursor-pointer'>
                                                    Eslab qolish
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className='flex flex-col space-y-4'>
                                <Button
                                    type='submit'
                                    className='w-full h-11 text-base font-semibold'
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className='flex items-center gap-2'>
                                            <div className='h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent' />
                                            Yuklanmoqda...
                                        </div>
                                    ) : (
                                        <div className='flex items-center gap-2'>
                                            <LogIn className='h-4 w-4' />
                                            Kirish
                                        </div>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default Login;
