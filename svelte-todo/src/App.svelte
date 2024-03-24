<script>
	import { onMount } from "svelte";
	import { router } from "./router.js";

	import Header from "./Header.svelte";
	import Footer from "./Footer.svelte";
	import Item from "./Item.svelte";

	import "./app.css";
	import "todomvc-app-css/index.css";
	import "todomvc-common/base.css";
	import {
		postTodoData,
		getTodoData,
		deleteTodoData,
		toggleMultipleTodoData,
		deleteMultipleTodoData
	} from "./codehooksDB.js";

	let currentFilter = "all";

	let items = [];

	async function addItem(event) {
		let item = {
			description: event.detail.text,
			completed: false,
		};
		// add to Codehooks backend
		const data = await postTodoData(item);
		items.push({
			id: data._id, // This only works in secure-context.
			description: data.description,
			completed: data.completed,
		});
		items = items;
	}

	function removeItem(index) {
		console.log("delete", index, items[index]);
		// delete from Codehooks backend
		deleteTodoData(items[index].id);
		items.splice(index, 1);
		items = items;
	}

	async function toggleAllItems(event) {
		const checked = event.target.checked;
		const idList = [];
		items = items.map((item) => {
			idList.push(item.id);
			return {
				...item,
				completed: checked,
			};
		});
		// update completed state on all items
		const result = await toggleMultipleTodoData(idList, checked);
		console.log("Toggle all", result);
	}

	async function removeCompletedItems() {
		const idList = [];
		items = items.filter((item) => {
			if (!item.completed) {
				return true;
			} else {
				idList.push(item.id);
				return false;
			}
		});
		const result = await deleteMultipleTodoData(idList);
		console.log('Deleted', result)
	}

	onMount(async () => {
		router((route) => (currentFilter = route)).init();
		// load from Codehooks backend
		let data = await getTodoData();
		items = data.map((item) => ({
			...item,
			id: item._id,
		}));
	});

	$: filtered =
		currentFilter === "all"
			? items
			: currentFilter === "completed"
				? items.filter((item) => item.completed)
				: items.filter((item) => !item.completed);
	$: numActive = items.filter((item) => !item.completed).length;
	$: numCompleted = items.filter((item) => item.completed).length;
</script>

<Header on:addItem={addItem} />

{#if items.length > 0}
	<main class="main">
		<div class="toggle-all-container">
			<input
				id="toggle-all"
				class="toggle-all"
				type="checkbox"
				on:change={toggleAllItems}
				checked={numCompleted === items.length}
			/>
			<label for="toggle-all">Mark all as complete</label>
		</div>
		<ul class="todo-list">
			{#each filtered as item, index (item.id)}
				<Item bind:item on:removeItem={() => removeItem(index)} />
			{/each}
		</ul>

		<Footer
			{numActive}
			{currentFilter}
			{numCompleted}
			on:removeCompletedItems={removeCompletedItems}
		/>
	</main>
{/if}
