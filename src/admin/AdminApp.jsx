import { Routes, Route } from 'react-router-dom'
import { AuthProvider, RequireAuth } from './auth'
import Login from './Login'
import Dashboard from './Dashboard'
import PersonalInfo from './PersonalInfo'
import ChatbotSettings from './ChatbotSettings'
import GitHubPanel from './GitHubPanel'
import SiteSettings from './SiteSettings'
import ResetPassword from './ResetPassword'
import VerifyPassword from './VerifyPassword'
import ResourceManager from './ResourceManager'
import { CONFIGS } from './configs'

// Mounted at /admin/* - child paths are relative to /admin.
export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="reset" element={<ResetPassword />} />
        <Route path="verify-password" element={<VerifyPassword />} />
        <Route element={<RequireAuth><Dashboard /></RequireAuth>}>
          <Route index element={<PersonalInfo />} />
          <Route path="skills" element={<ResourceManager config={CONFIGS.skills} />} />
          <Route path="projects" element={<ResourceManager config={CONFIGS.projects} />} />
          <Route path="experiences" element={<ResourceManager config={CONFIGS.experiences} />} />
          <Route path="awards" element={<ResourceManager config={CONFIGS.awards} />} />
          <Route path="certificates" element={<ResourceManager config={CONFIGS.certificates} />} />
          <Route path="changelog" element={<ResourceManager config={CONFIGS.changelog} />} />
          <Route path="chatbot" element={<ChatbotSettings />} />
          <Route path="github" element={<GitHubPanel />} />
          <Route path="settings" element={<SiteSettings />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
