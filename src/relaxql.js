'use strict';
var forOwn = require('lodash/object/forOwn'),
    Cursor = require('immutable/contrib/cursor'),
    forEach = require('lodash/collection/forEach'),
    Immutable = require('immutable');

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

    /**
     * Supports v0.12.x & v0.13.x, otherwise warns and returns false
     *
     * @return Boolean True if it is a root element
     */
    function elementIsRoot(context) {
      return elementIsRootv12(context)
        || elementIsRootv13(context);
    }

    function elementIsRootv12(context) {
      return (
        typeof context._mountDepth !== 'undefined'
        && context._mountDepth === 0
      );
    }

    function elementIsRootv13(context) {
      return (
        typeof context._reactInternalInstance !== 'undefined'
        && typeof context._reactInternalInstance._isTopLevel !== 'undefined'
        && context._reactInternalInstance._isTopLevel
      );
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
      try {
        return getElementKeyv12(context)
      } catch (error) {
        return getElementKeyv13(context);
      }
    }

    function getElementKeyv12(context) {
      return context._currentElement.key;
    }

    function getElementKeyv13(context) {
      return context._reactInternalInstance._currentElement.key;
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

    /**
     * Get a default state with a cursor that points to nothing
     *
     * @return Object with a `cursor` key
     */
    function getDefaultState() {
      return {
        cursor: Cursor.from(Immutable.Map())
      }
    }


    function triggerQueryLoad(component, query) {
      console.log('completed query loading:', query);

      var toHandle = {};
      var result = mapRecursiveQueriesToStructure(toHandle, query);

    }

    /**
     * Converting the recursive structure into a flat one which allows us to
     * batch-update all the cursors at once
     *
     * @param memo Object The memo of the map. See below for example result
     * @param query The Recursive query object. Expected to have keys `query`
     * and `_children`, where `_children` is an array of other queries of the
     * same form.
     *
     * Example result in memo:
       {
          // 'blogposts' is the name of a handler
         'blogposts': [
           { // The main-column blog posts of the homepage
             structure: {
               id: true,
               title: true,
               content: true,
               date: true
             },
             // These cursors are duplicated from the cursor the component
             // receives
             cursors: [
               {
                 form: 'plural',
                 cursor: Cusor.from(?)
               }
             ]
           },
           { // The side-column list of links to other posts
             structure: {
               id: true,
               title: true,
               commentCount: true
             },
             cursors: [
               {
                 form: 'singular',
                 cursor: Cusor.from(?)
               }
             ]
           }
         ]
       }
    */
    function mapRecursiveQueriesToStructure(toHandle, query) {

      if (query.query) {
        mapQueryToHandle(toHandle, query.query);
      }

      if (query._children) {
        forEach(query._children, function(childQuery) {
          recursivelyMapQueryToHandle(toHandle, childQuery);
        });
      }

    }

    function mapQueryToHandle(memo, query) {
      forOwn(query, function(structure, term) {
        // TODO: use 'structure' as a key (hashed?) so we don't duplicate query
        // structures
        var singularTerm = getSingular(term);
        var pluralTerm = isPlural(term);
        var termQueryGroups = memo[singularTerm] = memo[singularTerm] || {};
        getTermQueryGroup(singularTerm, pluralTerm, query, termQueryGroups);
        // TODO: Complete me.
        //memo[term].
      });
    }

    function getTermQueryGroup(term, isPlural, query, groups) {

      var foundGroup;

      var groupFound = groups.some(function(group) {

        if (deepEqual(group.structure, term.query)) {
          foundGroup = group;
          return true;
        } else {
        }

      });

      if (!groupFound) {
        groups.push({
          structure: term
          // TODO:
          cursors: [
            // TODO: What do I put in here!?
          ]
        });
      }
    }

    function deepEqual(a, b) {
      // TODO: implement me
      return true;
    }

    return {

      getInitialState: function() {
        return getDefaultState();
      },

      // This is the first method called in the component lifecycle which has a
      // context for the component (either instantiated or as a constructor) in
      // both v0.12.x and v0.13.x (v0.12.x has context in getInitialState, but
      // v0.13.x does not)
      componentWillMount: function() {
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
          } else {
            this.props.relaxQlProps.passQueryToParent(builtQuery, this);
          }

        }

      },

      componentDidMount: function() {
        // This lifecycle method is called from inner most to outer most
        // If this is the root element, then we know
        if (elementIsRoot(this)) {
          triggerQueryLoad(this, buildQuery);
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
