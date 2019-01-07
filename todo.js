// Is there a way to keep this within TodoApp and pass it into subcomponents?
const todos = [{
  title: 'Toggles',
  done: true
}, {
  title: 'Base class',
  done: true
}, {
  title: 'Toggle all items',
  done: false
}, {
  title: 'Clear completed',
  done: false
}, {
  title: 'Bold current filter',
  done: false
}, {
  title: 'Fix issues with multiple apps per page (gobals etc.)',
  done: false
}, {
  title: 'Improve re-rendering',
  done: false
}, {
  title: 'Allow passing options into the HTML tag',
  done: false
}];

let currentFilter = () => true;

class BaseElement extends HTMLElement {
  get templateName() {
    return this.tagName.toLowerCase();
  }

  constructor() {
    super();

    this.template = document.getElementById(this.templateName);
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    this.shadowRoot.appendChild(this.template.content.cloneNode(true));
  }

  send(action, ...args) {
    // Querying the whole DOM here is a little janky
    return document.querySelector('todo-app')[action](...args);
  }
}

class TodoApp extends BaseElement {
  // These are my current method of doing DDAU
  addItem(title) {
    const item = {
      title,
      done: false
    };
    todos.push(item);
    this.shadowRoot.querySelector('todo-list').appendItem(item);
    this.shadowRoot.querySelector('todo-filters').updateCount();
    console.table(todos);
  }

  removeItem(item) {
    todos.splice(todos.indexOf(item), 1);
    // Can we just remove node?
    this.shadowRoot.querySelector('todo-list').render();
    this.shadowRoot.querySelector('todo-filters').updateCount();
  }

  toggleItem(item) {
    item.done = !item.done;
    // Can we just toggle the class?
    this.shadowRoot.querySelector('todo-list').render();
    this.shadowRoot.querySelector('todo-filters').updateCount();
  }

  updateFilter(filter) {
    currentFilter = filter;
    // Is there a more elegant way to do this?
    this.shadowRoot.querySelector('todo-list').render();
  }
}

window.customElements.define('todo-app', TodoApp);

class TodoEntryForm extends BaseElement {
  render() {
    super.render();

    const input = this.shadowRoot.querySelector('input');
    this.shadowRoot.querySelector('form').addEventListener('submit', e => {
      const value = input.value.trim();
      if (value !== '') {
        this.send('addItem', value);
        input.value = '';
      }
      e.preventDefault();
    });
  }
}

window.customElements.define('todo-entry-form', TodoEntryForm);

class TodoList extends BaseElement {
  appendItem(todo) {
    const ul = this.shadowRoot.querySelector('ul');
    const item = document.createElement('todo-item');
    // This is a little weird and implicit
    item.todo = todo;
    ul.appendChild(item);
  }

  render() {
    super.render();

    for (let todo of todos) {
      if (currentFilter(todo)) {
        this.appendItem(todo);
      }
    }
  }
}

window.customElements.define('todo-list', TodoList);

class TodoItem extends BaseElement {
  render() {
    super.render();

    const title = document.createElement('span');
    title.setAttribute('slot', 'title');
    title.textContent = this.todo.title;
    this.appendChild(title);

    this.shadowRoot.querySelector('li').classList.toggle('done', this.todo.done);

    this.shadowRoot.querySelector('.done-button').addEventListener('click', e => {
      this.send('toggleItem', this.todo);
    });
    this.shadowRoot.querySelector('.delete-button').addEventListener('click', e => {
      this.send('removeItem', this.todo);
    });
  }
}

window.customElements.define('todo-item', TodoItem);

class TodoFilters extends BaseElement {
  updateCount() {
    this.count.textContent = todos.filter(t => !t.done).length;
  }

  render() {
    super.render();

    this.count = document.createElement('span');
    this.count.setAttribute('slot', 'count');
    this.updateCount();
    this.appendChild(this.count);

    this.shadowRoot.querySelector('.all-filter').addEventListener('click', e => {
      this.send('updateFilter', () => true);
    });
    this.shadowRoot.querySelector('.done-filter').addEventListener('click', e => {
      this.send('updateFilter', todo => todo.done);
    });
    this.shadowRoot.querySelector('.active-filter').addEventListener('click', e => {
      this.send('updateFilter', todo => !todo.done);
    });
  }
}

window.customElements.define('todo-filters', TodoFilters);