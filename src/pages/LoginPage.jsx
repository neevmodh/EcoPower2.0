import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, User, Shield, Target } from 'lucide-react';
import { login } from '../services/authService';
import { useApp } from '../context/AppContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();
    const { setCurrentUser } = useApp();

    // Matrix-style falling characters background effect
    useEffect(() => {
        const canvas = document.getElementById('matrix-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = '01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = [];

        for (let x = 0; x < columns; x++) {
            drops[x] = Math.random() * -100; // Random starting positions above screen
        }

        const draw = () => {
            // Semi-transparent black background creates the trail effect
            ctx.fillStyle = 'rgba(5, 9, 8, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#004d26'; // Very dark/dim green for the matrix
            ctx.font = `${fontSize}px "IBM Plex Mono", monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleQuickDemo = (e, emailVal, passVal) => {
        e.preventDefault();
        setEmail(emailVal);
        setPassword(passVal);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Both email and password are required');
            triggerShake();
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await login(email, password);

            if (response.success) {
                setCurrentUser(response.user);

                // Show success toast
                window.dispatchEvent(new CustomEvent('eco-toast', {
                    detail: { message: `Welcome back, ${response.user.name.split(' ')[0]}! ⚡`, type: 'success' }
                }));

                // artificial minor delay for smoother transition
                setTimeout(() => {
                    if (response.user.role === 'admin') {
                        navigate('/admin/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }, 300);
            } else {
                setError(response.error || 'Invalid credentials');
                triggerShake();
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            triggerShake();
        } finally {
            setIsSubmitting(false);
        }
    };

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500); // Remove class after animation
    };

    return (
        <div className="relative min-h-screen bg-[#050908] flex items-center justify-center overflow-hidden font-jakarta">
            {/* Background Canvas */}
            <canvas
                id="matrix-canvas"
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
            />

            {/* Fallback gradients if canvas fails or loads slowly */}
            <div className="absolute inset-0 z-0 bg-gradient-radial from-[#00C864]/5 to-transparent blur-3xl rounded-full scale-150 transform -translate-y-1/2" />

            {/* Main Glass Card */}
            <div
                className={`relative z-10 w-full max-w-[420px] mx-4 transition-transform duration-300 ${isShaking ? 'animate-shake' : ''}`}
            >
                <div className="bg-[#0d1512]/90 backdrop-blur-xl border border-[#00C864]/20 rounded-2xl shadow-2xl shadow-[#00C864]/5 overflow-hidden">
                    {/* Top Gradient Border Accent */}
                    <div className="h-1 w-full bg-gradient-to-r from-[#00C864] via-[#00FF85] to-[#009448]"></div>

                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00C864]/20 to-transparent border border-[#00C864]/30 mb-4 animate-[pulse_3s_ease-in-out_infinite]">
                                <Zap className="w-8 h-8 text-[#00FF85]" fill="currentColor" />
                            </div>
                            <h1 className="text-3xl font-syne font-bold text-white tracking-tight mb-2">
                                Eco<span className="text-[#00C864]">Power</span>
                            </h1>
                            <p className="text-[#00C864]/70 text-sm font-medium tracking-wide uppercase">
                                Energy-as-a-Service Platform
                            </p>
                        </div>

                        {/* Quick Access Demo Buttons */}
                        <div className="mb-8">
                            <div className="flex items-center mb-3">
                                <div className="h-px flex-1 bg-white/5"></div>
                                <span className="px-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Quick Demo Access</span>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={(e) => handleQuickDemo(e, 'neevmodh205@gmail.com', 'neev@123')}
                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-4 h-4 text-white/50 group-hover:text-[#3B82F6] transition-colors" />
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">neevmodh205@gmail.com</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] uppercase tracking-wider">Admin</span>
                                </button>

                                <button
                                    onClick={(e) => handleQuickDemo(e, 'modh4001@gmail.com', 'modh4001')}
                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-white/50 group-hover:text-[#00C864] transition-colors" />
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">modh4001@gmail.com</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00C864]/20 text-[#00C864] uppercase tracking-wider">Customer</span>
                                </button>

                                <button
                                    onClick={(e) => handleQuickDemo(e, 'demo@ecopower.in', 'Demo@123')}
                                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Target className="w-4 h-4 text-white/50 group-hover:text-amber-500 transition-colors" />
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">demo@ecopower.in</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 uppercase tracking-wider">Demo / Base</span>
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-fade-in">
                                <div className="text-red-400 text-sm">{error}</div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1 group">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                                <div className={`relative flex items-center rounded-xl bg-black/40 border transition-colors ${error && !email ? 'border-red-500/50' : 'border-white/10 focus-within:border-[#00C864]/50 hover:border-white/20'}`}>
                                    <div className="absolute left-4 text-white/40 group-focus-within:text-[#00C864] transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="Enter your email"
                                        className="w-full bg-transparent text-white placeholder-white/20 px-12 py-3.5 focus:outline-none focus:ring-0 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 group">
                                <div className="flex items-center justify-between overflow-hidden">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                                </div>
                                <div className={`relative flex items-center rounded-xl bg-black/40 border transition-colors ${error && !password ? 'border-red-500/50' : 'border-white/10 focus-within:border-[#00C864]/50 hover:border-white/20'}`}>
                                    <div className="absolute left-4 text-white/40 group-focus-within:text-[#00C864] transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="••••••••"
                                        className="w-full bg-transparent text-white placeholder-white/20 px-12 py-3.5 focus:outline-none focus:ring-0 text-sm tracking-wider font-ibm-plex"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 text-white/40 hover:text-white transition-colors focus:outline-none"
                                        tabIndex="-1"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="relative w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-[#00C864] to-[#009448] text-white font-bold text-[15px] overflow-hidden group transition-transform active:scale-[0.98]"
                            >
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out skew-x-[-20deg]"></div>

                                <span className="relative flex items-center justify-center gap-2">
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Sign In
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-xs font-ibm-plex text-[#00C864]/40 flex items-center justify-center gap-2">
                    <span>Secured by EcoPower</span>
                    <span>•</span>
                    <span>INSTINCT 4.0 Finalist</span>
                    <span>•</span>
                    <span>Top 10 India 🏆</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
