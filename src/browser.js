var Immutable = require('immutable'),
    RelaxQl = require('../src/relaxql'),
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

var Todos = React.createClass({

  mixins: [RelaxQl.mixin()],

  statics: {
    // The query this component requires
    query: {
      // Plural returns an Iterable collection
      todos: {
        // The requested structure of data, key esitence is the only important
        // part of this, the value doesn't matter
        title: true,
        done: true
      }
    }
  },

  getInitialState: function() {
    return {};
  },

  render: function() {
    var items = this.props.cursor.deref().map(function(item, index) {
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
  mixins: [RelaxQl.mixin()],
  render: function() {
    var items = this.props.cursor.deref().map(function(item, index) {
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
  mixins: [RelaxQl.mixin()],
  render: function() {
    return (
      <aside className='sidebar'>
        <Todos
          {...this.props}
          key='todos'
          cursor={this.props.cursor.cursor(['todos'])}
          relaxQlProps={this.relaxQlProps()}
        />
      </aside>
    );
  }
});

var App = React.createClass({
  mixins: [RelaxQl.mixin()],
  render: function() {
    return (
      <section>
        <BlogPosts
          cursor={this.props.cursor.cursor(['posts'])}
          relaxQlProps={this.relaxQlProps()}
          key='blogposts'
        />
        <SideBar
          cursor={this.props.cursor.cursor(['sidebar'])}
          relaxQlProps={this.relaxQlProps()}
          key='sidebar'
        />
      </section>
    );
  }
});

var objCursor = Cursor.from(
      obj,
      ['app'],
      function() {
        console.log('changed')
      }
    ),
    AppFactory = React.createFactory(App);
    app = AppFactory({cursor: objCursor}),
    targetEl = document.getElementById('app'),
    renderedApp = React.render(app, targetEl);

var subCursor = Cursor.from(
  objCursor,
  ['sidebar', 'todos'],
  function() {
    console.log('sub changed')
  }
);

var newObjCursor = objCursor.updateIn(['sidebar', 'todos'], function(todos) {
  console.log('updating', todos.toJS());
  return todos.push(Immutable.fromJS({
    title: 'update immutable data',
    done: false
  }));
});

var newSubCursor = subCursor.update(function(todos) {
  return todos.push(Immutable.fromJS({
    title: 'update sub cursor',
    done: false
  }));
});


console.log(obj.toJS());
console.log(newObjCursor);
console.log(newObjCursor.toJS());
//renderedApp.setProps(objCursor);
//
//console.log(html.prettyPrint(React.renderToStaticMarkup(app)));
