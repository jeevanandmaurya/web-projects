import { useState } from "react";
import "./App.css";

function App() {
  return (
    <>
      <div className="sidebar">
        <div className="sidebar-actions">
          <button>{`<-`}</button>
          <p className="new-chat">New Chat</p>
        </div>

        <div className="conversation-history">
          <p>Chat 001</p>
          <p>Chat 002</p>
          <p>Chat 003</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
          <p>Chat 004</p>
        </div>
      </div>
      <div className="chatSection">
        <h3 id="model">ChatLLM</h3>
        <div className="chat-view">
          <div className="ai chat-bubble">Hello, This is ChatLLM - An AI</div>
          <div className="user chat-bubble">Hello,This is User</div>

          <div className="ai chat-bubble">Hello, This is ChatLLM - An AI</div>
          <div className="user chat-bubble">Hello,This is User</div>

          <div className="ai chat-bubble">Hello, This is ChatLLM - An AI</div>
          <div className="user chat-bubble">Hello,This is User</div>

          <div className="ai chat-bubble">Hello, This is ChatLLM - An AI</div>
          <div className="user chat-bubble">Hello,This is User</div>

          <div className="ai chat-bubble">Hello, This is ChatLLM - An AI</div>
          <div className="user chat-bubble">Hello,This is User</div>
        </div>
        <div className="input-wrapper">
          <textarea className="input-field" type="text"></textarea>
          <div className="input-actions">
            <button id="send-button">{`^`}</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
