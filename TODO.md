# TODO

* Link the cursor within the 'builtQuery' so I can access it for later updates
* Use PropTypes to specify the available data keys a handler type can have
  * Then, perform a check whenever a component requests that type
* Actually recursively construct the flattened query structure
* Build some test handlers, and ensure they are executed in the correct order, only once, etc
* Unit tests!
* How does the cursor in a nested component get updated? Through props. But, how does it receive those new props? Through its parent. So, all the cursors have to listen to the root component for changes (since it is the one that triggers the updates)? Not necessarily; The parent can create new cursors, and `setState()` them to the components.
* How does the component listen to changes if it wants to? Have to wrap the cursor in some event emitter style code that emits when there's a change. But, that conflicts with the above, re: passing a brand new cursor through to the components
