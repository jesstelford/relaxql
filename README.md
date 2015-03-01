# Under Development

***This library is not yet ready for use***. If you have suggestions or
feedback, please let me know via the
[issues](https://github.com/jesstelford/relaxql/issues).

Read on for how I envisage this library to work...

# RelaxQL

A non-leaky nested component query library suitable for React components.
Inspired by [Facebook's
GraphQL](https://www.youtube.com/watch?v=9sc8Pyc51uU#t=6m45s).

## Nomenclature

Relay + Flux + GraphQL = RelaxQL

## Usage

### tl;dr

* Create a store: `MyStore = {term: 'foo', register: function(){ ... }}`
* Register the store: `RelaxQl.registerStore(MyStore);`
* Add the mixin to your component: `mixins: [RelaxQl().mixin()]`
* Define a query for your component: `statics: {query: {foo: {}, ...}}`
* On render, access the immutable-js object: `this.state.relax.get('foo')`
* Trigger events within your component: `this.props.relax.triggerFooAction()`
* Queries are flattened and deduplicated for you, and results processed ready
  for components

### Stores

Create a store to handle queries from all your components:

```javascript
// post-store.js
module.exports =  {

  term: 'post' // See docs for more. Note: always singular

  register: function(/* TODO */) {

    return {
      performQuery: function(queries, callback) {
        // Execute callback with fulfilled queries
      },

      onAction: function() {
        // A component called this.props.relax.triggerPostAction()
      },
      // ... See docs for more
    }
  }
}
```

Then register those via `.registerStore()`:

```javascript
// my-ql.js
var RelaxQl = require('relaxql')();
var PostStore = require('./post-store');
var AnotherStore = require('./another-store');
// ...

RelaxQl.registerStore(PostStore);
RelaxQl.registerStore(AnotherStore);
// ...

module.exports = RelaxQl;
```

### React Components

```javascript
// posts-component.js
var MyQl = require('./my-ql');
var React = require('react');
module.exports = React.createClass({

  mixins: [MyQl.mixin()],

  statics: {
    // The query this component requires
    query: {
      // Plural returns an Iterable collection
      posts: {
        // The requested structure of data, key existence is the only important
        // part of this, the value doesn't matter
	id: true,
        title: true,
	date: true,
	author: true,
	uri: true,
	body: true
      }
    }
  },

  render: function() {
    // this.state.relax is an immutable-js object with the structure defined in
    // statics.query
    var expectedObj = {
      id: // ...
      title: // ...
      date: // ...
      author: // ...
      uri: // ...
      body: // ...
    };
    var firstPost = this.state.relax.get('posts').first();
    isDeepEqual(expectedObj, firstPost) // true

    // ... render
  },

  onChange: function() {
    this.props.relax.triggerPostAction(/* ... */);
  }
});
```

```javascript
// sidebar-posts-component.js
var MyQl = require('./my-ql');
var React = require('react');
module.exports = React.createClass({

  mixins: [MyQl.mixin()],

  statics: {
    query: {
      posts: {
        // we only request certain keys here
	id: true,
        title: true,
	uri: true
      }
    }
  },

  render: function() {
    var expectedObj = {
      id: // ...
      title: // ...
      uri: // ...
    };
    var firstPost = this.state.relax.get('posts').first();
    isDeepEqual(expectedObj, firstPost) // true

    // ... render
  }
});
```

```javascript
// app-component.js
var MyQl = require('./my-ql');
var React = require('react');
var MainPosts = require('./posts-component');
var SidebarPosts = require('./sidebar-posts-component');
module.exports = React.createClass({

  mixins: [MyQl.mixin()],
  // Note: statics.query is not compulsory, but applying the mixin is

  render: function() {
    return (
      <div>
        <MainPosts> // No need to pass in props at all
        <SidebarPosts>
      </div>
    )
  }
});
```

```javascript
// main.js
var App = require('./app-component.js');
var React = require('react');

React.render(App(), document.querySelector('body'));
```

## API

### Stores

Stores are registered with RelaxQL to handle given **'terms'**. One store
handles one term in both the singular and the plural/collection form.

A Store's primary job is to define a mapping from what a component may request
in its query to what the actual data looks like when retreived.

Let's say we have a 'Posts' Store; given a data set of the following:

```json
[
  {
    "id": 123,
    "post-title": "Hello world",
    "who-wrote-it": "Jess Telford",
    "when-they-wrote-it: "Yesterday"
  }
]
```

And a component's query structure like so (see **'Queries'** for more):

```javascript
// in component 'foo':
query: {
  posts: {
    id: true,
    title: true,
    author: true
  }
}
```

It is up to the Store to correctly map `id` -> `id`, `post-title` -> `title`,
`who-wrote-it` -> `author`, and to completely ignore the unrequested
`when-they-wrote-it`.

**TODO: more**

### Queries

Queries are defined within a component's `statics`:

```javascript
var React = require('react');
module.exports = React.createClass({
  statics: {
    query: {
      posts: {
        id: true,
        title: true,
        uri: true
      }
    }
  },
  // ...
});
```

The `query` key represents an object of `<term>` to `<structure>` relationships.

#### Terms

Terms must map to a registered store. See **'Stores'** above for more.

#### Structure

A structure is defined as the set of keys the component requires. When defining
a structure, only the keys in the object are used - the values are ignored.
Their value is set to `true` by convention only, it is never used.

Structures are used by RelaxQL to determine exactly what data is required to be
queried. In this way, the amount of data sent back from the server is exactly
what was requested; no more, no less. This saves on bandwidth and on
client-side mutations in preparation for rendering.

When more than one component defines a query which uses the same term, these
queries are processed in batch before being sent to the store. Similarily, the
resulting data is processed in batch before being returned from the store to the
component. In this way, it is possible to have multiple queries for the same
term, but with different structures. For example;

```javascript
// in component 'foo':
query: {
  posts: {
    id: true,
    title: true,
    data: true,
    author: true
  }
}
```

```javascript
// in component 'bar':
query: {
  posts: {
    title: true,
    uri: true
  }
}
```

The `Post` store will receive a batch query request for `['id', 'title', 'data',
'author', 'uri']`, reducing the number of requests required.

### State

State is stored as an immutable-js object, available via `this.state.relax`. It
represents the structure defined in a component's `statics.query`.

For example, with the following statics:

```javascript
statics: {
  query: {
    posts: {
      id: true,
      title: true,
      uri: true
    }
  }
}
```

The resulting data is available via:

```javascript
var posts = this.state.relax.get('posts').first(); // == {id: , title: , uri: }
```

### Props

All props are available within a component via `this.props.relax`

#### `.trigger<Term>Action`

**TODO**

#### `.getParent`

**TODO**
