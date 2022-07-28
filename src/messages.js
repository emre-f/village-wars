const messageQueue = []
var messageUp = false;
const messageHolderElement = document.querySelector(".message");

function renderMessages() {
    if(messageQueue.length === 0 || messageUp) { return; } // No message to render

    messageUp = true;

    const ele = document.createElement("div");
    ele.classList.add("curr-msg");
    ele.innerHTML = messageQueue[0];
    messageQueue.shift(); // Remove 0th element
    
    messageHolderElement.appendChild(ele);

    setTimeout(function(){
        messageHolderElement.removeChild(ele);
        messageUp = false;
    }, 2000);
}

function addMessageToQueue(str) {
    messageQueue.push(str);
}