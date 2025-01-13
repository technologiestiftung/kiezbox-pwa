<script lang="ts">
	let videoElement: HTMLVideoElement;
	let stream;

	async function startVideo() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: true });
			if (videoElement) {
				videoElement.srcObject = stream;
			}
		} catch (error) {
			console.error('Error accessing the camera: ', error);
		}
	}
</script>

<video bind:this={videoElement} autoplay>
	<track kind="captions" src="path/to/captions.vtt" srclang="en" label="English" />
</video><button on:click={startVideo}>Start Video</button>
