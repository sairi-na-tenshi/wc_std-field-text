CComponent( 'std:field-text', function( el ){
	var lang= CHiqus( el.className ).get( 'lang' )
	var input= el.getElementsByTagName( 'textarea' )[0]
	input.style.display= 'none'
	var editor= document.createElement( 'std:field-text-content' )
	editor.innerHTML= input.value
	editor.contentEditable= true
	el.appendChild( editor )

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

	var selected= FPoly
	(	function(){
			if( document.selection ){
				var sel= document.selection
				return sel.createRange()
			} else {
				var sel= window.getSelection()
				return sel.rangeCount
				?	sel.getRangeAt(0)
				:	null
			}
		}
	,	function( range ){
			if( range.select ) range.select()
			else {
				var sel= window.getSelection()
		        sel.removeAllRanges()
		        sel.addRange( range )
		    }
		}
	)

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

	var pos= FPoly
	(	function(){
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

	        var found= traverse( editor, function( node ){
	        	if( node === target ) return true
	        	offset+= nodeLength( node )
	        });

	        return found ? offset : null;
		}
	,	function( offset ){
			if( pos === null ) return
	        var target= editor;

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

			var range= document.createRange()
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
	)

	var normalize= function(){

		Opera_Hack:
		var brs= editor.getElementsByTagName( 'br' )
		for( var i= 0; i < brs.length; ++i ){
			var br= brs[i]
			var prev= br.previousSibling
			if( prev && prev.nodeName !== 'BR' ) continue
			br.parentNode.insertBefore( document.createTextNode( '' ), br )
		}

		WebKit_Hack:
		var childLength= editor.childNodes.length
		if( childLength ){
			var lastChild= editor.childNodes[ childLength - 1 ]
			if( lastChild.nodeName !== 'BR' ) editor.appendChild( document.createElement( 'br' ) )
		}

	}

	var htmlLast
	var highlight= FTrottler( 40, function(){
		var htmlNew= editor.innerHTML
		if( htmlNew === htmlLast ) return
		var langContent= HLight.lang[ lang ] || HLight.lang.text
		var textNew= html2text( htmlNew )
		input.value= textNew
		htmlNew= langContent( textNew )
		input.value= htmlNew
		var p= pos()
		editor.innerHTML= htmlNew
		htmlLast= editor.innerHTML
		normalize()
		pos( p )
	})
	highlight()

	var observe= function( node, event, handler ){
		if( node.attachEvent ){
			node.attachEvent( 'on' + event, handler )
			return
		}
		node.addEventListener( event, handler, false )
	}

	observe( editor, 'keypress', function( evt ){
		if( !evt ) evt= event
		switch( evt.keyCode ){
			case 13:
				var range= selected()
				if( range.pasteHTML ){
					range.pasteHTML( '<br />' )
					evt.returnValue= false
				} else {
					range.deleteContents()
					var br= document.createElement( 'br' )
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

	observe( editor, 'keyup', function( evt ){
		if( !evt ) evt= event
		switch( evt.keyCode ){
		}
		highlight()
	})

})
