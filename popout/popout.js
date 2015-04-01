var popOutChatModule = {};
popOutChatModule.externalWindowObject = null;
popOutChatModule.isExternalWindow = false;
popOutChatModule.openExternalWindow = function(){
	popOutChatModule.externalWindowObject = window.open(external, "PlusOnePortalChat", "left=1300, width=350, resizable=false, scrollbars=no, status=no, location=no,top=0");
	setTimeout(function(){
		popOutChatModule.externalWindowObject.resizeTo(350, window.innerHeight+50);
		popOutChatModule.externalWindowObject.focus(); /* 					UtilityService.setFirebaseOffline(); */
		popOutChatModule.externalWindowObject.addEventListener('unload', closedetected, true);
		popOutChatModule.externalWindowObject.addEventListener('DOMContentLoaded', resizeChild, true);
	}, 1000);


	function resizeChild() { /* 					    		console.log('calling resize child'); */
		var resize = setTimeout(function() {
			console.log('load  detected');
			if(popOutChatModule.externalWindowObject){
				popOutChatModule.externalWindowObject.focus();
				popOutChatModule.externalWindowObject.document.documentElement.style.overflow = 'hidden'; // firefox, chrome
				popOutChatModule.externalWindowObject.document.body.scroll = "no"; // ie only
				if (localStorage['chatModule'])
				{
					localStorage['chatModule']['isExternalWindow'] = true;
				} else{
					localStorage['chatModule'] = {};
					localStorage['chatModule']['isExternalWindow'] = true;
				}
				clearTimeout(resize);
			}

		}, 2000)
	}

	function closedetected() {
		console.log('Close detected');
		popOutChatModule.externalWindowObject = null;
		popOutChatModule.isExternalWindow = false;
	}
}

function activateExternalWindow() {
	if (popOutChatModule.externalWindowObject) {
		popOutChatModule.externalWindowObject.focus();
	} else if ( localStorage['chatModule'] && localStorage['chatModule']['isExternalWindow'] == true) {
		popOutChatModule.externalWindowObject = window.open('', "PlusOnePortalChat");
		popOutChatModule.externalWindowObject.focus();
	} else {
		popOutChatModule.openExternalWindow();
	}
}
