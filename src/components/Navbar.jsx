// src/components/Navbar.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loadOrgInfo } from '../api/orgInfo';
import { AuthContext } from '../App';

const Navbar = () => {
    const [organization, setOrganization] = useState(null);
    const { isAuthenticated, logout, userProfile } = useContext(AuthContext);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Navbar renders outside the matched route, so read the active inventory from the path.
    const activeInventory = pathname.startsWith('/inventory/')
        ? decodeURIComponent(pathname.slice('/inventory/'.length))
        : '';

    useEffect(() => {
        loadOrgInfo().then(setOrganization).catch(console.error);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login'); // Sends user back to the login page
    };

    const handleInventoryChange = (event) => {
        const name = event.target.value;

        if (name) {
            navigate(`/inventory/${encodeURIComponent(name)}`);
        }
    };

    const inventories = organization?.inventory || [];
    const selectedInventory = inventories.find((item) => item.name === activeInventory);

    return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#333', color: 'white' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', textDecoration: 'none' }}>
                <img src={`${process.env.PUBLIC_URL}/logo192.png`} alt="" style={{ height: '32px', width: '32px' }} />
                {organization ? `${organization.name} ${organization.location}` : ''}
            </Link>

            {isAuthenticated ? (
                <>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <label htmlFor="inventory-select">Inventory:</label>
                        {/* <option> can't render icon-font markup, so show the active icon beside the select instead. */}
                        {selectedInventory && (
                            <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: selectedInventory.icon }} />
                        )}
                        <select
                            id="inventory-select"
                            value={activeInventory}
                            onChange={handleInventoryChange}
                        >
                            <option value="">Select an inventory...</option>
                            {inventories.map((item) => (
                                <option key={item.name} value={item.name}>{item.namePlural}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button onClick={handleLogout} style={{ marginLeft: '15px', cursor: 'pointer' }}>
                            Logout {userProfile ? userProfile.username : 'UnknownUser'}
                        </button>
                    </div>
                </>
            ) : (
                <Link to="/login" style={{ color: 'white' }}>Please Log In</Link>
            )}
        </nav>
    );
};

export default Navbar;
