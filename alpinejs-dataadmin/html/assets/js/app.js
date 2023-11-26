
const root = '/dev/app';

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
      this.router.on('/', () => {
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
        console.log('Coll ID', this.collectionId)
      })
      .on('/profile', () => {
        this.route = `${root}/profile`;
        this.title = 'User profile';
      })
      .resolve();

      this.router.notFound(() => {
        this.route = root;
      });
    },

    navigate(path) {
      this.router.navigate(path);
      // close any open drop down menues
      const elem = document.activeElement;
      if (elem) {
        elem?.blur();
      }
    }
  };
}