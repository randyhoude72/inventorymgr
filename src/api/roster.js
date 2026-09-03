import { loadOrgInfo } from './orgInfo';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const ROSTER_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

function getAccessToken(explicitToken) {
	return explicitToken || localStorage.getItem('authToken');
}

/**
 * Reads the Name/Email columns from the roster spreadsheet.
 * @param {string} [accessToken] OAuth access token; falls back to the stored auth token.
 * @returns {Promise<Array<{ name: string, email: string }>>}
 */
export async function loadRoster(accessToken) {
	const token = getAccessToken(accessToken);

	if (!token) {
		throw new Error('A Google access token is required to read the roster.');
	}

	const config = await loadOrgInfo();

	if (!config.rosterSheetId) {
		throw new Error('Organization configuration does not include a roster sheet ID.');
	}

	const tabName = config.rosterTabName || 'Roster';
	const range = `${tabName}!A:B`;
	const url = `${SHEETS_API_BASE}/${encodeURIComponent(config.rosterSheetId)}/values/${encodeURIComponent(range)}`;

	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!response.ok) {
		const details = await response.text();
		throw new Error(`Unable to load roster (${response.status}): ${details}`);
	}

	const { values = [] } = await response.json();

	return parseRosterRows(values);
}

function parseRosterRows(rows) {
	const people = [];

	rows.forEach((row, index) => {
		const name = (row[0] || '').trim();
		const email = (row[1] || '').trim();

		if (!name && !email) {
			return;
		}

		// Skip the header row if the sheet includes one.
		if (index === 0 && name.toLowerCase() === 'name' && email.toLowerCase() === 'email') {
			return;
		}

		people.push({ name, email });
	});

	return people;
}
