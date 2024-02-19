import React, { useState, useEffect } from 'react';
import useSound from 'use-sound';

export const NewMessageForm = () => {
  const [play] = useSound('sent.wav');
  const [body, setBody] = useState('');

  const addNewMessage = (body: string) => {
    play();
  };


  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (body) {
          addNewMessage(body);
          setBody('');
        }
      }}
      className="flex items-center space-x-3"
    >
      <input
        autoFocus
        id="message"
        name="message"
        placeholder="Write a message..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-1 h-12 px-3 rounded bg-slate-400 border border-bg-slate-400 focus:border-slate-400 focus:outline-none text-black placeholder-black"
      />
      <button
        type="submit"
        className="bg-slate-400 rounded h-12 p-1 font-medium text-black w-24 text-sm border border-transparent hover:bg-slate-600 transition"
        disabled={!body}
      >
        Send
      </button>
    </form >
  );
};

export default NewMessageForm;
