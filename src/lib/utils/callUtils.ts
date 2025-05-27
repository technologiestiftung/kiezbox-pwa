export const assignStream = (
	stream: MediaStream,
	element: HTMLMediaElement | null,
	setError: (string: string) => void
) => {
	if (!element) {
		setError('No audio element available to assign stream.');
		return;
	}
	// Set element source.
	element.autoplay = true;
	element.srcObject = stream;

	// Load and start playback of media.
	element.play().catch((error: Error) => {
		// setError(`Failed to play remote media: ${error.message}`);
		console.error('Failed to play remote media');
		console.error(error);
	});

	stream.onaddtrack = (): void => {
		element.load();
		element.play().catch((error: Error) => {
			setError(`Failed to play remote media on add track: ${error.message}`);
		});
	};

	stream.onremovetrack = (): void => {
		element.load();
		element.play().catch((error: Error) => {
			console.error('Failed to play remote media on remove track');
			console.error(error);
		});
	};
};
