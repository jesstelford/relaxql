var Immutable = require('immutable'),
    Cursor = require('immutable/contrib/cursor'),
    React = require('react');

/**
 * Mimic a todo list in a sidebar
 */
var obj = Immutable.fromJS({
  app: {
    sidebar: {
      todos: [
        {
          title: 'ride train',
          done: false,
        }, {
          title: 'research immutables',
          done: true
        }
      ]
    },
    posts: [
      {
        title: 'Code More',
        content: 'Lorem Ipsum'
      }, {
        title: 'Exercise',
        content: 'Bacon Ipsum'
      }
    ]
  }
});

var cursorMixin = {
  getInitialState: function() {
    // We create the cursor here as this is the first lifecycle method called on
    // a component
    var cursor = this.props.cursorFn
    // Set the cursor as the state
    return this.props.cursor;
  },
  componentDidMount: function() {
    console.log('componentDidMount');
    // Register our 'change' listener
    // Note: We don't store / use the newly created cursor returned by .from as
    // we're only interested in the originally passed in cursor.
    Cursor.from(this.props.cursor, [], this.onCursorChange);
  },
  componentWillReceiveProps: function(nextProps) {
    console.log('componentWillReceiveProps');
    Cursor.from(this.props.cursor, [], this.onCursorChange);
    this.replaceState(nextProps.cursor);
  },
  onCursorChange: function(newData, oldData, path) {
    console.log('key path', this.props.cursor._keyPath);
  }
};

var Todos = React.createClass({
  mixins: [cursorMixin],
  render: function() {
    console.log('rendering Todos');
    var items = this.state.deref().map(function(item, index) {
      return (
        <li key={index}>
          <input type='checkbox' checked={item.get('done')} />
          {item.get('title')}
        </li>
      );
    }).toJS();

    return (
      <ul>
        {items}
      </ul>
    );
  }
});

var BlogPosts = React.createClass({
  mixins: [cursorMixin],
  render: function() {
    console.log('rendering BlogPosts');
    var items = this.state.deref().map(function(item, index) {
      return (
        <article key={index}>
          <h1>{item.get('title')}</h1>
          {item.get('content')}
        </article>
      );
    }).toJS();

    return (
      <section>
        {items}
      </section>
    );
  }
});


var SideBar = React.createClass({
  mixins: [cursorMixin],
  render: function() {
    console.log('rendering SideBar');
    return (
      <aside className='sidebar'>
        <Todos cursorFn={this.state.cursor} cursorPath={['todos']} />
      </aside>
    );
  }
});

var App = React.createClass({
  mixins: [cursorMixin],
  render: function() {
    console.log('rendering App');
    return (
      <section>
        <BlogPosts cursorFn={this.state.cursor} cursorPath={['posts']} />
        <SideBar cursorFn={this.state.cursor} cursorPath={['sidebar']} />
      </section>
    );
  }
});

var objCursor = Cursor.from(obj, ['app'], function() { console.log('changed') }),
    app = App({cursor: objCursor}),
    targetEl = document.getElementById('app'),
    renderedApp = React.render(app, targetEl);

var subCursor = Cursor.from(objCursor._rootData, ['app'], function() { console.log('sub changed') });

var newObjCursor = objCursor.updateIn(['sidebar', 'todos'], function(todos) {
  console.log('updating', todos.toJS());
  return todos.push(Immutable.fromJS({
    title: 'update immutable data',
    done: false
  }));
});

console.log(obj.toJS());
console.log(newObjCursor.toJS());
//renderedApp.setProps(objCursor);
//
//console.log(html.prettyPrint(React.renderToStaticMarkup(app)));
