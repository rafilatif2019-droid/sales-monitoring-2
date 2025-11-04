
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
// FIX: Import InboxProvider to make the inbox context available to the app
import { InboxProvider } from './contexts/InboxContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UserProvider>
      <AuthProvider>
        <NotificationProvider>
          {/* FIX: Wrap the App with InboxProvider to enable the inbox feature */}
          <InboxProvider>
            <App />
          </InboxProvider>
        </NotificationProvider>
      </AuthProvider>
    </UserProvider>
  </React.StrictMode>
);