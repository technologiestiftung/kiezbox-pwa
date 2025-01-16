<script lang="ts">
	import * as Table from '$lib/components/ui/table';
</script>

<Table.Root>
	<Table.Caption>Aktuelle Feuerwehrmeldungen</Table.Caption>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-[200px] text-left">Datum</Table.Head>
			<Table.Head>Meldung</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		<Table.Row>
			<Table.Cell class="text-left">16.01.2025, 10:00</Table.Cell>
			<Table.Cell class="font-medium">Kautze auf einem Baum</Table.Cell>
		</Table.Row>
	</Table.Body>
</Table.Root>
