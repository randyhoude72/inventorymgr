const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const INVENTORY_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

export const STATUS_AVAILABLE = 'Available';
export const STATUS_IN_USE = 'In Use';
export const STATUS_BROKEN = 'Broken';

export const CONDITION_GOOD = 'Good Condition';
export const CONDITION_BROKEN = 'Broken';
export const CONDITION_REPAIRED = 'Repaired';

const COLUMN_FIELDS = {
	id: 'ID',
	description: 'Description',
	status: 'Status',
	who: 'Who',
	date: 'Date',
	notes: 'Notes',
};

function getAccessToken(explicitToken) {
	return explicitToken || localStorage.getItem('authToken');
}

function columnLetter(index) {
	let letter = '';
	let remaining = index;

	while (remaining >= 0) {
		letter = String.fromCharCode((remaining % 26) + 65) + letter;
		remaining = Math.floor(remaining / 26) - 1;
	}

	return letter;
}

function formatDate(date = new Date()) {
	return date.toLocaleDateString();
}

function formatDateTime(date = new Date()) {
	return date.toLocaleString();
}

export const HISTORY_HEADERS = ['Date & Time', 'Description', 'Condition', 'Issues'];

function historyTabName(entry) {
	return `History-${entry.id}`;
}

/**
 * Reads and updates a single inventory spreadsheet.
 * Initialize with one of the entries from `orgInfo.inventory`.
 */
export class InventorySheet {
	/**
	 * @param {{ name: string, sheetId: string, tabName: string }} inventoryInfo
	 */
	constructor(inventoryInfo) {
		if (!inventoryInfo || !inventoryInfo.sheetId) {
			throw new Error('An inventory configuration with a sheetId is required.');
		}

		this.name = inventoryInfo.name;
		this.sheetId = inventoryInfo.sheetId;
		this.tabName = inventoryInfo.tabName || 'Inventory';
		this.columnIndexes = null;
	}

