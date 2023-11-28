
const root = '/dev/app';

const mockUsers = [
  { name: "Fred", email: "fred@example.com" },
  { name: "Jill", email: "jill@example.com" }
]

const mockCustomers = [
  { name: "Acme Inc", city: "ACO", email: "acme@example.com" },
  { name: "Billo Coffe", city: "MEX", email: "billo@example.com" }
]

document.addEventListener('alpine:init', () => {
  Alpine.store('mystore', {
    loading: false,
    search: '',
    users: [],
    customers: [],
    async getUsers() {
      console.log('getUsers')
      this.loading = true
      this.users = mockUsers
      this.loading = false
    },
    async getCustomers() {
      console.log('getCustomers')
      this.loading = true
      this.customers = mockCustomers
      this.loading = false
    }
  })
})

function app() {
  return {
    route: '/',
    collectionId: null,
    router: null,
    title: '',

    init() {
      this.router = new Navigo(root, { hash: true });
      // for the root
      this.router.on(() => {
        this.route = root;
      })
        .on('/', () => {
          this.route = root;
        })
        // home
        .on('/dashboard', () => {
          this.route = `${root}/dashboard`;
          this.title = 'Dashboard';
        })
        // collection list view
        .on('/collection/:id', (params) => {
          this.route = `${root}/collection/${params.data.id}`;
          this.collectionId = params.data.id;
          if (this.collectionId === 'users') {
            Alpine.store('mystore').getUsers()
          } else if (this.collectionId === 'customers') {
            Alpine.store('mystore').getCustomers()
          }

          console.log('Coll ID', this.collectionId)
        })
        .on('/profile', () => {
          this.route = `${root}/profile`;
          this.title = 'User profile';
        })
        .resolve();

      this.router.notFound(() => {
        this.route = `${root}/404`;
      });
    },

    navigate(path) {
      this.router.navigate(path);
      // close any open drop down menues
      const elem = document.activeElement;
      if (elem) {
        // close drawer if open        
        //document.getElementById('my-drawer-2').click()
        //}

        // close menu drop downs
        elem?.blur();
      }
    }
  };
}