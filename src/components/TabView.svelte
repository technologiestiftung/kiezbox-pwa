<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		BaggageClaim,
		EventIncident,
		Fire,
		Flood,
		ThunderstormStrong
	} from 'carbon-icons-svelte';
</script>

<Tabs.Root value="prevention" class="w-[343px]">
	<Tabs.List>
		<Tabs.Trigger value="prevention"><BaggageClaim /></Tabs.Trigger>
		<Tabs.Trigger value="fire"><Fire /></Tabs.Trigger>
		<Tabs.Trigger value="flood"><Flood /></Tabs.Trigger>
		<Tabs.Trigger value="storm"><ThunderstormStrong /></Tabs.Trigger>
		<Tabs.Trigger value="cbrn"><EventIncident /></Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="prevention">Make changes to your account here.</Tabs.Content>
	<Tabs.Content value="fire">Make changes to your account here.</Tabs.Content>
	<Tabs.Content value="flood">Make changes to your account here.</Tabs.Content>
	<Tabs.Content value="storm">Make changes to your account here.</Tabs.Content>
	<Tabs.Content value="cbrn">Change your password here.</Tabs.Content>
</Tabs.Root>
