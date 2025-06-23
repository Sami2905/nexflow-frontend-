import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { authFetch } from '../utils/authFetch';
import SpinnerOverlay from '../components/SpinnerOverlay';
import { User, Bell, Lock, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  // Example state for toggles (in real app, sync with user/profile/global state)
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASuccess, setTwoFASuccess] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState('app'); // 'app' or 'email'
  const [twoFAQr, setTwoFAQr] = useState('');
  const [twoFAOtpauth, setTwoFAOtpauth] = useState('');
  const [activeSection, setActiveSection] = useState('preferences');
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await authFetch('http://localhost:5000/api/auth/me');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setDarkMode(data.theme === 'dark');
        setNotificationsEnabled(data.notificationsEnabled);
        setHighContrast(data.highContrast);
        setLanguage(data.language || 'en');
        setEmailPrefs(data.emailPrefs);
        setTwoFAEnabled(data.twoFactorEnabled);
        // Persist theme and accessibility
        document.documentElement.setAttribute('data-theme', data.theme || 'light');
        localStorage.setItem('theme', data.theme || 'light');
        if (data.highContrast) document.body.classList.add('contrast-200');
        else document.body.classList.remove('contrast-200');
      } catch {}
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const updateSettings = async (updates) => {
    try {
      const res = await authFetch('http://localhost:5000/api/auth/me/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      setToast('Settings updated!');
    } catch (err) {
      setToast('Failed to update settings');
    }
  };

  const handleThemeToggle = () => {
    setDarkMode(v => {
      const newVal = !v;
      document.documentElement.setAttribute('data-theme', newVal ? 'dark' : 'light');
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      updateSettings({ theme: newVal ? 'dark' : 'light' });
      return newVal;
    });
  };
  const handleNotificationsToggle = () => {
    setNotificationsEnabled(v => { updateSettings({ notificationsEnabled: !v }); return !v; });
  };
  const handleEmailPrefsToggle = () => {
    setEmailPrefs(v => { updateSettings({ emailPrefs: !v }); return !v; });
  };
  const handleLanguageChange = e => {
    setLanguage(e.target.value);
    updateSettings({ language: e.target.value });
  };
  const handleHighContrastToggle = () => {
    setHighContrast(v => {
      const newVal = !v;
      if (newVal) document.body.classList.add('contrast-200');
      else document.body.classList.remove('contrast-200');
      updateSettings({ highContrast: newVal });
      return newVal;
    });
  };
  const handlePasswordChange = async e => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      const res = await authFetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ current: passwordForm.current, newPassword: passwordForm.new }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      setPasswordSuccess('Password changed!');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPasswordError('Failed to change password');
    }
  };
  const handleDeleteAccount = async () => {
    try {
      const res = await authFetch('http://localhost:5000/api/auth/me', {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete account');
      localStorage.removeItem('token');
      setToast('Account deleted');
      setTimeout(() => navigate('/'), 1200);
    } catch {
      setToast('Failed to delete account');
    }
  };
  const handle2FASetup = async () => {
    setTwoFAError('');
    setTwoFASuccess('');
    setShow2FASetup(true);
    try {
      if (twoFAMethod === 'app') {
        const res = await authFetch('http://localhost:5000/api/auth/2fa/setup', {
          method: 'POST',
        });
        const data = await res.json();
        setTwoFASecret(data.secret);
        setTwoFAQr(data.qr);
        setTwoFAOtpauth(data.otpauthUrl);
      } else {
        await authFetch('http://localhost:5000/api/auth/2fa/email/send', {
          method: 'POST',
        });
      }
    } catch {
      setTwoFAError('Failed to start 2FA setup');
    }
  };
  const handle2FAVerify = async () => {
    setTwoFAError('');
    setTwoFASuccess('');
    try {
      const res = await authFetch('http://localhost:5000/api/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: twoFACode }),
      });
      if (!res.ok) throw new Error('Invalid code');
      await authFetch('http://localhost:5000/api/auth/2fa/enable', {
        method: 'POST',
      });
      setTwoFAEnabled(true);
      setShow2FASetup(false);
      setTwoFASuccess('2FA enabled!');
      setToast('2FA enabled!');
    } catch (err) {
      setTwoFAError('Invalid code');
    }
  };
  const handle2FADisable = async () => {
    if (!window.confirm('Disable 2FA?')) return;
    try {
      await authFetch('http://localhost:5000/api/auth/2fa/disable', {
        method: 'POST',
      });
      setTwoFAEnabled(false);
      setToast('2FA disabled');
    } catch {
      setToast('Failed to disable 2FA');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 ${highContrast ? 'contrast-200' : ''}`}>
      <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-0 w-full max-w-2xl flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="bg-surface-light dark:bg-surface-dark p-6 flex flex-col gap-6 w-full md:w-1/3 border-r border-border-light dark:border-border-dark">
          <div className="flex flex-col items-center gap-2">
            <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold"><User size={40} /></div>
            <div className="font-semibold text-lg mt-2">User Name</div>
            <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">user@email.com</div>
          </div>
          <div className="flex flex-col gap-4 mt-8">
            <button className={`flex items-center gap-2 font-semibold ${activeSection==='preferences' ? 'text-primary' : 'text-textSecondary-light dark:text-textSecondary-dark'}`} onClick={()=>setActiveSection('preferences')}><SettingsIcon size={18} /> Preferences</button>
            <button className={`flex items-center gap-2 ${activeSection==='notifications' ? 'text-blue-600 font-semibold' : 'text-textSecondary-light dark:text-textSecondary-dark'}`} onClick={()=>setActiveSection('notifications')}><Bell size={18} /> Notifications</button>
            <button className={`flex items-center gap-2 ${activeSection==='security' ? 'text-emerald-600 font-semibold' : 'text-textSecondary-light dark:text-textSecondary-dark'}`} onClick={()=>setActiveSection('security')}><Lock size={18} /> Security</button>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-8">
          <h2 className="text-2xl font-bold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Settings</h2>
          {toast && <div className="mb-2 text-success text-center">{toast}</div>}
          {loading ? <SpinnerOverlay message="Loading settings..." /> : (
            <div className="space-y-6">
              {activeSection === 'preferences' && <>
                {/* Theme Toggle */}
                <div className="flex items-center justify-between hover:bg-primary/5 rounded-lg px-4 py-2 transition">
                  <span className="font-semibold">Dark Mode</span>
                  <button className={`btn btn-sm ${darkMode ? 'btn-primary' : 'btn-outline'}`} onClick={handleThemeToggle}>{darkMode ? 'On' : 'Off'}</button>
                </div>
                {/* High Contrast */}
                <div className="flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg px-4 py-2 transition">
                  <span className="font-semibold">High Contrast</span>
                  <button className={`btn btn-sm ${highContrast ? 'btn-primary' : 'btn-outline'}`} onClick={handleHighContrastToggle}>{highContrast ? 'On' : 'Off'}</button>
                </div>
                {/* Language */}
                <div className="flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg px-4 py-2 transition">
                  <span className="font-semibold">Language</span>
                  <select className="input input-bordered w-32" value={language} onChange={handleLanguageChange}>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </>}
              {activeSection === 'notifications' && <>
                {/* Notification Preferences */}
                <div className="flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg px-4 py-2 transition">
                  <span className="font-semibold">Enable Notifications</span>
                  <button className={`btn btn-sm ${notificationsEnabled ? 'btn-primary' : 'btn-outline'}`} onClick={handleNotificationsToggle}>{notificationsEnabled ? 'On' : 'Off'}</button>
                </div>
                {/* Email Preferences */}
                <div className="flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg px-4 py-2 transition">
                  <span className="font-semibold">Email Preferences</span>
                  <button className={`btn btn-sm ${emailPrefs ? 'btn-primary' : 'btn-outline'}`} onClick={handleEmailPrefsToggle}>{emailPrefs ? 'On' : 'Off'}</button>
                </div>
              </>}
              {activeSection === 'security' && <>
                {/* Password Change */}
                <div className="mt-8">
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Lock size={16} /> Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="flex flex-col gap-2">
                    <input type="password" className="input input-bordered" placeholder="Current password" value={passwordForm.current} onChange={e => setPasswordForm(f => ({ ...f, current: e.target.value }))} required />
                    <input type="password" className="input input-bordered" placeholder="New password" value={passwordForm.new} onChange={e => setPasswordForm(f => ({ ...f, new: e.target.value }))} required />
                    <input type="password" className="input input-bordered" placeholder="Confirm new password" value={passwordForm.confirm} onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} required />
                    {passwordError && <div className="text-danger text-xs">{passwordError}</div>}
                    {passwordSuccess && <div className="text-success text-xs">{passwordSuccess}</div>}
                    <button type="submit" className="btn btn-primary mt-2">Change Password</button>
                  </form>
                </div>
                {/* 2FA Section */}
                <div className="mt-8">
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Lock size={16} /> Two-Factor Authentication</h3>
                  {twoFAEnabled ? (
                    <button className="btn btn-outline btn-sm" onClick={handle2FADisable}>Disable 2FA</button>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={handle2FASetup}>Enable 2FA</button>
                  )}
                  {show2FASetup && (
                    <div className="mt-4">
                      <div className="mb-2">Scan the QR code with your authenticator app:</div>
                      {twoFAQr && <img src={twoFAQr} alt="2FA QR Code" className="mx-auto mb-2" />}
                      <input type="text" className="input input-bordered" placeholder="Enter code" value={twoFACode} onChange={e => setTwoFACode(e.target.value)} />
                      <button className="btn btn-primary btn-sm mt-2" onClick={handle2FAVerify}>Verify</button>
                      {twoFAError && <div className="text-danger text-xs mt-1">{twoFAError}</div>}
                      {twoFASuccess && <div className="text-success text-xs mt-1">{twoFASuccess}</div>}
                    </div>
                  )}
                </div>
                {/* Delete Account */}
                <div className="mt-8">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-danger"><Lock size={16} /> Danger Zone</h3>
                  <button className="btn btn-error btn-outline w-full" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
                  {showDeleteConfirm && (
                    <div className="mt-2 p-4 bg-danger/10 rounded-lg">
                      <div className="mb-2 text-danger font-semibold">Are you sure you want to delete your account?</div>
                      <button className="btn btn-error mr-2" onClick={handleDeleteAccount}>Yes, Delete</button>
                      <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                    </div>
                  )}
                </div>
              </>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 