	async request(path, options = {}, accessToken) {
		const token = getAccessToken(accessToken);

		if (!token) {
			throw new Error('A Google access token is required to access the inventory sheet.');
		}

		const response = await fetch(`${SHEETS_API_BASE}/${encodeURIComponent(this.sheetId)}${path}`, {
			...options,
			headers: {
				...(options.headers || {}),
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const details = await response.text();
			throw new Error(`Google Sheets request failed (${response.status}): ${details}`);
		}

		return response.json();
	}

	/**
	 * @returns {Promise<Array<{ rowNumber: number, id: string, description: string, status: string, who: string, date: string, notes: string }>>}
	 */
	async load(accessToken) {
		const range = `${this.tabName}!A:Z`;
		const data = await this.request(
			`/values/${encodeURIComponent(range)}`,
			{ method: 'GET' },
			accessToken,
		);

		const rows = data.values || [];

		if (rows.length === 0) {
			this.columnIndexes = null;
			return [];
		}

		const headers = rows[0].map((header) => (header || '').trim().toLowerCase());
		this.columnIndexes = {};

		Object.entries(COLUMN_FIELDS).forEach(([field, header]) => {
			const index = headers.indexOf(header.toLowerCase());

			if (index === -1) {
				throw new Error(`The "${this.name}" inventory sheet is missing the "${header}" column.`);
			}

			this.columnIndexes[field] = index;
		});

		return rows.slice(1).reduce((entries, row, offset) => {
			const entry = { rowNumber: offset + 2 };

			Object.keys(COLUMN_FIELDS).forEach((field) => {
				entry[field] = (row[this.columnIndexes[field]] || '').trim();
			});

			if (entry.id || entry.description) {
				entries.push(entry);
			}

			return entries;
		}, []);
	}

	/**
	 * Adds a dated entry to the per-item "History-<ID>" tab, creating the tab if needed.
	 */
	async appendHistory(entry, { description, condition = '', issues = '' }, accessToken) {
		const tabName = historyTabName(entry);
		const metadata = await this.request(
			'?fields=sheets.properties(title,sheetId)',
			{ method: 'GET' },
			accessToken,
		);

		const existing = (metadata.sheets || []).find(
			(sheet) => sheet.properties && sheet.properties.title === tabName,
		);

		let tabId;

		if (existing) {
			tabId = existing.properties.sheetId;
		} else {
			const created = await this.request(
				':batchUpdate',
				{
					method: 'POST',
					body: JSON.stringify({
						requests: [{ addSheet: { properties: { title: tabName } } }],
					}),
				},
				accessToken,
			);

			tabId = created.replies[0].addSheet.properties.sheetId;

			await this.request(
				`/values/${encodeURIComponent(`${tabName}!A1:D1`)}?valueInputOption=USER_ENTERED`,
				{
					method: 'PUT',
					body: JSON.stringify({ values: [HISTORY_HEADERS] }),
				},
				accessToken,
			);
		}

		// Open a blank row directly beneath the header so the newest entry stays on row 2.
		await this.request(
			':batchUpdate',
			{
				method: 'POST',
				body: JSON.stringify({
					requests: [{
						insertDimension: {
							range: { sheetId: tabId, dimension: 'ROWS', startIndex: 1, endIndex: 2 },
							inheritFromBefore: false,
						},
					}],
				}),
			},
			accessToken,
		);

		return this.request(
			`/values/${encodeURIComponent(`${tabName}!A2:D2`)}?valueInputOption=USER_ENTERED`,
			{
				method: 'PUT',
				body: JSON.stringify({ values: [[formatDateTime(), description, condition, issues]] }),
			},
			accessToken,
		);
	}

	/**
	 * Reads the per-item history rows, newest first. Returns an empty list when the tab does not exist.
	 * @returns {Promise<Array<{ dateTime: string, description: string, condition: string, issues: string }>>}
	 */
	async loadHistory(entry, accessToken) {
		const tabName = historyTabName(entry);
		const metadata = await this.request(
			'?fields=sheets.properties.title',
			{ method: 'GET' },
			accessToken,
		);

		const exists = (metadata.sheets || []).some(
			(sheet) => sheet.properties && sheet.properties.title === tabName,
		);

		if (!exists) {
			return [];
		}

		const data = await this.request(
			`/values/${encodeURIComponent(`${tabName}!A2:D`)}`,
			{ method: 'GET' },
			accessToken,
		);

		return (data.values || [])
			.map((row) => ({
				dateTime: (row[0] || '').trim(),
				description: (row[1] || '').trim(),
				condition: (row[2] || '').trim(),
				issues: (row[3] || '').trim(),
			}))
			.filter((row) => row.dateTime || row.description);
	}

	async updateRowFields(rowNumber, fields, accessToken) {
		if (!this.columnIndexes) {
			throw new Error('The inventory sheet must be loaded before it can be updated.');
		}

		const data = Object.entries(fields).map(([field, value]) => {
			const index = this.columnIndexes[field];

			if (index === undefined) {
				throw new Error(`Unknown inventory column: ${field}`);
			}

			return {
				range: `${this.tabName}!${columnLetter(index)}${rowNumber}`,
				values: [[value]],
			};
		});

		return this.request(
			'/values:batchUpdate',
			{
				method: 'POST',
				body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
			},
			accessToken,
		);
	}

	/**
	 * Marks an available entry as in use by the selected roster member.
	 */
	async checkOut(entry, { who, approvedBy }, accessToken) {
		if (entry.status !== STATUS_AVAILABLE) {
			throw new Error(`Only entries with the "${STATUS_AVAILABLE}" status can be checked out.`);
		}

		if (!who) {
			throw new Error('A roster member must be selected before checking out.');
		}

		const result = await this.updateRowFields(
			entry.rowNumber,
			{
				who,
				status: STATUS_IN_USE,
				date: formatDate(),
				notes: `Checkout approved by: ${approvedBy || 'Unknown user'}`,
			},
			accessToken,
		);

		await this.appendHistory(
			entry,
			{
				description: `${who} checked out ${entry.id} - ${entry.description} by ${approvedBy || 'Unknown user'}`,
			},
			accessToken,
		);

		return result;
	}

	/**
	 * Returns an in-use entry to the inventory, either available again or flagged as broken.
	 */
	async checkIn(entry, { condition, checkedInBy, brokenDescription }, accessToken) {
		if (entry.status !== STATUS_IN_USE) {
			throw new Error(`Only entries with the "${STATUS_IN_USE}" status can be checked in.`);
		}

		const historyDescription = `${entry.who || 'Unknown'} checked in ${entry.id} - ${entry.description} by ${checkedInBy || 'Unknown user'}, Condition: ${condition}`;

		if (condition === CONDITION_BROKEN) {
			if (!brokenDescription) {
				throw new Error('A description of the damage is required when checking in a broken item.');
			}

			const brokenResult = await this.updateRowFields(
				entry.rowNumber,
				{
					status: STATUS_BROKEN,
					notes: brokenDescription,
				},
				accessToken,
			);

			await this.appendHistory(
				entry,
				{ description: historyDescription, condition, issues: brokenDescription },
				accessToken,
			);

			return brokenResult;
		}

		if (condition !== CONDITION_GOOD) {
			throw new Error(`Unknown check in condition: ${condition}`);
		}

		const result = await this.updateRowFields(
			entry.rowNumber,
			{
				status: STATUS_AVAILABLE,
				who: '',
				date: formatDate(),
				notes: `Last used by: ${entry.who || 'Unknown'} and checked in by ${checkedInBy || 'Unknown user'}.`,
			},
			accessToken,
		);

		await this.appendHistory(
			entry,
			{ description: historyDescription, condition },
			accessToken,
		);

		return result;
	}

	/**
	 * Returns a broken entry to service once the reported damage has been resolved.
	 */
	async repair(entry, { resolution, repairedBy }, accessToken) {
		if (entry.status !== STATUS_BROKEN) {
			throw new Error(`Only entries with the "${STATUS_BROKEN}" status can be repaired.`);
		}

		if (!resolution) {
			throw new Error('A resolution is required when repairing an item.');
		}

		const user = repairedBy || 'Unknown user';

		const result = await this.updateRowFields(
			entry.rowNumber,
			{
				status: STATUS_AVAILABLE,
				date: formatDate(),
				notes: `${user} repaired: ${resolution}`,
			},
			accessToken,
		);

		await this.appendHistory(
			entry,
			{
				description: `${user} repaired ${entry.id} - ${entry.description}`,
				condition: CONDITION_REPAIRED,
				issues: resolution,
			},
			accessToken,
		);

		return result;
	}
}

export function createInventorySheet(inventoryInfo) {
	return new InventorySheet(inventoryInfo);
}
