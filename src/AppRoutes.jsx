import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import BoardView from './components/BoardView';
import Profile from './pages/Profile';
import CreateProject from './pages/CreateProject';
import ReportBug from './pages/ReportBug';
import Settings from './pages/Settings';
import ListView from './pages/ListView';
import ActivityView from './pages/ActivityView';
import ProjectSettings from './pages/ProjectSettings';
import EnhancedDashboard from './pages/EnhancedDashboard';
import NewIssue from './pages/NewIssue';
import Bugs from './pages/Bugs';
import InviteMember from './pages/InviteMember';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected routes */}
      <Route element={<Layout />}>
        <Route index element={<EnhancedDashboard />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/create" element={<CreateProject />} />
        <Route path="projects/:id" element={<ProjectDetailPage />}>
          <Route index element={<BoardView />} />
          <Route path="list" element={<ListView />} />
          <Route path="activity" element={<ActivityView />} />
          <Route path="settings" element={<ProjectSettings />} />
        </Route>
        <Route path="profile" element={<Profile />} />
        <Route path="bugs/report" element={<ReportBug />} />
        <Route path="bugs/new" element={<NewIssue />} />
        <Route path="bugs" element={<Bugs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="invite" element={<InviteMember />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
} 