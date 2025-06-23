import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

// Mock user data for now
const user = {
  name: 'Test User',
  email: 'test@test.com',
  role: 'Developer',
  projects: [
    { id: 1, name: 'NexFlow Core' },
    { id: 2, name: 'UI Redesign' },
  ],
};
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '', avatar: '', role: '', projects: [] });
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await authFetch('/api/auth/me');
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setProfileError('Could not load profile');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = async e => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await authFetch('http://localhost:5000/api/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setProfile(data);
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      setProfileError('Could not update profile');
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileSuccess(''), 2500);
    }
  };

  const handleAvatarUpload = async e => {
    e.preventDefault();
    if (!avatarFile) return;
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const res = await authFetch('http://localhost:5000/api/auth/me/avatar', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload avatar');
      const data = await res.json();
      setProfile(data);
      setProfileSuccess('Avatar updated successfully!');
    } catch (err) {
      setProfileError('Could not upload avatar');
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileSuccess(''), 2500);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <div className="relative mb-4">
          <img
            src={profile.avatar || '/default-avatar.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow"
          />
          <span className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold border-2 border-white dark:border-gray-900">
            {getInitials(profile.name)}
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">{profile.name}</h2>
        <div className="text-gray-500 dark:text-gray-300 mb-2">{profile.email}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">Role: <span className="font-semibold">{profile.role}</span></div>
        <div className="w-full mb-4">
          <div className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-200">Projects</div>
          <ul className="list-disc list-inside space-y-1">
            {(profile.projects || []).map(p => (
              <li key={p._id || p.id} className="text-gray-700 dark:text-gray-100">{p.name}</li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4 w-full" aria-label="Edit Profile Form">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Change Avatar</span>
            <input
              type="file"
              accept="image/*"
              onChange={e => setAvatarFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80 mt-1"
              aria-label="Upload Avatar"
            />
            <button
              type="button"
              className="btn btn-secondary mt-2"
              onClick={handleAvatarUpload}
              disabled={profileLoading || !avatarFile}
              aria-disabled={profileLoading || !avatarFile}
            >
              {profileLoading && avatarFile ? 'Uploading...' : 'Upload Avatar'}
            </button>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</span>
            <input
              className="input input-bordered w-full"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              aria-label="Name"
              required
              disabled={profileLoading}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</span>
            <input
              className="input input-bordered w-full"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              aria-label="Email"
              type="email"
              required
              disabled={profileLoading}
            />
          </label>
          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={profileLoading}
            aria-disabled={profileLoading}
          >
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
          {profileError && <div className="text-red-600 text-sm mt-2" role="alert">{profileError}</div>}
          {profileSuccess && <div className="text-green-600 text-sm mt-2" role="status">{profileSuccess}</div>}
        </form>
      </div>
    </div>
  );
} 