<script>
	import { createEventDispatcher, tick } from "svelte";
	import { patchTodoData } from "./codehooksDB.js";

	export let item;

	const dispatch = createEventDispatcher();

	let editing = false;

	function removeItem() {
		dispatch("removeItem");
	}

	function startEdit() {
		editing = true;
	}

	function handleEdit(event) {
		if (event.key === "Enter") event.target.blur();
		else if (event.key === "Escape") editing = false;
	}

	async function updateItem(event) {
		if (!editing) return;
		const { value } = event.target;
		if (value.length) {
			item.description = value;
			// save to db
			saveState(item);
		} else {
			// delete from db
			//await deleteTodoData(item.id);
			removeItem();
		}
		editing = false;
	}

	async function focusInput(element) {
		await tick();
		element.focus();
	}
	// save todo item state to Codehooks data backend
	async function saveState(item) {
		const data = await patchTodoData(item);
		console.log("Saved item", data);
	}
</script>

<li class:completed={item.completed} class:editing>
	<div class="view">
		<input
			class="toggle"
			type="checkbox"
			on:change={(event) => {
				item.completed = event.target.checked;
				saveState(item);
			}}
			checked={item.completed}
		/>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label on:dblclick={startEdit}>{item.description}</label>
		<button on:click={removeItem} class="destroy" />
	</div>

	{#if editing}
		<div class="input-container">
			<input
				value={item.description}
				id="edit-todo-input"
				class="edit"
				on:keydown={handleEdit}
				on:blur={updateItem}
				use:focusInput
			/>
			<label class="visually-hidden" for="edit-todo-input"
				>Edit Todo Input</label
			>
		</div>
	{/if}
</li>
