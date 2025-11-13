import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import api from '@/utils/axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/login', {
                username,
                password
            });

            if (response.data.isSuccess) {
                // Store token and user data
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));

                // Redirect to dashboard
                navigate("/dashboard");
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (error: any) {
            console.error('Login error:', error);

            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else if (error.response?.data?.errors) {
                // Handle validation errors
                const validationErrors = error.response.data.errors;
                const firstError = Object.values(validationErrors)[0] as string[];
                setError(firstError[0] || 'Validation failed');
            } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
                setError('Cannot connect to server. Please try again.');
            } else {
                setError('An error occurred during login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[url('bg.jpg')] bg-cover bg-center p-4">
            {/* Gradient overlay for better contrast */}
            <div className="absolute inset-0 bg-black/20"></div>

            <Card className="w-full max-w-md brightnes-110 shadow-2xl border-4 border-black/10 bg-white/90 z-100">
                <CardHeader className="space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-blue-600 p-3 rounded-full">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-center">Library Management System</CardTitle>
                    <CardDescription className="text-center">
                        Sign in to manage your library
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 hover:cursor-pointer"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}