<script lang="ts">
	import { pushState } from '$app/navigation';
	import Modal from '../../components/Modal.svelte';

	const showModal = () => {
		pushState('', {
			showModal: true
		});
	};

	const closeModal = () => {
		history.back();
	};
</script>

<Modal close={closeModal}>
	{#snippet header()}
		{'2. Wer ruft an?'}
	{/snippet}
	{#snippet children()}
		{'Nennen Sie Ihren Namen, Ihren Standort und Ihre Telefonnummer für Rückfragen!'}
	{/snippet}
</Modal>
