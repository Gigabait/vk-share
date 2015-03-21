var imageUrl = null;
var _fileName;
var _photoData;
var _accToken;
var _photoObject;
var _docObject;
var _userId;
var _uids = [];
var _allFriendsArr = [];

function getObjectDescription(object)
{
	var res = "";
	for (var prop in object)
	{
		res += prop + "(" + (typeof prop) + "): " + object[prop] + "\n";
	}
	return res;
}

function hasClass(ele,cls) {
	return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
 
function addClass(ele,cls) {
	if (!this.hasClass(ele,cls)) ele.className += " "+cls;
}
 
function removeClass(ele,cls) {
	if (hasClass(ele,cls)) {
    var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,' ');
	}
}

function upload(imageUrl, fileName)
{
	_fileName = fileName;
	var getPhotoHttpRequest = new XMLHttpRequest();
	getPhotoHttpRequest.onload = onGetPhoto;
	getPhotoHttpRequest.responseType = 'blob';
	getPhotoHttpRequest.open('GET', imageUrl);
	getPhotoHttpRequest.send();
}

function onGetPhoto(event)
{
	_photoData = event.srcElement.response;

	var ext = _fileName.split('.').pop();
	if (!(ext && ext.length < 5))
	{
		var fileType = event.srcElement.response.type;
		var fileTypeArr = fileType.split('/');
		ext = "jpg";
		if (fileTypeArr.length > 1) {
			ext = fileTypeArr.pop();
		}
		_fileName += "." + ext;
	}
	ext = ext.toLowerCase();

	if (ext !== "gif") {
		beginLoadImage();
	}
	else {
		beginLoadDoc();
	}
}

function beginLoadImage() {
	var getPhotoUploadServer = new XMLHttpRequest();
	getPhotoUploadServer.open('GET', 'https://api.vk.com/method/photos.getMessagesUploadServer?access_token=' + _accToken);
	getPhotoUploadServer.onload = onGetPhotoUploadServer;
	getPhotoUploadServer.send();
}

function beginLoadDoc() {
	var getDocUploadServer = new XMLHttpRequest();
	getDocUploadServer.open('GET', 'https://api.vk.com/method/docs.getUploadServer?access_token=' + _accToken);
	getDocUploadServer.onload = onGetDocUploadServer;
	getDocUploadServer.send();
}


