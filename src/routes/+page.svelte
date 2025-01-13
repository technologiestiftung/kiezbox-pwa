<script>
	let message = '';

	const sendMessage = () => {
		if (message.trim() !== '') {
			console.log('Message sent:', message);
			message = '';
		}
	};
</script>

<div class="form-container">
	<h1>Send a Kiezbox Message</h1>

	<input type="text" bind:value={message} placeholder="Enter your message" />

	<button on:click={sendMessage} disabled={message.trim() === ''}> Send Message </button>
</div>

<style>
	.form-container {
		max-width: 400px;
		margin: 0 auto;
		padding: 20px;
		text-align: center;
	}

	input[type='text'] {
		width: 80%;
		padding: 10px;
		font-size: 16px;
		margin-bottom: 10px;
	}

	button {
		padding: 10px 20px;
		font-size: 16px;
		cursor: pointer;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
	}

	button:disabled {
		background-color: #cccccc;
	}
</style>
