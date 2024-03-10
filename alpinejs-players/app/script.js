// replace this with your project url, use CLI command 'coho info' to find yours
const MY_CODEHOOKS_URL = "/football";
// replace this with your own key, use CLI command 'coho add-token' to create a new one
const MY_API_KEY = "0b49638f-56c3-48e9-8725-7f3c20f25316";

document.addEventListener('alpine:init', () => {
    Alpine.store('coho', {
        loading: false,
        search: '',
        players: [],
        async getData() {
            this.loading = true
            this.players = await getDataFromAPI(this.search)
            this.loading = false
        }
    })
})
// Fetch data from Codehooks REST API
async function getDataFromAPI(search) {
    var myHeaders = new Headers();
    myHeaders.append("x-apikey", MY_API_KEY); // read-only token
    myHeaders.append("Content-Type", "application/json");

    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };
    var query = "{}";
    console.log('getData', search)
    if (search.length > 0) {
        query = JSON.stringify({"Player": {$regex: search, $options: "gi"}})
    }
    var hints = JSON.stringify({sort: {Squad: 1, Nation: 1}, $fields: {"Player": 1, "Nation": 1, "Squad": 1}})
    var URL = `${MY_CODEHOOKS_URL}?q=${query}&h=${hints}`;
    console.log(URL)
    const response = await fetch(URL, requestOptions)
    return response.json()
}