function onGetDocUploadServer(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response.upload_url)
	{
		var formData = new FormData();
		formData.append("file", _photoData, _fileName);
		var postPhotoRequest = new XMLHttpRequest();
		postPhotoRequest.open("POST", answer.response.upload_url, true);
		postPhotoRequest.onload = onPostDoc;
		postPhotoRequest.send(formData);
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function onGetPhotoUploadServer(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response.upload_url)
	{
		var formData = new FormData();
		formData.append("photo", _photoData, _fileName);
		var postPhotoRequest = new XMLHttpRequest();
		postPhotoRequest.open("POST", answer.response.upload_url, true);
		postPhotoRequest.onload = onPostPhoto;
		postPhotoRequest.send(formData);
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function onPostDoc(event)
{
	// alert(event.target.response);
	if (event.target.response.indexOf("Security Breach2") !== -1)
	{
		alert(event.target.response);
		return;
	}

	var answer = JSON.parse(event.target.response);
	
 	if (answer.file)
 	{
 		var saveDocRequest = new XMLHttpRequest();
 		saveDocRequest.open("GET", "https://api.vk.com/method/docs.save?file=" + answer.file + "&access_token=" + _accToken);
 		saveDocRequest.onload = onSaveDoc;
 		saveDocRequest.send();
 	}
 	else
 	{
 		alert("Doc not uploaded");
 	}
}

function onPostPhoto(event)
{
	if (event.target.response.indexOf("Security Breach2") !== -1)
	{
		alert(event.target.response);
		return;
	}

	var answer = JSON.parse(event.target.response);
	
 	if ((answer.photo) && (answer.photo !== '[]')) {
 		var savePhotoRequest = new XMLHttpRequest();
 		savePhotoRequest.open("GET", "https://api.vk.com/method/photos.saveMessagesPhoto?server=" + answer.server +
 			"&photo=" + answer.photo + 
 			"&hash=" + answer.hash + 
 			"&access_token=" + _accToken);
 		savePhotoRequest.onload = onSavePhoto;
 		savePhotoRequest.send();
 	}
 	else {
 		thereIsAnError("Photo not uploaded", "Photo array is empty");
 	}
}

function onSaveDoc(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response)
	{
		_docObject = answer.response[0];
		document.getElementById("loader_image_wrapper").style.display = "none";
		document.getElementById("photo_image").style.display = "block";
		document.getElementById("photo_image").src = _docObject.url;
		refreshButtonState();
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function onSavePhoto(event)
{
	var answer = JSON.parse(event.target.response);
	// alert(event.target.response);
	if (answer.response)
	{
		_photoObject = answer.response[0];
		document.getElementById("loader_image_wrapper").style.display = "none";
		document.getElementById("photo_image").style.display = "block";
		document.getElementById("photo_image").src = _photoObject.src_xxbig || _photoObject.src_xbig || _photoObject.src_big || _photoObject.src_small || _photoObject.src;
		refreshButtonState();
	}
	else
	{
		alert("Error: " + event.target.response);
	}
}

function sendMessage()
{
	chrome.storage.local.set({'windowCoord': {
		x: window.screenX,
		y: window.screenY,
		w: window.innerWidth,
		h: window.innerHeight,
	}});

	if ((_uids.length > 0) && (_photoObject || _docObject))
	{
		var messageContainer = document.getElementById("message_text");
		var messageText = messageContainer.value || "";
		for (var index = 0; index < _uids.length; index++)
		{
			var uid = _uids[index];
			var chatId;

			var attachmentStr = "";
			if (_photoObject) 
			{
				attachmentStr = _photoObject.id;
			}
			else
			{
				attachmentStr = "doc" + _docObject.owner_id + "_" + _docObject.did;
			}

			if (uid.indexOf("chat_") !== -1) {
				chatId = uid.replace("chat_", "");
			}

			var sendMessageRequest = new XMLHttpRequest();

			var receiver;
			if (chatId) {
				receiver = "chat_id=" + chatId;
			}
			else {
				receiver = "uid=" + uid;
			}
			var url = "https://api.vk.com/method/messages.send?" + 
				receiver + 
				"&message=" + messageText +
				"&attachment=" + attachmentStr +
				"&access_token=" + _accToken;
			sendMessageRequest.open("GET", url);
			sendMessageRequest.onload = onSendMessage;
			sendMessageRequest.uid = uid;
			sendMessageRequest.send();
		}
	}
}


function onSendMessage(event)
{
	//todo: write message in window, set timer with 5 seconds to close and button (like shutdown in ubuntu)
	var answer = JSON.parse(event.target.response);
	if (answer.response && event.target.uid)
	{
		var index = _uids.indexOf(event.target.uid);
		if (index !== -1)
		{
			_uids.splice(index, 1);
		}
		if (_uids.length === 0) 
		{
			window.close();
		}
	}
}

function beginLoadFriendList()
{
	var getFriendsRequest = new XMLHttpRequest();
	getFriendsRequest.onload = onGetFriends;
	getFriendsRequest.open("GET", "https://api.vk.com/method/friends.get?"+
		"access_token=" + _accToken +
		"&fields=uid,first_name,last_name,photo,online,last_seen" +
		"&order=hints"
		);
	getFriendsRequest.send();
}

function onGetFriends(event)
{
	var answer = JSON.parse(event.target.response);
	if (answer.response)
	{
		_allFriendsArr = answer.response;
	}
}

function refreshFriendsList (friendsArr) {
	var friendsTable = document.getElementById("friends_list").tBodies[0];
	friendsTable.innerHTML = "";

	if (friendsArr.length === 0) {
		var tr = document.createElement("tr");
		var p = document.createElement("p");
		p.className = "text-center";
		p.innerText = chrome.i18n.getMessage("not_found");
		tr.appendChild(p);
		friendsTable.appendChild(tr);
	}

	for (var friendNum = 0; friendNum < friendsArr.length; friendNum++)
	{
		var friend = friendsArr[friendNum];
		
		var tr = document.createElement("tr");
		tr.setAttribute("uid", friend.uid);
		tr.onclick = selectFriend;

		if (_uids.indexOf(friend.uid + "") !== -1) {
			tr.className = "selected";
		}
		
		var td = document.createElement("td");
		td.className = "col_photo";
		
		var img = document.createElement("img");
		img.className = "avatar";
		img.src = friend.photo;
		
		td.appendChild(img);
		tr.appendChild(td);
		
		td = document.createElement("td");
		// td.className = "info";
		
		var name = document.createElement("a");
		name.innerHTML = friend.first_name + " " + friend.last_name;
		name.setAttribute("uid", friend.uid);
		
		var onlineDiv = document.createElement("div");
		var onlineSpan = document.createElement("span");
		onlineSpan.className = "label label-info my_label";
		if (friend.online == 1)
			onlineSpan.innerHTML = "online";
		onlineDiv.appendChild(onlineSpan);
		
		td.appendChild(name);
		td.appendChild(onlineDiv);
		tr.appendChild(td);

		td = document.createElement("td");
		img = document.createElement("img");
		img.className = "flag";
		td.appendChild(img);
		tr.appendChild(td);
		
		friendsTable.appendChild(tr);
	}
}


function selectFriend(event)
{
	chrome.storage.local.set({'windowCoord': {
		x: window.screenX,
		y: window.screenY,
		w: window.innerWidth,
		h: window.innerHeight,
	}});

	var row = event.currentTarget;
	var uid = row.getAttribute("uid");
	if (uid)
	{

		var index = _uids.indexOf(uid);
		if (index === -1)
		{
			if (!hasClass(row, "selected"))
			{
				addClass(row, "selected");
			}
			_uids.push(uid);
		}
		else
		{
			if (hasClass(row, "selected"))
			{
				removeClass(row, "selected");
			}
			_uids.splice(index, 1);
		}
	}
	refreshButtonState();
}




function beginLoadDialogs()
{
	var getDialogsRequest = new XMLHttpRequest();
	getDialogsRequest.onload = onGetDialogs;
	getDialogsRequest.open("GET", "https://api.vk.com/method/messages.getDialogs?"+
		"access_token=" + _accToken +
		"&count=50"
		);
	getDialogsRequest.send();
}

function onGetDialogs(event)
{
	var answer = JSON.parse(event.target.response);
	if (answer.response)
	{
		var dialogsArr = answer.response
		if (dialogsArr.length > 0) {
			delete dialogsArr[0];
			dialogsArr.splice(0, 1);
		}

		var users = {};
		for (var i = 0; i < dialogsArr.length; i++) {
			if (!dialogsArr[i].admin_id) {
				users[dialogsArr[i].uid] = {};
			}
			else {
				var chatUsers = dialogsArr[i].chat_active.split(",");
				for (var userIndex = 0; userIndex < chatUsers.length; userIndex++) {
					users[chatUsers[userIndex]] = {};
				}
			}
		}

		var usersIdArr = [];
		for (var userId in users) {
			if (users.hasOwnProperty(userId)) {
				usersIdArr.push(userId);
    		
				if (usersIdArr.length === 1000) {
					break;
				}
			}
		}

		getUsersData(usersIdArr.join(","), function (usersData) {
			for (var i = 0; i < usersData.length; i++) {
				var user = users[usersData[i].uid];
				if (user) {
					user.data = usersData[i];
				}
			}

			for (var i = 0; i < dialogsArr.length; i++) {
				var dialogUsersData = [];

				if (!dialogsArr[i].admin_id) {
					var user = users[dialogsArr[i].uid];
					dialogUsersData.push(user.data);
				}
				else {
					var chatUsers = dialogsArr[i].chat_active.split(",");
					for (var userIndex = 0; userIndex < chatUsers.length; userIndex++) {
						var user = users[chatUsers[userIndex]];
						dialogUsersData.push(user.data);
					}
				}

				dialogsArr[i].usersData = dialogUsersData;
			}

			refreshDialogsList(dialogsArr);
		});

		document.getElementById("loader_dialogs_wrapper").style.display = "none";
	}
}


function selectDialog() {
	chrome.storage.local.set({'windowCoord': {
		x: window.screenX,
		y: window.screenY,
		w: window.innerWidth,
		h: window.innerHeight,
	}});

	var row = event.currentTarget;
	var uid = row.getAttribute("uid");
	if (uid) {
		var index = _uids.indexOf(uid);
		if (index === -1) {
			if (!hasClass(row, "selected")) {
				addClass(row, "selected");
			}
			_uids.push(uid);
		}
		else {
			if (hasClass(row, "selected")) {
				removeClass(row, "selected");
			}
			_uids.splice(index, 1);
		}
	}
	refreshButtonState();
}


function refreshDialogsList (dialogsArr) {
	var table = document.getElementById("dialogs_list").tBodies[0];
	table.innerHTML = "";

	if (dialogsArr.length === 0) {
		var tr = document.createElement("tr");
		var p = document.createElement("p");
		p.className = "text-center";
		p.innerText = chrome.i18n.getMessage("not_found") || "Нет диалогов";
		tr.appendChild(p);
		table.appendChild(tr);
	}

	for (var dialogNum = 0; dialogNum < dialogsArr.length; dialogNum++)
	{
		var dialog = dialogsArr[dialogNum];
		var usersData = dialog.usersData;

		if (!usersData[0]) {
			continue;
		}
		
		var tr = document.createElement("tr");
		tr.setAttribute("uid", dialog.chat_id ? "chat_" + dialog.chat_id : dialog.uid);
		tr.onclick = selectDialog;
		
		var td = document.createElement("td");
		td.className = "col_photo";
		
		var img = document.createElement("img");
		img.className = "avatar";
		img.src = "images/multichat_50.png";
		if (usersData.length === 1) {
			if (usersData[0]) {
				img.src = usersData[0].photo;
			}
		} 
		else
		{
			img.src = dialog.photo_50;
		}
		
		
		td.appendChild(img);
		tr.appendChild(td);
		
		td = document.createElement("td");

		var usernames = "";
		for (var i = 0; i < usersData.length; i++) {
			if (usersData[i]) {
				if (usernames !== "") {
					usernames += ", ";
				}
				usernames += usersData[i].first_name + " " + usersData[i].last_name;
			}

			if (i === 2) {
				usernames += ", ...";
				break;
			}
		}

		if (usersData.length != 1) {
			usernames = dialog.title;
		}

		/*var onlineDiv = document.createElement("div");
		var onlineSpan = document.createElement("span");
		onlineSpan.className = "label label-info my_label";
		if (usersData[0].online == 1)
			onlineSpan.innerHTML = "online";
			console.log("online");
		onlineDiv.appendChild(onlineSpan);

		td.appendChild(onlineDiv);*/

		var namesDiv = document.createElement("div");
		namesDiv.className = "dialog_names";
		namesDiv.innerHTML = usernames;
		td.appendChild(namesDiv);

		var text = dialog.body;
		if (text.length > 100) {
			text = text.substring(0, 100) + "...";
		}
		text = text.replace(/([^\s-]{5})([^\s-]{5})/, "$1&shy;$2");

		var textDiv = document.createElement("div");
		textDiv.className = "dialog_content";
		textDiv.innerHTML = text;
		td.appendChild(textDiv);

		tr.appendChild(td);

		td = document.createElement("td");
		img = document.createElement("img");
		img.className = "flag";
		td.appendChild(img);
		tr.appendChild(td);
		
		table.appendChild(tr);
	}
}





function getUsersData(users, callback) {
	var getUsersDataRequest = new XMLHttpRequest();
	getUsersDataRequest.open("GET", "https://api.vk.com/method/users.get?"+
		"access_token=" + _accToken +
		"&fields=uid,first_name,last_name,photo" +
		"&uids=" + users
		);
	getUsersDataRequest.onload = function (event) {
		var answer = JSON.parse(event.target.response);
		if (answer.response) {
			callback(answer.response);
		}
	};
	getUsersDataRequest.send();
}



function refreshButtonState()
{
	var sendButton = document.getElementById("send_button");
	if ((_uids.length > 0) && (_photoObject || _docObject))
	{
		removeClass(sendButton, "disabled");
	}
	else
	{
		addClass(sendButton, "disabled");
	}
	
}

document.addEventListener("DOMContentLoaded", function() {
	var sendButton = document.getElementById("send_button");
	sendButton.onclick = sendMessage;
	refreshButtonState();

	var sendButtonTitle = 
		friendsLoaderText = 
		dialogsLoaderText = 
		imageLoaderText = 
		documentTitle = 
		navBarTab1Text = 
		navBarTab2Text = "";


	if (chrome.i18n) {
		sendButtonTitle = chrome.i18n.getMessage("upload_send_button_title");
		friendsLoaderText = chrome.i18n.getMessage("upload_friends_loader_text");
		dialogsLoaderText = chrome.i18n.getMessage("upload_dialogs_loader_text");
		imageLoaderText = chrome.i18n.getMessage("upload_image_loader_text");
		documentTitle = chrome.i18n.getMessage("upload_page_title");
		navBarTab1Text = chrome.i18n.getMessage("nav_bar_tab1_text");
		navBarTab2Text = chrome.i18n.getMessage("nav_bar_tab2_text");
	}
	else {
		sendButtonTitle = "Отправить";
		friendsLoaderText = "Загрузка списка друзей...";
		dialogsLoaderText = "Загрузка диалогов...";
		imageLoaderText = "Загрузка изображения...";
		documentTitle = "Отправка изображения с помощью сообщения ВКонтакте";
		navBarTab1Text = "Друзья";
		navBarTab2Text = "Диалоги";
	}


	document.getElementById("send_button").innerText = sendButtonTitle;
	document.title = documentTitle;

	document.getElementById("message_text").onkeypress = onMessageTextKeyPress;

	var params = window.location.hash.substring(1).split('&access_token=');
	if(params && params.length == 2) {
		var imageParam = params[0];
		_accToken = params[1];

		//Check if base64 image
		if (imageParam.indexOf('data:image') !== -1) {
			var base64Parts = imageParam.split(',');
			var base64Params = base64Parts[0].split(';');
			var fileExt = base64Params[0].split('/')[1];

			//Converting base64 to blob
			var data = atob(base64Parts[1]);
			var aBufferView = new Uint8Array(data.length);
			for (var i = 0; i < aBufferView.length; i++) {
				aBufferView[i] = data.charCodeAt(i);
			}
			var blobData = new Blob([aBufferView.buffer]);

			_photoData = blobData;
			_fileName = "base64File." + fileExt;

			if (fileExt !== "gif") {
				beginLoadImage();
			}
			else {
				beginLoadDoc();
			}

			// debugger;
		}
		else {
			var filename = params[0].split('/');
			if(filename.length > 0) {
				imageUrl = params[0];
				var imageName = filename[filename.length - 1];
				if (imageName.indexOf('?') > -1 )
				{
					imageName = imageName.slice( 0, imageName.indexOf('?'));
				}
				if (imageName.indexOf('#') > -1 )
				{
					imageName = imageName.slice( 0, imageName.indexOf('#'));
				}    
				if (imageName.indexOf('&') > -1 )
				{
					imageName = imageName.slice( 0, imageName.indexOf('&'));
				}
				upload(imageUrl, imageName);
			}
			else {
				thereIsAnError('Getting image filename', 'filename.length <= 0');
			}
		}

		beginLoadFriendList();
		beginLoadDialogs();
	}
	else {
		thereIsAnError('Parsing image url', 'params || params.length != 2');
	}
	
	document.getElementById("message_text").placeholder = chrome.i18n.getMessage("upload_send_text_title");
	


	window.onresize = resizeElements;
	resizeElements();
});


function onSelectRightTab(event) {
	setActiveTab(event.target.data);
	return false;
}


function setActiveTab(activeTab) {
	var navBar = document.getElementById("list_navigation_tabs");
	removeClass(navBar.children[0], "active");
	removeClass(navBar.children[1], "active");
	
	addClass(navBar.children[activeTab], "active");

	var friendsPanel = document.getElementById("friends_panel");
	var dialogsPanel = document.getElementById("dialogs_panel");

	switch (activeTab) {
		case 0:
			friendsPanel.style.display = "";
			dialogsPanel.style.display = "none";
			break;
		case 1:
			friendsPanel.style.display = "none";
			dialogsPanel.style.display = "";
			break;
	}

	chrome.storage.local.set({
		'activeTab': activeTab
	});
}


function resizeElements() {
	var height = window.innerHeight;
	document.getElementById("dialogs_list_wrapper").style.height = height - 40 + "px";
}

function onMessageTextKeyPress(e) {
	if (e.which === 13) {
		if (e.ctrlKey || (e.which === 91) || (e.which === 93))
			sendMessage();
		return false;
	}
	return true;
}

function thereIsAnError(textToShow, errorToShow)
{
	// document.getElementById('error_message').innerHTML = '<p></p><br/><br/><center><h1>Wow! Some error arrived!</h1></center><br/><br/><p>' + textToShow + '</p><br/><br/><p>' + errorToShow + '</p><p>' + imageUrl + '</p>';
	var errorDim = document.getElementById('error_message');
	var div = document.createElement("div");
	div.className = "alert alert-danger";

	var errorDescription = chrome.i18n.getMessage("error_message_title");

	div.innerHTML = "<b>" +errorDescription+ "</b><br />" + 
					textToShow + "<br />" +
					errorToShow;

	errorDim.appendChild(div);
	errorDim.style.display = "block";

	document.getElementById('main_content').style.display = "none";
}




