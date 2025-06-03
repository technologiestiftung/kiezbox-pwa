type State = 'idle' | 'pending' | 'success' | 'error';

type SIPUser = {
	username: string;
	password: string;
	timestamp: number;
	displayName?: string;
};

type SessionResponse = {
	extension: string | number;
	password: string;
	timestamp: number;
};
