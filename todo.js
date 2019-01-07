class TodoEntry extends HTMLElement {
  get title() { return this.textContent.trim(); }
  get done() { return this.getAttribute('done') === 'true'; }
}

window.customElements.define('todo-entry', TodoEntry);

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
  constructor() {
    super();

    this.todos = [];
    // Make sure we don't delete anything already attaching a handler
    const prev = window.onload;
    // Is there a better way to get the contents of the tag?
    window.onload = () => {
      if (prev) { prev(); }
      for (let todo of this.children) {
        this.todos.push({
          title: todo.title,
          done: todo.done
        });
      }
      this.render();
    }
  }

  render() {
    super.render();

    // These initialize the values that will be used to render
    // Might be a better way to pass values down from the parent
    const list = this.shadowRoot.querySelector('todo-list');
    list.todos = this.todos;
    list.currentFilter = () => true;
    list.render();
    const filters = this.shadowRoot.querySelector('todo-filters');
    filters.todos = this.todos;
    filters.updateCount();
  }

  // These are my current method of doing DDAU
  addItem(title) {
    const item = {
      title,
      done: false
    };
    this.todos.push(item);
    this.shadowRoot.querySelector('todo-list').appendItem(item);
    this.shadowRoot.querySelector('todo-filters').updateCount();
    console.table(this.todos);
  }

  removeItem(item) {
    this.todos.splice(this.todos.indexOf(item), 1);
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
    const list = this.shadowRoot.querySelector('todo-list');
    list.currentFilter = filter;
    // Is there a more elegant way to do this?
    list.render();
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

    // In the first render todo-app hasn't had time to attach the todos/filter
    if (this.todos) {
      for (let todo of this.todos) {
        if (this.currentFilter(todo)) {
          this.appendItem(todo);
        }
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
    if (this.todos) {
      this.count.textContent = this.todos.filter(t => !t.done).length;
    }
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
