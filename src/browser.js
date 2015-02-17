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
          done: false
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
    return this.props.cursor;
  },
  componentWillReceiveProps: function(nextProps) {
    this.replaceState(nextProps.cursor);
  },
  shouldComponentUpdate: function(nextProps, nextState) {

  }
};

var Todos = React.createClass({
  mixins: [cursorMixin],
  render: function() {
    console.log('rendering Todos');
    var items = this.state.deref().map(function(item) {
      return (
        <li>
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
    var items = this.state.deref().map(function(item) {
      return (
        <article>
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
        <Todos cursor={this.state.cursor(['todos'])} />
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
        <BlogPosts cursor={this.state.cursor(['posts'])} />
        <SideBar cursor={this.state.cursor(['sidebar'])} />
      </section>
    );
  }
});

var objCursor = Cursor.from(obj, ['app']),
    app = App({cursor: objCursor}),
    targetEl = document.getElementById('app');

React.render(app, targetEl);

//app.setState(objCursor);
//
//console.log(html.prettyPrint(React.renderToStaticMarkup(app)));
