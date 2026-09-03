export let orgInfo = null;

let orgInfoPromise = null;

export function loadOrgInfo() {
	if (!orgInfoPromise) {
		const configUrl = `${process.env.PUBLIC_URL || ''}/public/config/orgConfig.json`;

		orgInfoPromise = fetch(configUrl)
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Unable to load organization configuration: ${response.status}`);
				}

				return response.json();
			})
			.then((config) => {
				orgInfo = config;
				return config;
			})
			.catch((error) => {
				orgInfoPromise = null;
				throw error;
			});
	}

	return orgInfoPromise;
}

