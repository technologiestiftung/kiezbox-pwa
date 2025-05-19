type State = 'idle' | 'pending' | 'success' | 'error';
type SIPConfig = {
	kbServerAddress: string;
	kbWSSPort: number;
	kbWSSPath: string;
	kbDomain: string;
	kbUserPrefix: string;
};
type SIPUser = {
	username: string;
	password: string;
	timestamp: number;
	displayName?: string;
};
