import React, { useContext, useEffect, useRef, useState } from 'react';
import { INVENTORY_SCOPE } from '../api/inventorySheet';
import { loadOrgInfo } from '../api/orgInfo';
import { ROSTER_SCOPE } from '../api/roster';
import { AuthContext } from '../App';

export default function GoogleLoginButton() {
  // Use a ref to store the token client instance across renders
  const tokenClientRef = useRef(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const { login, setUserProfile } = useContext(AuthContext);
  const loginRef = useRef(login);
  const setUserProfileRef = useRef(setUserProfile);

  loginRef.current = login;
  setUserProfileRef.current = setUserProfile;

  useEffect(() => {
    let isMounted = true;
    let script;

    loadOrgInfo()
      .then((config) => {
        if (!config.clientId) {
          throw new Error('Organization configuration does not include a Google client ID.');
        }

        if (!isMounted) {
          return;
        }

        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          if (isMounted && window.google?.accounts?.oauth2) {
            tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
              client_id: config.clientId,
              scope: `https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email ${ROSTER_SCOPE} ${INVENTORY_SCOPE}`,
              callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                  console.log('Access Token Received:', tokenResponse.access_token);
                  loginRef.current(tokenResponse.access_token);
                  handleFetchUserData(tokenResponse.access_token);
                }
              },
            });
            setIsSdkReady(true);
          } else if (isMounted) {
            setSdkError('Google SDK failed to initialize.');
          }
        };

        script.onerror = () => {
          if (isMounted) {
            setSdkError('Google SDK failed to load.');
          }
        };
      })
      .catch((error) => {
        if (isMounted) {
          setSdkError(error.message);
        }
      });

    // Cleanup script on unmount
    return () => {
      isMounted = false;
      script?.remove();
    };
  }, []);

  // 3. Handle user profile fetching
  const handleFetchUserData = async (accessToken) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      console.log('User Data:', data);
      setUserProfileRef.current({ username: data.name || data.email });
      alert(`Welcome, ${data.name}!`);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // 4. Triggered by the button click
  const loginGoogleUser = () => {
    if (isSdkReady && tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken();
    } else {
      console.error('Google SDK not loaded yet.');
    }
  };

  return (
     <div style={styles.container}>
       <div className="card" style={styles.card}>
         <button onClick={loginGoogleUser} disabled={!isSdkReady}>Login with Google</button>
         {sdkError && <p style={styles.error}>{sdkError}</p>}
       </div>
    </div>
  );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh', // Make it take up most of the screen height
        padding: '20px',
    },
    card: {
        maxWidth: '400px',
        padding: '30px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.1)',
    },
    error: {
      color: '#b00020',
      marginTop: '12px',
    },
};