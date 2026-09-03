import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  CONDITION_BROKEN,
  CONDITION_GOOD,
  HISTORY_HEADERS,
  InventorySheet,
  STATUS_AVAILABLE,
  STATUS_BROKEN,
  STATUS_IN_USE,
} from '../api/inventorySheet';
import { loadOrgInfo } from '../api/orgInfo';
import { loadRoster } from '../api/roster';
import { AuthContext } from '../App';

const InventoryTablePage = ({ inventoryName }) => {
  const params = useParams();
  const activeInventoryName = inventoryName || params.inventoryName;
  const { token, userProfile } = useContext(AuthContext);
  const [inventoryInfo, setInventoryInfo] = useState(null);
  const [data, setData] = useState([]);
  const [roster, setRoster] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRowNumber, setSelectedRowNumber] = useState(null);
  const [selectedRosterName, setSelectedRosterName] = useState('');
  const [checkInCondition, setCheckInCondition] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [history, setHistory] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const sheetRef = useRef(null);
  const authedUser = userProfile ? userProfile.username : 'Unknown user';

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const config = await loadOrgInfo();
        const inventories = config.inventory || [];
        const info = activeInventoryName
          ? inventories.find((item) => item.name === activeInventoryName)
          : inventories[0];

        if (!info) {
          throw new Error(`No inventory configuration found for "${activeInventoryName || 'default'}".`);
        }

        sheetRef.current = new InventorySheet(info);

        const [entries, people] = await Promise.all([
          sheetRef.current.load(token),
          loadRoster(token).catch(() => []),
        ]);

        if (!isMounted) {
          return;
        }

        setInventoryInfo(info);
        setData(entries);
        setRoster(people);
      } catch (err) {
        console.error('Error fetching inventory:', err);

        if (isMounted) {
          setError(err.message || 'Failed to fetch inventory data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [activeInventoryName, token]);

  const reloadInventory = async () => {
    const entries = await sheetRef.current.load(token);
    setData(entries);
    setSelectedRowNumber((current) => (
      entries.some((entry) => entry.rowNumber === current) ? current : null
    ));
  };

  const selectedEntry = data.find((entry) => entry.rowNumber === selectedRowNumber) || null;
  const canCheckOut = selectedEntry?.status === STATUS_AVAILABLE;
  const canCheckIn = selectedEntry?.status === STATUS_IN_USE;
  const canRepair = selectedEntry?.status === STATUS_BROKEN;

  const handleCheckOut = async () => {
    if (!selectedEntry) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await sheetRef.current.checkOut(
        selectedEntry,
        { who: selectedRosterName, approvedBy: authedUser },
        token,
      );
      await reloadInventory();
      setSelectedRosterName('');
    } catch (err) {
      console.error('Error checking out inventory entry:', err);
      setError(err.message || 'Failed to check out the selected entry.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEntry) {
      return;
    }

    let brokenDescription;

    if (checkInCondition === CONDITION_BROKEN) {
      brokenDescription = window.prompt('Describe how the item is broken:');

      if (!brokenDescription) {
        return;
      }
    }

    setIsUpdating(true);
    setError(null);

    try {
      await sheetRef.current.checkIn(
        selectedEntry,
        { condition: checkInCondition, checkedInBy: authedUser, brokenDescription },
        token,
      );
      await reloadInventory();
      setCheckInCondition('');
    } catch (err) {
      console.error('Error checking in inventory entry:', err);
      setError(err.message || 'Failed to check in the selected entry.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRepair = async () => {
    if (!selectedEntry) {
      return;
    }

    const resolution = window.prompt('Describe how the item was repaired:');

    if (!resolution) {
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await sheetRef.current.repair(
        selectedEntry,
        { resolution, repairedBy: authedUser },
        token,
      );
      await reloadInventory();
    } catch (err) {
      console.error('Error repairing inventory entry:', err);
      setError(err.message || 'Failed to repair the selected entry.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShowHistory = async () => {
    if (!selectedEntry) {
      return;
    }

    setIsLoadingHistory(true);
    setError(null);

    try {
      setHistory(await sheetRef.current.loadHistory(selectedEntry, token));
    } catch (err) {
      console.error('Error loading inventory history:', err);
      setError(err.message || 'Failed to load the history for the selected entry.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: 'ID',
      accessorKey: 'id',
    },
    {
      header: 'Description',
      accessorKey: 'description',
    },
    {
      header: 'Who',
      accessorKey: 'who',
    },
    {
      header: 'Status',
      accessorKey: 'status',
    },
    {
      header: 'Date',
      accessorKey: 'date',
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div className="page-content">Loading inventory data...</div>;
  }

  if (error && !inventoryInfo) {
    return <div className="page-content" style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <main className="page-content inventory-container" style={{ padding: '20px' }}>
      <h1>
        {/* icon is stored in orgConfig as an <i> markup string, so it must be injected as HTML. */}
        <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: inventoryInfo.icon }} />
        {' '}
        {inventoryInfo.name} Inventory
      </h1>
      <h3>Location: {inventoryInfo.location}</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        {selectedEntry && (
          <span style={{ fontWeight: 600 }}>
            Selected {inventoryInfo.name}: {selectedEntry.description} - {selectedEntry.id} ({selectedEntry.status})
          </span>
        )}

        <div id="checkout-container" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexBasis: '100%' }}>
          <button
            type="button"
            onClick={handleCheckOut}
            disabled={!canCheckOut || !selectedRosterName || isUpdating}
          >
             Checkout
          </button>

          <select
            value={selectedRosterName}
            onChange={(event) => setSelectedRosterName(event.target.value)}
            disabled={!canCheckOut || isUpdating}
          >
            <option value="">Select a roster member...</option>
            {roster.map((person) => (
              <option key={person.email || person.name} value={person.name}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div id="checkin-container" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexBasis: '100%' }}>
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={!canCheckIn || !checkInCondition || isUpdating}
          >
             Checkin
          </button>
          <select
            value={checkInCondition}
            onChange={(event) => setCheckInCondition(event.target.value)}
            disabled={!canCheckIn || isUpdating}
          >
            <option value="">Select a condition...</option>
            <option value={CONDITION_GOOD}>{CONDITION_GOOD}</option>
            <option value={CONDITION_BROKEN}>{CONDITION_BROKEN}</option>
          </select>
        </div>
        <div id="repair-container" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexBasis: '100%' }}>
          <button
            type="button"
            onClick={handleRepair}
            disabled={!canRepair || isUpdating}
          >
            Repair
          </button>
        </div>

        <div id="history-container" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexBasis: '100%' }}>
          <button
            type="button"
            onClick={handleShowHistory}
            disabled={!selectedEntry || isLoadingHistory || isUpdating}
          >
            History
          </button>
        </div>
      </div>

      {history && (
        <div className="table-scroll">
          <h3>History for {selectedEntry ? `${selectedEntry.id} - ${selectedEntry.description}` : ''}</h3>
          {history.length === 0 ? (
            <p>No history recorded for this entry yet.</p>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  {HISTORY_HEADERS.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, index) => (
                  <tr key={`${row.dateTime}-${index}`}>
                    <td>{row.dateTime}</td>
                    <td>{row.description}</td>
                    <td>{row.condition}</td>
                    <td>{row.issues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="table-scroll">
        <table className="inventory-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => {
                  setSelectedRowNumber(row.original.rowNumber);
                  setHistory(null);
                }}
                className={row.original.rowNumber === selectedRowNumber ? 'is-selected' : undefined}
                style={{ cursor: 'pointer' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default InventoryTablePage;
