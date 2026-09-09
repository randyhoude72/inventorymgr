// src/pages/LandingPage.jsx
import React, { useEffect, useState } from 'react';
import { loadOrgInfo } from '../api/orgInfo';

const LandingPage = () => {
    const [orgInfo, setOrgInfo] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        loadOrgInfo()
            .then((config) => {
                if (isMounted) setOrgInfo(config);
            })
            .catch((err) => {
                console.error('Failed to load organization configuration:', err);
                if (isMounted) setError('Unable to load organization information.');
            });

        return () => {
            isMounted = false;
        };
    }, []);

    if (error) {
        return <div className="page-content" style={{ color: 'red' }}>Error: {error}</div>;
    }

    if (!orgInfo) {
        return <div className="page-content">Loading...</div>;
    }

    const informationLinks = orgInfo.informationLinks || [];

    return (
        <main className="page-content landing-container" style={{ padding: '20px' }}>
            <h1><img src={`${process.env.PUBLIC_URL}/logo192.png`} alt="" style={{ height: '48px', width: '48px' }} />{orgInfo.name}</h1>
            <h2>{orgInfo.type}</h2>
            <p>{orgInfo.location}</p>

            <h3>Information Links</h3>
            {informationLinks.length === 0 ? (
                <p>No information links are configured.</p>
            ) : (
                <ul>
                    {informationLinks.map((link) => (
                        <li key={link.url}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                                {link.name}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
};

export default LandingPage;
