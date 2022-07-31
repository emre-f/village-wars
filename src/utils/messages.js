const messageQueue = [] // has content and optional color
var messageUp = false;
const messageHolderElement = document.querySelector(".message");

function renderMessages() {
    if(messageQueue.length === 0 || messageUp) { return; } // No message to render

    messageUp = true;

    const ele = document.createElement("div");
    ele.classList.add("curr-msg");
    // ele.innerHTML = messageQueue[0].content;
    ele.innerHTML = `
        <span style="color:${messageQueue[0].color};">${messageQueue[0].content}</span>
    `;

    messageQueue.shift(); // Remove 0th element
    
    messageHolderElement.appendChild(ele);

    setTimeout(function(){
        messageHolderElement.removeChild(ele);
        messageUp = false;
    }, 2000);
}

function addMessageToQueue(str, color = "white") {
    messageQueue.push({content: str, color});
}