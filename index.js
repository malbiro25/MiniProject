$(()=>{
	
	$(".chat, .regField").hide();
	
	$.ajax({
		url: "api.php",
		dataType:"json",
		type: "GET"
	}).then((res)=>{
		if(res.success){
			loggedIn(res.data);
		}else{
			alertError(res.data);
		}
	});
	
	function alertSuccess(txt){
		$(".alert-success").text(txt).fadeIn().delay(2000).fadeOut();
	}
	
	function alertError(txt){
		$(".alert-danger").text(txt).fadeIn().delay(2000).fadeOut();
	}
	
	function isEmpty(val){
		return String(val).trim().length === 0;
	}
	
	function loggedIn(data){
		$(".chat").show();
		$(".noChat").hide();
		$(".nickname").text(data.nickname);
		
		$("#totalMsgsCount").text(data.msgsFromMe.length + data.msgsToMe.length);
		$("#toMeCount").text(data.msgsToMe.length);
		$("#fromMeCount").text(data.msgsFromMe.length);
		
		updateArrivedToMe(data.msgsToMe);
		
		console.log(data);
		
		loadMsgsToList("#toMeList", data.msgsToMe);
		showChat("#toMeList>li", "From ");
		
		loadMsgsToList("#fromMeList", data.msgsFromMe);
		showChat("#fromMeList>li", "To ");
		
		function showChat(itemSelector, prefix){
			$(itemSelector).click((e)=>{
				const li = $(e.target);
				$("#chatTtl").text(prefix + li.text());
				$("#chatDesc").text(li.attr("data-txt"));
				$(".sendMsg").show();
				$("#sendMsgInput").attr("data-contact-id", li.attr("data-contact-id"));
				const receivedMsgId = li.attr("data-msg-id");
				if(receivedMsgId){
					updateSeenMsg(parseInt(receivedMsgId));
				}
			});
		}
		
		function loadMsgsToList(listSelector, msgs){
			const arrows = {SENT: singleArrow(), ARRIVED: doulbeArrow(), SEEN: doulbeBlueArrow()};
			var list = "";
			for(const obj of msgs){
				const receivedMsgId = obj.id || "";
				const contactId		= obj.receiver_id || obj.sender_id;
				let arrow = "";
				if(!receivedMsgId){
					arrow = arrows[obj.status];
				}
				list += "<li class='list-group-item' data-txt='"+obj.txt+"' data-msg-id='"+receivedMsgId+"' data-contact-id='"+contactId+"'><b>"+arrow+obj.contact+"</b> at "+obj.created_at+"</li>";
			}
			$(listSelector).html(list);
		}
		
		function updateArrivedToMe(msgsToMe){
			const msgsIds = [];
			for(const obj of msgsToMe){
				msgsIds.push(obj.id);
			}
			$.ajax({
				url: "api.php",
				type: "PUT",
				contentType:"application/json; charset=utf-8",
				dataType:"json",
				data: JSON.stringify({msgsIds, action: "setArrivedMessages"})
			});
		}
		
		function updateSeenMsg(msgId){
			$.ajax({
				url: "api.php",
				type: "PUT",
				contentType:"application/json; charset=utf-8",
				dataType:"json",
				data: JSON.stringify({msgsIds: [msgId], action: "setSeenMessages"})
			});
		}
		
		
	}
	
	$("#regFormBtn").click(()=>{
		$(".regField").show();
		$(".loginField").hide();
		$("#formTtl").text("Sign Up form");
	});
	
	$("#backLogin").click(()=>{
		$(".regField").hide();
		$(".loginField").show();
		$("#formTtl").text("Sign In form");
	});

    $("#registerBtn").click(()=>{
        const nickname   = $("#nicknameInput").val();
        const email		 = $("#emailInput").val();
        const password   = $("#passwordInput").val();
        const passwdConf = $("#passwordConfInput").val();
		const errors 	 = [];
		
		if(isEmpty(nickname) || isEmpty(email) || isEmpty(password)){
			errors.push("All fields are required");	   
		}
		
		if(password != passwdConf){
			errors.push("Passwords must match");
		}
		
		if(errors.length > 0){//Has errors
			alertError(errors);
		}else{
			 $.ajax({
				url: "api.php",
				type: "PUT",
				contentType:"application/json; charset=utf-8",
				dataType:"json",
				data: JSON.stringify({email, password, nickname, action: "register"})
			}).then((res)=>{
				if(res.success){
					alertSuccess(res.data);
				}else{
					alertError(res.data);
				}
			});
		}
		
    });
	
	$("#loginBtn").click(()=>{
        const email		 = $("#emailInput").val();
        const password   = $("#passwordInput").val();
		
		if(isEmpty(email) || isEmpty(password)){
			 alertError("Both fields are required");	   
		}else{
			 $.ajax({
				url: "api.php",
				type: "POST",
				contentType:"application/json; charset=utf-8",
				dataType:"json",
				data: JSON.stringify({email, password, action: "login"})
			}).then((res)=>{
				if(res.success){
					location.reload();
				}else{
					alertError(res.data);
				}
			});
		}
		
    });

    $("#logoutBtn").click(()=>{
        $.ajax({
            url: "api.php",
            type: "DELETE",
            dataType:"json"
        }).then((res)=>{
			if(res.success){
            	location.reload();
			}
        });
    });
	
	$("#sendMsgBtn").click(()=>{
		const txt = $("#sendMsgInput").val();
		const receiverId = $("#sendMsgInput").attr("data-contact-id");
		
		if(isEmpty(txt)){
			alertError("Cannot send empty message");
		}else{
			 $.ajax({
				url: "api.php",
				type: "POST",
				contentType:"application/json; charset=utf-8",
				dataType:"json",
				data: JSON.stringify({receiverId, txt, action: "sendMessage"})
			}).then((res)=>{
				if(res.success){
					$("#sendMsgInput").val("");
					alertSuccess(res.data);
				}else{
					alertError(res.data);
				}
			});
		}
		
	});
    
	function singleArrow(){
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15"><path fill="#92A58C" d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>';
	}
	
	function doulbeArrow(arrowColor){
		const color = arrowColor || "#92A58C";
		return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" width="16" height="15"><path fill="'+arrowColor+'" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>';
	}
	
    function doulbeBlueArrow(){
		return doulbeArrow("#4FC3F7");
	}
    
});