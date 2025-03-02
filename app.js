//defining variables
const chatBody = document.querySelector(".chat-body")
const messageInput = document.querySelector(".message-input");
const sendMessageBtn = document.querySelector("#send-message"); //sending the message even when the sewnd btn is clicked
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

//API SETUP
const apiKey = ENV.API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

const userData = {  //storing the user's message by creating a global object making accessible throught the project
    message: null,
    file: {
        data: null,
        mime_type: null
    } 
}

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

//Creating the message element with dynamic classes and returning it
const creatMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

//FUNCTION FOR GENERATING RESPONSES using AI
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    //Adding user response to chat history
    chatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    })



    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    }

    try {
        //Fetch bot response from API
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json()
        if(!response.ok) throw new Error(data.error.message);
        console.log(data);

        //Extract and display bot's response text
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;
        //Adding bot response to chat history
        chatHistory.push({
            role: "model",
            parts: [{ text: apiResponseText }]
        });

    } catch(error){
        //handling error in the API call
        console.log(error);
        messageElement.innerText = error.message;
        messageElement.style.color = "#ff0000";
    }   finally {
        //reset the users file data, removing thinking indicator and scroll chat to bottom
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth"  }); //enabling automatic scrolling when sending or receiving messages
    }
    
}



//sending the user's sent message to the chat list $ handling outgoing user message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();               //the user's message from the object
    messageInput.value = " ";                                    //clearing the textarea after the message is sent
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    //Create and display user message $ the file uploaded if selected
    const messageContent = `<div class="message-text"></div>
                            ${userData.file.data ? 
                            `<img src="data:${userData.file.mime_type};base64, 
                            ${userData.file.data}" class="attachment"/>` : ""}` ;  
                            
    const outgoingMessageDiv = creatMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").innerText = userData.message; //to ensiure only the textcontent is actually rendered out
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth"  }); //enabling automatic scrolling when sending or receiving messages


    //displaying a thinking indicator as a bot message after a brief delay & simulating bot response with thinking indicator after a delay
    setTimeout(() => {
        const messageContent = `<img src="assets/imgs/favicon.png" alt="chatbot icon" class="bot-avatar">
                                <div class="message-text">
                                <div class="thinking-indicator">
                                <div class="dot"></div>
                                <div class="dot"></div>
                                <div class="dot"></div>
                                </div>
                                </div>
                                `;  
        const incomingMessageDiv = creatMessageElement(messageContent, "bot-message", "thinking"); //Create and display user message
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth"  }); //enabling automatic scrolling when sending or receiving messages
        generateBotResponse(incomingMessageDiv)       //generating a gemini response based on the user's message
    }, 600)
}

    //2.getting the textarea value when the 'Enter Key' is pressed
    messageInput.addEventListener("keydown", (e) => {
        const userMessage = e.target.value.trim();      //trim the whitespace
            if(e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth > 768){
                handleOutgoingMessage(e)
            }
    })

    //make the textarea more dynamic based on the user input
    messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px"
    })

    //receiving the clicked file from device & handling file input changes and preview the selected fle
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if(!file) return;

        //converting file to base64 format
        const reader = new FileReader(); 
        reader.onload = (e) => {
            fileUploadWrapper.querySelector("img").src = e.target.result;
            fileUploadWrapper.classList.add("file-uploaded")
            const base64String = e.target.result.split(",")[1];

            //storing file data in userData
            userData.file = {
                data: base64String,
                mime_type: file.type
        }
        
        //clearing the file input value to allow the user to select the same file again
        fileInput.value = "";
    }
    reader.readAsDataURL(file);
})

//cancel file upload btn
fileCancelButton.addEventListener('click', () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded")
})

// code for emojis & initializing the emoji picker
const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
   const { selectionStart: start,  selectionEnd: end } = messageInput;
   messageInput.setRangeText(emoji.native, start, end, "end");
   messageInput.focus();
   },

    onClickOutside: (e) => {
        if(e.target.id === "emoji-picker"){
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    }
})

document.querySelector(".chat-form").appendChild(picker);

//adding an event listener for the sendmessageButton
sendMessageBtn.addEventListener('click', (e) => handleOutgoingMessage(e));

//creating an event listener for the file upload btn when it is clicked
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click())

//making the popup work
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
//close chatbot btn
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));