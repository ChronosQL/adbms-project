import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MessagesProvider } from './context/MessagesContext';
import { BookingsProvider } from './context/BookingsContext.jsx';
import { WeatherNotificationProvider } from './context/WeatherNotificationContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="913716108139-hi934gnivb53r81qp0dqbot47672oso2.apps.googleusercontent.com">
      <BrowserRouter>
        <AuthProvider>
          <MessagesProvider>
            <BookingsProvider>
              <WeatherNotificationProvider>
                <App />
              </WeatherNotificationProvider>
            </BookingsProvider>
          </MessagesProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)

