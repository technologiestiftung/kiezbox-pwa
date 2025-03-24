<script lang="ts">
	import { pushState } from '$app/navigation';
	import Modal from '../../components/Modal.svelte';
	import { t } from '$lib/translations';

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
	{#snippet children()}
		{'Nennen Sie Ihren Namen, Ihren Standort und Ihre Telefonnummer für Rückfragen!'}
	{/snippet}
</Modal>
