IClick
=======

On most touch devices, when a user clicks an element, there is a 300ms delay before the actual `click`
event is fired.

This library provides a costume event (default name is `iclick`) that would fire immediately after the user
clicked the element.

Browser support:
 * Android 2.3+
 * Chrome
 * Safari
 * Firefox
 * IE9+

## Unique features

 1. Aside from providing support for touch and mouse, this library also supports adding new device drivers
 2. Supports multiple input devices at once (so Chrome on win8 will work on both touch and mouse)
 3. Allows for the user to prevent the real click event (either globally or on case-by-case basis). This is
    very important in cases where the clicked element in removed/moved/hidden before the real click fires.
 4. AMD support - can work with or without AMD.
 5. Since it uses DOM events, this library is completely cross-library

## Basic usage

```js
require(['IClick'], function(IClick){
	new IClick();

	$('some-target').on('iclick', function(){
		console.log('foo');
	});
});
```

for more info on API and on how to add drivers, consult the [docs](http://cheggeng.github.io/IClick/docs)


