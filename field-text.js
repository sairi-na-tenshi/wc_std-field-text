CComponent( new function(){
this.tag= 'i:field-text'
this.factory= function( el ){
	var lang= el.getAttribute( 'i:lang' ) || 'text'
	var input= el.getElementsByTagName( 'textarea' )[0]
	input.style.display= 'none'
	var editor= document.createElement( 'iframe' )
	editor.frameBorder= 0
	el.appendChild( editor )
	var win= editor.contentWindow
	var doc= win.document
	var sheets= document.styleSheets
	var styles= []
	for( var i= 0; i < sheets.length; ++i ){
		styles.push( '<link rel="stylesheet" href="' + sheets[i].href + '" />' )
	}
	doc.open()
	doc.write( '<!doctype html><html class="i-root-editor"><head>' + styles.join('') + '<body>' + input.value )
	doc.close()
	doc.designMode= 'on'
	var body= FPoly([ function(){
		return doc.getElementsByTagName('body')[0]
	}])
	var html2text= function( str ){
		noLFCR:     str= str.split( /[\n\r]+/ ).join( '' )
		BR2CR:      str= str.replace( /<br ?\/?>/gi, '\n' )
		stripTags:  str= str.split( /<.*?>/ ).join( '' )
		decodeNBSP: str= str.split( '&nbsp;' ).join( ' ' )
		decodeGT:   str= str.split( '&gt;' ).join( '>' )
		decodeLT:   str= str.split( '&lt;' ).join( '<' )
		decodeAMP:  str= str.split( '&amp;' ).join( '&' )
		return str
	}
	var selected= FPoly(
	[	function(){
			if( doc.selection ){
				var sel= doc.selection
				return sel.createRange()
			} else {
				var sel= win.getSelection()
				return sel.rangeCount
				?	sel.getRangeAt(0)
				:	null
			}
		}
	,	function( range ){
			if( range.select ) range.select()
			else {
				var sel= win.getSelection()
		        sel.removeAllRanges()
		        sel.addRange( range )
		    }
		}
	])
    var traverse= function( root, handler ){
    	if( handler( root ) ) return true
    	var child= root.firstChild
    	while( child ){
    		if( traverse( child, handler ) ) return true
    		child= child.nextSibling
    	}
    	return false
    }
    var nodeLength= function( node ){
    	switch( node.nodeName ){
    		case '#text': return node.nodeValue.length
    		case 'BR': return 1
    		default: return 0
    	}
    }
	var pos= FPoly(
	[	function(){
			var bod= body()
			var range= selected()
			if( !range ) return null

			if( range.move ){
                range.moveStart( 'character', -10000 )
                return html2text( range.htmlText ).length
			}

	        var target= range.endContainer;
	        var offset= range.endOffset;

	        if( target.nodeName !== '#text' ) {
	            target= target.childNodes[ offset ]
	            offset= 0
	        }

	        var found= traverse( body(), function( node ){
	        	if( node === target ) return true
	        	offset+= nodeLength( node )
	        });

	        return found ? offset : null;
		}
	,	function( offset ){
			if( pos === null ) return
	        var target= body();

			if( target.createTextRange ){
				var range= target.createTextRange()
				range.move( 'character', offset )
				selected( range )
				return
			}

	        traverse( target, function( node ){
	        	var length= nodeLength( node );
	            target= node
	            if( offset <= length ) return true;
	            offset-= length;
	        })

			var range= doc.createRange()
			if( target.nodeName === 'BR' ){
				range.setEndAfter( target )
				range.setStartAfter( target )
			} else {
				range.setEnd( target, offset )
				range.setStart( target, offset )
			}
			range.collapse( false )

	        selected( range )
	    }
	])
	var normalize= function(){
		var bod= body()

		Opera_Hack:
		var brs= bod.getElementsByTagName( 'br' )
		for( var i= 0; i < brs.length; ++i ){
			var br= brs[i]
			var prev= br.previousSibling
			if( prev && prev.nodeName !== 'BR' ) continue
			br.parentNode.insertBefore( doc.createTextNode( '' ), br )
		}

		WebKit_Hack:
		var childLength= bod.childNodes.length
		if( childLength ){
			var lastChild= bod.childNodes[ childLength - 1 ]
			if( lastChild.nodeName !== 'BR' ) bod.appendChild( doc.createElement( 'br' ) )
		}

	}
	var htmlLast
	var highlight= FTrottler( 40, function(){
		var htmlNew= body().innerHTML
		if( htmlNew === htmlLast ) return
		htmlNew= HLight.lang[ lang ]( html2text( htmlNew ) )
		input.value= htmlNew
		var p= pos()
		body().innerHTML= htmlNew
		htmlLast= body().innerHTML
		normalize()
		pos( p )

		val= Math.max( 100, doc.documentElement.scrollHeight ) + 'px'
		if( editor.style.height !== val ) editor.style.height= val
	})
	highlight()
	setTimeout( highlight, 1000 )
	var observe= function( node, event, handler ){
		if( node.attachEvent ){
			node.attachEvent( 'on' + event, handler )
			return
		}
		node.addEventListener( event, handler, false )
	}
	observe( doc, 'keypress', function( evt ){
		if( !evt ) evt= event
		switch( evt.keyCode ){
			case 13:
				var range= selected()
				if( range.pasteHTML ){
					range.pasteHTML( '<br />' )
					evt.returnValue= false
				} else {
					range.deleteContents()
					var br= doc.createElement( 'br' )
					range.insertNode( br )
					range.selectNode( br )
					evt.preventDefault()
				}
				range.collapse( false )
				selected( range )
				break;
		}
		highlight()
	})
	observe( doc, 'keyup', function( evt ){
		if( !evt ) evt= event
		switch( evt.keyCode ){
		}
		//highlight()
	})
}
})

/*

маркдаун:
код


яваскрипт:
комментарии
строки
регулярки
идентификаторы

*/
