/* Codehooks client CRUD functions */

const BACKEND_URL = 'https://daring-harbor-b5fe.codehooks.io'; // replace with yours
const apitoken = '27678bdf-3a6e-49d7-b09f-42f7f4b6db25'; // replace with yours
const collection='todo';

// get all todo items from data backend
export async function getTodoData() {
    try {
        const response = await fetch(`${BACKEND_URL}/${collection}`, { 
        method: 'GET', 
        headers: { 
            'x-apikey': apitoken, 
            'Content-Type': 'application/json' 
        }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// add new todo item to data backend
export async function postTodoData(item) {
    try {
        const response = await fetch(`${BACKEND_URL}/${collection}`, { 
        method: 'POST', 
        headers: { 
            'x-apikey': apitoken, 
            'Content-Type': 'application/json' }, 
            body: JSON.stringify(item)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// update todo item in the data backend
export async function patchTodoData(item) {
    try {
        const response = await fetch(`${BACKEND_URL}/${collection}/${item._id}`, { 
        method: 'PATCH', 
        headers: { 
            'x-apikey': apitoken, 
            'Content-Type': 'application/json' }, 
            body: JSON.stringify(item)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}


// delete todo item from data backend
export async function deleteTodoData(ID) {
  try {
    const response = await fetch(`${BACKEND_URL}/${collection}/${ID}`, { 
      method: 'DELETE', 
      headers: { 'x-apikey': apitoken, 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// update completed state on multiple todo items by ID
export async function toggleMultipleTodoData(idList, completed) {
    try {
        const query = JSON.stringify({"_id": {"$in": idList}})
        const response = await fetch(`${BACKEND_URL}/${collection}/_byquery?q=${query}`, { 
        method: 'PATCH', 
        headers: { 
            'x-apikey': apitoken, 
            'Content-Type': 'application/json' }, 
            body: JSON.stringify({"completed": completed})
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// delete multiple todo items by ID
export async function deleteMultipleTodoData(idList) {
	try {
			const query = JSON.stringify({"_id": {"$in": idList}})
			const response = await fetch(`${BACKEND_URL}/${collection}/_byquery?q=${query}`, { 
			method: 'DELETE', 
			headers: { 
					'x-apikey': apitoken, 
					'Content-Type': 'application/json' }
			});
			const result = await response.json();
			return result;
	} catch (error) {
			console.error('Fetch error:', error);
	}
}