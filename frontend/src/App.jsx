import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StreakProvider, useStreak } from './context/StreakContext';
import { Toaster, toast } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OnboardingWizard from './pages/Onboarding/OnboardingWizard';
import Dashboard from './pages/Dashboard';
import RoadmapView from './pages/Roadmap/RoadmapView';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import Profile from './pages/Profile.jsx';
import { GraduationCap, Flame, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';


// Route Guards
const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-10 h-10 border-3 border-border-color border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile || !profile.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

const OnboardingRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-10 h-10 border-3 border-border-color border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile && profile.onboarding_complete) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="w-10 h-10 border-3 border-border-color border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    if (profile && profile.onboarding_complete) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return children;
};

// Layout with Header
const Layout = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const { current: streak, celebrating } = useStreak();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();


  const getInitials = () => {
    if (!profile?.full_name) return '?';
    return profile.full_name
      .split(' ')
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };
  
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-bg-primary text-text-primary font-body">
      <nav className="bg-bg-primary border-b border-border-color sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl text-text-primary" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center text-black font-extrabold">
              <GraduationCap size={16} />
            </div>
            CAREERVIO
          </Link>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-border-color hover:bg-white/5 text-text-secondary hover:text-text-primary transition duration-200 cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (

              <div className="flex items-center gap-3 md:gap-5">
                <div className="flex items-center gap-1.5 text-accent font-semibold text-sm" title="Preparation Streak">
                  <Flame
                    size={18}
                    className={`text-accent ${celebrating ? 'animate-streak-flame-pop' : 'animate-scale-pulse'}`}
                  />
                  <span>{streak} day{streak !== 1 ? 's' : ''}</span>
                </div>
                {profile?.onboarding_complete && (
                  <>
                    <div className="hidden md:flex items-center gap-2.5">
                      <Link to="/dashboard" className="px-3.5 py-1.5 text-xs font-semibold font-heading text-text-primary bg-transparent border border-border-color hover:bg-white/5 hover:border-text-secondary rounded-lg transition duration-200">
                        Dashboard
                      </Link>
                      <Link to="/roadmap" className="px-3.5 py-1.5 text-xs font-semibold font-heading text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200">
                        Roadmap
                      </Link>
                      <Link to="/resume-analyzer" className="px-3.5 py-1.5 text-xs font-semibold font-heading text-text-primary bg-transparent border border-border-color hover:bg-white/5 hover:border-text-secondary rounded-lg transition duration-200">
                        Resume
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(!menuOpen)}
                          className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 hover:border-accent flex items-center justify-center text-accent text-xs font-bold transition duration-200 cursor-pointer select-none"
                          title="Account Menu"
                        >
                          {getInitials()}
                        </button>

                        {menuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setMenuOpen(false)} 
                            />
                            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-bg-card border border-border-color shadow-xl z-50 py-1.5 animate-fade-in text-left">
                              <Link
                                to="/profile"
                                onClick={() => setMenuOpen(false)}
                                className="w-full px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-white/5 transition-colors duration-150 flex items-center gap-2 text-left cursor-pointer"
                              >
                                <Settings size={14} /> Settings
                              </Link>
                              <button
                                type="button"
                                onClick={async () => {
                                  setMenuOpen(false);
                                  try {
                                    await signOut();
                                    toast.success('Successfully logged out.');
                                  } catch (err) {
                                    toast.error(err.message || 'Error signing out.');
                                  }
                                }}
                                className="w-full px-4 py-2.5 text-xs font-semibold text-error hover:bg-error/10 transition-colors duration-150 flex items-center gap-2 text-left cursor-pointer border-none bg-transparent"
                              >
                                <LogOut size={14} /> Logout
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="md:hidden p-1.5 rounded-lg border border-border-color hover:bg-white/5 text-text-primary transition duration-200 cursor-pointer"
                      title="Toggle Menu"
                    >
                      {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-xs font-semibold font-heading text-text-primary bg-transparent border border-border-color hover:bg-white/5 hover:border-text-secondary rounded-lg transition duration-200">
                  Sign In
                </Link>
                <Link to="/signup" className="px-4 py-2 text-xs font-semibold font-heading text-black bg-accent hover:bg-accent-hover rounded-lg transition duration-200">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {user && profile?.onboarding_complete && mobileMenuOpen && (
          <div className="md:hidden border-t border-border-color bg-bg-card animate-fade-in">
            <div className="px-6 py-4 flex flex-col gap-3">
              <Link 
                to="/dashboard" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold font-heading text-text-primary bg-transparent hover:bg-white/5 border border-border-color transition duration-200 text-center"
              >
                Dashboard
              </Link>
              <Link 
                to="/roadmap" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold font-heading text-black bg-accent hover:bg-accent-hover transition duration-200 text-center"
              >
                Roadmap
              </Link>
              <Link 
                to="/resume-analyzer" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold font-heading text-text-primary bg-transparent hover:bg-white/5 border border-border-color transition duration-200 text-center"
              >
                Resume
              </Link>
              <div className="border-t border-border-color/50 my-1" />
              <Link 
                to="/profile" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold font-heading text-text-secondary hover:bg-white/5 flex items-center justify-center gap-2 transition duration-200"
              >
                <Settings size={14} /> Settings
              </Link>
              <button 
                type="button"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  try {
                    await signOut();
                    toast.success('Successfully logged out.');
                  } catch (err) {
                    toast.error(err.message || 'Error signing out.');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold font-heading text-error hover:bg-error/10 flex items-center justify-center gap-2 transition duration-200 border-none bg-transparent"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="flex-1 flex flex-col w-full overflow-y-auto min-h-0">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <StreakProvider>
            <Toaster

            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'var(--font-body)',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: 'var(--success)',
                  secondary: 'var(--bg-card)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--error)',
                  secondary: 'var(--bg-card)',
                },
              },
            }}
          />
          <Layout>
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
              <Route path="/onboarding" element={<OnboardingRoute><OnboardingWizard /></OnboardingRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/roadmap" element={<ProtectedRoute><RoadmapView /></ProtectedRoute>} />
              <Route path="/resume-analyzer" element={<ProtectedRoute><ResumeAnalyzer /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
          </StreakProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}


export default App;
