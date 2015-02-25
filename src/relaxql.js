'use strict';
var forOwn = require('lodash/object/forOwn'),
    forEach = require('lodash/collection/forEach');

var handlers = {};

function isPlural(term) {
  return term.slice(-1) === 's';
}

function makeSingular(term) {
  return term.slice(0, -1);
}

function getSingular(term) {
  return isPlural(term) ? makeSingular(term) : term;
}

module.exports = {

  /**
   * Add a handler for a particular query term
   *
   * @param term String The term to handle. If ends in 's', is considered to be
   * a 'plural'. For example, 'todos' will be registered as 'todo', and 'sheeps'
   * will be registered as 'sheep'.
   * @param handler function
   */
  addTermHandler: function(term, handler) {
    handlers[getSingular(term)] = handler;
  },

  mixin: function() {

    var builtQuery = {
          query: {},
          _children: {}
        },
        isRoot = false;

    // TODO: memoize
    function buildQueryStructure(query) {
      return query;
    }

    function elementIsRoot(context) {
      return context._mountDepth === 0;
    }

    function elementHasQuery(context) {
      return !!context.constructor.query;
    }

    // TODO: memoize
    function getElementQuery(context) {
      if (!elementHasQuery(context)) {
        return getDefaultQuery(context);
      } else {
        return context.constructor.query;
      }
    }

    function getElementKey(context) {
      return context._currentElement.key;
    }

    function getDefaultQuery(context) {
      return {};
    }

    function receiveQueryFromChild(childQuery, child) {

      var childKey;

      try {
        validateQueryOrThrow.call(child, childQuery);
        childKey = getChildKeyOrThrow(child);
        throwIfChildExists(builtQuery, childKey);
      } catch (error) {
        return console.warn(error.message);
      }

      builtQuery._children[childKey] = childQuery;
    }

    function getChildKeyOrThrow(child) {

      var childKey = getElementKey(child);

      if (!childKey) {
        throw new Error('RelaxQL requires components to have a unique key prop'
                        + ' to register its query. See "'
                        + child.constructor.displayName
                        + '"'
                       );
      }

      return childKey;
    }

    function throwIfChildExists(query, childKey) {

      if (query._children[childKey]) {
        throw new Error('Attempted to register duplicate query for element with'
                        + ' key "'
                        + childKey
                        + '". See "'
                        + child.constructor.displayName
                        + '"'
                       );
      }

    }

    /**
     * Sanity Check for query structure
     *
     * Should be bound to the element context
     *
     * @param query Object The query to check
     */
    function validateQueryOrThrow(query) {

      forOwn(query, function(term) {
        forEach(['_children'], function(reservedKeyword) {
          if (term === reservedKeyword) {
            throw new Error('"'
                            + reservedKeyword
                            + '" is a reserved RelaxQL work. See "query" for '
                            + this.constructor.displayName
                           );
          }
        });
      });
    }

    return {

      // This is the first method called in the component lifecycle which has a
      // context for the component (either instantiated or as a constructor)
      getInitialState: function() {
        var query = getElementQuery(this),
            queryRequestStructure,
            warnings;

        builtQuery.query = buildQueryStructure(query);

        if (!elementIsRoot(this)) {

          if (!this.props.relaxQlProps) {
            console.warn('The component must have relaxQlProps set. See the '
                         + this.constructor.displayName
                         + ' component'
                        );
            return {};
          }

          this.props.relaxQlProps.passQueryToParent(builtQuery, this);

        }

        return {};

      },

      componentWillMount: function() {
      },

      componentDidMount: function() {
        // This lifecycle method is called from inner most to outer most
        // If this is the root element, then we know
        if (elementIsRoot(this)) {
          // TODO Trigger query
          console.log('completed query built:', builtQuery);
        }
      },

      componentWillReceiveProps: function(newProps) {
        // TODO: check if the new cursor is different, and set it if so
      },

      relaxQlProps: function() {
        return {
          passQueryToParent: receiveQueryFromChild.bind(this)
        }
      }

    }

  }

}
