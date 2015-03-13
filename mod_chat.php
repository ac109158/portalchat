<?php
/**
* Chat Widget
**/

defined('_JEXEC') or die('Restricted access');
		$user =& JFactory::getUser();
		$document =& JFactory::getDocument(); 
/* 		print_r($user);		 */
		$url = 'http' . (isset($_SERVER['HTTPS']) ? 's' : '') . '://' . "{$_SERVER['HTTP_HOST']}/{$_SERVER['REQUEST_URI']}";
		$url_path = explode("?", $url);
		if(preg_match('/firefox/i', $_SERVER['HTTP_USER_AGENT']))
		{
			$currentBr = 'firefox';
		}
		
		$url_path = rtrim($url_path[1], '#');
		if ($_SERVER[SERVER_NAME] == 'www.test.plusoneportal.com')
		{
			$ng_src = '/modules/mod_chat/app/js/ng.min.js';
/* 			$ng_src = '/modules/mod_chat/app/js/ng/ng_src.js'; */
			$_SESSION[ext_link] = 'option=com_content&view=article&id=100&Itemid=1111';
			if ($url_path == $_SESSION[ext_link])
			{
				$external = true;
			}
			else
			{
				$external = false;
			}
		}
		else
		{
			$ng_src = '/modules/mod_chat/app/js/ng.min.js';
/* 			$ng_src = '/modules/mod_chat/app/js/ng/ng_src.js'; */
			$_SESSION[ext_link] = 'option=com_content&view=article&id=233&Itemid=1112';
			if ($url_path == $_SESSION[ext_link])
			{
				$external = true;
			}
			else
			{
				$external = false;
			}
			
		}
		 if(!$external)
		 {
/* 		     if(in_array(33, $user->groups) || in_array(32, $user->groups) || in_array(31, $user->groups) ) */
		     if($currentBr == 'firefox')
			 {
				 echo '<a class="fa fa-external-link-square fa-4x" style="position:static; text-decoration:none; background:transparent;cursor:pointer;" onclick="activateExternalWindow();"><span style="position:relative; z-index:100;left:-25px;font-size:10px; color:white; cursor: pointer;">Chat</span></a>';
				 $document->addScript('/modules/mod_chat/popout/popout.js');
			 }
			 else
			 {
				$page = '<div presence="MOUSE TOUCH KEYBOARD" ng-controller="MainController" ng-app="chatModule"><chat-module ng-if="';
				$page .= !$external;
				$page .= '"></chat-module></div><chat-module_external ng-if="';
				$page .= $external; 
				$page .= '"></chat-module_external></div>';
				echo ($page);
				
				$document->addStyleSheet('/modules/mod_chat/app/css/compiled_vendor.css');
				$document->addStyleSheet('/modules/mod_chat/app/css/partial_bootstrap.css');
				$document->addStyleSheet('/modules/mod_chat/app/css/chat_module.css');
				
				
				$document->addScript('/modules/mod_chat/app/js/vendor.min.js');
				$document->addScript($ng_src);
			 }
			 
		 }
		 else
		 { 
		 	$page = '<div presence="MOUSE TOUCH KEYBOARD" ng-controller="MainController" ng-app="chatModule"><chat-module ng-if="';
		 	$page .= !$external;
		 	$page .= '"></chat-module><div ng-if="';
		 	$page .= $external;
		 	$page .= '" class="cm-fixed-wrapper-external"></div><chat-module_external></chat-module-external></div>';
		 	echo ($page);
		 	
		 	$document->addStyleSheet('/modules/mod_chat/app/css/compiled_vendor.css');
			if($external)
			{
	/* 			$document->addStyleSheet('/modules/mod_chat/app/css/bootstrap.css'); */
				$document->addStyleSheet('/modules/mod_chat/app/css/partial_bootstrap.css');
			}
			else
			{
				$document->addStyleSheet('/modules/mod_chat/app/css/partial_bootstrap.css');
			}
			$document->addStyleSheet('/modules/mod_chat/app/css/chat_module.css');
			
			
			$document->addScript('/modules/mod_chat/app/js/vendor.min.js');
			$document->addScript($ng_src);
		 }
		


		
?>


<script type="text/javascript">
<!--
var pathArray = window.location.host.split( '.' );
if ( pathArray[1] === 'test')
{
	var database = 'https://portalchattest.firebaseio.com/';
	var external = 'index.php?option=com_content&view=article&id=100&Itemid=1111'
}
else
{
	var database = 'https://plusoneportal.firebaseio.com/';
	var external = 'index.php?option=com_content&view=article&id=233&Itemid=1112'
}

//Chrome passes the error object (5th param) which we must use since it now truncates the Msg (1st param).
window.onerror = function (errorMsg, url, lineNumber, columnNumber, errorObject) {
    var errMsg;
    //check the errorObject as IE and FF don't pass it through (yet)
    if (errorObject && errorObject !== undefined) {
            errMsg = errorObject.message;
        }
        else {
            errMsg = errorMsg;
        }
    console.log('Error: ' + errMsg);
}

var throwError = function () {
    throw new Error(
    'Something went wrong. Something went wrong. Something went wrong. Something went wrong. ' +
    'Something went wrong. Something went wrong. Something went wrong. Something went wrong. ' + 
    'Something went wrong. Something went wrong. Something went wrong. Something went wrong. ' + 
    'Text does not get truncated! :-)');
}

</script>
<link href="//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">
