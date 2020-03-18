<?php
	session_start();

	$method = $_SERVER["REQUEST_METHOD"];
	
	switch(strtoupper($method)){
		case "POST":
			postHandler(requestBody());
			break;
		case "GET":
			getHandler();
			break;
		case "PUT":
			putHandler(requestBody());
			break;
		case "DELETE":
			deleteHandler();
			break;
		default:
			returnError("Unsopported request method");
	}

	function validJsonBody($body){
		return is_array($body) && isset($body["action"]);
	}

	function validRegistrationAttempt($json){
		return hasCredentials($json) && isset($json["nickname"]);
	}

	function hasCredentials($json){
		return isset($json["email"]) && isset($json["password"]);
	}

	function hasAction($json, $action){
		return isset($json["action"]) && $json["action"] === $action;
	}

	function hashPassword($plainPassword){
		$salt = "f7e43_=7FAa5^$@#";
		return sha1($plainPassword . $salt);
	}

	function putHandler($json){
		if(hasAction($json, "register")){
			register($json);
		}else if(hasAction($json, "setArrivedMessages")){
			updateMessages($json, "ARRIVED");
		}else if(hasAction($json, "setSeenMessages")){
			updateMessages($json, "SEEN");
		}else{
			returnError("Unsupported action for this method");
		}
	}

	function postHandler($json){
		if(hasAction($json, "login")){
			login($json);
		}else if(hasAction($json, "sendMessage")){
			sendMessage($json);
		}
	}

	function deleteHandler(){
		logout();
	}

	function getHandler(){
		if($userId = getLoggedUserId()){
			$db = getDb();
			$allMessages = [];
			
			$allMessages["nickname"] = $_SESSION["nickname"];

			//Get all messages sent from this user
			$stmt = $db->prepare("SELECT  m.receiver_id, m.txt, m.created_at, m.status, u.nickname AS contact FROM messages AS m JOIN users AS u ON m.receiver_id = u.id WHERE m.sender_id = ? ORDER BY m.created_at DESC");
			$stmt->execute([$userId]);
			$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			$allMessages["msgsFromMe"] = $result;

			//Get all messages sent to this user
			$stmt = $db->prepare("SELECT  m.id, m.sender_id, m.txt, m.created_at, m.status, u.nickname AS contact FROM messages AS m JOIN users AS u ON m.sender_id = u.id WHERE m.receiver_id = ? ORDER BY m.created_at DESC");
			$stmt->execute([$userId]);
			$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			$allMessages["msgsToMe"] = $result;

			returnSuccess($allMessages);
		}else{
			returnError("User is not logged in");
		}
	}	
	
	function register($json){
		if(validRegistrationAttempt($json)){
			$json["password"] = hashPassword($json["password"]);
			$stmt = getDb()->prepare("INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)");
			if($stmt->execute([$json["email"], $json["password"], $json["nickname"]])){
				returnSuccess("User successfully created, you can login now");
			}else{
				returnError("The user cannot be created with these credential, please try again");
			}
		}else{
			returnError("Invalid registration attempt");
		}
	}

	function login($json){
		if(hasCredentials($json)){
			$json["password"] = hashPassword($json["password"]);
			$stmt = getDb()->prepare("SELECT id, nickname FROM users WHERE email = ? AND password = ?");
			$stmt->execute([$json["email"], $json["password"]]);
			$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
			if(count($result) === 1){
				$_SESSION["userId"] = $result[0]["id"];
				$_SESSION["nickname"] = $result[0]["nickname"];
				returnSuccess(["nickname" => $result[0]["nickname"]]);
			}else{
				returnError("No user found with given credentials");
			}
		}else{
			returnError("Invalid login attempt");
		}	
	}

	function logout(){
		unset($_SESSION["userId"]);
		unset($_SESSION["nickname"]);
		returnSuccess("logout done");
	}

	function sendMessage($json){
		if($userId = getLoggedUserId()){
			$stmt = getDb()->prepare("INSERT INTO messages (sender_id, receiver_id, txt, status) VALUES (?, ?, ?, 'SENT')");
			if($r = $stmt->execute([$userId, $json["receiverId"], $json["txt"]])){
				return returnSuccess("Message is sent");
			}
		}
		returnError("Failed to send message");
	}

	function updateMessages($json, $status){
		if($userId = getLoggedUserId()){
			$questionMarks = array_fill(0, count($json["msgsIds"]), "?");
			$stmt = getDb()->prepare("UPDATE messages SET status = ? WHERE receiver_id = ? AND id IN (".implode(",", $questionMarks).")");
			if($stmt->execute(array_merge([$status, $userId], $json["msgsIds"]))){
				return returnSuccess("Messages successfully updated");
			}
		}
		returnError("Failed to update messages");
	}
	
	function getLoggedUserId(){
		if(isset($_SESSION["userId"])){
			return $_SESSION["userId"];
		}
		return false;
	}

	function responseBody($success, $data){
		return json_encode(["success" => $success, "data" => $data]);
	}

	function requestBody(){
		return json_decode(file_get_contents('php://input'), true);
	}

	function returnError($data){
        header('Content-Type: application/json');
        die(responseBody(false, $data));
    }

    function returnSuccess($data){
        header('HTTP/1.1 200 OK', true, 200);
        header('Content-Type: application/json');
        die(responseBody(true, $data));
    }


	function getDb(){
		$host 		= "127.0.0.1";	
		$username 	= "root";
		$password 	= "";
		$dbName 	= "itsafe2";
		return new PDO("mysql:host=$host;dbname=$dbName", $username, $password);
	}

?>