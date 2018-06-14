$(document).ready(function() {
  // Getting jQuery references to the message body and author
  var bodyInput = $("#submitBody");
  var localUser;
  // Adding an event listener for when the form is submitted
  $("#chatSubmit").on("submit", handleFormSubmit);
  
  // Get messages upon page load
  getUserInfo();
  getChat();


  const pusher = new Pusher('7e8690097d33fa90c7a8', {
    cluster: 'us2',
    encrypted: true,
    authEndpoint: 'pusher/auth'
  });

      

  var username = '';
  var connectedUsers = '';
  var newMessage = '';
  var messages = [];
  var status = $("#status");
      
     
  function joinChat() {
      $.post('join-chat', {username: localUser.name}, function() {
              // User has joined the chat
              const channel = pusher.subscribe('presence-groupChat');
              channel.bind('pusher:subscription_succeeded', (members) => {
                  connectedUsers = Object.keys(channel.members.members);
                  console.log(connectedUsers);
                  showUsers();
              });
              // User joins chat
              channel.bind('pusher:member_added', (member) => {
                connectedUsers = Object.keys(channel.members.members);
                showUsers();
                $.post("/api/chat", {
                  body: member.id + " has joined the chat",
                  UserId: 1
                }, getChat); 
              });
              // Listen for chat messages
              listen();
          });
  };
  
  function listen() {
      const channel = pusher.subscribe('presence-groupChat');
      channel.bind('message_sent', getChat);
      channel.bind('member_added', showUsers);
      channel.bind('pusher:member_removed', (member) => {
        connectedUsers = Object.keys(channel.members.members);
        console.log(connectedUsers);
        showUsers();
        $.post("/api/chat", {
          body: member.id + " has left the chat",
          UserId: 1
        }, getChat); 
      });
  };
  var connectionList = $("#connectionList")

  function showUsers() {
    connectionList.empty();
    console.log(connectedUsers);
    var list = "";
    for (var i = 0; i < connectedUsers.length; i++) {
      list = list + (connectedUsers[i] + "<br>");
    }
    console.log(list);
    connectionList.append(list);
  };
      
  
  // Store current user info on client side. Set form placeholder to welcome user
    function getUserInfo() {
      $.get("/api/user_data", function(data) {
        if (!data.email) {
          console.log("not signed in");
          bodyInput.attr("placeholder", "Please sign in to chat!");
        } else {
          localUser = data;
          bodyInput.attr("placeholder", "Welcome " + localUser.name + "! Type your message here.");
          joinChat();
        }
      });
    }

  // A function for handling what happens when the form to create a new message is submitted
  function handleFormSubmit(event) {
    event.preventDefault();
    // Won't submit the post if we are missing a body
    if (!bodyInput.val().trim()) {
      return;
    }
    // Constructing a newMessage object to hand to the database
    var newMessage = {
      body: bodyInput.val().trim(),
      UserId: localUser.id
    };
    // Post to database, retrieve updated view, change placeholder to standard
    $.post("/api/chat", newMessage, getChat); 
    bodyInput.attr("placeholder", "Type your message here.");
    bodyInput.val("");
  }
  
  // A function to get and then render our list of messages
  function getChat() {
    $.get("/api/chat", renderMessageList);
    // Auto-scroll to bottom of container so newest messages are visible
    $("#messageContainer").animate({ scrollTop: $('#messageContainer').prop("scrollHeight")}, 1000);
  }

  var printUsername; // Variable to determine whether to print the time and username above a chat message

  function renderMessageList(data) {
    var messageContainer = $("#messageContainer");
    messageContainer.empty();
    // Initial message when chat is empty
    if (!data.length) {
      var $noMessages = $("<div>", {"class": "messageBody"}).html("No messages yet..");
      messageContainer.append($noMessages);
    } else {
      for (var i = 0; i < data.length; i++) {
        if ((i > 0) // Name must be printed on first message, so exclude first loop.
          && (data[i].User.id === data[i-1].User.id) // If a message has the same author as the previous message...
          && (moment(data[i].createdAt).diff(data[i-1].createdAt, 'minutes') < 1) // ...and it has been less than one minute since the previous...
        ){
          printUsername = false; // ...then don't print the name
        } else {
          printUsername = true;
        }
        messageContainer.append(createMessageRow(data[i]));
      }
    }
  }

  // Creates the individual messages
  function createMessageRow(data) {
    // Create separate elements for each part of the message so that they can be individually styled
    var $message = $("<div>", {"class": "messageComplete"});
    var $authorName = $("<span>", {"class": "authorName"}).html(data.User.name + "&nbsp;&nbsp;");
    var $postedAt = $("<span>", {"class": "postedAt"}).html(moment(data.createdAt).format("h:mm A"));
    var $messageBody = $("<div>", {"class": "messageBody"}).html(data.body);
    // Print author and time if conditions are met
    if (printUsername === true) {
      $message.append($authorName);
      $message.append($postedAt);
    }
    $message.append($messageBody);
    return $message;
  }
});
